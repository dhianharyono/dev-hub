import "server-only";
import { db } from "./db";
import { getSettings, splitList } from "./settings";
import { collectIssueLocations, type IssueKey } from "./code-issues";
import {
  buildHotspotDetail,
  buildLanguageDetail,
  buildRecurringDetail,
  type RecurringKey,
} from "./card-detail";

import { computeMetrics, localDay, type CommitRow, type EventRow, type MrRow, type PipelineRow } from "./metrics";
import {
  computeScorecard,
  analyzeRework,
  type ScoreCommit,
  type ScoreEvent,
  type ScoreFile,
  type ScoreReview,
} from "./scoring";
import type { FlowMr, ReachRow } from "./talent-report";

/** Identitas GitLab yang terhubung (glUser + identityEmails/identityNames). */
function loadGitlabIdentity() {
  const d = db();
  const s = getSettings();
  const userRow = d.prepare("SELECT value FROM settings WHERE key = 'glUser'").get() as
    | { value: string }
    | undefined;
  const user = userRow?.value
    ? (JSON.parse(userRow.value) as { id: number; username: string; name: string })
    : null;
  const emails = new Set(
    splitList(s.identityEmails)
      .map((value) => value.toLowerCase())
      .filter(Boolean),
  );
  const names = new Set(
    [...splitList(s.identityNames), user?.username ?? "", user?.name ?? ""]
      .map((value) => value.toLowerCase())
      .filter(Boolean),
  );
  return { emails, names, configured: emails.size > 0 || names.size > 0 };
}

/** Klause SQL filter identitas; "0" berarti tidak ada baris yang cocok. */
function identitySql(columnEmail: string | null, columnName: string, emails: Set<string>, names: Set<string>) {
  const clauses: string[] = [];
  const params: string[] = [];
  if (columnEmail && emails.size) {
    clauses.push(`lower(${columnEmail}) IN (${[...emails].map(() => "?").join(",")})`);
    params.push(...emails);
  }
  if (names.size) {
    clauses.push(`lower(${columnName}) IN (${[...names].map(() => "?").join(",")})`);
    params.push(...names);
  }
  return { sql: clauses.length ? `(${clauses.join(" OR ")})` : "0", params };
}

/**
 * scope 'identity' membatasi commit & MR ke user GitLab yang terhubung.
 * Default 'all' supaya /api/summary, laporan, dan halaman GitLab tetap global.
 */
