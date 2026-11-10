import {
  DEFAULT_MODEL_BY_PROVIDER,
  resolveAiModel,
  type AiProvider,
} from '../ai/models';
import type { Settings } from '../settings';

function matchesProvider(provider: AiProvider, model: string): boolean {
  const value = model.toLowerCase();
  if (provider === 'gemini') return value.startsWith('gemini');
  if (provider === 'anthropic') return value.includes('claude');
  if (provider === 'openai') return /^(gpt|o\d|chatgpt)/.test(value);
  return true;
}

/**
 * Model override for the Release Note feature. Settings can hold a model from a
 * different provider (for example an Anthropic provider with a Gemini model),
 * which makes the API reject the request. In that case use the provider default.
 */
export function resolveReleaseNoteModel(s: Settings): string | undefined {
  const provider = s.aiProvider || 'gemini';
  const model = resolveAiModel(s, 'release-note');
  return matchesProvider(provider, model)
    ? undefined
    : DEFAULT_MODEL_BY_PROVIDER[provider];
}
