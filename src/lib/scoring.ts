/**
 * Mesin skor 6 komponen (metodologi Ranking Talent) — murni, tanpa DB/server.
 *
 * Catatan Fase 0: Produktivitas, Kolaborasi, dan Alur Rilis masih memakai
 * benchmark absolut. Metodologi aslinya memakai peringkat relatif tim; skor
 * relatif menyusul di Fase 4. Nilai pembanding PDF disimpan di PDF_REFERENCE.
 */

import { localDay, weekStart, workdaysBetween } from "./metrics";
import {
  ISSUE_KEYS,
  ISSUE_LABELS,
  addBundles,
  emptyBundle,
  languageOf,
  per100,
  readIssues,
  severityOf,
  staticPenalty,
  type IssueBundle,
  type IssueKey,
  type IssueSeverity,
} from "./code-issues";
import {
  averageReviewScore,
  buildReviewInsights,
  reviewHighlights,
  type ReviewHighlight,
  type ReviewInsight,
} from "./commit-review";
import {
  CARRIED_FACTOR,
  computeReleaseFlow,
  FINDING_THRESHOLDS,
  FIX_ON_FIX_WINDOW_DAYS,
  monthKey,
  RELEASE_TARGET_POINTS_PER_MONTH,
  RELEASE_TARGET_REACH_RATE,
  scoreReleaseFlow,
  STAGE_POINTS,
  type CommitFileRow,
  type FlowCommit,
  type FlowEvent,
  type FlowMr,
  type ReachRow,
} from "./talent-report";

export type Grade = "A" | "B" | "C" | "D" | "E";

export const COMPONENT_WEIGHTS = {
  productivity: 20,
  quality: 25,
  skill: 15,
  collaboration: 15,
  consistency: 10,
  releaseFlow: 15,
} as const;

export type ComponentKey = keyof typeof COMPONENT_WEIGHTS;

/** Alias eksplisit untuk metodologi Ranking Talent. */
export const TALENT_WEIGHTS = COMPONENT_WEIGHTS;

export const COMPONENT_KEYS = Object.keys(COMPONENT_WEIGHTS) as ComponentKey[];

export const COMPONENT_LABELS: Record<ComponentKey, string> = {
  productivity: "Produktivitas",
  quality: "Kualitas Kode",
  skill: "Skill Kode",
  collaboration: "Kolaborasi",
  consistency: "Konsistensi",
  releaseFlow: "Alur Rilis",
};

/** Nilai pembanding dari PDF Ranking Talent (Dhian, YTD 1 Jan – 20 Nov 2026). */
export const PDF_REFERENCE = {
  productivity: 73,
  quality: 59,
  skill: 48,
  collaboration: 26,
  consistency: 88,
  releaseFlow: 70,
  overall: 60,
} as const;

export const TARGET_SCORE = 70;

/** Target dinamis: skor dibulatkan ke atas ke kelipatan 10 (88 → 90, 77 → 80, 70 → 70). */
export function targetOfScore(score: number): number {
  return Math.min(100, Math.max(10, Math.ceil(score / 10) * 10));
}

/** Target tindak lanjut yang dipakai kartu Prioritas Aksi (bukan angka UI). */
export const FOLLOW_UP_TARGETS = {
  selfReworkPct: 10,
  fixOnFix: 40,
  activeWorkdayPct: 60,
} as const;

const DAY_MS = 86_400_000;
const MONTH_DAYS = 30.4375;
const REWORK_WINDOW_DAYS = 21;

/** Skala nilai A–E sesuai metodologi PDF. */
export function gradeOfScore(score: number): { grade: Grade; label: string } {
  if (score >= 85) return { grade: "A", label: "Sangat Baik" };
  if (score >= 70) return { grade: "B", label: "Baik" };
  if (score >= 55) return { grade: "C", label: "Cukup" };
  if (score >= 40) return { grade: "D", label: "Perlu Perhatian" };
  return { grade: "E", label: "Kurang" };
}

export interface ScoreCommit extends FlowCommit {
  title: string;
}

export interface ScoreEvent extends FlowEvent {
  noteable_type: string | null;
}

export interface ScoreFile extends CommitFileRow {
  added_hashes: string | null;
  deleted_hashes: string | null;
  issues_json?: string | null;
}

export interface ScoreInput {
  start: Date;
  end: Date;
  commits: ScoreCommit[];
  mrs: FlowMr[];
  events: ScoreEvent[];
  files: ScoreFile[];
  reaches: ReachRow[];
  reviews?: ScoreReview[];
}

export interface ScoreReview {
  sha: string;
  title: string;
  authored_at: string;
  score: number;
  summary: string;
  notes: string[];
}

export interface ReviewDetail {
  score: number | null;
  count: number;
  highlights: ReviewHighlight[];
  insights: ReviewInsight[];
}

export interface ScoreComponent {
  key: ComponentKey;
  label: string;
  weight: number;
  effectiveWeight: number;
  score: number | null;
  grade: Grade | null;
  available: boolean;
  potentialToTarget: number;
  potentialToMax: number;
}

export interface ScoreEvidence {
  months: number;
  commits: number;
  commitsPerMonth: number;
  linesChanged: number;
  linesPerMonth: number;
  mergedMrs: number;
  mergedMrsPerMonth: number;
  activeWorkdays: number;
  workdays: number;
  activeWorkdayRatio: number;
  weeksWithCommit: number;
  totalWeeks: number;
  fixRatio: number;
  selfReworkPct: number;
  fixOnFix: number;
  repeatedFiles: number;
  backAndForthLines: number;
  revertCount: number;
  testPct: number;
  scannedFiles: number;
  scannedLines: number;
  reviewActions: number;
  reviewsPerMonth: number;
  mrsCreated: number;
  mrsCreatedPerMonth: number;
  monthlyStability: number;
  messageQuality: number;
  releasePoints: number;
  releasePointsPerMonth: number;
  releaseReachPct: number;
}

export type IssueStatus = "critical" | "warn" | "good";

export type { IssueSeverity } from "./code-issues";

