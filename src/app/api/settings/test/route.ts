import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getSettings, isMasked } from '@/lib/settings';
import { invalidateIntegrationCache } from '@/lib/integrations';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

interface TestPayload {
  target: 'taiga' | 'gitlab' | 'gemini' | 'ai';
  taigaBaseUrl?: string;
  taigaSession?: string;
  taigaToken?: string;
  gitlabBaseUrl?: string;
  gitlabToken?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  aiProvider?: 'gemini' | 'openai' | 'anthropic' | 'custom';
  aiApiKey?: string;
  aiModel?: string;
  aiBaseUrl?: string;
}

async function handleTest(payload: TestPayload) {
  const { target } = payload;
  const s = getSettings();

  if (target === 'taiga') {
    const baseUrl = (
      payload.taigaBaseUrl?.trim() ||
      s.taigaBaseUrl?.trim() ||
      ''
    ).replace(/\/+$/, '');

    if (!baseUrl) {
      throw new Error('Taiga Base URL belum diisi. Masukkan URL Taiga Anda.');
    }
    let token = '';
    if (payload.taigaSession?.trim()) {
      try {
        const parsed = JSON.parse(payload.taigaSession.trim()) as {
          token?: string;
        };
        token = (
          typeof parsed === 'object' && parsed?.token
            ? parsed.token
            : payload.taigaSession.trim()
        ).replace(/^"|"$/g, '');
      } catch {
        token = payload.taigaSession.trim().replace(/^"|"$/g, '');
      }
    } else if (payload.taigaToken && !isMasked(payload.taigaToken)) {
      token = payload.taigaToken.trim();
    } else {
      token = s.taigaToken;
    }

    if (!token)
      throw new Error(
        'Token Taiga belum diisi. Masukkan token atau paste script session.',
      );

    const res = await fetch(`${baseUrl}/api/v1/users/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-disable-pagination': 'True',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try {
        const j = await res.json();
        msg =
          j._error_message || (j.detail ? String(j.detail) : JSON.stringify(j));
      } catch {}
      throw new Error(`Taiga: ${msg}`);
    }

    const me = (await res.json()) as {
      full_name_display?: string;
      username?: string;
    };
    const name = me.full_name_display || me.username || 'Pengguna';
    return {
      ok: true,
      message: `Terhubung sebagai ${name} (@${me.username ?? '-'})`,
    };
  }

  if (target === 'gitlab') {
    const baseUrl = (
      payload.gitlabBaseUrl ||
      s.gitlabBaseUrl ||
      'https://gitlab.com/'
    )
      .trim()
      .replace(/\/+$/, '');
    let token = '';
    if (payload.gitlabToken && !isMasked(payload.gitlabToken)) {
      token = payload.gitlabToken.trim();
    } else {
      token = s.gitlabToken;
    }

    if (!token)
      throw new Error('Personal Access Token (PAT) GitLab belum diisi.');

    const res = await fetch(`${baseUrl}/api/v4/user`, {
      headers: { 'PRIVATE-TOKEN': token },
      cache: 'no-store',
    });

    if (!res.ok) {
      let msg = res.statusText;
      try {
        const j = await res.json();
        msg = j.message
          ? typeof j.message === 'string'
            ? j.message
            : JSON.stringify(j.message)
          : j.error
            ? String(j.error)
            : res.statusText;
      } catch {}
      throw new Error(`GitLab ${res.status}: ${msg}`);
    }

    const me = (await res.json()) as { name: string; username: string };

    let scopeNotice = '';
    try {
      const patRes = await fetch(
        `${baseUrl}/api/v4/personal_access_tokens/self`,
        {
          headers: { 'PRIVATE-TOKEN': token },
          cache: 'no-store',
        },
      );
      if (patRes.ok) {
        const pat = await patRes.json();
        if (Array.isArray(pat?.scopes)) {
          if (!pat.scopes.includes('api')) {
            scopeNotice = ` (Perhatian: Scope hanya [${pat.scopes.join(', ')}]. Tambahkan scope 'api' untuk fitur posting review MR)`;
          } else {
            scopeNotice = " Scope 'api' Aktif";
          }
        }
      }
    } catch {}

    return {
      ok: true,
      message: `Terhubung sebagai ${me.name} (@${me.username})${scopeNotice}`,
    };
  }

  if (target === 'gemini' || target === 'ai') {
    const provider = payload.aiProvider || s.aiProvider || 'gemini';
    let apiKey = '';
    const rawKey = payload.aiApiKey ?? payload.geminiApiKey;
    if (rawKey && !isMasked(rawKey)) {
      apiKey = rawKey.trim();
    } else {
      apiKey = s.aiApiKey || s.geminiApiKey || '';
    }

    if (!apiKey && provider !== 'custom') {
      throw new Error(`API key untuk ${provider.toUpperCase()} belum diisi.`);
    }

    let model =
      payload.aiModel?.trim() ||
      payload.geminiModel?.trim() ||
      s.aiModel ||
      s.geminiModel ||
      (provider === 'openai'
        ? 'gpt-4o-mini'
        : provider === 'anthropic'
          ? 'claude-3-5-sonnet-latest'
          : provider === 'custom'
            ? 'deepseek-chat'
            : 'gemini-3.8-flash');

    if (
      provider === 'gemini' &&
      (model.startsWith('gemini-2.5-') ||
        model.startsWith('gemini-1.5-') ||
        model.startsWith('gemini-2.0-'))
    ) {
      model = 'gemini-3.8-flash';
    }

    if (provider === 'gemini') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const r = await ai.models.generateContent({
          model,
          contents: 'Balas hanya kata: OK',
        });
        return {
          ok: true,
          message: `Model ${model} aktif (respon: ${r.text?.trim() || 'OK'})`,
        };
      } catch (err) {
        let msg = (err as Error).message || 'Koneksi gagal';
        try {
          const parsed = JSON.parse(msg);
          if (parsed.error?.message) {
            msg = parsed.error.message;
          }
        } catch {}
        throw new Error(`Gemini: ${msg}`);
      }
    }

    if (provider === 'openai' || provider === 'custom') {
      const rawBase = (
        payload.aiBaseUrl ||
        s.aiBaseUrl ||
        (provider === 'custom' ? '' : 'https://api.openai.com/v1')
      )
        .trim()
        .replace(/\/+$/, '');
      const baseUrl = rawBase || 'https://api.openai.com/v1';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Balas hanya kata: OK' }],
          temperature: 0.1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg =
          data.error?.message ||
          (typeof data.error === 'string' ? data.error : null) ||
          `HTTP ${res.status}`;
        throw new Error(`${provider.toUpperCase()}: ${errMsg}`);
      }
      const reply = data.choices?.[0]?.message?.content?.trim() || 'OK';
      return {
        ok: true,
        message: `${provider.toUpperCase()} (${model}) aktif (respon: ${reply})`,
      };
    }

    if (provider === 'anthropic') {
      const rawBase = (
        payload.aiBaseUrl ||
        s.aiBaseUrl ||
        'https://api.anthropic.com/v1'
      )
        .trim()
        .replace(/\/+$/, '');
      const res = await fetch(`${rawBase}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 20,
          messages: [{ role: 'user', content: 'Balas hanya kata: OK' }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg =
          data.error?.message ||
          (typeof data.error === 'string' ? data.error : null) ||
          `HTTP ${res.status}`;
        throw new Error(`Anthropic: ${errMsg}`);
      }
      return { ok: true, message: `Anthropic (${model}) aktif` };
    }

    throw new Error(`Provider ${provider} tidak didukung.`);
  }

  throw new Error('Target uji tidak dikenal');
}

export async function GET(req: Request) {
  try {
    const target = new URL(req.url).searchParams.get(
      'target',
    ) as TestPayload['target'];
    const result = await handleTest({ target });
    invalidateIntegrationCache();
    return NextResponse.json(result);
  } catch (e) {
    invalidateIntegrationCache();
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TestPayload;
    const result = await handleTest(body);
    invalidateIntegrationCache();
    return NextResponse.json(result);
  } catch (e) {
    invalidateIntegrationCache();
    return errorResponse(e);
  }
}
