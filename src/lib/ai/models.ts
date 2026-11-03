// Shared by server (AI client) and browser (Settings page): keep free of server-only imports.

export type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'custom';

export type AiFeature = 'smartTask' | 'productivity' | 'workload' | 'report';

export type AiFeatureModelKey =
  | 'aiModelSmartTask'
  | 'aiModelProductivity'
  | 'aiModelWorkload'
  | 'aiModelReport';

export interface AiFeatureInfo {
  feature: AiFeature;
  settingKey: AiFeatureModelKey;
  label: string;
  usage: string;
}

export const AI_FEATURES: AiFeatureInfo[] = [
  {
    feature: 'smartTask',
    settingKey: 'aiModelSmartTask',
    label: 'Smart Task',
    usage: 'Parsing teks bebas jadi draf User Story & Task',
  },
  {
    feature: 'productivity',
    settingKey: 'aiModelProductivity',
    label: 'Productivity Monitor',
    usage: 'Pre-review kode, MR Assistant, dan review MR masuk',
  },
  {
    feature: 'workload',
    settingKey: 'aiModelWorkload',
    label: 'Workload Analysis',
    usage: 'Timesheet Gap Healer dan analisis workload',
  },
  {
    feature: 'report',
    settingKey: 'aiModelReport',
    label: 'Report',
    usage: 'Bagian Analisis AI di laporan performa',
  },
];

export const DEFAULT_MODEL_BY_PROVIDER: Record<AiProvider, string> = {
  gemini: 'gemini-3.8-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
  custom: 'dpe/alias/glm-flash',
};

export interface AiModelOption {
  value: string;
  label: string;
}

/** Selectable models per provider. `custom` uses free text input instead. */
export const MODEL_OPTIONS: Record<
  Exclude<AiProvider, 'custom'>,
  AiModelOption[]
> = {
  gemini: [
    { value: 'gemini-3.8-flash', label: 'gemini-3.8-flash (Generasi Terbaru)' },
    { value: 'gemini-3.7-flash', label: 'gemini-3.7-flash (Stabil & Canggih)' },
    {
      value: 'gemini-3.6-flash',
      label: 'gemini-3.6-flash (Cepat & Responsif)',
    },
    { value: 'gemini-3.5-flash', label: 'gemini-3.5-flash (Stabil & Handal)' },
    {
      value: 'gemini-3.1-flash-lite',
      label: 'gemini-3.1-flash-lite (Ultra Cepat & Hemat Kuota)',
    },
    {
      value: 'gemini-flash-lite-latest',
      label: 'gemini-flash-lite-latest (Versi Lite Otomatis)',
    },
  ],
  openai: [
    {
      value: 'gpt-4o-mini',
      label: 'gpt-4o-mini (Rekomendasi - Cepat & Hemat)',
    },
    { value: 'gpt-4o', label: 'gpt-4o (Kapasitas Analisis Penuh)' },
    { value: 'o3-mini', label: 'o3-mini (Reasoning Cepat)' },
  ],
  anthropic: [
    {
      value: 'claude-3-5-sonnet-latest',
      label: 'claude-3-5-sonnet (Rekomendasi - Kode & Analisis)',
    },
    {
      value: 'claude-3-5-haiku-latest',
      label: 'claude-3-5-haiku (Super Cepat & Ringkas)',
    },
  ],
};

export const AI_FEATURE_MODEL_KEYS: AiFeatureModelKey[] = AI_FEATURES.map(
  (f) => f.settingKey,
);

type ModelSettings = Partial<Record<AiFeatureModelKey, string>> & {
  aiProvider?: AiProvider;
  aiModel?: string;
  geminiModel?: string;
};

const LEGACY_GEMINI_PREFIXES = ['gemini-2.5-', 'gemini-1.5-', 'gemini-2.0-'];

/** Global model chosen in Settings, falling back to the provider default. */
export function resolveGlobalModel(s: ModelSettings): string {
  const provider = s.aiProvider || 'gemini';
  return (
    s.aiModel ||
    s.geminiModel ||
    DEFAULT_MODEL_BY_PROVIDER[provider]
  ).trim();
}

/**
 * Model for a given menu: the per-menu override when set, otherwise the global model.
 * Retired Gemini generations are remapped to the current default.
 */
export function resolveAiModel(s: ModelSettings, feature?: AiFeature): string {
  const provider = s.aiProvider || 'gemini';
  const info = feature
    ? AI_FEATURES.find((f) => f.feature === feature)
    : undefined;
  const override = info ? (s[info.settingKey] || '').trim() : '';
  const model = override || resolveGlobalModel(s);
  if (
    provider === 'gemini' &&
    LEGACY_GEMINI_PREFIXES.some((p) => model.startsWith(p))
  ) {
    return DEFAULT_MODEL_BY_PROVIDER.gemini;
  }
  return model;
}