export interface StaticIssueRow {
  key: IssueKey;
  label: string;
  count: number;
  per100: number;
  status: IssueSeverity;
  statusLabel: "Kritis" | "Perhatian" | "Baik";
  penalty: number;
}

export interface SkillExample {
  path: string;
  count: number;
}

export interface LanguageSkill {
  language: string;
  lines: number;
  commits: number;
  intensity: "Intensif" | "Aktif" | "Dasar";
  score: number;
  findings: number;
}

export interface SkillDetail {
  score: number | null;
  penalty: number;
  testBonus: number;
  issues: StaticIssueRow[];
  languages: LanguageSkill[];
  /** File dengan temuan terbanyak per jenis, untuk langkah perbaikan konkret. */
  examples: Partial<Record<IssueKey, SkillExample>>;
  scannedFiles: number;
  scannedLines: number;
  coverage: number;
}

export interface QualityPenaltyItem {
  key: "selfRework" | "fixOnFix" | "repeatedFix" | "backAndForth" | "revert";
  label: string;
  count: number;
  unit: string;
  ratio: number;
  ratioLabel: string;
  penalty: number;
  maxPenalty: number;
}

export interface RecurringIssue {
  key: "fixOnFix" | "repeatedFix" | "backAndForth" | "revert";
  label: string;
  count: number;
  unit: string;
  ratio: number;
  ratioLabel: string;
  status: IssueStatus;
  statusLabel: "Kritis" | "Perhatian" | "Baik";
}

export interface RepeatedFixFile {
  path: string;
  fixCount: number;
  avgLines: number;
  kind: "perbaikan berulang" | "perbaikan kecil rutin";
  shas: string[];
}

export interface HotspotFile {
  path: string;
  commits: number;
  lines: number;
  selfReworkLines: number;
  selfReworkPct: number;
  fixCommits: number;
}

export interface ScoreAction {
  component: ComponentKey;
  priority: "P1" | "P2" | "P3";
  title: string;
  detail: string;
  steps: string[];
  note?: string;
  points: number;
}

