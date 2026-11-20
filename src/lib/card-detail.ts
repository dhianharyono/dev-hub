/**
 * Builder detail untuk popup kartu produktivitas. Murni: menerima baris data
 * yang sudah diambil server, tidak menyentuh DB atau jaringan, jadi bisa diuji.
 */
import {
  EMPTY_COUNTS,
  ISSUE_KEYS,
  ISSUE_LABELS,
  issuePenalty,
  languageOf,
  per100,
  readIssues,
  severityOf,
  staticPenalty,
  type IssueCounts,
  type IssueKey,
  type IssueSeverity,
} from "./code-issues";
import type { ReworkAnalysis, RepeatedFixFile } from "./scoring";

export const MAX_DETAIL_LOCATIONS = 5;
export const MAX_DETAIL_FILES = 5;
export const MAX_DETAIL_COMMITS = 8;

export interface DetailLocation {
  path: string;
  line: number;
  snippet: string;
  sha: string;
  authoredAt: string;
}

export interface DetailFileCount {
  path: string;
  count: number;
}

export interface LanguageFinding {
  key: IssueKey;
  label: string;
  count: number;
  per100: number;
  status: IssueSeverity;
  statusLabel: "Kritis" | "Perhatian" | "Baik";
  penalty: number;
  files: DetailFileCount[];
  locations: DetailLocation[];
}

export interface LanguageDetail {
  language: string;
  lines: number;
  commits: number;
  score: number | null;
  findings: LanguageFinding[];
}

export interface LanguageDetailRow {
  sha: string;
  path: string;
  authoredAt: string;
  issuesJson: string | null;
}

export function statusLabelOf(status: IssueSeverity): "Kritis" | "Perhatian" | "Baik" {
  if (status === "critical") return "Kritis";
  if (status === "warn") return "Perhatian";
  return "Baik";
}

/** Temuan statis satu bahasa + lokasi file terparah, diurutkan dari penalti terbesar. */
export function buildLanguageDetail(
  language: string,
  rows: LanguageDetailRow[],
): LanguageDetail {
  const totals: IssueCounts = { ...EMPTY_COUNTS };
  const commits = new Set<string>();
  let lines = 0;
  const filesByKey = new Map<IssueKey, Map<string, number>>();
  const locationsByKey = new Map<IssueKey, DetailLocation[]>();

  for (const row of rows) {
    if (languageOf(row.path) !== language) continue;
    const bundle = readIssues(row.issuesJson);
    if (!bundle) continue;
    lines += bundle.lines;
    commits.add(row.sha);

    for (const key of ISSUE_KEYS) {
      const count = bundle.counts[key];
      if (!count) continue;
      totals[key] += count;

      const files = filesByKey.get(key) ?? new Map<string, number>();
      files.set(row.path, (files.get(row.path) ?? 0) + count);
      filesByKey.set(key, files);

      const locations = bundle.loc?.[key];
      if (!locations) continue;
      const list = locationsByKey.get(key) ?? [];
      for (const item of locations) {
        if (list.length >= MAX_DETAIL_LOCATIONS) break;
        list.push({
          path: row.path,
          line: item.line,
          snippet: item.snippet,
          sha: row.sha,
          authoredAt: row.authoredAt,
        });
      }
      locationsByKey.set(key, list);
    }
  }

  const findings: LanguageFinding[] = ISSUE_KEYS.map((key) => {
    const count = totals[key];
    if (!count) return null;
    const status = severityOf(key, count, lines);
    const files = [...(filesByKey.get(key) ?? new Map<string, number>()).entries()]
      .map(([path, value]) => ({ path, count: value }))
      .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
      .slice(0, MAX_DETAIL_FILES);
    return {
      key,
      label: ISSUE_LABELS[key],
      count,
      per100: Math.round(per100(count, lines) * 100) / 100,
      status,
      statusLabel: statusLabelOf(status),
      penalty: Math.round(issuePenalty(key, count, lines) * 10) / 10,
      files,
      locations: (locationsByKey.get(key) ?? []).slice(0, MAX_DETAIL_LOCATIONS),
    };
  })
    .filter((finding): finding is LanguageFinding => finding !== null)
    .sort((a, b) => b.penalty - a.penalty || b.count - a.count);

  return {
    language,
    lines,
    commits: commits.size,
    score: lines > 0 ? Math.round(Math.max(0, Math.min(100, 100 - staticPenalty(totals, lines)))) : null,
    findings,
  };
}