export function loadMetrics(
  days: number,
  endDate = new Date(),
  options: { scope?: "all" | "identity" } = {},
) {
  const end = endDate;
  // days = 0 berarti YTD: 1 Januari tahun berjalan (Asia/Jakarta) sampai hari ini.
  const start =
    days > 0
      ? new Date(end.getTime() - days * 864e5)
      : new Date(`${localDay(end).slice(0, 4)}-01-01T00:00:00+07:00`);
  const s = start.toISOString();
  const d = db();
  const identity = options.scope === "identity" ? loadGitlabIdentity() : null;
  const commitScope = identity ? identitySql("author_email", "author_name", identity.emails, identity.names) : null;
  const mrScope = identity ? identitySql(null, "author", identity.emails, identity.names) : null;
  const commits = d
    .prepare(
      `SELECT authored_at, adj_additions, adj_deletions, additions, deletions, is_merge, is_fix, project_id
       FROM gl_commits WHERE authored_at >= ?${commitScope ? ` AND ${commitScope.sql}` : ""}`,
    )
    .all(s, ...(commitScope?.params ?? [])) as unknown as CommitRow[];
  const mrs = d
    .prepare(
      `SELECT role, created_at, merged_at, state, project_id FROM gl_mrs
       WHERE (created_at >= ? OR merged_at >= ?)${mrScope ? ` AND role = 'author' AND ${mrScope.sql}` : ""}`,
    )
    .all(s, s, ...(mrScope?.params ?? [])) as unknown as MrRow[];
  const events = d.prepare("SELECT created_at, action, noteable_type FROM gl_events WHERE created_at >= ?").all(s) as unknown as EventRow[];
  const pipelines = d.prepare("SELECT status, created_at FROM gl_pipelines WHERE created_at >= ?").all(s) as unknown as PipelineRow[];
  const projectNames = Object.fromEntries(
    (d.prepare("SELECT id, path FROM gl_projects").all() as { id: number; path: string }[]).map((p) => [p.id, p.path]),
  );
  const metrics = computeMetrics({ start, end, commits, mrs, events, pipelines, projectNames });

  // 52 weeks (365 days) rolling daily commit map for GitLab-style horizontal full-calendar heatmap
  const heatmapStart = new Date(end.getTime() - 365 * 864e5);
  const heatmapCommits = d
    .prepare(
      `SELECT authored_at FROM gl_commits WHERE authored_at >= ?${commitScope ? ` AND ${commitScope.sql}` : ""}`,
    )
    .all(heatmapStart.toISOString(), ...(commitScope?.params ?? [])) as { authored_at: string }[];
  const heatmapDaily: Record<string, number> = {};
  for (const c of heatmapCommits) {
    const day = localDay(c.authored_at);
    heatmapDaily[day] = (heatmapDaily[day] ?? 0) + 1;
  }

  const recentCommits = (
    d
      .prepare(
        `SELECT c.sha, c.title, c.authored_at, c.adj_additions, c.adj_deletions, c.web_url, p.path AS project
         FROM gl_commits c LEFT JOIN gl_projects p ON p.id = c.project_id
         WHERE c.is_merge = 0 AND c.authored_at >= ?${commitScope ? ` AND ${commitScope.sql}` : ""} ORDER BY c.authored_at DESC LIMIT 15`,
      )
      .all(s, ...(commitScope?.params ?? [])) as {
        sha: string;
        title: string;
        authored_at: string;
        adj_additions: number;
        adj_deletions: number;
        web_url: string | null;
        project: string | null;
      }[]
  );

  const todayKey = localDay(end);
  const todayCommits = (
    d
      .prepare(
        `SELECT c.sha, c.title, c.authored_at, c.adj_additions, c.adj_deletions, c.additions, c.deletions, c.web_url, c.is_merge, p.path AS project
         FROM gl_commits c LEFT JOIN gl_projects p ON p.id = c.project_id
         ${commitScope ? `WHERE ${commitScope.sql}` : ""}
         ORDER BY c.authored_at DESC LIMIT 100`,
      )
      .all(...(commitScope?.params ?? [])) as {
        sha: string;
        title: string;
        authored_at: string;
        adj_additions: number;
        adj_deletions: number;
        additions: number;
        deletions: number;
        web_url: string | null;
        is_merge: number;
        project: string | null;
      }[]
  ).filter((c) => localDay(c.authored_at) === todayKey);
  const recentMrs = d
    .prepare(
      `SELECT m.title, m.state, m.role, m.created_at, m.merged_at, m.web_url, m.author, p.path AS project
       FROM gl_mrs m LEFT JOIN gl_projects p ON p.id = m.project_id
       WHERE (m.created_at >= ? OR m.merged_at >= ?)${mrScope ? ` AND m.role = 'author' AND ${mrScope.sql}` : ""} ORDER BY COALESCE(m.merged_at, m.created_at) DESC LIMIT 15`,
    )
    .all(s, s, ...(mrScope?.params ?? []));
  const meta = Object.fromEntries(
    (d.prepare("SELECT key, value FROM settings WHERE key IN ('glLastSync','glUser')").all() as { key: string; value: string }[]).map((r) => [
      r.key,
      r.value,
    ]),
  );
  return {
    ...metrics,
    heatmapDaily,
    heatmapStart: heatmapStart.toISOString(),
    heatmapEnd: end.toISOString(),
    recentCommits,
    todayCommits,
    recentMrs,
    lastSync: meta.glLastSync ?? null,
    identity: identity ? { configured: identity.configured } : null,
    user: meta.glUser ? (JSON.parse(meta.glUser) as { id: number; username: string; name: string }) : null,
  };
}

export type LoadedMetrics = ReturnType<typeof loadMetrics>;

/**
 * Skor 6 komponen untuk periode aktif, sudah difilter ke identitas pengguna.
 * Query berat (commit files + hash) hanya dijalankan saat tab skor dibuka.
 */
