import { GoogleGenAI } from '@google/genai';
import { getSettings } from '@/lib/settings';
import { resolveAiModel, type AiFeature } from './models';

export interface AiCompletionOptions {
  systemInstruction?: string;
  prompt: string;
  temperature?: number;
  responseFormat?: 'json' | 'text';
  jsonSchema?: Record<string, unknown>;
  modelOverride?: string;
  /** Menu making the call; picks the per-menu model from Settings when set. */
  feature?: AiFeature;
}

/**
 * Universal AI Completion function supporting:
 * - Google Gemini (native GoogleGenAI SDK)
 * - OpenAI (GPT-4o, GPT-4o-mini, o3-mini)
 * - Anthropic Claude (Claude 3.5 Sonnet, Claude 3.5 Haiku)
 * - Custom / OpenAI-Compatible endpoints (DeepSeek, Groq, Ollama, OpenRouter, Local LLM)
 */
export async function runAiCompletion(
  options: AiCompletionOptions,
): Promise<string> {
  const s = getSettings();
  const provider = s.aiProvider || 'gemini';
  const apiKey = (s.aiApiKey || s.geminiApiKey || '').trim();
  const model =
    options.modelOverride?.trim() || resolveAiModel(s, options.feature);

  if (!apiKey && provider !== 'custom') {
    throw new Error(
      `API Key untuk provider ${provider.toUpperCase()} belum diatur di Pengaturan.`,
    );
  }

  // 1. Google Gemini
  if (provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey });
    const config: Record<string, unknown> = {
      temperature: options.temperature ?? 0.3,
    };
    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options.responseFormat === 'json') {
      config.responseMimeType = 'application/json';
      if (options.jsonSchema) {
        config.responseJsonSchema = options.jsonSchema;
      }
    }

    const candidateModels = Array.from(
      new Set(
        [
          model,
          'gemini-3.8-flash',
          'gemini-3.7-flash',
          'gemini-3.6-flash',
          'gemini-3.5-flash',
          'gemini-3.1-flash-lite',
          'gemini-flash-lite-latest',
        ].filter(Boolean),
      ),
    );

    let lastError: unknown = null;
    for (const m of candidateModels) {
      try {
        const res = await ai.models.generateContent({
          model: m,
          contents: options.prompt,
          config,
        });
        if (res.text) return res.text;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('Gagal memanggil Google Gemini.');
  }

  // 2. OpenAI & OpenAI-Compatible Custom (DeepSeek, Ollama, Groq, OpenRouter)
  if (provider === 'openai' || provider === 'custom') {
    const rawBaseUrl =
      provider === 'custom' && s.aiBaseUrl
        ? s.aiBaseUrl
        : 'https://api.openai.com/v1';
    const baseUrl = rawBaseUrl.trim().replace(/\/+$/, '');

    const isClaudeModel =
      model.toLowerCase().includes('claude') ||
      model.toLowerCase().includes('haiku') ||
      model.toLowerCase().includes('sonnet') ||
      model.toLowerCase().includes('opus');

    const messages: Array<{ role: string; content: string }> = [];
    // Anthropic API strictly prohibits { role: 'system' } inside messages array.
    // When routing via an OpenAI proxy to Claude, passing { role: 'system' } in messages causes:
    // "messages.0: use the top-level 'system' parameter for the initial system prompt"
    if (options.systemInstruction && !isClaudeModel) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push({ role: 'user', content: options.prompt });

    const payload: Record<string, unknown> = {
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: 4096,
    };

    if (options.systemInstruction) {
      payload.system = options.systemInstruction;
    }

    if (options.responseFormat === 'json') {
      payload.response_format = { type: 'json_object' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg =
          data.error?.message ||
          (typeof data.error === 'string' ? data.error : null) ||
          `HTTP ${res.status} dari ${provider}`;
        throw new Error(errMsg);
      }

      const text = data.choices?.[0]?.message?.content || '';
      return text;
    } catch (err) {
      const causeMsg = (err as { cause?: Error })?.cause?.message;
      const msg = (err as Error).name === 'TimeoutError'
        ? `Request ke ${provider} timeout setelah 60 detik`
        : causeMsg
          ? `${(err as Error).message} (${causeMsg})`
          : (err as Error).message;
      throw new Error(msg);
    }
  }

  // 3. Anthropic Claude
  if (provider === 'anthropic') {
    const rawBaseUrl = s.aiBaseUrl || 'https://api.anthropic.com/v1';
    const baseUrl = rawBaseUrl.trim().replace(/\/+$/, '');

    const payload: Record<string, unknown> = {
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: options.prompt }],
      temperature: options.temperature ?? 0.3,
    };

    if (options.systemInstruction) {
      payload.system = options.systemInstruction;
    }

    const res = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg =
        data.error?.message ||
        (typeof data.error === 'string' ? data.error : null) ||
        `HTTP ${res.status} dari Anthropic`;
      throw new Error(errMsg);
    }

    const contentBlocks = data.content || [];
    const textBlock = contentBlocks.find(
      (b: { type?: string; text?: string }) => b.type === 'text',
    );
    return textBlock?.text || contentBlocks[0]?.text || '';
  }

  throw new Error(`Provider AI '${provider}' tidak didukung.`);
}

export function extractJsonFromAiResponse(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (match) return match[1].trim();
  return trimmed;
}
