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
  applyRelativeScores,
  type ScoreCommit,
  type ScoreEvent,
  type ScoreFile,
  type ScoreReview,
} from "./scoring";
import { computeReleaseFlow, type FlowCommit, type FlowMr, type ReachRow } from "./talent-report";
import {
  buildTalentIndex,
  computeRelativeScores,
  isLimitedTalent,
  resolveTalent,
  talentCollaboration,
  talentProductivity,
  type TalentRelativeMetric,
} from "./relative";

export function loadMetrics(days: number, endDate = new Date()) {
  const end = endDate;
  // days = 0 berarti YTD: 1 Januari tahun berjalan (Asia/Jakarta) sampai hari ini.
  const start =
    days > 0
      ? new Date(end.getTime() - days * 864e5)
      : new Date(`${localDay(end).slice(0, 4)}-01-01T00:00:00+07:00`);
  const s = start.toISOString();
  const d = db();
  const commits = d
    .prepare("SELECT authored_at, adj_additions, adj_deletions, additions, deletions, is_merge, is_fix, project_id FROM gl_commits WHERE authored_at >= ?")
    .all(s) as unknown as CommitRow[];
  const mrs = d
    .prepare("SELECT role, created_at, merged_at, state, project_id FROM gl_mrs WHERE created_at >= ? OR merged_at >= ?")
    .all(s, s) as unknown as MrRow[];
  const events = d.prepare("SELECT created_at, action, noteable_type FROM gl_events WHERE created_at >= ?").all(s) as unknown as EventRow[];
  const pipelines = d.prepare("SELECT status, created_at FROM gl_pipelines WHERE created_at >= ?").all(s) as unknown as PipelineRow[];
  const projectNames = Object.fromEntries(
    (d.prepare("SELECT id, path FROM gl_projects").all() as { id: number; path: string }[]).map((p) => [p.id, p.path]),
  );
  const metrics = computeMetrics({ start, end, commits, mrs, events, pipelines, projectNames });

  // 52 weeks (365 days) rolling daily commit map for GitLab-style horizontal full-calendar heatmap
  const heatmapStart = new Date(end.getTime() - 365 * 864e5);
  const heatmapCommits = d
    .prepare("SELECT authored_at FROM gl_commits WHERE authored_at >= ?")
    .all(heatmapStart.toISOString()) as { authored_at: string }[];
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
         WHERE c.is_merge = 0 AND c.authored_at >= ? ORDER BY c.authored_at DESC LIMIT 15`,
      )
      .all(s) as {
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
         ORDER BY c.authored_at DESC LIMIT 100`,
      )
      .all() as {
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
       WHERE m.created_at >= ? OR m.merged_at >= ? ORDER BY COALESCE(m.merged_at, m.created_at) DESC LIMIT 15`,
    )
    .all(s, s);
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
    user: meta.glUser ? (JSON.parse(meta.glUser) as { id: number; username: string; name: string }) : null,
  };
}

export type LoadedMetrics = ReturnType<typeof loadMetrics>;

const DAY_MS_TEAM = 864e5;
const MONTH_MS_TEAM = 30.44 * DAY_MS_TEAM;

function weekdayCount(start: Date, end: Date): number {
  let count = 0;
  const cursor = new Date(`${localDay(start)}T12:00:00Z`);
  const last = new Date(`${localDay(end)}T12:00:00Z`);
  while (cursor.getTime() <= last.getTime()) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return Math.max(1, count);
}

interface TeamCommitRow {
  sha: string;
  project_id: number;
  authored_at: string;
  author_name: string;
  author_email: string;
  is_fix: number;
  adj_additions: number;
  adj_deletions: number;
}

interface TeamMrRow {
  project_id: number;
  role: string;
  author: string | null;
  created_at: string;
  merged_at: string | null;
  source_branch: string | null;
  target_branch: string | null;
}

/**
 * Agregasi datum bulanan seluruh roster dari tabel yang sudah tersinkron.
 * Identitas digabung lewat alias; MR diatribusikan ke penulisnya, sedangkan
 * aksi review (baris role='reviewer' + event) hanya milik pengguna aktif karena
 * tabel belum menyimpan reviewer per orang lain.
 */
export function loadTeamTalents(
  start: Date,
  end: Date,
  events: ScoreEvent[],
  user: { username: string; name: string } | null,
) {
  const d = db();
  const s = getSettings();
  const index = buildTalentIndex(s.teamRoster, s.talentAliases);
  const months = Math.max(1, (end.getTime() - start.getTime()) / MONTH_MS_TEAM);
  const workdays = weekdayCount(start, end);
  const meName =
    resolveTalent(index, user?.username, splitList(s.identityEmails)[0] ?? null) ??
    resolveTalent(index, user?.name, null) ??
    resolveTalent(index, splitList(s.identityNames)[0] ?? null, null);

  if (index.roster.length === 0) {
    return { meName, rosterSize: 0, months, talents: [] as TalentRelativeMetric[] };
  }

  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const commits = d
    .prepare(
      `SELECT sha, project_id, authored_at, author_name, author_email, is_fix, adj_additions, adj_deletions
       FROM gl_commits
       WHERE is_merge = 0 AND authored_at BETWEEN ? AND ?`,
    )
    .all(startIso, endIso) as unknown as TeamCommitRow[];
  const mrs = d
    .prepare(
      `SELECT project_id, role, author, created_at, merged_at, source_branch, target_branch
       FROM gl_mrs
       WHERE (created_at BETWEEN ? AND ?) OR (merged_at BETWEEN ? AND ?)`,
    )
    .all(startIso, endIso, startIso, endIso) as unknown as TeamMrRow[];
  const reachRows = d
    .prepare(
      `SELECT r.sha, r.stage FROM gl_commit_reach r JOIN gl_commits c ON c.sha = r.sha
       WHERE c.is_merge = 0 AND c.authored_at BETWEEN ? AND ?`,
    )
    .all(startIso, endIso) as unknown as ReachRow[];

  type Bucket = {
    commits: TeamCommitRow[];
    mrs: TeamMrRow[];
    reviews: number;
  };
  const buckets = new Map<string, Bucket>();
  const bucketOf = (name: string): Bucket => {
    let bucket = buckets.get(name);
    if (!bucket) {
      bucket = { commits: [], mrs: [], reviews: 0 };
      buckets.set(name, bucket);
    }
    return bucket;
  };

  const commitTalent = new Map<string, string>();
  for (const commit of commits) {
    const name = resolveTalent(index, commit.author_name, commit.author_email);
    if (!name) continue;
    commitTalent.set(commit.sha, name);
    bucketOf(name).commits.push(commit);
  }

  const reviewActions = events.filter(
    (event) =>
      (event.action.startsWith("commented") && event.noteable_type === "MergeRequest") ||
      event.action === "approved",
  ).length;
  const reviewerRows = mrs.filter((mr) => mr.role === "reviewer").length;
  if (meName) {
    bucketOf(meName).reviews = reviewActions + reviewerRows;
  }

  for (const mr of mrs) {
    if (!mr.author) continue;
    const name = resolveTalent(index, mr.author, null);
    if (!name) continue;
    bucketOf(name).mrs.push(mr);
  }

  const reachesByTalent = new Map<string, ReachRow[]>();
  for (const row of reachRows) {
    const name = commitTalent.get(row.sha);
    if (!name) continue;
    const list = reachesByTalent.get(name) ?? [];
    list.push(row);
    reachesByTalent.set(name, list);
  }

  const flowEvents = events.map((event) => ({
    created_at: event.created_at,
    action: event.action,
    project_id: event.project_id,
    ref: event.ref,
  }));

  const talents: TalentRelativeMetric[] = [];
  for (const [name, bucket] of buckets.entries()) {
    const authored = bucket.mrs;
    const created = authored.filter((mr) => {
      const t = new Date(mr.created_at).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    const merged = authored.filter((mr) => {
      if (!mr.merged_at) return false;
      const t = new Date(mr.merged_at).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    const activeDays = new Set(
      bucket.commits.filter((commit) => {
        const dow = new Date(`${localDay(commit.authored_at)}T12:00:00Z`).getUTCDay();
        return dow !== 0 && dow !== 6;
      }).map((commit) => localDay(commit.authored_at)),
    ).size;
    const lines = bucket.commits.reduce(
      (sum, commit) => sum + commit.adj_additions + commit.adj_deletions,
      0,
    );

    const flowCommits: FlowCommit[] = bucket.commits.map((commit) => ({
      sha: commit.sha,
      project_id: commit.project_id,
      authored_at: commit.authored_at,
      is_fix: commit.is_fix,
      adj_additions: commit.adj_additions,
      adj_deletions: commit.adj_deletions,
    }));
    const flowMrs: FlowMr[] = authored.map((mr) => ({
      project_id: mr.project_id,
      role: "author",
      created_at: mr.created_at,
      merged_at: mr.merged_at,
      source_branch: mr.source_branch,
      target_branch: mr.target_branch,
    }));
    const flow = computeReleaseFlow({
      commits: flowCommits,
      mrs: flowMrs,
      events: name === meName ? flowEvents : [],
      reaches: reachesByTalent.get(name) ?? [],
      start,
      end,
    });

    const datum = {
      name,
      commits: bucket.commits.length,
      lines,
      mrsCreated: created.length,
      mrsMerged: merged.length,
      activeDays,
      reviews: bucket.reviews,
      reviewKnown: name === meName,
      releaseScore: flow.score,
    };

    talents.push({
      name,
      limited: isLimitedTalent({ commits: datum.commits, lines: datum.lines, months }),
      productivity: talentProductivity(datum, months, workdays),
      collaboration: talentCollaboration(datum, months),
      releaseFlow: datum.releaseScore,
    });
  }

  return { meName, rosterSize: index.roster.length, months, talents };
}

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

  const base = computeScorecard({ start, end, commits, mrs, events, files, reaches, reviews });
  const team = loadTeamTalents(start, end, events, user);
  const relative = computeRelativeScores(
    team.meName ?? "",
    team.talents,
    team.rosterSize,
    team.months,
  );
  const relativeInfo = {
    applied: relative.applied && !relative.meLimited,
    talents: team.talents.length,
    peers: relative.peers,
    meLimited: relative.meLimited,
    reason: relative.reason,
  };

  const card = relativeInfo.applied
    ? applyRelativeScores(base, relative.overrides, relativeInfo, relative.rankOverall)
    : { ...base, relativeInfo, ranks: { overall: relative.rankOverall, perRole: null } };

  return { ...card, user };
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
