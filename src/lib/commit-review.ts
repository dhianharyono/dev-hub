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