export function loadScorecard(days: number, endDate = new Date()) {
  const end = endDate;
  const start =
    days > 0
      ? new Date(end.getTime() - days * 864e5)
      : new Date(`${localDay(end).slice(0, 4)}-01-01T00:00:00+07:00`);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const d = db();
  const s = getSettings();
  const userRow = d.prepare("SELECT value FROM settings WHERE key = 'glUser'").get() as
    | { value: string }
    | undefined;
  const user = userRow?.value
    ? (JSON.parse(userRow.value) as { id: number; username: string; name: string })
    : null;

  const emails = new Set(
    splitList(s.identityEmails)
      .map((value) => value.toLowerCase())
      .filter(Boolean),
  );
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

  const mrIdentityClauses: string[] = [];
  const mrIdentityParams: string[] = [];
  if (names.size) {
    mrIdentityClauses.push(`lower(m.author) IN (${[...names].map(() => "?").join(",")})`);
    mrIdentityParams.push(...names);
  }
  const mrIdentity = mrIdentityClauses.length ? `(${mrIdentityClauses.join(" OR ")})` : "0";

  const commits = d
    .prepare(
      `SELECT c.sha, c.project_id, c.authored_at, c.title, c.is_fix, c.adj_additions, c.adj_deletions
       FROM gl_commits c
       WHERE c.is_merge = 0 AND c.authored_at BETWEEN ? AND ? AND ${identity}
       ORDER BY c.authored_at`,
    )
    .all(startIso, endIso, ...identityParams) as unknown as ScoreCommit[];

  const mrs = d
    .prepare(
      `SELECT m.project_id, m.role, m.created_at, m.merged_at, m.source_branch, m.target_branch
       FROM gl_mrs m
       WHERE m.role = 'author' AND ${mrIdentity}
         AND (m.created_at BETWEEN ? AND ? OR m.merged_at BETWEEN ? AND ?)`,
    )
    .all(...mrIdentityParams, startIso, endIso, startIso, endIso) as unknown as FlowMr[];

  const events = d
    .prepare(
      `SELECT created_at, action, project_id, ref, noteable_type
       FROM gl_events WHERE created_at BETWEEN ? AND ?`,
    )
    .all(startIso, endIso) as unknown as ScoreEvent[];

  const files = d
    .prepare(
      `SELECT f.sha, f.project_id, f.path, f.added, f.deleted, f.added_hashes, f.deleted_hashes, f.issues_json
       FROM gl_commit_files f JOIN gl_commits c ON c.sha = f.sha
       WHERE c.is_merge = 0 AND c.authored_at BETWEEN ? AND ? AND ${identity}`,
    )
    .all(startIso, endIso, ...identityParams) as unknown as ScoreFile[];

  const reaches = d
    .prepare(
      `SELECT r.sha, r.stage FROM gl_commit_reach r JOIN gl_commits c ON c.sha = r.sha
       WHERE c.is_merge = 0 AND c.authored_at BETWEEN ? AND ? AND ${identity}`,
    )
    .all(startIso, endIso, ...identityParams) as unknown as ReachRow[];

  const reviewRows = d
    .prepare(
      `SELECT r.sha, c.title, c.authored_at, r.score, r.summary, r.notes_json
       FROM gl_commit_reviews r JOIN gl_commits c ON c.sha = r.sha
       WHERE r.status = 'reviewed' AND r.score IS NOT NULL
         AND c.is_merge = 0 AND datetime(c.authored_at) BETWEEN datetime(?) AND datetime(?) AND ${identity}`,
    )
    .all(startIso, endIso, ...identityParams) as unknown as {
    sha: string;
    title: string;
    authored_at: string;
    score: number;
    summary: string | null;
    notes_json: string | null;
  }[];

  const reviews: ScoreReview[] = reviewRows.map((row) => {
    let notes: string[] = [];
    try {
      const parsed = row.notes_json ? (JSON.parse(row.notes_json) as unknown) : [];
      if (Array.isArray(parsed)) {
        notes = parsed.filter((note): note is string => typeof note === "string");
      }
    } catch {
      notes = [];
    }
    return {
      sha: row.sha,
      title: row.title,
      authored_at: row.authored_at,
      score: row.score,
      summary: row.summary ?? "",
      notes,
    };
  });

  return {
    ...computeScorecard({ start, end, commits, mrs, events, files, reaches, reviews }),
    user,
  };
}

export type LoadedScorecard = ReturnType<typeof loadScorecard>;

/** Periode + filter identitas yang sama dengan scorecard, untuk loader detail. */
function detailContext(days: number, endDate = new Date()) {
  const end = endDate;
  const start =
    days > 0
      ? new Date(end.getTime() - days * 864e5)
      : new Date(`${localDay(end).slice(0, 4)}-01-01T00:00:00+07:00`);

  const d = db();
  const s = getSettings();
  const userRow = d.prepare("SELECT value FROM settings WHERE key = 'glUser'").get() as
    | { value: string }
    | undefined;
  const user = userRow?.value
    ? (JSON.parse(userRow.value) as { id: number; username: string; name: string })
    : null;

  const emails = new Set(
    splitList(s.identityEmails)
      .map((value) => value.toLowerCase())
      .filter(Boolean),
  );
  const names = new Set(
    [...splitList(s.identityNames), user?.username ?? "", user?.name ?? ""]
      .map((value) => value.toLowerCase())
      .filter(Boolean),
  );

  const clauses: string[] = [];
  const params: string[] = [];
  if (emails.size) {
    clauses.push(`lower(c.author_email) IN (${[...emails].map(() => "?").join(",")})`);
    params.push(...emails);
  }
  if (names.size) {
    clauses.push(`lower(c.author_name) IN (${[...names].map(() => "?").join(",")})`);
    params.push(...names);
  }

  return {
    d,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    identity: clauses.length ? `(${clauses.join(" OR ")})` : "0",
    params,
  };
}

