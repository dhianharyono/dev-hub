import "server-only";
import { GoogleGenAI } from "@google/genai";
import { db } from "./db";
import { getSettings, splitList } from "./settings";
import { glAll, pool } from "./gitlab";
import {
  REVIEW_MAX_PER_CYCLE,
  REVIEW_MIN_ADDED,
  buildReviewPrompt,
  parseReviewResponse,
  selectReviewCandidates,
  type ReviewCandidateInput,
  type ReviewFileLines,
} from "./commit-review";

export interface ReviewRunResult {
  configured: boolean;
  model: string | null;
  candidates: number;
  reviewed: number;
  failed: number;
  skipped: number;
  total: number;
}

export interface ReviewStatus extends ReviewRunResult {
  running: boolean;
  phase: string;
  done: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  log: string[];
}

const g = globalThis as unknown as { __reviewStatus?: ReviewStatus };
export const reviewStatus = (): ReviewStatus =>
  (g.__reviewStatus ??= {
    configured: false,
    model: null,
    running: false,
    phase: "idle",
    done: 0,
    total: 0,
    candidates: 0,
    reviewed: 0,
    failed: 0,
    skipped: 0,
    log: [],
  });

function log(message: string) {
  const st = reviewStatus();
  st.log = [...st.log.slice(-30), `${new Date().toLocaleTimeString("id-ID")} ${message}`];
}

const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer", description: "Skor kualitas kode 0-100" },
    summary: { type: "string", description: "Ringkasan evaluasi 1-2 kalimat" },
    notes: {
      type: "array",
      items: { type: "string" },
      description: "3-6 poin singkat, diawali 'Yang sudah baik:' atau 'Yang perlu diperbaiki:'",
    },
  },
  required: ["score", "summary", "notes"],
};

const SYSTEM_PROMPT = `Kamu adalah Senior Software Engineer yang melakukan code review atas commit seorang engineer.
Nilai HANYA baris kode yang ditambahkan pada commit tersebut, bukan seluruh file atau repository.
Fokus: kebenaran logika, keamanan (secret, SQL injection, otorisasi), penanganan error, duplikasi, debug print, tipe any, nesting, dan kualitas tes.

Rubrik skor 0-100:
- 85-100: bersih, aman, teruji, tanpa temuan berarti.
- 70-84: baik, hanya catatan kecil yang tidak menghambat.
- 55-69: ada masalah jelas yang perlu diperbaiki (duplikasi, error ditelan, tipe longgar, debug tertinggal).
- 40-54: banyak masalah pada logika, keamanan, atau kualitas; perlu rework.
- 0-39: rusak, berbahaya, atau tidak dapat dijalankan (secret bocor, sintaks rusak, SQL dirangkai tanpa parameter).

Tulis dalam bahasa Indonesia yang ringkas, objektif, dan konstruktif, maksimal 220 kata.
Berikan 3-6 poin catatan. Setiap poin harus diawali "Yang sudah baik: " atau "Yang perlu diperbaiki: ".
Balas hanya JSON sesuai skema: score, summary, notes.`;

function capLines(files: ReviewFileLines[], maxPerFile = 400, maxTotal = 1500): ReviewFileLines[] {
  let total = 0;
  const out: ReviewFileLines[] = [];
  for (const file of files) {
    if (total >= maxTotal) break;
    const lines = file.lines.slice(0, Math.min(maxPerFile, maxTotal - total));
    if (!lines.length) continue;
    total += lines.length;
    out.push({ path: file.path, lines });
  }
  return out;
}

function readStoredLines(sha: string): ReviewFileLines[] | null {
  const row = db().prepare("SELECT added_json FROM gl_commit_diffs WHERE sha = ?").get(sha) as
    | { added_json: string | null }
    | undefined;
  if (!row?.added_json) return null;
  try {
    const parsed = JSON.parse(row.added_json) as ReviewFileLines[];
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((file) => typeof file?.path === "string" && Array.isArray(file.lines));
  } catch {
    return null;
  }
}

