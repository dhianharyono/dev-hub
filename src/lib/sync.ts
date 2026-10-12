import "server-only";
import { db } from "./db";
import { getSettings, saveSettings, splitList } from "./settings";
import { countDiff, gl, glAll, globToRegex, isExcluded, pool } from "./gitlab";

export interface SyncStatus {
  running: boolean;
  phase: string;
  done: number;
  total: number;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  log: string[];
  summary?: { projects: number; commits: number; mrs: number; events: number; pipelines: number; projectErrors: number };
}

const g = globalThis as unknown as { __syncStatus?: SyncStatus };
export const syncStatus = (): SyncStatus => (g.__syncStatus ??= { running: false, phase: "idle", done: 0, total: 0, log: [] });

function log(msg: string) {
  const st = syncStatus();
  st.log = [...st.log.slice(-40), `${new Date().toLocaleTimeString("id-ID")} ${msg}`];
}

interface GLCommit {
  id: string;
  title: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  parent_ids: string[];
  stats?: { additions: number; deletions: number };
  web_url: string;
}
interface GLProject {
  id: number;
  path_with_namespace: string;
  web_url: string;
}
interface GLEvent {
  id: number;
  created_at: string;
  action_name: string;
  target_type: string | null;
  project_id: number | null;
  note?: { noteable_type?: string };
  push_data?: unknown;
}
interface GLMR {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  state: string;
  created_at: string;
  merged_at: string | null;
  web_url: string;
  author: { username: string };
}
interface GLPipeline {
  id: number;
  status: string;
  ref: string;
  created_at: string;
  web_url: string;
}

const FIX_RE = /\b(fix(e[sd])?|hotfix|bugfix|revert|perbaik\w*|patch)\b/i;
const DIFF_THRESHOLD = 300;

export function startSync(days = 180, full = false) {
  const st = syncStatus();
  if (st.running) return st;
  Object.assign(st, { running: true, phase: "Memulai", done: 0, total: 0, error: undefined, log: [], startedAt: new Date().toISOString(), finishedAt: undefined, summary: undefined });
  runSync(days, full)
    .catch((e: Error) => {
      st.error = e.message;
      log(`❌ ${e.message}`);
    })
    .finally(() => {
      st.running = false;
      st.phase = st.error ? "Gagal" : "Selesai";
      st.finishedAt = new Date().toISOString();
    });
  return st;
}