/** Temuan statis satu bahasa + lokasi file terparah untuk popup kartu bahasa. */
export function loadLanguageDetail(language: string, days: number, endDate = new Date()) {
  const { d, startIso, endIso, identity, params } = detailContext(days, endDate);
  const rows = d
    .prepare(
      `SELECT f.sha, f.path, c.authored_at AS authoredAt, f.issues_json AS issuesJson
       FROM gl_commit_files f JOIN gl_commits c ON c.sha = f.sha
       WHERE c.is_merge = 0 AND c.authored_at BETWEEN ? AND ? AND ${identity}
       ORDER BY c.authored_at DESC`,
    )
    .all(startIso, endIso, ...params) as unknown as {
    sha: string;
    path: string;
    authoredAt: string;
    issuesJson: string | null;
  }[];
  return buildLanguageDetail(language, rows);
}

/** File + contoh commit untuk satu isu berulang. */
export function loadRecurringDetail(
  key: RecurringKey,
  days: number,
  endDate = new Date(),
) {
  const { d, startIso, endIso, identity, params } = detailContext(days, endDate);
  const commits = d
    .prepare(
      `SELECT c.sha, c.project_id, c.authored_at, c.title, c.is_fix, c.adj_additions, c.adj_deletions
       FROM gl_commits c
       WHERE c.is_merge = 0 AND c.authored_at BETWEEN ? AND ? AND ${identity}
       ORDER BY c.authored_at`,
    )
    .all(startIso, endIso, ...params) as unknown as ScoreCommit[];

  const files = d
    .prepare(
      `SELECT f.sha, f.project_id, f.path, f.added, f.deleted, f.added_hashes, f.deleted_hashes, f.issues_json
       FROM gl_commit_files f JOIN gl_commits c ON c.sha = f.sha
       WHERE c.is_merge = 0 AND c.authored_at BETWEEN ? AND ? AND ${identity}`,
    )
    .all(startIso, endIso, ...params) as unknown as ScoreFile[];

  return buildRecurringDetail(key, analyzeRework(files, commits), commits);
}

/** Contoh commit yang menyentuh satu file hotspot. */
export function loadHotspotDetail(path: string, days: number, endDate = new Date()) {
  const { d, startIso, endIso, identity, params } = detailContext(days, endDate);
  const rows = d
    .prepare(
      `SELECT c.sha, c.title, c.authored_at, c.is_fix
       FROM gl_commit_files f JOIN gl_commits c ON c.sha = f.sha
       WHERE f.path = ? AND c.is_merge = 0 AND c.authored_at BETWEEN ? AND ? AND ${identity}
       ORDER BY c.authored_at DESC`,
    )
    .all(path, startIso, endIso, ...params) as unknown as {
    sha: string;
    title: string;
    authored_at: string;
    is_fix: number;
  }[];
  return buildHotspotDetail(path, rows);
}

/**
 * Lokasi temuan satu kategori isu untuk periode yang sama dengan scorecard.
 * File lama tanpa `loc` dilewati; UI menampilkan catatan "menunggu pemindaian ulang".
 */
export function loadIssueLocations(key: IssueKey, days: number, endDate = new Date()) {
  const end = endDate;
  const start =
    days > 0
      ? new Date(end.getTime() - days * 864e5)
      : new Date(`${localDay(end).slice(0, 4)}-01-01T00:00:00+07:00`);

  const d = db();
  const s = getSettings();
  const userRow = d.prepare("SELECT value FROM settings WHERE key = 'glUser'").get() as
    | { value: string }
    | undefined;
  const user = userRow?.value
    ? (JSON.parse(userRow.value) as { id: number; username: string; name: string })
    : null;

  const emails = new Set(
    splitList(s.identityEmails)
      .map((value) => value.toLowerCase())
      .filter(Boolean),
  );
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

  const rows = d
    .prepare(
      `SELECT f.sha, f.project_id AS projectId, f.path, c.authored_at AS authoredAt, f.issues_json AS issuesJson
       FROM gl_commit_files f JOIN gl_commits c ON c.sha = f.sha
       WHERE c.is_merge = 0 AND c.authored_at BETWEEN ? AND ? AND ${identity}
       ORDER BY c.authored_at DESC`,
    )
    .all(start.toISOString(), end.toISOString(), ...identityParams) as unknown as {
    sha: string;
    projectId: number;
    path: string;
    authoredAt: string;
    issuesJson: string | null;
  }[];

  const locations = collectIssueLocations(key, rows, 50);
  return { key, locations };
}