async function loadAddedLines(candidate: ReviewCandidateInput): Promise<ReviewFileLines[] | null> {
  const stored = readStoredLines(candidate.sha);
  if (stored) return stored;

  const diffs = await glAll<{ new_path: string; path?: string; diff: string }>(
    `/projects/${candidate.project_id}/repository/commits/${candidate.sha}/diff`,
    5,
  );
  const files: ReviewFileLines[] = [];
  for (const file of diffs) {
    const filePath = file.new_path || file.path || "";
    if (!filePath) continue;
    const lines: string[] = [];
    for (const line of (file.diff ?? "").split("\n")) {
      if (!line.startsWith("+") || line.startsWith("+++")) continue;
      lines.push(line.slice(1));
    }
    if (lines.length) files.push({ path: filePath, lines });
  }
  if (files.length === 0) return null;

  const capped = capLines(files);
  const paths = capped.map((file) => file.path);
  db()
    .prepare(
      `INSERT INTO gl_commit_diffs(sha, files_json, added_json) VALUES (?,?,?)
       ON CONFLICT(sha) DO UPDATE SET added_json = excluded.added_json`,
    )
    .run(candidate.sha, JSON.stringify(paths), JSON.stringify(capped));
  return capped;
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const config: Record<string, unknown> = {
    systemInstruction: SYSTEM_PROMPT,
    temperature: 0.2,
    responseMimeType: "application/json",
    responseJsonSchema: REVIEW_SCHEMA,
    maxOutputTokens: 2048,
    // Gemini 3.x memakai token "thinking" yang bisa menghabiskan kuota output
    // sebelum JSON selesai; review ini tidak butuh penalaran panjang.
    thinkingConfig: { thinkingBudget: 0 },
  };
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout 60 detik memanggil Gemini")), 60_000);
  });
  const response = await Promise.race([
    ai.models.generateContent({ model, contents: prompt, config }),
    timeout,
  ]);
  return response.text ?? "";
}

/** Satu percobaan + retry 1× untuk error API maupun respons tidak valid. */
async function reviewCommit(
  apiKey: string,
  model: string,
  candidate: ReviewCandidateInput,
  files: ReviewFileLines[],
) {
  const { prompt } = buildReviewPrompt(candidate, files);
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callGemini(apiKey, model, prompt);
      const parsed = parseReviewResponse(raw);
      if (parsed) return parsed;
      lastError = new Error(
        raw.trim() ? `Respons LLM tidak valid: ${raw.trim().slice(0, 160)}` : "Respons LLM kosong",
      );
    } catch (error) {
      lastError = error as Error;
    }
  }
  throw lastError ?? new Error("Review gagal");
}

function markReview(
  sha: string,
  status: "reviewed" | "failed" | "skipped",
  data: { score?: number; summary?: string; notes?: string[]; model?: string; error?: string },
) {
  db()
    .prepare(
      `INSERT INTO gl_commit_reviews(sha, status, score, summary, notes_json, model, error, reviewed_at)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(sha) DO UPDATE SET
         status = excluded.status, score = excluded.score, summary = excluded.summary,
         notes_json = excluded.notes_json, model = excluded.model, error = excluded.error,
         reviewed_at = excluded.reviewed_at`,
    )
    .run(
      sha,
      status,
      data.score ?? null,
      data.summary ?? null,
      data.notes ? JSON.stringify(data.notes) : null,
      data.model ?? null,
      data.error ?? null,
      new Date().toISOString(),
    );
}

/**
 * Jalankan satu siklus review: pilih kandidat terbaru yang belum pernah
 * diproses, ambil baris tambahan (cache di gl_commit_diffs), panggil Gemini.
 */
