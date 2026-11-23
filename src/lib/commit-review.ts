/**
 * Aturan murni untuk Review Kode AI: pemilihan kandidat commit, prompt,
 * parsing respons LLM, dan agregasi. Tanpa DB, jaringan, atau panggilan model,
 * sehingga bisa diuji tanpa memakai kuota Gemini.
 */

export const REVIEW_MIN_ADDED = 100;
export const REVIEW_MAX_PER_CYCLE = 20;
/** Batas baris tambahan yang dikirim ke model per commit (kontrol kuota). */
export const REVIEW_MAX_LINES = 600;
export const REVIEW_MAX_NOTES = 6;
export const REVIEW_MIN_NOTES = 3;

export interface ReviewCandidateInput {
  sha: string;
  project_id: number;
  title: string;
  authored_at: string;
  added: number;
}

export interface ReviewFileLines {
  path: string;
  lines: string[];
}

export interface CommitReviewResult {
  score: number;
  summary: string;
  notes: string[];
}

export interface ReviewHighlight extends CommitReviewResult {
  sha: string;
  shortSha: string;
  title: string;
}

/** Commit terbaru yang cukup besar dan belum pernah direview. */
export function selectReviewCandidates(
  rows: ReviewCandidateInput[],
  reviewedShas: Iterable<string>,
  options: { minAdded?: number; limit?: number } = {},
): ReviewCandidateInput[] {
  const minAdded = options.minAdded ?? REVIEW_MIN_ADDED;
  const limit = Math.max(0, options.limit ?? REVIEW_MAX_PER_CYCLE);
  const reviewed = new Set(reviewedShas);
  return rows
    .filter((row) => row.added >= minAdded && !reviewed.has(row.sha))
    .sort((a, b) => b.authored_at.localeCompare(a.authored_at) || a.sha.localeCompare(b.sha))
    .slice(0, limit);
}

/** Ambil JSON dari respons model yang kadang dibungkus pagar kode. */
export function extractJson(raw: string): string | null {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  return text.slice(start, end + 1);
}

function clampScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Validasi respons terstruktur. Respons rusak, skor hilang, atau catatan
 * kurang dari 3 dianggap gagal supaya pemanggil bisa retry 1×.
 */
export function parseReviewResponse(raw: string): CommitReviewResult | null {
  const json = extractJson(raw);
  if (!json) return null;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
  const score = clampScore(parsed.score);
  if (score === null) return null;

  const rawNotes = Array.isArray(parsed.notes) ? parsed.notes : [];
  const notes = rawNotes
    .filter((note): note is string => typeof note === "string")
    .map((note) => note.trim())
    .filter((note) => note.length >= 3)
    .map((note) => note.slice(0, 240))
    .slice(0, REVIEW_MAX_NOTES);
  if (notes.length < REVIEW_MIN_NOTES) return null;

  const summary =
    typeof parsed.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim().slice(0, 400)
      : notes[0];

  return { score, summary, notes };
}

/** Rakit prompt review dari judul commit dan baris tambahan (dibatasi). */
export function buildReviewPrompt(
  candidate: Pick<ReviewCandidateInput, "title" | "authored_at">,
  files: ReviewFileLines[],
  maxLines = REVIEW_MAX_LINES,
): { prompt: string; lineCount: number; truncated: boolean } {
  const ordered = [...files]
    .filter((file) => file.lines.length > 0)
    .sort((a, b) => b.lines.length - a.lines.length || a.path.localeCompare(b.path));

  const blocks: string[] = [];
  let lineCount = 0;
  let truncated = false;
  for (const file of ordered) {
    if (lineCount >= maxLines) {
      truncated = true;
      break;
    }
    const remaining = maxLines - lineCount;
    const lines = file.lines.slice(0, remaining);
    if (file.lines.length > lines.length) truncated = true;
    lineCount += lines.length;
    blocks.push(`### ${file.path}\n${lines.map((line) => `+ ${line}`).join("\n")}`);
  }

  const prompt = `Judul commit: ${candidate.title}
Tanggal commit: ${candidate.authored_at.slice(0, 10)}
${truncated ? `Catatan: hanya ${lineCount} baris tambahan pertama yang ditampilkan.\n` : ""}
Baris kode yang ditambahkan (hanya baris ini yang dinilai):
${blocks.join("\n\n")}`;

  return { prompt, lineCount, truncated };
}

export function averageReviewScore(reviews: Array<{ score: number }>): number | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + review.score, 0);
  return Math.round(total / reviews.length);
}

