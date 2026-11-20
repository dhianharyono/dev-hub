import "server-only";
import { createHash } from "node:crypto";
import { db } from "./db";
import { getSettings, saveSettings, splitList } from "./settings";
import { countDiff, gl, glAll, globToRegex, isExcluded, pool } from "./gitlab";
import { scanAddedLines, serializeIssues } from "./code-issues";

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
  push_data?: { ref?: string; commit_count?: number };
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
  source_branch: string;
  target_branch: string;
}
interface GLPipeline {
  id: number;
  status: string;
  ref: string;
  created_at: string;
  web_url: string;
}

const FIX_RE = /\b(fix(e[sd])?|hotfix|bugfix|revert|perbaik\w*|patch)\b/i;

/** Isi baris yang ditambahkan pada patch diff (tanpa prefiks `+`). */
function addedLines(diff: string): string[] {
  const out: string[] = [];
  for (const line of diff.split("\n")) {
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    out.push(line.slice(1));
  }
  return out;
}

/** Normalized hashes of changed lines, used to detect code that is deleted then restored. */
function lineHashes(diff: string, prefix: "+" | "-"): string[] {
  const out: string[] = [];
  for (const line of diff.split("\n")) {
    if (!line.startsWith(prefix) || line.startsWith(prefix.repeat(3))) continue;
    const text = line.slice(1).trim().replace(/\s+/g, " ");
    if (text.length < 6) continue;
    out.push(createHash("sha1").update(text).digest("hex").slice(0, 16));
    if (out.length >= 500) break;
  }
  return out;
}

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

/**
 * Pindai ulang commit lama yang belum punya `issues_json`. Dipakai sekali saat
 * menyalakan pemindai statis: diff tidak disimpan di DB, jadi patch diambil
 * ulang dari GitLab. Commit yang gagal diambil tetap NULL (netral).
 */
