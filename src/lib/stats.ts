import "server-only";
import { db } from "./db";
import { computeMetrics, localDay, type CommitRow, type EventRow, type MrRow, type PipelineRow } from "./metrics";

export function loadMetrics(days: number, endDate = new Date()) {
  const end = endDate;
  const start = new Date(end.getTime() - days * 864e5);
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
