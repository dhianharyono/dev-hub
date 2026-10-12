export interface PublicSettings {
  taigaBaseUrl: string;
  taigaProjectSlug: string;
  taigaSprintSlug: string;
  taigaToken: string;
  taigaTokenSet: boolean;
  taigaRefresh: string;
  gitlabBaseUrl: string;
  gitlabToken: string;
  gitlabTokenSet: boolean;
  gitlabUsername: string;
  identityEmails: string;
  identityNames: string;
  excludePatterns: string;
  geminiApiKey: string;
  geminiApiKeySet: boolean;
  geminiModel: string;
  writingLanguage: 'id' | 'en';
  aiProvider: 'gemini' | 'openai' | 'anthropic' | 'custom';
  aiApiKey: string;
  aiApiKeySet: boolean;
  aiModel: string;
  aiBaseUrl: string;
}

export interface TestResult {
  taiga?: { ok: boolean; message: string };
  gitlab?: { ok: boolean; message: string };
  gemini?: { ok: boolean; message: string };
  ai?: { ok: boolean; message: string };
}

export interface TestingState {
  taiga?: boolean;
  gitlab?: boolean;
  gemini?: boolean;
  ai?: boolean;
}
