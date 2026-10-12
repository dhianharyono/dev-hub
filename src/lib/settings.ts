import "server-only";
import { db } from "./db";

export interface Settings {
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
  writingLanguage: "id" | "en";
  aiProvider: "gemini" | "openai" | "anthropic" | "custom";
  aiApiKey: string;
  aiModel: string;
  aiBaseUrl: string;
}

export const DEFAULT_SETTINGS: Settings = {
  taigaBaseUrl: "https://tree.taiga.io",
  taigaProjectSlug: "",
  taigaSprintSlug: "",
  taigaToken: "",
  taigaRefresh: "",
  gitlabBaseUrl: "https://gitlab.playcourt.id",
  gitlabToken: "",
  gitlabUsername: "",
  identityEmails: "",
  identityNames: "",
  excludePatterns:
    "*.lock, package-lock.json, yarn.lock, pnpm-lock.yaml, go.sum, composer.lock, *.min.js, *.min.css, *.map, dist/*, build/*, vendor/*, node_modules/*, *.snap, *.svg, *.pb.go, *_generated.*, *.generated.*",
  geminiApiKey: "",
  geminiModel: "gemini-3.8-flash",
  writingLanguage: "id",
  aiProvider: "gemini",
  aiApiKey: "",
  aiModel: "gemini-3.8-flash",
  aiBaseUrl: "",
};

const SECRET_KEYS: (keyof Settings)[] = [
  "taigaToken",
  "taigaRefresh",
  "gitlabToken",
  "geminiApiKey",
  "aiApiKey",
];

export function getSettings(): Settings {
  const rows = db().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const s: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) s[r.key] = r.value;
  // env fallbacks for secrets
  if (!s.geminiApiKey && process.env.GEMINI_API_KEY) s.geminiApiKey = process.env.GEMINI_API_KEY;
  if (!s.aiApiKey) {
    if (s.aiProvider === "gemini" && s.geminiApiKey) s.aiApiKey = s.geminiApiKey;
    else if (s.aiProvider === "openai" && process.env.OPENAI_API_KEY) s.aiApiKey = process.env.OPENAI_API_KEY;
    else if (s.aiProvider === "anthropic" && process.env.ANTHROPIC_API_KEY) s.aiApiKey = process.env.ANTHROPIC_API_KEY;
    else if (s.geminiApiKey) s.aiApiKey = s.geminiApiKey;
  }
  if (!s.gitlabToken && process.env.GITLAB_TOKEN) s.gitlabToken = process.env.GITLAB_TOKEN;
  return s as unknown as Settings;
}

export function saveSettings(patch: Partial<Settings>) {
  const stmt = db().prepare(
    "INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in DEFAULT_SETTINGS) || v === undefined) continue;
    let cleanVal = String(v).trim();
    if (k === "taigaToken" || k === "taigaRefresh") {
      cleanVal = cleanVal.replace(/^["']+|["']+$/g, "").trim();
    }
    stmt.run(k, cleanVal);
  }
}

/** Settings sent to the browser: values are accessible for direct editing */
export function getPublicSettings() {
  const s = getSettings();
  const out: Record<string, string | boolean> = { ...s };
  for (const k of SECRET_KEYS) {
    const v = s[k] as string;
    out[k] = v || "";
    out[`${k}Set`] = Boolean(v);
  }
  return out;
}

export function isMasked(v: unknown) {
  return typeof v === "string" && v.startsWith("••••");
}

export const splitList = (v: string) =>
  v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