export async function runReviewBatch(
  options: { limit?: number; days?: number } = {},
): Promise<ReviewRunResult> {
  const st = reviewStatus();
  const s = getSettings();
  const apiKey = (s.geminiApiKey || "").trim();
  const model = (s.geminiModel || "gemini-3.8-flash").trim();
  st.configured = Boolean(apiKey);
  st.model = apiKey ? model : null;
  if (!apiKey) {
    st.phase = "Belum dikonfigurasi";
    return { configured: false, model: null, candidates: 0, reviewed: 0, failed: 0, skipped: 0, total: 0 };
  }

  const limit = Math.max(1, Math.min(options.limit ?? REVIEW_MAX_PER_CYCLE, 50));
  const days = options.days ?? 365;
  const start =
    days > 0
      ? new Date(Date.now() - days * 864e5)
      : new Date(`${new Date().getFullYear()}-01-01T00:00:00+07:00`);

  const userRow = db().prepare("SELECT value FROM settings WHERE key = 'glUser'").get() as
    | { value: string }
    | undefined;
  const user = userRow?.value
    ? (JSON.parse(userRow.value) as { username?: string; name?: string })
    : undefined;

  const emails = new Set(splitList(s.identityEmails).map((value) => value.toLowerCase()).filter(Boolean));
  const names = new Set(
    [...splitList(s.identityNames), user?.username ?? "", user?.name ?? ""]
      .map((value) => value.toLowerCase())
      .filter(Boolean),
  );
  const identityClauses: string[] = [];
  const identityParams: string[] = [];
  if (emails.size) {
    identityClauses.push(`lower(c.author_email) IN (${[...emails].map(() => "?").join(",")})`);
    identityParams.push(...emails);
  }
  if (names.size) {
    identityClauses.push(`lower(c.author_name) IN (${[...names].map(() => "?").join(",")})`);
    identityParams.push(...names);
  }
  const identity = identityClauses.length ? `(${identityClauses.join(" OR ")})` : "0";

  const rows = db()
    .prepare(
      `SELECT c.sha, c.project_id, c.title, c.authored_at, SUM(f.added) AS added
       FROM gl_commits c JOIN gl_commit_files f ON f.sha = c.sha
       WHERE c.is_merge = 0 AND c.authored_at >= ? AND ${identity}
         AND NOT EXISTS (SELECT 1 FROM gl_commit_reviews r WHERE r.sha = c.sha)
       GROUP BY c.sha
       HAVING SUM(f.added) >= ?
       ORDER BY c.authored_at DESC`,
    )
    .all(start.toISOString(), ...identityParams, REVIEW_MIN_ADDED) as unknown as ReviewCandidateInput[];

  const candidates = selectReviewCandidates(rows, [], { limit });
  st.candidates = rows.length;
  st.total = candidates.length;
  st.done = 0;
  st.reviewed = 0;
  st.failed = 0;
  st.skipped = 0;
  st.phase = "Review kode";
  log(`${rows.length} kandidat, ${candidates.length} direview siklus ini`);

  await pool(candidates, 2, async (candidate) => {
    try {
      const files = await loadAddedLines(candidate);
      if (!files) {
        markReview(candidate.sha, "skipped", { error: "Diff tidak tersimpan atau kosong" });
        st.skipped++;
        return;
      }
      const result = await reviewCommit(apiKey, model, candidate, files);
      markReview(candidate.sha, "reviewed", {
        score: result.score,
        summary: result.summary,
        notes: result.notes,
        model,
      });
      st.reviewed++;
    } catch (error) {
      const message = (error as Error).message.slice(0, 300);
      markReview(candidate.sha, "failed", { error: message, model });
      st.failed++;
      if (st.failed <= 3) log(`⚠️ ${candidate.sha.slice(0, 8)}: ${message}`);
    } finally {
      st.done++;
    }
  });

  st.phase = "Selesai";
  log(`✅ Review selesai: ${st.reviewed} direview, ${st.failed} gagal, ${st.skipped} dilewati`);
  return {
    configured: true,
    model,
    candidates: rows.length,
    reviewed: st.reviewed,
    failed: st.failed,
    skipped: st.skipped,
    total: candidates.length,
  };
}

/** Endpoint manual: jalankan review di latar belakang dengan status terpisah. */
export function startReview(options: { limit?: number; days?: number } = {}): ReviewStatus {
  const st = reviewStatus();
  if (st.running) return st;
  Object.assign(st, {
    running: true,
    phase: "Review kode",
    done: 0,
    total: 0,
    candidates: 0,
    reviewed: 0,
    failed: 0,
    skipped: 0,
    error: undefined,
    log: [],
    startedAt: new Date().toISOString(),
    finishedAt: undefined,
  });
  runReviewBatch(options)
    .catch((error: Error) => {
      st.error = error.message;
      log(`❌ ${error.message}`);
    })
    .finally(() => {
      st.running = false;
      st.phase = st.error ? "Gagal" : "Selesai";
      st.finishedAt = new Date().toISOString();
    });
  return st;
}
