import { describe, it, expect } from 'vitest';
import { resolveAiModel, resolveGlobalModel } from '../src/lib/ai/models';

describe('AI model resolution per menu', () => {
  it('uses the per-menu model when set', () => {
    const s = { aiProvider: 'gemini' as const, aiModel: 'gemini-3.8-flash', aiModelSmartTask: 'gemini-3.1-flash-lite' };
    expect(resolveAiModel(s, 'smartTask')).toBe('gemini-3.1-flash-lite');
  });

  it('falls back to the global model when the menu override is empty or blank', () => {
    const s = { aiProvider: 'openai' as const, aiModel: 'gpt-4o', aiModelReport: '   ', aiModelWorkload: '' };
    expect(resolveAiModel(s, 'report')).toBe('gpt-4o');
    expect(resolveAiModel(s, 'workload')).toBe('gpt-4o');
  });

  it('ignores overrides of other menus and calls without a feature', () => {
    const s = { aiProvider: 'anthropic' as const, aiModel: 'claude-3-5-sonnet-latest', aiModelProductivity: 'claude-3-5-haiku-latest' };
    expect(resolveAiModel(s, 'smartTask')).toBe('claude-3-5-sonnet-latest');
    expect(resolveAiModel(s)).toBe('claude-3-5-sonnet-latest');
    expect(resolveAiModel(s, 'productivity')).toBe('claude-3-5-haiku-latest');
  });

  it('uses the provider default when no global model is stored', () => {
    expect(resolveGlobalModel({ aiProvider: 'custom' })).toBe('deepseek-chat');
    expect(resolveGlobalModel({})).toBe('gemini-3.8-flash');
  });

  it('remaps retired Gemini generations, including per-menu overrides', () => {
    expect(resolveAiModel({ aiProvider: 'gemini', aiModel: 'gemini-2.5-flash' })).toBe('gemini-3.8-flash');
    expect(resolveAiModel({ aiProvider: 'gemini', aiModel: 'gemini-3.7-flash', aiModelReport: 'gemini-1.5-pro' }, 'report')).toBe(
      'gemini-3.8-flash',
    );
  });

  it('does not remap gemini-like names on non-Gemini providers', () => {
    expect(resolveAiModel({ aiProvider: 'custom', aiModel: 'gemini-2.0-proxy' })).toBe('gemini-2.0-proxy');
  });

  it('saves and loads per-menu models in settings', async () => {
    const { saveSettings, getSettings, getPublicSettings } = await import('../src/lib/settings');
    saveSettings({
      aiModelSmartTask: 'haiku-4.5',
      aiModelProductivity: 'dpe/limited/claude-sonnet-5.5',
    });
    const s = getSettings();
    expect(s.aiModelSmartTask).toBe('haiku-4.5');
    expect(s.aiModelProductivity).toBe('dpe/limited/claude-sonnet-5.5');
    const pub = getPublicSettings();
    expect(pub.aiModelSmartTask).toBe('haiku-4.5');
    expect(pub.aiModelProductivity).toBe('dpe/limited/claude-sonnet-5.5');
  });
});

