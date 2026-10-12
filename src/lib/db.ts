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
`;

const globalForDb = globalThis as unknown as { __devhubDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!globalForDb.__devhubDb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const d = new DatabaseSync(DB_PATH);
    d.exec("PRAGMA journal_mode = WAL;");
    d.exec(SCHEMA);
    globalForDb.__devhubDb = d;
  }
  return globalForDb.__devhubDb;
}