export function startRetroScan(days = 365) {
  const st = syncStatus();
  if (st.running) return st;
  Object.assign(st, {
    running: true,
    phase: "Pindai kode",
    done: 0,
    total: 0,
    error: undefined,
    log: [],
    startedAt: new Date().toISOString(),
    finishedAt: undefined,
    summary: undefined,
  });
  runRetroScan(days)
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

async function runRetroScan(days: number) {
  const st = syncStatus();
  const d = db();
  const s = getSettings();
  const userRow = d.prepare("SELECT value FROM settings WHERE key = 'glUser'").get() as
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
  if (!clauses.length) throw new Error("Identitas belum diatur. Buka Settings.");
  const identity = `(${clauses.join(" OR ")})`;

  const end = new Date();
  const start =
    days > 0
      ? new Date(end.getTime() - days * 864e5)
      : new Date(`${end.getFullYear()}-01-01T00:00:00+07:00`);

  const rows = d
    .prepare(
      `SELECT DISTINCT f.sha, f.project_id FROM gl_commit_files f
       JOIN gl_commits c ON c.sha = f.sha
       WHERE c.is_merge = 0 AND c.authored_at >= ? AND ${identity}
         AND EXISTS (
           SELECT 1 FROM gl_commit_files x
           WHERE x.sha = f.sha
             AND (x.issues_json IS NULL OR x.issues_json NOT LIKE '%"v":2%')
         )`,
    )
    .all(start.toISOString(), ...params) as { sha: string; project_id: number }[];

  st.total = rows.length;
  log(`${rows.length} commit perlu dipindai`);
  const upd = d.prepare("UPDATE gl_commit_files SET issues_json = ? WHERE sha = ? AND path = ?");
  let scanned = 0;
  let failed = 0;

  await pool(rows, 4, async (row) => {
    try {
      const diffs = await glAll<{ new_path: string; path?: string; diff: string }>(
        `/projects/${row.project_id}/repository/commits/${row.sha}/diff?`,
        5,
      );
      for (const file of diffs) {
        const filePath = file.new_path || file.path || "";
        if (!filePath) continue;
        const bundle = scanAddedLines(filePath, addedLines(file.diff ?? ""));
        upd.run(serializeIssues(bundle), row.sha, filePath);
      }
      scanned++;
    } catch (e) {
      failed++;
      if (failed <= 5) log(`⚠️ ${row.sha.slice(0, 8)}: ${(e as Error).message}`);
    } finally {
      st.done++;
      if (st.done % 200 === 0) log(`${st.done}/${rows.length} commit dipindai`);
    }
  });

  st.summary = { projects: 0, commits: scanned, mrs: 0, events: 0, pipelines: 0, projectErrors: failed };
  log(`✅ Pindai selesai: ${scanned} commit, ${failed} gagal (tetap netral)`);
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
    "INSERT OR REPLACE INTO gl_events(id, created_at, action, target_type, project_id, noteable_type, ref, commit_count) VALUES (?,?,?,?,?,?,?,?)",
  );
  for (const e of events)
    insEvent.run(e.id, e.created_at, e.action_name, e.target_type, e.project_id, e.note?.noteable_type ?? null, e.push_data?.ref ?? null, e.push_data?.commit_count ?? null);
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
    `INSERT OR REPLACE INTO gl_commits(sha, project_id, authored_at, title, author_name, author_email, additions, deletions, adj_additions, adj_deletions, is_merge, is_fix, web_url)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );
  const insPipe = d.prepare("INSERT OR REPLACE INTO gl_pipelines(id, project_id, status, ref, created_at, web_url) VALUES (?,?,?,?,?,?)");
  const insFile = d.prepare(
    "INSERT OR REPLACE INTO gl_commit_files(sha, project_id, path, added, deleted, added_hashes, deleted_hashes, issues_json) VALUES (?,?,?,?,?,?,?,?)",
  );
  const insReach = d.prepare("INSERT OR REPLACE INTO gl_commit_reach(sha, stage) VALUES (?,?)");
  const DELAYED_STAGES: { stage: string; refs: string[] }[] = [
    { stage: "develop", refs: ["develop", "development", "dev"] },
    { stage: "release", refs: ["release", "staging", "stage", "preprod"] },
    { stage: "master", refs: ["master", "main", "production", "prod"] },
  ];
  const setErr = d.prepare("UPDATE gl_projects SET last_error=? WHERE id=?");
  let commitCount = 0,
    pipeCount = 0,
    projectErrors = 0;
  // GitLab ignores `page` when `all=true` is used, so commits are fetched per
  // branch the talent pushed to. Events only cover branches pushed in the window.
  const pushRefs = new Map<number, Set<string>>();
  for (const e of events) {
    const ref = e.push_data?.ref;
    if (!e.project_id || !ref) continue;
    if (e.action_name !== "pushed new" && e.action_name !== "pushed to") continue;
    const set = pushRefs.get(e.project_id) ?? new Set<string>();
    set.add(ref);
    pushRefs.set(e.project_id, set);
  }
  const shaHasFiles = d.prepare("SELECT 1 FROM gl_commit_files WHERE sha = ? LIMIT 1");

  await pool(projects, 4, async (p) => {
    try {
      const seen = new Map<string, GLCommit>();
      const queries = [`/projects/${p.id}/repository/commits?since=${since}&with_stats=true`];
      for (const ref of pushRefs.get(p.id) ?? []) {
        queries.push(`/projects/${p.id}/repository/commits?since=${since}&with_stats=true&ref_name=${encodeURIComponent(ref)}`);
      }
      for (const query of queries) {
        try {
          const list = await glAll<GLCommit>(query, 30);
          for (const c of list) seen.set(c.id, c);
        } catch {
          /* branch was deleted or is not readable */
        }
      }
      log(`${p.path_with_namespace}: ${seen.size} commit terlihat`);
      for (const c of seen.values()) {
        const mine = emails.includes(c.author_email.toLowerCase()) || names.includes(c.author_name.toLowerCase());
        if (!mine) continue;
        const isMerge = c.parent_ids.length > 1;
        const add = c.stats?.additions ?? 0;
        const del = c.stats?.deletions ?? 0;
        let adjAdd = add,
          adjDel = del;
        if (!isMerge && !shaHasFiles.get(c.id)) {
          try {
            const diffs = await glAll<{ new_path: string; path?: string; diff: string }>(`/projects/${p.id}/repository/commits/${c.id}/diff?`, 5);
            adjAdd = 0;
            adjDel = 0;
            for (const f of diffs) {
              const filePath = f.new_path || f.path || "";
              if (!filePath) continue;
              const cnt = countDiff(f.diff);
              if (isExcluded(filePath, excludes)) continue;
              adjAdd += cnt.add;
              adjDel += cnt.del;
              const issues = scanAddedLines(filePath, addedLines(f.diff));
              insFile.run(c.id, p.id, filePath, cnt.add, cnt.del, JSON.stringify(lineHashes(f.diff, "+")), JSON.stringify(lineHashes(f.diff, "-")), serializeIssues(issues));
            }
            const diffFiles = diffs.map((df) => df.new_path).filter(Boolean);
            if (diffFiles.length > 0) {
              try {
                d.prepare("INSERT OR REPLACE INTO gl_commit_diffs(sha, files_json) VALUES (?, ?)").run(c.id, JSON.stringify(diffFiles));
              } catch {}
            }
          } catch {
            /* keep raw stats */
          }
        }
        if (isMerge) {
          adjAdd = 0;
          adjDel = 0;
        }
        insCommit.run(c.id, p.id, c.authored_date, c.title, c.author_name, c.author_email, add, del, adjAdd, adjDel, isMerge ? 1 : 0, FIX_RE.test(c.title) ? 1 : 0, c.web_url);
        commitCount++;
      }
      const myShas = new Set(seen.keys());
      for (const { stage, refs } of DELAYED_STAGES) {
        for (const ref of refs) {
          try {
            const list = await glAll<{ id: string }>(`/projects/${p.id}/repository/commits?ref_name=${encodeURIComponent(ref)}&since=${since}`, 20);
            for (const c of list) if (myShas.has(c.id)) insReach.run(c.id, stage);
            break;
          } catch {
            /* branch not present in this project */
          }
        }
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
    `INSERT OR REPLACE INTO gl_mrs(id, role, iid, project_id, title, state, created_at, merged_at, web_url, author, source_branch, target_branch) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  );
  const authored = await glAll<GLMR>(`/merge_requests?scope=all&state=all&author_id=${me.id}&updated_after=${since}`, 30);
  const reviewing = await glAll<GLMR>(`/merge_requests?scope=all&state=all&reviewer_id=${me.id}&updated_after=${since}`, 30);
  for (const m of authored)
    insMr.run(m.id, "author", m.iid, m.project_id, m.title, m.state, m.created_at, m.merged_at, m.web_url, m.author.username, m.source_branch, m.target_branch);
  for (const m of reviewing)
    if (m.author.username !== me.username)
      insMr.run(m.id, "reviewer", m.iid, m.project_id, m.title, m.state, m.created_at, m.merged_at, m.web_url, m.author.username, m.source_branch, m.target_branch);
  log(`${authored.length} MR dibuat, ${reviewing.length} MR direview`);

  saveSettings({});
  d.prepare("INSERT INTO settings(key,value) VALUES('glLastSync',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(new Date().toISOString());
  d.prepare("INSERT INTO settings(key,value) VALUES('glUser',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(
    JSON.stringify({ id: me.id, username: me.username, name: me.name }),
  );

  st.summary = { projects: projects.length, commits: commitCount, mrs: authored.length + reviewing.length, events: events.length, pipelines: pipeCount, projectErrors };
  log("✅ Sinkronisasi selesai");
}