/** Commit dengan skor terendah jadi sorotan; yang terbaru menang bila seri. */
export function reviewHighlights(
  reviews: Array<{
    sha: string;
    title: string;
    score: number;
    summary: string;
    notes: string[];
    authored_at: string;
  }>,
  limit = 3,
): ReviewHighlight[] {
  return [...reviews]
    .sort((a, b) => a.score - b.score || b.authored_at.localeCompare(a.authored_at))
    .slice(0, limit)
    .map((review) => ({
      sha: review.sha,
      shortSha: review.sha.slice(0, 8),
      title: review.title,
      score: review.score,
      summary: review.summary,
      notes: review.notes,
    }));
}

export type ReviewInsightTone = "good" | "warn" | "info";

export interface ReviewInsight {
  tone: ReviewInsightTone;
  text: string;
}

/** Tema temuan "perlu diperbaiki" pada catatan Gemini, dengan kata kuncinya. */
const ISSUE_THEMES: Array<{ label: string; pattern: RegExp }> = [
  { label: "keamanan (secret/SQL)", pattern: /secret|kredensial|sql|injection|otorisasi/i },
  { label: "penanganan error", pattern: /catch|penanganan error|exception|error ditelan/i },
  { label: "duplikasi", pattern: /duplikasi|duplikat|duplicate/i },
  { label: "debug print tertinggal", pattern: /debug|console\.log|print\s*\(/i },
  { label: "tipe longgar (any)", pattern: /\bany\b|tipe eksplisit/i },
  { label: "nesting dalam", pattern: /nesting|bersarang/i },
  { label: "kualitas tes", pattern: /\btes\b|\btest\b|pengujian/i },
  { label: "kebenaran logika", pattern: /logika|logic/i },
];

const THEME_DO: Record<string, string> = {
  "keamanan (secret/SQL)": "Pindahkan kredensial ke environment variable dan pakai parameterized query.",
  "penanganan error": "Isi setiap catch dengan log dan penanganan yang jelas.",
  duplikasi: "Satukan baris yang sama ke fungsi atau konstanta bersama.",
  "debug print tertinggal": "Hapus debug print sebelum push.",
  "tipe longgar (any)": "Ganti tipe any dengan tipe eksplisit.",
  "nesting dalam": "Pangkas nesting dengan early-return atau guard clause.",
  "kualitas tes": "Tambahkan tes untuk cabang logika yang baru ditambahkan.",
  "kebenaran logika": "Uji jalur logika yang berisiko sebelum merge.",
};

const PERBAIKI_PREFIX = /^Yang perlu diperbaiki:\s*/i;

/**
 * Rakit baris insight dari semua hasil review satu periode: rata-rata,
 * distribusi skor, tema temuan tersering, dan commit terlemah.
 */
export function buildReviewInsights(
  reviews: Array<{
    sha: string;
    title: string;
    score: number;
    summary: string;
    notes: string[];
    authored_at: string;
  }>,
): ReviewInsight[] {
  const average = averageReviewScore(reviews);
  if (average === null) return [];

  const insights: ReviewInsight[] = [];

  const good = reviews.filter((r) => r.score >= 70).length;
  const mid = reviews.filter((r) => r.score >= 40 && r.score < 70).length;
  const low = reviews.filter((r) => r.score < 40).length;
  const avgLabel =
    average >= 85
      ? "sangat baik"
      : average >= 70
        ? "baik"
        : average >= 55
          ? "cukup"
          : "perlu perhatian";
  insights.push({
    tone: average >= 70 ? "good" : "warn",
    text: `Rata-rata penilaian Gemini ${average}/100 dari ${reviews.length} commit (${avgLabel}).`,
  });

  const dist = [
    good ? `${good} bersih (≥70)` : "",
    mid ? `${mid} cukup (40–69)` : "",
    low ? `${low} kritis (<40)` : "",
  ].filter(Boolean);
  if (dist.length) {
    insights.push({
      tone: low > 0 ? "warn" : "info",
      text: `Distribusi skor: ${dist.join(", ")}.`,
    });
  }

  const themeCount = new Map<string, number>();
  for (const review of reviews) {
    const seen = new Set<string>();
    for (const note of review.notes) {
      const cleaned = note.replace(PERBAIKI_PREFIX, "");
      if (cleaned === note) continue;
      for (const theme of ISSUE_THEMES) {
        if (theme.pattern.test(cleaned) && !seen.has(theme.label)) {
          seen.add(theme.label);
          themeCount.set(theme.label, (themeCount.get(theme.label) ?? 0) + 1);
        }
      }
    }
  }
  const themes = [...themeCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (themes.length) {
    const [top] = themes[0];
    const names = themes.map(([label, count]) => `${label} (${count} commit)`).join(" dan ");
    insights.push({ tone: "warn", text: `Tema perbaikan tersering: ${names}.` });
    const advice = THEME_DO[top];
    if (advice) {
      insights.push({ tone: "info", text: `Saran: mulai dari ${top} — ${advice}` });
    }
  }

  return insights;
}
