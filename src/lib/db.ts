import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "devhub.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS task_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT NOT NULL,
  kind        TEXT NOT NULL,          -- 'userstory' | 'task'
  subject     TEXT NOT NULL,
  taiga_id    INTEGER,
  taiga_ref   INTEGER,
  url         TEXT,
  raw_input   TEXT
);

CREATE TABLE IF NOT EXISTS gl_projects (
  id         INTEGER PRIMARY KEY,
  path       TEXT NOT NULL,
  web_url    TEXT,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS gl_commits (
  sha            TEXT PRIMARY KEY,
  project_id     INTEGER NOT NULL,
  authored_at    TEXT NOT NULL,
  title          TEXT NOT NULL,
  author_name    TEXT,
  author_email   TEXT,
  additions      INTEGER NOT NULL DEFAULT 0,
  deletions      INTEGER NOT NULL DEFAULT 0,
  adj_additions  INTEGER NOT NULL DEFAULT 0,   -- after excluding generated/lock/vendor files
  adj_deletions  INTEGER NOT NULL DEFAULT 0,
  is_merge       INTEGER NOT NULL DEFAULT 0,
  is_fix         INTEGER NOT NULL DEFAULT 0,
  web_url        TEXT
);
CREATE INDEX IF NOT EXISTS idx_commits_date ON gl_commits(authored_at);

CREATE TABLE IF NOT EXISTS gl_mrs (
  id          INTEGER NOT NULL,
  role        TEXT NOT NULL,               -- 'author' | 'reviewer'
  iid         INTEGER NOT NULL,
  project_id  INTEGER NOT NULL,
  title       TEXT NOT NULL,
  state       TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  merged_at   TEXT,
  web_url     TEXT,
  author      TEXT,
  PRIMARY KEY (id, role)
);

CREATE TABLE IF NOT EXISTS gl_events (
  id           INTEGER PRIMARY KEY,
  created_at   TEXT NOT NULL,
  action       TEXT NOT NULL,
  target_type  TEXT,
  project_id   INTEGER,
  noteable_type TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_date ON gl_events(created_at);

CREATE TABLE IF NOT EXISTS gl_pipelines (
  id          INTEGER PRIMARY KEY,
  project_id  INTEGER NOT NULL,
  status      TEXT NOT NULL,
  ref         TEXT,
  created_at  TEXT NOT NULL,
  web_url     TEXT
);
CREATE INDEX IF NOT EXISTS idx_pipelines_date ON gl_pipelines(created_at);

CREATE TABLE IF NOT EXISTS gl_commit_diffs (
  sha        TEXT PRIMARY KEY,
  files_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS release_notes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    INTEGER NOT NULL,
  project_path  TEXT NOT NULL,
  release_title TEXT NOT NULL DEFAULT '',
  feature_name  TEXT NOT NULL,
  service       TEXT NOT NULL,
  deploy_at     TEXT NOT NULL,
  mr_iids       TEXT NOT NULL,
  content       TEXT NOT NULL,
  target_branch TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_release_notes_created ON release_notes(created_at);
`;

const globalForDb = globalThis as unknown as { __devhubDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!globalForDb.__devhubDb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const d = new DatabaseSync(DB_PATH);
    d.exec("PRAGMA journal_mode = WAL;");
    d.exec("PRAGMA busy_timeout = 5000;");
    d.exec(SCHEMA);
    try {
      d.exec("CREATE TABLE IF NOT EXISTS gl_commit_diffs (sha TEXT PRIMARY KEY, files_json TEXT NOT NULL);");
    } catch {}
    try {
      d.exec("ALTER TABLE gl_commits ADD COLUMN author_name TEXT;");
    } catch {}
    try {
      d.exec("ALTER TABLE gl_commits ADD COLUMN author_email TEXT;");
    } catch {}
    try {
      d.exec("CREATE INDEX IF NOT EXISTS idx_commits_author ON gl_commits(author_email, author_name);");
    } catch {}
    try {
      d.exec("ALTER TABLE release_notes ADD COLUMN release_title TEXT NOT NULL DEFAULT '';");
    } catch {}
    try {
      d.exec("ALTER TABLE release_notes ADD COLUMN target_branch TEXT;");
    } catch {}
    globalForDb.__devhubDb = d;
  }
  return globalForDb.__devhubDb;
}