export type RecurringKey = "fixOnFix" | "repeatedFix" | "backAndForth" | "revert";

export interface RecurringFileDetail {
  path: string;
  count: number;
  avgLines?: number;
}

export interface RecurringCommitDetail {
  sha: string;
  title: string;
  authoredAt: string;
}

export interface RecurringDetail {
  key: RecurringKey;
  files: RecurringFileDetail[];
  commits: RecurringCommitDetail[];
}

interface DetailCommitRow {
  sha: string;
  title: string;
  authored_at: string;
}

function commitDetails(
  shas: Set<string>,
  commits: DetailCommitRow[],
): RecurringCommitDetail[] {
  return commits
    .filter((commit) => shas.has(commit.sha))
    .sort((a, b) => b.authored_at.localeCompare(a.authored_at))
    .slice(0, MAX_DETAIL_COMMITS)
    .map((commit) => ({
      sha: commit.sha,
      title: commit.title,
      authoredAt: commit.authored_at,
    }));
}

/**
 * File dan contoh commit untuk satu isu berulang. `rework` dihitung dengan
 * `analyzeRework`, jadi angkanya konsisten dengan kartu.
 */
export function buildRecurringDetail(
  key: RecurringKey,
  rework: ReworkAnalysis,
  commits: DetailCommitRow[],
): RecurringDetail {
  if (key === "revert") {
    return {
      key,
      files: [],
      commits: rework.revertCommits
        .slice()
        .sort((a, b) => b.authored_at.localeCompare(a.authored_at))
        .slice(0, MAX_DETAIL_COMMITS)
        .map((commit) => ({
          sha: commit.sha,
          title: commit.title,
          authoredAt: commit.authored_at,
        })),
    };
  }

  if (key === "repeatedFix") {
    const files = rework.repeatedFixFiles
      .slice(0, MAX_DETAIL_FILES * 2)
      .map((file: RepeatedFixFile) => ({
        path: file.path,
        count: file.fixCount,
        avgLines: file.avgLines,
      }));
    const repeatShas = new Set(
      rework.repeatedFixFiles.flatMap((file) => file.shas ?? []),
    );
    return { key, files, commits: commitDetails(repeatShas, commits) };
  }

  const evidence = key === "fixOnFix" ? rework.fixOnFixFiles : rework.backAndForthFiles;
  const files = evidence
    .slice(0, MAX_DETAIL_FILES * 2)
    .map((file) => ({ path: file.path, count: file.count }));
  const shas = new Set(evidence.flatMap((file) => file.shas));
  return { key, files, commits: commitDetails(shas, commits) };
}

export interface HotspotCommitDetail {
  sha: string;
  title: string;
  authoredAt: string;
  isFix: boolean;
}

export interface HotspotDetail {
  path: string;
  commits: HotspotCommitDetail[];
}

export function buildHotspotDetail(
  path: string,
  rows: { sha: string; title: string; authored_at: string; is_fix: number }[],
): HotspotDetail {
  return {
    path,
    commits: rows
      .slice()
      .sort((a, b) => b.authored_at.localeCompare(a.authored_at))
      .slice(0, MAX_DETAIL_COMMITS + 4)
      .map((row) => ({
        sha: row.sha,
        title: row.title,
        authoredAt: row.authored_at,
        isFix: Boolean(row.is_fix),
      })),
  };
}