export interface Scorecard {
  scores: Record<ComponentKey, number | null>;
  overall: number;
  grade: Grade;
  gradeLabel: string;
  weights: typeof COMPONENT_WEIGHTS;
  effectiveWeights: Record<ComponentKey, number>;
  components: ScoreComponent[];
  potential: { target: number; toTarget: number; toMax: number };
  period: { start: string; end: string; days: number; months: number; ytd: boolean };
  evidence: ScoreEvidence;
  diffReady: boolean;
  quality: { score: number | null; penalty: number; breakdown: QualityPenaltyItem[] };
  skill: SkillDetail;
  review: ReviewDetail;
  recurringIssues: RecurringIssue[];
  repeatedFixFiles: RepeatedFixFile[];
  hotspots: HotspotFile[];
  actions: ScoreAction[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const clampScore = (n: number) => Math.max(0, Math.min(100, n));

function parseHashes(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function inRange(iso: string | null, start: Date, end: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function isWeekday(day: string): boolean {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay();
  return dow !== 0 && dow !== 6;
}

function lastDayOfMonth(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

function monthKeysBetween(startDay: string, endDay: string): string[] {
  const out: string[] = [];
  let year = Number(startDay.slice(0, 4));
  let month = Number(startDay.slice(5, 7));
  const endYm = endDay.slice(0, 7);
  while (`${year}-${String(month).padStart(2, "0")}` <= endYm) {
    out.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return out;
}

interface FileHistoryEntry {
  sha: string;
  at: number;
  isFix: boolean;
  fixLike: boolean;
  added: string[];
  deleted: string[];
  lines: number;
}

export interface FileHistoryStats {
  rework: number;
  backAndForth: number;
  fixOnFixShas: Set<string>;
  fixOnFixLines: number;
  reworkShas: Set<string>;
  backAndForthShas: Set<string>;
}

/** Metodologi PDF: baris diganti ≤21 hari setelah ditulis; fix atas fix ≤45 hari. */
function analyzeFileHistory(list: FileHistoryEntry[]): FileHistoryStats {
  const addedAt = new Map<string, number>();
  const deletedAt = new Map<string, number>();
  const seenRework = new Set<string>();
  const seenBack = new Set<string>();
  const reworkShas = new Set<string>();
  const backAndForthShas = new Set<string>();
  let rework = 0;
  let backAndForth = 0;
  for (const entry of list) {
    for (const hash of entry.deleted) {
      const at = addedAt.get(hash);
      if (at !== undefined && entry.at > at && entry.at - at <= REWORK_WINDOW_DAYS * DAY_MS) {
        const key = `${entry.sha}:${hash}`;
        if (!seenRework.has(key)) {
          seenRework.add(key);
          rework++;
          reworkShas.add(entry.sha);
        }
      }
    }
    for (const hash of entry.added) {
      const at = deletedAt.get(hash);
      if (at !== undefined && entry.at > at && entry.at - at <= REWORK_WINDOW_DAYS * DAY_MS) {
        const key = `${entry.sha}:${hash}`;
        if (!seenBack.has(key)) {
          seenBack.add(key);
          backAndForth++;
          backAndForthShas.add(entry.sha);
        }
      }
    }
    for (const hash of entry.added) addedAt.set(hash, entry.at);
    for (const hash of entry.deleted) deletedAt.set(hash, entry.at);
  }

  // Fix atas fix: commit perbaikan yang mengganti baris hasil perbaikan sebelumnya.
  const fixAddedAt = new Map<string, number>();
  const fixOnFixShas = new Set<string>();
  let fixOnFixLines = 0;
  for (const entry of list) {
    if (!entry.isFix) continue;
    let hit = false;
    for (const hash of entry.deleted) {
      const at = fixAddedAt.get(hash);
      if (at !== undefined && entry.at > at && entry.at - at <= FIX_ON_FIX_WINDOW_DAYS * DAY_MS) {
        hit = true;
        fixOnFixLines++;
      }
    }
    if (hit) fixOnFixShas.add(entry.sha);
    for (const hash of entry.added) fixAddedAt.set(hash, entry.at);
  }

  return { rework, backAndForth, fixOnFixShas, fixOnFixLines, reworkShas, backAndForthShas };
}

/**
 * Baris yang dihapus kembali oleh penulis yang sama dalam 21 hari setelah
 * ditulis. Satu baris yang sama tidak dihitung dua kali pada commit yang sama.
 */
export function computeSelfReworkLines(
  files: ScoreFile[],
  commitAt: Map<string, number>,
): number {
  const byFile = new Map<string, FileHistoryEntry[]>();
  for (const file of files) {
    const list = byFile.get(file.path) ?? [];
    list.push({
      sha: file.sha,
      at: commitAt.get(file.sha) ?? 0,
      isFix: false,
      fixLike: false,
      added: parseHashes(file.added_hashes),
      deleted: parseHashes(file.deleted_hashes),
      lines: file.added + file.deleted,
    });
    byFile.set(file.path, list);
  }
  let lines = 0;
  for (const list of byFile.values()) {
    list.sort((a, b) => a.at - b.at);
    lines += analyzeFileHistory(list).rework;
  }
  return lines;
}

const FIX_LIKE_RE =
  /\b(fix(?:es|ed|ing)?|hotfix|bugfix|perbaik\w*|patch(?:es|ed|ing)?|error|typo|adjust(?:ment)?|salah)\b/i;

/** Commit "perbaikan" versi PDF lebih luas dari flag is_fix hasil sinkron. */
export function isFixLikeCommit(commit: { title: string; is_fix: number }): boolean {
  return Boolean(commit.is_fix) || FIX_LIKE_RE.test(commit.title);
}

export interface ReworkFileEvidence {
  path: string;
  count: number;
  shas: string[];
}

export interface ReworkAnalysis {
  selfReworkLines: number;
  backAndForthLines: number;
  fixOnFixCommits: number;
  fixOnFixLines: number;
  repeatedFixFiles: RepeatedFixFile[];
  hotspots: HotspotFile[];
  revertCount: number;
  fixOnFixFiles: ReworkFileEvidence[];
  backAndForthFiles: ReworkFileEvidence[];
  revertCommits: { sha: string; title: string; authored_at: string }[];
}

/** Menghitung rework, fix atas fix, file fix berulang, dan hotspot per file. */
export function analyzeRework(files: ScoreFile[], commits: ScoreCommit[]): ReworkAnalysis {
  const commitBySha = new Map(commits.map((commit) => [commit.sha, commit]));
  const byPath = new Map<string, FileHistoryEntry[]>();
  for (const file of files) {
    const commit = commitBySha.get(file.sha);
    if (!commit) continue;
    const entry: FileHistoryEntry = {
      sha: file.sha,
      at: new Date(commit.authored_at).getTime(),
      isFix: Boolean(commit.is_fix),
      fixLike: isFixLikeCommit(commit),
      added: parseHashes(file.added_hashes),
      deleted: parseHashes(file.deleted_hashes),
      lines: file.added + file.deleted,
    };
    const list = byPath.get(file.path) ?? [];
    list.push(entry);
    byPath.set(file.path, list);
  }

  let selfReworkLines = 0;
  let backAndForthLines = 0;
  let fixOnFixLines = 0;
  const fixOnFixShas = new Set<string>();
  const repeatedFixFiles: RepeatedFixFile[] = [];
  const hotspots: HotspotFile[] = [];
  const fixOnFixFiles: ReworkFileEvidence[] = [];
  const backAndForthFiles: ReworkFileEvidence[] = [];

  for (const [path, list] of byPath) {
    list.sort((a, b) => a.at - b.at);
    const stats = analyzeFileHistory(list);
    selfReworkLines += stats.rework;
    backAndForthLines += stats.backAndForth;
    fixOnFixLines += stats.fixOnFixLines;
    for (const sha of stats.fixOnFixShas) fixOnFixShas.add(sha);
    if (stats.fixOnFixShas.size) {
      fixOnFixFiles.push({ path, count: stats.fixOnFixShas.size, shas: [...stats.fixOnFixShas] });
    }
    if (stats.backAndForth > 0) {
      backAndForthFiles.push({
        path,
        count: stats.backAndForth,
        shas: [...stats.backAndForthShas],
      });
    }

    const fixes = list.filter((entry) => entry.fixLike);
    if (fixes.length >= 3) {
      const gaps: number[] = [];
      for (let i = 1; i < fixes.length; i++) gaps.push((fixes[i].at - fixes[i - 1].at) / DAY_MS);
      const avgLines = fixes.reduce((sum, entry) => sum + entry.lines, 0) / fixes.length;
      repeatedFixFiles.push({
        path,
        fixCount: fixes.length,
        avgLines: round1(avgLines),
        kind:
          fixes.length >= 5 || avgLines >= 20 ? "perbaikan berulang" : "perbaikan kecil rutin",
        shas: fixes.map((entry) => entry.sha),
      });
    }

    const lines = list.reduce((sum, entry) => sum + entry.lines, 0);
    hotspots.push({
      path,
      commits: new Set(list.map((entry) => entry.sha)).size,
      lines,
      selfReworkLines: stats.rework,
      selfReworkPct: lines ? round1((stats.rework / lines) * 100) : 0,
      fixCommits: fixes.length,
    });
  }

  repeatedFixFiles.sort((a, b) => b.fixCount - a.fixCount || a.path.localeCompare(b.path));
  hotspots.sort((a, b) => b.lines - a.lines || a.path.localeCompare(b.path));

  const revertCount = commits.filter((commit) => /^revert\s+["“]/i.test(commit.title.trim()))
    .length;

  fixOnFixFiles.sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));
  backAndForthFiles.sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));

  return {
    selfReworkLines,
    backAndForthLines,
    fixOnFixCommits: fixOnFixShas.size,
    fixOnFixLines,
    repeatedFixFiles,
    hotspots,
    revertCount,
    fixOnFixFiles,
    backAndForthFiles,
    revertCommits: commits
      .filter((commit) => /^revert\s+["“]/i.test(commit.title.trim()))
      .map((commit) => ({ sha: commit.sha, title: commit.title, authored_at: commit.authored_at })),
  };
}

function issueStatus(value: number): { status: IssueStatus; label: "Kritis" | "Perhatian" | "Baik" } {
  const band = FINDING_THRESHOLDS.duplicateLinesPer100;
  if (value >= band.critical) return { status: "critical", label: "Kritis" };
  if (value >= band.warn) return { status: "warn", label: "Perhatian" };
  return { status: "good", label: "Baik" };
}

const fmtId = (n: number) => n.toLocaleString("id-ID");

function shortPath(path: string): string {
  return path.replace(/^src\//, "");
}

function buildActions(
  components: ScoreComponent[],
  evidence: ScoreEvidence,
  repeatedFiles: RepeatedFixFile[],
  hotspots: HotspotFile[],
  skillDetail: SkillDetail,
  target: number,
): ScoreAction[] {
  const scoreOf = (key: ComponentKey) =>
    components.find((component) => component.key === key)?.score ?? null;
  const withTarget = (key: ComponentKey) => {
    const score = scoreOf(key);
    return score === null ? `target ${target}` : `${score}/100 (target ${target})`;
  };
  const exampleOf = (key: IssueKey) => {
    const example = skillDetail.examples[key];
    return example ? ` — mis. ${shortPath(example.path)} (${fmtId(example.count)})` : "";
  };

  const issueOf = (key: IssueKey) => skillDetail.issues.find((issue) => issue.key === key);
  const countOf = (key: IssueKey) => issueOf(key)?.count ?? 0;
  const per100Of = (key: IssueKey) => issueOf(key)?.per100 ?? 0;

  const issueSteps: Partial<Record<IssueKey, () => string>> = {
    secret: () =>
      `Pindahkan ${fmtId(countOf("secret"))} kredensial ke environment variable/secret manager${exampleOf("secret")}.`,
    sqlString: () =>
      `Ganti ${fmtId(countOf("sqlString"))} SQL yang dirangkai string dengan parameterized query${exampleOf("sqlString")}.`,
    emptyCatch: () =>
      `Isi ${fmtId(countOf("emptyCatch"))} catch kosong dengan log dan penanganan error${exampleOf("emptyCatch")}.`,
    debugPrint: () =>
      `Hapus ${fmtId(countOf("debugPrint"))} debug print yang tertinggal sebelum push${exampleOf("debugPrint")}.`,
    commentedCode: () =>
      `Hapus ${fmtId(countOf("commentedCode"))} baris kode yang dikomentari${exampleOf("commentedCode")}.`,
    duplicate: () =>
      `Satukan ${fmtId(countOf("duplicate"))} baris duplikat ke fungsi/konstanta bersama${exampleOf("duplicate")} — kini ${fmtId(per100Of("duplicate"))}/100 baris, target <${FINDING_THRESHOLDS.duplicateLinesPer100.warn}.`,
    anyType: () =>
      `Ganti ${fmtId(countOf("anyType"))} tipe any dengan tipe eksplisit${exampleOf("anyType")} — target <${FINDING_THRESHOLDS.anyTypePer100.warn}/100 baris.`,
    todo: () =>
      `Selesaikan atau angkat ${fmtId(countOf("todo"))} TODO/FIXME ke tiket${exampleOf("todo")}.`,
    deepNesting: () =>
      `Refactor ${fmtId(countOf("deepNesting"))} baris nesting dalam dengan early-return/guard clause${exampleOf("deepNesting")} — kini ${fmtId(per100Of("deepNesting"))}/100 baris, target <${FINDING_THRESHOLDS.deepNestingPer100.warn}.`,
    longLine: () => `Pecah ${fmtId(countOf("longLine"))} baris >120 karakter${exampleOf("longLine")}.`,
  };

  const skillIssues = [...skillDetail.issues]
    .filter((issue) => issue.count > 0)
    .sort((a, b) => b.penalty - a.penalty || b.count - a.count);
  const skillSteps = skillIssues
    .map((issue) => issueSteps[issue.key]?.())
    .filter((step): step is string => Boolean(step))
    .slice(0, 4);
  if (skillSteps.length < 4 && evidence.testPct < 30) {
    skillSteps.push(
      `Tambah kode tes: porsi sekarang ${fmtId(evidence.testPct)}%, bonus penuh di ≥30%.`,
    );
  }

  const topRepeated = repeatedFiles[0];
  const qualitySteps: string[] = [];
  if (topRepeated) {
    qualitySteps.push(
      `Selesaikan akar masalah ${shortPath(topRepeated.path)} sekali perbaikan — jangan patch kecil berulang (kini ${topRepeated.fixCount}×, rata-rata ${fmtId(topRepeated.avgLines)} baris).`,
    );
  }
  const topHotspot = [...hotspots]
    .filter((hotspot) => hotspot.path !== topRepeated?.path)
    .sort((a, b) => b.selfReworkLines - a.selfReworkLines)[0];
  if (topHotspot) {
    qualitySteps.push(
      `Prioritaskan ${shortPath(topHotspot.path)}: ${fmtId(topHotspot.selfReworkLines)} baris self-rework dari ${topHotspot.commits} commit — refactor terarah, bukan tambal.`,
    );
  }
  qualitySteps.push(
    `Gabungkan perbaikan terkait dalam satu commit/MR: turunkan self-rework ${fmtId(evidence.selfReworkPct)}% → <${FOLLOW_UP_TARGETS.selfReworkPct}% dan fix-atas-fix ${fmtId(evidence.fixOnFix)} → <${FOLLOW_UP_TARGETS.fixOnFix}.`,
  );
  if (repeatedFiles.length > 1 && qualitySteps.length < 4) {
    qualitySteps.push(
      `Bereskan juga ${repeatedFiles
        .slice(1, 3)
        .map((file) => `${shortPath(file.path)} ${file.fixCount}×`)
        .join(", ")}.`,
    );
  }

  const emptyWeeks = Math.max(0, evidence.totalWeeks - evidence.weeksWithCommit);
  const unmergedPct = Math.max(0, Math.round((100 - evidence.releaseReachPct) * 10) / 10);
  const masterFactor = STAGE_POINTS.master / STAGE_POINTS.develop;

  const copy: Record<ComponentKey, { title: string; detail: string; steps: string[]; note?: string }> = {
    productivity: {
      title: "Produktivitas: pertahankan ritme commit dan MR",
      detail: `${withTarget("productivity")} — ${fmtId(evidence.commitsPerMonth)} commit/bln, ${fmtId(evidence.linesPerMonth)} baris/bln, ${fmtId(evidence.mergedMrsPerMonth)} MR merged/bln, ${fmtId(evidence.activeWorkdayRatio)}% hari aktif.`,
      steps: [
        `Pertahankan: pecah pekerjaan besar jadi commit/MR kecil yang mudah di-merge (kini ${fmtId(evidence.mergedMrsPerMonth)} MR merged/bln).`,
      ],
    },
    quality: {
      title: "Kualitas: bereskan file yang fix-berulang sampai tuntas",
      detail: `${withTarget("quality")} — self-rework ${fmtId(evidence.selfReworkPct)}% (target <${FOLLOW_UP_TARGETS.selfReworkPct}%), fix-atas-fix ${fmtId(evidence.fixOnFix)} (target <${FOLLOW_UP_TARGETS.fixOnFix}), ${evidence.repeatedFiles} file fix berulang.`,
      steps: qualitySteps.slice(0, 4),
    },
    skill: {
      title: "Skill Kode: bersihkan sebelum push",
      detail: `${withTarget("skill")} — penalti statis ${fmtId(skillDetail.penalty)} poin, porsi kode tes ${fmtId(evidence.testPct)}%${
        skillDetail.testBonus
          ? ` (bonus +${fmtId(skillDetail.testBonus)})`
          : " (target ≥30% untuk bonus +3)"
      }.`,
      steps: skillSteps,
    },
    collaboration: {
      title: "Kolaborasi: review MR rekan dan buat MR sendiri",
      detail: `${withTarget("collaboration")} — ${evidence.reviewActions} aksi review, ${evidence.mrsCreated} MR dibuat (${fmtId(evidence.mrsCreatedPerMonth)}/bln).`,
      steps: [
        `Review 2–3 MR rekan per minggu — angka ${evidence.reviewActions} aksi review ini perkiraan dari gl_events.`,
        `Buat MR sendiri untuk pekerjaan utama — jangan ikut MR rilis bersama (poin terbawa hanya ${fmtId(CARRIED_FACTOR)}×).`,
      ],
      note: "Angka review berasal dari gl_events yang belum mencatat aktor, jadi bisa termasuk aktivitas orang lain — jangan dibaca sebagai angka pasti.",
    },
    consistency: {
      title: "Konsistensi: jaga ritme commit mingguan",
      detail: `${withTarget("consistency")} — ${evidence.weeksWithCommit}/${evidence.totalWeeks} minggu ada commit, ${fmtId(evidence.activeWorkdayRatio)}% hari aktif (target ≥${FOLLOW_UP_TARGETS.activeWorkdayPct}%), kualitas pesan ${fmtId(evidence.messageQuality)}%.`,
      steps: [
        ...(emptyWeeks > 0
          ? [`Isi ${emptyWeeks} minggu tanpa commit dengan pekerjaan kecil (dokumentasi, refactor, tes).`]
          : []),
        `Jaga commit di ≥${FOLLOW_UP_TARGETS.activeWorkdayPct}% hari kerja (kini ${fmtId(evidence.activeWorkdayRatio)}%).`,
        `Pakai Conventional Commits dengan judul ≥12 karakter agar skor pesan naik (kini ${fmtId(evidence.messageQuality)}%).`,
      ],
    },
    releaseFlow: {
      title: "Alur Rilis: dorong pekerjaan sampai master",
      detail: `${withTarget("releaseFlow")} — ${fmtId(evidence.releaseReachPct)}% commit sampai master${
        evidence.releaseReachPct >= RELEASE_TARGET_REACH_RATE * 100
          ? ` (target ${RELEASE_TARGET_REACH_RATE * 100}% sudah terlampaui)`
          : ` (target ≥${RELEASE_TARGET_REACH_RATE * 100}%)`
      }, ${fmtId(evidence.releasePointsPerMonth)} poin alur/bln (target ${RELEASE_TARGET_POINTS_PER_MONTH}).`,
      steps: [
        `Masukkan tiap pekerjaan ke MR release/master: master bernilai ${fmtId(masterFactor)}× develop.`,
        ...(unmergedPct > 0
          ? [`${fmtId(unmergedPct)}% commit belum sampai master — telusuri dan buka MR susulan.`]
          : []),
        `Kejar ${RELEASE_TARGET_POINTS_PER_MONTH} poin alur/bln (kini ${fmtId(evidence.releasePointsPerMonth)}) — poin datang dari MR ke release/master, bukan branch lama.`,
      ].slice(0, 4),
    },
  };

  const priorityOf = (rank: number): "P1" | "P2" | "P3" =>
    rank <= 1 ? "P1" : rank <= 3 ? "P2" : "P3";

  return components
    .filter((component) => component.score !== null && component.score < 100)
    .map((component) => ({
      component,
      points: round1((100 - (component.score as number)) * (component.effectiveWeight / 100)),
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5)
    .map((entry, index) => ({
      component: entry.component.key,
      priority: priorityOf(index),
      title: copy[entry.component.key].title,
      detail: copy[entry.component.key].detail,
      steps: copy[entry.component.key].steps,
      note: copy[entry.component.key].note,
      points: entry.points,
    }));
}

function buildSkillDetail(files: ScoreFile[], testPct: number): SkillDetail {
  let total = emptyBundle();
  let scannedFiles = 0;
  const byLanguage = new Map<string, { lines: number; commits: Set<string>; bundle: IssueBundle }>();
  const bestExample = new Map<IssueKey, SkillExample>();

  for (const file of files) {
    const bundle = readIssues(file.issues_json);
    if (!bundle) continue;
    scannedFiles++;
    total = addBundles(total, bundle);

    for (const key of ISSUE_KEYS) {
      const count = bundle.counts[key];
      if (!count) continue;
      const current = bestExample.get(key);
      // Utamakan file non-tes sebagai contoh; file tes hanya jadi cadangan.
      const rank = (path: string, value: number) => (isTestPath(path) ? 0 : 1_000_000) + value;
      if (!current || rank(file.path, count) > rank(current.path, current.count)) {
        bestExample.set(key, { path: file.path, count });
      }
    }

    const language = languageOf(file.path);
    if (!language) continue;
    const bucket = byLanguage.get(language) ?? { lines: 0, commits: new Set<string>(), bundle: emptyBundle() };
    bucket.lines += bundle.lines;
    bucket.commits.add(file.sha);
    bucket.bundle = addBundles(bucket.bundle, bundle);
    byLanguage.set(language, bucket);
  }

  const available = scannedFiles > 0 && total.lines > 0;
  const penalty = available ? staticPenalty(total.counts, total.lines) : 0;
  const testBonus = testPct >= 30 ? 3 : testPct >= 20 ? 1.5 : 0;

  const issues: StaticIssueRow[] = available
    ? ISSUE_KEYS.map((key) => {
        const count = total.counts[key];
        const status = severityOf(key, count, total.lines);
        return {
          key,
          label: ISSUE_LABELS[key],
          count,
          per100: Math.round(per100(count, total.lines) * 100) / 100,
          status,
          statusLabel: status === "critical" ? "Kritis" : status === "warn" ? "Perhatian" : "Baik",
          penalty: round1(
            key === "secret"
              ? count > 0
                ? Math.min(15, 5 + count * 0.3)
                : 0
              : staticPenalty({ ...emptyBundle().counts, [key]: count }, total.lines),
          ),
        };
      })
    : [];

  const languages: LanguageSkill[] = [...byLanguage.entries()]
    .filter(([, bucket]) => bucket.lines > 0)
    .map(([language, bucket]): LanguageSkill => {
      const score = clampScore(100 - staticPenalty(bucket.bundle.counts, bucket.bundle.lines));
      return {
        language,
        lines: bucket.lines,
        commits: bucket.commits.size,
        intensity: bucket.lines >= 3000 ? "Intensif" : bucket.lines >= 800 ? "Aktif" : "Dasar",
        score: Math.round(score),
        findings: ISSUE_KEYS.reduce((sum, key) => sum + bucket.bundle.counts[key], 0),
      };
    })
    .sort((a, b) => b.lines - a.lines || a.language.localeCompare(b.language))
    .slice(0, 6);

  return {
    score: available ? Math.round(clampScore(100 - penalty + testBonus)) : null,
    penalty: round1(penalty),
    testBonus,
    issues,
    languages,
    examples: available ? Object.fromEntries(bestExample) : {},
    scannedFiles,
    scannedLines: total.lines,
    coverage: files.length ? round1((scannedFiles / files.length) * 100) : 0,
  };
}

function isTestPath(path: string): boolean {
  const p = path.toLowerCase();  return (
    /(^|\/)(__tests__|tests?|e2e|__mocks__)\//.test(p) ||
    /\.(test|spec)\.[a-z0-9]+$/.test(p) ||
    p.endsWith(".snap")
  );
}

const CONVENTIONAL_RE =
  /^(feat|fix|refactor|chore|docs|style|test|perf|build|ci|revert)(\(.+\))?!?:\s+\S/i;

function countFullMonths(startDay: string, endDay: string, months: string[]): string[] {
  return months.filter((ym) => `${ym}-01` >= startDay && lastDayOfMonth(ym) <= endDay);
}

function monthlyStability(commitsByMonth: Map<string, number>, fullMonths: string[]): number {
  if (fullMonths.length < 2) return 0;
  const values = fullMonths.map((ym) => commitsByMonth.get(ym) ?? 0);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const cv = Math.sqrt(variance) / mean;
  return clamp01(1 - cv / 1.5);
}

export function computeScorecard(input: ScoreInput): Scorecard {
  const { start, end, commits, mrs, events, files, reaches } = input;

  const days = Math.max(1, (end.getTime() - start.getTime()) / DAY_MS);
  const months = Math.max(1, days / MONTH_DAYS);
  const startDay = localDay(start);
  const endDay = localDay(end);

  const totalCommits = commits.length;
  const linesAdded = commits.reduce((sum, c) => sum + c.adj_additions, 0);
  const linesDeleted = commits.reduce((sum, c) => sum + c.adj_deletions, 0);
  const linesChanged = linesAdded + linesDeleted;

  const authMerged = mrs.filter((m) => m.role === "author" && inRange(m.merged_at, start, end));
  const authCreated = mrs.filter((m) => m.role === "author" && inRange(m.created_at, start, end));

  const commitDays = new Set(commits.map((c) => localDay(c.authored_at)));
  const activeWorkdays = [...commitDays].filter(isWeekday).length;
  const workdays = workdaysBetween(start, end);
  const activeWorkdayRatio = workdays ? activeWorkdays / workdays : 0;
  const totalWeeks = Math.max(1, Math.ceil(days / 7));
  const weeksWithCommit = new Set([...commitDays].map(weekStart)).size;
  const weekRatio = Math.min(1, weeksWithCommit / totalWeeks);

  const commitsByMonth = new Map<string, number>();
  for (const commit of commits) {
    const ym = monthKey(commit.authored_at);
    commitsByMonth.set(ym, (commitsByMonth.get(ym) ?? 0) + 1);
  }
  const allMonths = monthKeysBetween(startDay, endDay);
  const fullMonths = countFullMonths(startDay, endDay, allMonths);
  const stability = monthlyStability(commitsByMonth, fullMonths);

  const conventional = totalCommits
    ? commits.filter((c) => CONVENTIONAL_RE.test(c.title.trim())).length / totalCommits
    : 0;
  const meaningful = totalCommits
    ? commits.filter((c) => c.title.trim().length >= 12).length / totalCommits
    : 0;
  const messageQuality = 0.7 * conventional + 0.3 * meaningful;

  const totalAdded = files.reduce((sum, f) => sum + f.added, 0);
  const rework = analyzeRework(files, commits);
  const selfReworkPct = totalAdded ? (rework.selfReworkLines / totalAdded) * 100 : 0;

  const fixCommits = commits.filter((c) => c.is_fix).length;
  const fixRatio = totalCommits ? fixCommits / totalCommits : 0;
  const revertCount = rework.revertCount;

  const testAdded = files.filter((f) => isTestPath(f.path)).reduce((sum, f) => sum + f.added, 0);
  const testPct = totalAdded ? (testAdded / totalAdded) * 100 : 0;

  const reviewComments = events.filter(
    (e) => e.action.startsWith("commented") && e.noteable_type === "MergeRequest",
  ).length;
  const approvals = events.filter((e) => e.action === "approved").length;
  const reviewActions = reviewComments + approvals;

  const flow = computeReleaseFlow({ commits, mrs, events, reaches, start, end });
  const releasePointsPerMonth = flow.totalPoints / months;
  const releaseScore = scoreReleaseFlow(releasePointsPerMonth, flow.reachRate);

  // ---- Komponen ----
  const productivityAvailable = totalCommits > 0;
  const productivity = productivityAvailable
    ? 30 * clamp01(totalCommits / months / 180) +
      25 * clamp01(Math.log10(1 + linesChanged / months) / Math.log10(1 + 120_000)) +
      25 * clamp01(authMerged.length / months / 50) +
      20 * clamp01(activeWorkdayRatio / 0.85)
    : null;

  const fixOnFixPer100 = totalCommits ? (rework.fixOnFixCommits / totalCommits) * 100 : 0;
  const repeatedFilePer100 = totalCommits
    ? (rework.repeatedFixFiles.length / totalCommits) * 100
    : 0;
  const backAndForthPer1000 = linesChanged ? rework.backAndForthLines / (linesChanged / 1000) : 0;
  const revertPer100 = totalCommits ? (revertCount / totalCommits) * 100 : 0;

  const penalties = {
    selfRework: Math.min(selfReworkPct * 1.2, 30),
    fixOnFix: Math.min(fixOnFixPer100 * 0.35, 20),
    repeatedFix: Math.min(repeatedFilePer100 * 0.9, 15),
    backAndForth: Math.min(backAndForthPer1000 * 1.2, 15),
    revert: Math.min(revertPer100 * 5, 10),
  };
  const qualityPenalty =
    penalties.selfRework +
    penalties.fixOnFix +
    penalties.repeatedFix +
    penalties.backAndForth +
    penalties.revert;
  const diffReady = files.length > 0;
  const qualityAvailable = totalCommits > 0 && diffReady;
  const quality = qualityAvailable ? clampScore(100 - qualityPenalty) : null;

  // Fase 2: skor Skill Kode dari pemindai statis. File yang belum dipindai
  // (issues_json NULL) netral dan tidak dihitung, jadi tidak ada angka palsu.
  const skillDetail = buildSkillDetail(files, testPct);
  const skill = skillDetail.score;

  // Fase 3: rata-rata skor Review Kode AI atas commit yang sudah dinilai.
  const reviews = input.reviews ?? [];
  const reviewDetail: ReviewDetail = {
    score: averageReviewScore(reviews),
    count: reviews.length,
    highlights: reviewHighlights(reviews),
    insights: buildReviewInsights(reviews),
  };

  const collaborationAvailable = mrs.length > 0 || events.length > 0;
  const collaboration = collaborationAvailable
    ? 60 * clamp01(reviewActions / months / 40) + 40 * clamp01(authCreated.length / months / 60)
    : null;

  const consistencyAvailable = totalCommits > 0;
  const consistencyParts: { value: number; weight: number }[] = [
    { value: clamp01(activeWorkdayRatio / 0.6), weight: 35 },
    { value: weekRatio, weight: 35 },
    { value: messageQuality, weight: 15 },
  ];
  if (fullMonths.length >= 2) consistencyParts.push({ value: stability, weight: 15 });
  const consistencyWeight = consistencyParts.reduce((sum, p) => sum + p.weight, 0);
  const consistency = consistencyAvailable
    ? (consistencyParts.reduce((sum, p) => sum + p.value * p.weight, 0) / consistencyWeight) * 100
    : null;

  const releaseAvailable = mrs.length > 0 || reaches.length > 0;
  const releaseFlow = releaseAvailable ? releaseScore : null;

  const rawScores: Record<ComponentKey, number | null> = {
    productivity,
    quality,
    skill,
    collaboration,
    consistency,
    releaseFlow,
  };

  const availableKeys = COMPONENT_KEYS.filter((key) => rawScores[key] !== null);
  const availableWeight = availableKeys.reduce((sum, key) => sum + COMPONENT_WEIGHTS[key], 0);

  const scores = {} as Record<ComponentKey, number | null>;
  const effectiveWeights = {} as Record<ComponentKey, number>;
  for (const key of COMPONENT_KEYS) {
    const value = rawScores[key];
    scores[key] = value === null ? null : Math.round(value);
    effectiveWeights[key] =
      value === null || availableWeight === 0
        ? 0
        : round1((COMPONENT_WEIGHTS[key] / availableWeight) * 100);
  }

  const overall =
    availableWeight === 0
      ? 0
      : Math.round(
          availableKeys.reduce(
            (sum, key) => sum + (scores[key] as number) * (effectiveWeights[key] / 100),
            0,
          ),
        );
  const gradeInfo = gradeOfScore(overall);
  const target = targetOfScore(overall);

  const components: ScoreComponent[] = COMPONENT_KEYS.map((key) => {
    const score = scores[key];
    const weight = effectiveWeights[key];
    return {
      key,
      label: COMPONENT_LABELS[key],
      weight: COMPONENT_WEIGHTS[key],
      effectiveWeight: weight,
      score,
      grade: score === null ? null : gradeOfScore(score).grade,
      available: score !== null,
      potentialToTarget: score === null ? 0 : round1(Math.max(0, target - score) * (weight / 100)),
      potentialToMax: score === null ? 0 : round1((100 - score) * (weight / 100)),
    };
  });

  const evidence: ScoreEvidence = {
    months: round1(months),
    commits: totalCommits,
    commitsPerMonth: round1(totalCommits / months),
    linesChanged,
    linesPerMonth: round1(linesChanged / months),
    mergedMrs: authMerged.length,
    mergedMrsPerMonth: round1(authMerged.length / months),
    activeWorkdays,
    workdays,
    activeWorkdayRatio: round1(activeWorkdayRatio * 100),
    weeksWithCommit,
    totalWeeks,
    fixRatio: round1(fixRatio * 100),
    selfReworkPct: round1(selfReworkPct),
    fixOnFix: rework.fixOnFixCommits,
    repeatedFiles: rework.repeatedFixFiles.length,
    backAndForthLines: rework.backAndForthLines,
    revertCount,
    testPct: round1(testPct),
    scannedFiles: skillDetail.scannedFiles,
    scannedLines: skillDetail.scannedLines,
    reviewActions,
    reviewsPerMonth: round1(reviewActions / months),
    mrsCreated: authCreated.length,
    mrsCreatedPerMonth: round1(authCreated.length / months),
    monthlyStability: round1(stability * 100),
    messageQuality: round1(messageQuality * 100),
    releasePoints: Math.round(flow.totalPoints),
    releasePointsPerMonth: round1(releasePointsPerMonth),
    releaseReachPct: round1(flow.reachRate * 100),
  };

  const qualityBreakdown: QualityPenaltyItem[] = [
    {
      key: "selfRework",
      label: "Self-rework (≤21 hari)",
      count: rework.selfReworkLines,
      unit: "baris",
      ratio: round1(selfReworkPct),
      ratioLabel: `${round1(selfReworkPct)}% baris ditambah`,
      penalty: round1(penalties.selfRework),
      maxPenalty: 30,
    },
    {
      key: "fixOnFix",
      label: "Fix atas fix (≤45 hari)",
      count: rework.fixOnFixCommits,
      unit: "commit",
      ratio: round1(fixOnFixPer100),
      ratioLabel: `${round1(fixOnFixPer100)} / 100 commit`,
      penalty: round1(penalties.fixOnFix),
      maxPenalty: 20,
    },
    {
      key: "repeatedFix",
      label: "File fix berulang ≥3×",
      count: rework.repeatedFixFiles.length,
      unit: "file",
      ratio: round1(repeatedFilePer100),
      ratioLabel: `${round1(repeatedFilePer100)} / 100 commit`,
      penalty: round1(penalties.repeatedFix),
      maxPenalty: 15,
    },
    {
      key: "backAndForth",
      label: "Kode bolak-balik (≤21 hari)",
      count: rework.backAndForthLines,
      unit: "baris",
      ratio: round1(backAndForthPer1000),
      ratioLabel: `${round1(backAndForthPer1000)} / 1.000 baris`,
      penalty: round1(penalties.backAndForth),
      maxPenalty: 15,
    },
    {
      key: "revert",
      label: "Revert asli",
      count: revertCount,
      unit: "commit",
      ratio: round1(revertPer100),
      ratioLabel: `${round1(revertPer100)} / 100 commit`,
      penalty: round1(penalties.revert),
      maxPenalty: 10,
    },
  ];

  const fixOnFixStatus = issueStatus(fixOnFixPer100);
  const repeatedFixStatus = issueStatus(repeatedFilePer100);
  const backAndForthStatus = issueStatus(backAndForthPer1000);
  const revertStatus = issueStatus(revertPer100);

  const recurringIssues: RecurringIssue[] = [
    {
      key: "fixOnFix",
      label: "Fix atas fix (≤45 hari)",
      count: rework.fixOnFixCommits,
      unit: "commit",
      ratio: round1(fixOnFixPer100),
      ratioLabel: `${round1(fixOnFixPer100)} / 100 commit`,
      status: fixOnFixStatus.status,
      statusLabel: fixOnFixStatus.label,
    },
    {
      key: "repeatedFix",
      label: "File fix berulang ≥3×",
      count: rework.repeatedFixFiles.length,
      unit: "file",
      ratio: round1(repeatedFilePer100),
      ratioLabel: `${round1(repeatedFilePer100)} / 100 commit`,
      status: repeatedFixStatus.status,
      statusLabel: repeatedFixStatus.label,
    },
    {
      key: "backAndForth",
      label: "Kode bolak-balik (≤21 hari)",
      count: rework.backAndForthLines,
      unit: "baris",
      ratio: round1(backAndForthPer1000),
      ratioLabel: `${round1(backAndForthPer1000)} / 1.000 baris`,
      status: backAndForthStatus.status,
      statusLabel: backAndForthStatus.label,
    },
    {
      key: "revert",
      label: "Revert asli",
      count: revertCount,
      unit: "commit",
      ratio: round1(revertPer100),
      ratioLabel: `${round1(revertPer100)} / 100 commit`,
      status: revertStatus.status,
      statusLabel: revertStatus.label,
    },
  ];

  return {
    scores,
    overall,
    grade: gradeInfo.grade,
    gradeLabel: gradeInfo.label,
    weights: COMPONENT_WEIGHTS,
    effectiveWeights,
    components,
    potential: {
      target,
      toTarget: round1(components.reduce((sum, c) => sum + c.potentialToTarget, 0)),
      toMax: round1(components.reduce((sum, c) => sum + c.potentialToMax, 0)),
    },
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
      days: Math.round(days),
      months: round1(months),
      ytd: startDay.slice(0, 4) === endDay.slice(0, 4) && startDay.endsWith("-01-01"),
    },
    evidence,
    diffReady,
    quality: {
      score: quality === null ? null : Math.round(quality),
      penalty: round1(qualityPenalty),
      breakdown: diffReady ? qualityBreakdown : [],
    },
    skill: skillDetail,
    review: reviewDetail,
    recurringIssues: diffReady ? recurringIssues : [],
    repeatedFixFiles: diffReady ? rework.repeatedFixFiles.slice(0, 10) : [],
    hotspots: diffReady ? rework.hotspots.slice(0, 8) : [],
    actions: buildActions(components, evidence, rework.repeatedFixFiles, rework.hotspots, skillDetail, target),
  };
}
