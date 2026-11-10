import 'server-only';
import { db } from './db';

export type AppMode = 'developer' | 'monitoring';

export interface Settings {
  appMode: AppMode;
  taigaBaseUrl: string;
  taigaProjectSlug: string;
  taigaSprintSlug: string;
  taigaToken: string;
  taigaRefresh: string;
  gitlabBaseUrl: string;
  gitlabToken: string;
  gitlabUsername: string;
  identityEmails: string; // comma separated
  identityNames: string; // comma separated
  excludePatterns: string; // comma separated globs
  geminiApiKey: string;
  geminiModel: string;
  writingLanguage: 'id' | 'en';
  aiProvider: 'gemini' | 'openai' | 'anthropic' | 'custom';
  aiApiKey: string;
  aiModel: string;
  aiBaseUrl: string;
  // Per-menu model overrides; empty = use aiModel
  aiModelSmartTask: string;
  aiModelProductivity: string;
  aiModelWorkload: string;
  aiModelReport: string;
  aiModelReleaseNote: string;
}

export const DEFAULT_SETTINGS: Settings = {
  appMode: 'developer',
  taigaBaseUrl: '',
  taigaProjectSlug: '',
  taigaSprintSlug: '',
  taigaToken: '',
  taigaRefresh: '',
  gitlabBaseUrl: '',
  gitlabToken: '',
  gitlabUsername: '',
  identityEmails: '',
  identityNames: '',
  excludePatterns:
    '*.lock, package-lock.json, yarn.lock, pnpm-lock.yaml, go.sum, composer.lock, *.min.js, *.min.css, *.map, dist/*, build/*, vendor/*, node_modules/*, *.snap, *.svg, *.pb.go, *_generated.*, *.generated.*',
  geminiApiKey: '',
  geminiModel: 'gemini-3.8-flash',
  writingLanguage: 'id',
  aiProvider: 'gemini',
  aiApiKey: '',
  aiModel: 'gemini-3.8-flash',
  aiBaseUrl: '',
  aiModelSmartTask: '',
  aiModelProductivity: '',
  aiModelWorkload: '',
  aiModelReport: '',
  aiModelReleaseNote: '',
};

const SECRET_KEYS: (keyof Settings)[] = [
  'taigaToken',
  'taigaRefresh',
  'gitlabToken',
  'geminiApiKey',
  'aiApiKey',
];

type AiProviderKey = 'gemini' | 'openai' | 'anthropic' | 'custom';

export function getSettings(): Settings {
  const rows = db().prepare('SELECT key, value FROM settings').all() as {
    key: string;
    value: string;
  }[];
  const s: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) s[r.key] = r.value;

  // env fallbacks for secrets
  if (!s.geminiApiKey && process.env.GEMINI_API_KEY)
    s.geminiApiKey = process.env.GEMINI_API_KEY;

  // Check per-provider key
  const activeProvider = (s.aiProvider || 'gemini') as AiProviderKey;
  const providerKeyInDb = s[`aiApiKey_${activeProvider}`];

  if (providerKeyInDb) {
    s.aiApiKey = providerKeyInDb;
  } else if (!s.aiApiKey) {
    if (activeProvider === 'gemini' && s.geminiApiKey)
      s.aiApiKey = s.geminiApiKey;
    else if (activeProvider === 'openai' && process.env.OPENAI_API_KEY)
      s.aiApiKey = process.env.OPENAI_API_KEY;
    else if (activeProvider === 'anthropic' && process.env.ANTHROPIC_API_KEY)
      s.aiApiKey = process.env.ANTHROPIC_API_KEY;
    else if (s.geminiApiKey)
      s.aiApiKey = s.geminiApiKey;
  }

  // Auto-sync active gemini key
  if (activeProvider === 'gemini' && s.aiApiKey && !s.geminiApiKey) {
    s.geminiApiKey = s.aiApiKey;
  }

  if (!s.gitlabToken && process.env.GITLAB_TOKEN)
    s.gitlabToken = process.env.GITLAB_TOKEN;
  return s as unknown as Settings;
}

export function saveSettings(patch: Partial<Settings> & { aiApiKeys?: Record<string, string> }) {
  const stmt = db().prepare(
    'INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  );

  // If aiApiKeys map is provided, persist each provider key
  if (patch.aiApiKeys && typeof patch.aiApiKeys === 'object') {
    for (const [provider, keyVal] of Object.entries(patch.aiApiKeys)) {
      if (typeof keyVal === 'string' && !isMasked(keyVal)) {
        stmt.run(`aiApiKey_${provider}`, keyVal.trim());
      }
    }
  }

  // If aiApiKey is passed in patch, also store it for the active provider
  const targetProvider = patch.aiProvider || getSettings().aiProvider || 'gemini';
  if (patch.aiApiKey !== undefined && !isMasked(patch.aiApiKey)) {
    const keyVal = String(patch.aiApiKey).trim();
    stmt.run(`aiApiKey_${targetProvider}`, keyVal);
    if (targetProvider === 'gemini') {
      stmt.run('geminiApiKey', keyVal);
    }
  }

  for (const [k, v] of Object.entries(patch)) {
    if (k === 'aiApiKeys' || !(k in DEFAULT_SETTINGS) || v === undefined) continue;
    let cleanVal = String(v).trim();
    if (k === 'taigaToken' || k === 'taigaRefresh') {
      cleanVal = cleanVal.replace(/^["']+|["']+$/g, '').trim();
    }
    stmt.run(k, cleanVal);
  }
}

/** Settings sent to the browser: values are accessible for direct editing */
export function getPublicSettings() {
  const s = getSettings();
  const out: Record<string, unknown> = { ...s };
  for (const k of SECRET_KEYS) {
    const v = s[k] as string;
    out[k] = v || '';
    out[`${k}Set`] = Boolean(v);
  }

  // Gather all per-provider keys
  const rows = db().prepare("SELECT key, value FROM settings WHERE key LIKE 'aiApiKey_%'").all() as {
    key: string;
    value: string;
  }[];
  const aiApiKeys: Record<string, string> = {};
  for (const r of rows) {
    const p = r.key.replace('aiApiKey_', '');
    aiApiKeys[p] = r.value || '';
  }

  // Backwards compatibility migration / seed in output if not yet in aiApiKey_<provider>
  if (!aiApiKeys.gemini && s.geminiApiKey) {
    aiApiKeys.gemini = s.geminiApiKey;
  }
  const currentProvider = s.aiProvider || 'gemini';
  if (!aiApiKeys[currentProvider] && s.aiApiKey) {
    aiApiKeys[currentProvider] = s.aiApiKey;
  }

  out.aiApiKeys = aiApiKeys;
  return out;
}

export function isMasked(v: unknown) {
  return typeof v === 'string' && v.startsWith('••••');
}

export const splitList = (v: string) =>
  v
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