async function runSync(days: number, full: boolean) {
  const st = syncStatus();
  const s = getSettings();
  const d = db();
  const emails = splitList(s.identityEmails).map((e) => e.toLowerCase());
  const names = splitList(s.identityNames).map((n) => n.toLowerCase());
  const excludes = splitList(s.excludePatterns).map(globToRegex);

  st.phase = "Identitas";
  const me = await gl<{ id: number; username: string; name: string; public_email?: string; email?: string }>("/user");
  if (me.email) emails.push(me.email.toLowerCase());
  if (me.public_email) emails.push(me.public_email.toLowerCase());
  names.push(me.name.toLowerCase(), me.username.toLowerCase());
  log(`Login sebagai ${me.username} (#${me.id})`);

  const lastSync = d.prepare("SELECT value FROM settings WHERE key='glLastSync'").get() as { value: string } | undefined;
  const sinceDate = !full && lastSync ? new Date(new Date(lastSync.value).getTime() - 2 * 864e5) : new Date(Date.now() - days * 864e5);
  const since = sinceDate.toISOString();
  log(`Sinkron data sejak ${since.slice(0, 10)}`);

  // 1. Events - reliable source of projects I actually touched + collaboration signals
  st.phase = "Aktivitas (events)";
  const events = await glAll<GLEvent>(`/users/${me.id}/events?after=${since.slice(0, 10)}&sort=asc`, 100);
  const insEvent = d.prepare(
    "INSERT OR REPLACE INTO gl_events(id, created_at, action, target_type, project_id, noteable_type) VALUES (?,?,?,?,?,?)",
  );
  for (const e of events) insEvent.run(e.id, e.created_at, e.action_name, e.target_type, e.project_id, e.note?.noteable_type ?? null);
  log(`${events.length} event`);

  // 2. Projects - only ones I'm a member of with activity + ones from my events (avoids 403 spam)
  st.phase = "Proyek";
  const memberProjects = await glAll<GLProject>(
    `/projects?membership=true&simple=true&min_access_level=20&last_activity_after=${since}`,
    20,
  );
  const projMap = new Map<number, GLProject>(memberProjects.map((p) => [p.id, p]));
  const eventProjectIds = [...new Set(events.map((e) => e.project_id).filter((x): x is number => !!x))];
  for (const pid of eventProjectIds) {
    if (projMap.has(pid)) continue;
    try {
      projMap.set(pid, await gl<GLProject>(`/projects/${pid}?simple=true`));
    } catch {
      /* no access - skip silently */
    }
  }
  const projects = [...projMap.values()];
  const insProj = d.prepare("INSERT OR REPLACE INTO gl_projects(id, path, web_url, last_error) VALUES (?,?,?,?)");
  for (const p of projects) insProj.run(p.id, p.path_with_namespace, p.web_url, null);
  log(`${projects.length} proyek relevan (member: ${memberProjects.length}, dari event: ${eventProjectIds.length})`);

  // 3. Commits + pipelines per project
  st.phase = "Commit & pipeline";
  st.total = projects.length;
  st.done = 0;
  const insCommit = d.prepare(
    `INSERT OR REPLACE INTO gl_commits(sha, project_id, authored_at, title, additions, deletions, adj_additions, adj_deletions, is_merge, is_fix, web_url)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
  );
  const insPipe = d.prepare("INSERT OR REPLACE INTO gl_pipelines(id, project_id, status, ref, created_at, web_url) VALUES (?,?,?,?,?,?)");
  const setErr = d.prepare("UPDATE gl_projects SET last_error=? WHERE id=?");
  let commitCount = 0,
    pipeCount = 0,
    projectErrors = 0;
  const authorQueries = [...new Set([...splitList(s.identityEmails), me.username, me.name])];

  await pool(projects, 4, async (p) => {
    try {
      const seen = new Map<string, GLCommit>();
      for (const a of authorQueries) {
        const list = await glAll<GLCommit>(
          `/projects/${p.id}/repository/commits?since=${since}&all=true&with_stats=true&author=${encodeURIComponent(a)}`,
          30,
        );
        for (const c of list) seen.set(c.id, c);
      }
      for (const c of seen.values()) {
        const mine = emails.includes(c.author_email.toLowerCase()) || names.includes(c.author_name.toLowerCase());
        if (!mine) continue;
        const isMerge = c.parent_ids.length > 1;
        const add = c.stats?.additions ?? 0;
        const del = c.stats?.deletions ?? 0;
        let adjAdd = add,
          adjDel = del;
        if (!isMerge && add + del > DIFF_THRESHOLD) {
          try {
            const diffs = await glAll<{ new_path: string; diff: string }>(`/projects/${p.id}/repository/commits/${c.id}/diff?`, 5);
            adjAdd = 0;
            adjDel = 0;
            for (const f of diffs) {
              if (isExcluded(f.new_path, excludes)) continue;
              const cnt = countDiff(f.diff);
              adjAdd += cnt.add;
              adjDel += cnt.del;
            }
          } catch {
            /* keep raw stats */
          }
        }
        if (isMerge) {
          adjAdd = 0;
          adjDel = 0;
        }
        insCommit.run(c.id, p.id, c.authored_date, c.title, add, del, adjAdd, adjDel, isMerge ? 1 : 0, FIX_RE.test(c.title) ? 1 : 0, c.web_url);
        commitCount++;
      }
      const pipes = await glAll<GLPipeline>(`/projects/${p.id}/pipelines?username=${encodeURIComponent(me.username)}&updated_after=${since}`, 10);
      for (const pl of pipes) insPipe.run(pl.id, p.id, pl.status, pl.ref, pl.created_at, pl.web_url);
      pipeCount += pipes.length;
    } catch (e) {
      projectErrors++;
      setErr.run((e as Error).message, p.id);
      log(`⚠️ ${p.path_with_namespace}: ${(e as Error).message}`);
    } finally {
      st.done++;
    }
  });
  log(`${commitCount} commit, ${pipeCount} pipeline`);

  // 4. Merge requests (authored + reviewing)
  st.phase = "Merge request";
  const insMr = d.prepare(
    `INSERT OR REPLACE INTO gl_mrs(id, role, iid, project_id, title, state, created_at, merged_at, web_url, author) VALUES (?,?,?,?,?,?,?,?,?,?)`,
  );
  const authored = await glAll<GLMR>(`/merge_requests?scope=all&state=all&author_id=${me.id}&updated_after=${since}`, 30);
  const reviewing = await glAll<GLMR>(`/merge_requests?scope=all&state=all&reviewer_id=${me.id}&updated_after=${since}`, 30);
  for (const m of authored) insMr.run(m.id, "author", m.iid, m.project_id, m.title, m.state, m.created_at, m.merged_at, m.web_url, m.author.username);
  for (const m of reviewing)
    if (m.author.username !== me.username) insMr.run(m.id, "reviewer", m.iid, m.project_id, m.title, m.state, m.created_at, m.merged_at, m.web_url, m.author.username);
  log(`${authored.length} MR dibuat, ${reviewing.length} MR direview`);

  saveSettings({});
  d.prepare("INSERT INTO settings(key,value) VALUES('glLastSync',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(new Date().toISOString());
  d.prepare("INSERT INTO settings(key,value) VALUES('glUser',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(
    JSON.stringify({ id: me.id, username: me.username, name: me.name }),
  );
  st.summary = { projects: projects.length, commits: commitCount, mrs: authored.length + reviewing.length, events: events.length, pipelines: pipeCount, projectErrors };
  log("✅ Sinkronisasi selesai");
}
