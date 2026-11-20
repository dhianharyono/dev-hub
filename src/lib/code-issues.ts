/**
 * Pemindai isu kode statis untuk baris yang DITAMBAHKAN pada sebuah commit.
 *
 * Murni dan sinkron: tidak menyentuh DB, jaringan, atau LLM. Hasil per file
 * disimpan di `gl_commit_files.issues_json` saat sinkronisasi GitLab.
 *
 * Batasan metodologi: hanya baris yang ditambahkan pada commit penulis yang
 * dipindai, dan duplikasi hanya dihitung di dalam file yang sama. Duplikasi
 * lintas file sengaja dilewati karena biayanya besar (perlu indeks seluruh
 * repo) dan tidak sebanding dengan tambahan akurasi.
 */

export const ISSUE_KEYS = [
  "secret",
  "sqlString",
  "emptyCatch",
  "debugPrint",
  "commentedCode",
  "duplicate",
  "anyType",
  "todo",
  "deepNesting",
  "longLine",
] as const;

export type IssueKey = (typeof ISSUE_KEYS)[number];

export interface IssueCounts {
  secret: number;
  sqlString: number;
  emptyCatch: number;
  debugPrint: number;
  commentedCode: number;
  duplicate: number;
  anyType: number;
  todo: number;
  deepNesting: number;
  longLine: number;
}

export interface IssueBundle {
  /** Jumlah baris tambahan yang dipindai. */
  lines: number;
  counts: IssueCounts;
  /** Lokasi temuan per kategori (opsional; JSON lama belum punya). */
  loc?: Partial<Record<IssueKey, IssueLocation[]>>;
}

/** Satu temuan: nomor baris di daftar baris tambahan file ini + cuplikan singkat. */
export interface IssueLocation {
  line: number;
  snippet: string;
}

/** Batas lokasi yang disimpan per kategori per file agar JSON tetap kecil. */
export const MAX_LOCATIONS_PER_KEY = 20;

/** Versi format `issues_json`. Naikkan bila bentuknya berubah agar retro-scan jalan. */
export const ISSUE_JSON_VERSION = 2;

const SNIPPET_MAX = 160;

export const ISSUE_LABELS: Record<IssueKey, string> = {
  deepNesting: "Nesting terlalu dalam",
  secret: "Secret tertulis",
  duplicate: "Baris duplikat",
  sqlString: "SQL dari string",
  debugPrint: "Debug print tertinggal",
  anyType: "Tipe any",
  emptyCatch: "Catch kosong",
  commentedCode: "Kode di dalam komentar",
  todo: "TODO/FIXME",
  longLine: "Baris terlalu panjang",
};

/**
 * Ambang status: mengikuti pola FINDING_THRESHOLDS (warn/kritis). Nilai
 * per-100-baris dipakai untuk membandingkan file/bahasa dengan volume berbeda.
 * `count` menang untuk secret: satu kredensial bocor sudah kritis.
 */
export const ISSUE_THRESHOLDS: Record<IssueKey, { warn: number; critical: number }> = {
  secret: { warn: 1, critical: 2 },
  sqlString: { warn: 1, critical: 3 },
  emptyCatch: { warn: 1, critical: 3 },
  debugPrint: { warn: 1, critical: 3 },
  commentedCode: { warn: 2, critical: 6 },
  duplicate: { warn: 2, critical: 5 },
  anyType: { warn: 1.5, critical: 4 },
  todo: { warn: 1, critical: 5 },
  deepNesting: { warn: 7, critical: 12 },
  longLine: { warn: 10, critical: 30 },
};

/** Plafon penalti per jenis temuan pada skor Skill Kode (total 100). */
export const ISSUE_MAX_PENALTY: Record<IssueKey, number> = {
  deepNesting: 30,
  secret: 15,
  duplicate: 10,
  sqlString: 5,
  debugPrint: 6,
  anyType: 6,
  emptyCatch: 4,
  commentedCode: 3,
  todo: 2,
  longLine: 4,
};

export const EMPTY_COUNTS: IssueCounts = {
  secret: 0,
  sqlString: 0,
  emptyCatch: 0,
  debugPrint: 0,
  commentedCode: 0,
  duplicate: 0,
  anyType: 0,
  todo: 0,
  deepNesting: 0,
  longLine: 0,
};

const TS_RE = /\.(ts|tsx)$/i;
const CODE_RE =
  /\.(ts|tsx|js|jsx|mjs|cjs|php|py|go|java|kt|rb|swift|rs|vue|svelte|sql|css|scss|sass|less)$/i;
const SQL_FILE_RE = /\.sql$/i;

/** Bahasa untuk profil skill per bahasa; null = bukan bahasa kode. */
export function languageOf(path: string): string | null {
  const p = path.toLowerCase();
  if (p.endsWith(".tsx")) return "TypeScript (React)";
  if (p.endsWith(".ts")) return "TypeScript";
  if (/\.(jsx?|mjs|cjs)$/.test(p)) return "JavaScript";
  if (p.endsWith(".php")) return "PHP";
  if (p.endsWith(".sql")) return "SQL";
  if (/\.(css|scss|sass|less)$/.test(p)) return "CSS";
  if (p.endsWith(".py")) return "Python";
  if (p.endsWith(".go")) return "Go";
  if (p.endsWith(".java")) return "Java";
  if (p.endsWith(".vue") || p.endsWith(".svelte")) return "Vue/Svelte";
  if (/\.(kt|rb|swift|rs)$/.test(p)) return "Lainnya";
  return null;
}

const SECRET_RE =
  /(api[_-]?key|secret|token|password|passwd|credential)s?\s*[:=]\s*(['"`])([^'"`]{8,})\2/i;
const SECRET_PLACEHOLDER_RE =
  /process\.env|import\.meta\.env|\$\{|\{\{|xxxx|\*\*\*|your[-_ ]|example|placeholder|changeme|dummy|sample|redacted|test|mock|fake|stub|fixture|valid|invalid|wrong|<[^>]+>/i;
const SQL_RE =
  /\b(SELECT\s+[\w*,\s.`"]+\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+(TABLE|INDEX|VIEW)|ALTER\s+TABLE)\b/i;
/** SQL yang dirangkai: konkatenasi `+` atau interpolasi `${}`. */
const SQL_CONCAT_RE = /\+\s*[\w'"`(]|\$\{/;
const DEBUG_RE =
  /(^|[^\w.])console\.(log|debug|trace|dir)\s*\(|\bdebugger\b|\bvar_dump\s*\(|\bprint_r\s*\(|(^|[^\w>])dd\s*\(|\bSystem\.out\.print|\bfmt\.Print/;
const COMMENT_RE = /^\s*(\/\/|#|--|\/\*|\*)\s?(.*)$/;
const COMMENT_CODE_RE =
  /\b(const|let|var|function|return|await|import|export|class|interface|if|for|while|switch|try|catch|def|public|private|protected|SELECT|INSERT|UPDATE|DELETE)\b|=>|\)\s*\{/;
const ANY_RE = /(:\s*any\b|\bas\s+any\b|<any>|any\s*\[\]|Array<any>|Record<[^>]*,\s*any>)/;
const TODO_RE = /\b(TODO|FIXME|HACK|XXX)\b/;

/** Baris komentar yang bukan kode (dokumentasi, direktif alat, judul). */
function isCommentOnly(line: string): boolean {
  const m = line.match(COMMENT_RE);
  if (!m) return false;
  const body = m[2].trim();
  if (body.length < 8) return false;
  if (/^@(param|returns?|throws|example|see|deprecated|ts-|eslint|phpstan|noinspection)/i.test(body)) return false;
  return COMMENT_CODE_RE.test(body);
}

function isSecret(line: string): boolean {
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(line)) return true;
  if (/AKIA[0-9A-Z]{16}/.test(line)) return true;
  if (/glpat-[A-Za-z0-9_-]{20,}/.test(line)) return true;
  const m = line.match(SECRET_RE);
  if (!m) return false;
  return !SECRET_PLACEHOLDER_RE.test(m[3]);
}

function indentDepth(line: string): number {
  const match = line.match(/^[\t ]*/);
  if (!match) return 0;
  const indent = match[0];
  const tabs = (indent.match(/\t/g) ?? []).length;
  const spaces = indent.length - tabs;
  return tabs * 2 + Math.floor(spaces / 2);
}

const DUPLICATE_MIN_LEN = 12;

function isDuplicateCandidate(line: string): boolean {
  const text = line.trim();
  if (text.length < DUPLICATE_MIN_LEN) return false;
  if (/^(import|export\s+\*|from)\b/.test(text)) return false;
  if (/^(\}|\{|\}\);?|\);?|\],?|\],?|<\/)/.test(text)) return false;
  if (COMMENT_RE.test(text)) return false;
  return true;
}

/**
 * Pindai baris tambahan satu file. `lines` harus berupa isi baris tanpa
 * prefiks `+` dari patch diff.
 */
export function scanAddedLines(path: string, lines: string[]): IssueBundle {
  const counts: IssueCounts = { ...EMPTY_COUNTS };
  if (!CODE_RE.test(path)) return { lines: 0, counts };

  const isTs = TS_RE.test(path);
  const isSqlFile = SQL_FILE_RE.test(path);
  const countsNesting = !/\.(sql|css|scss|sass|less)$/i.test(path);
  const seen = new Map<string, number>();
  const loc: Partial<Record<IssueKey, IssueLocation[]>> = {};

  const addLoc = (key: IssueKey, index: number, line: string) => {
    const list = (loc[key] ??= []);
    if (list.length >= MAX_LOCATIONS_PER_KEY) return;
    const snippet = line.trim();
    list.push({
      line: index + 1,
      snippet: snippet.length > SNIPPET_MAX ? `${snippet.slice(0, SNIPPET_MAX)}…` : snippet,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isSecret(line)) {
      counts.secret++;
      addLoc("secret", i, line);
    }
    if (!isSqlFile && SQL_RE.test(line) && /['"`]/.test(line) && SQL_CONCAT_RE.test(line)) {
      counts.sqlString++;
      addLoc("sqlString", i, line);
    }
    if (DEBUG_RE.test(line)) {
      counts.debugPrint++;
      addLoc("debugPrint", i, line);
    }
    if (isCommentOnly(line)) {
      counts.commentedCode++;
      addLoc("commentedCode", i, line);
    }
    if (isTs && ANY_RE.test(line)) {
      counts.anyType++;
      addLoc("anyType", i, line);
    }
    if (TODO_RE.test(line)) {
      counts.todo++;
      addLoc("todo", i, line);
    }
    if (line.length > 120) {
      counts.longLine++;
      addLoc("longLine", i, line);
    }
    if (countsNesting && indentDepth(line) >= 5) {
      counts.deepNesting++;
      addLoc("deepNesting", i, line);
    }

    if (/\bcatch\s*(\([^)]*\))?\s*\{\s*\}/.test(line)) {
      counts.emptyCatch++;
      addLoc("emptyCatch", i, line);
    } else if (/\bcatch\s*(\([^)]*\))?\s*\{\s*$/.test(line)) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length && lines[j].trim() === "}") {
        counts.emptyCatch++;
        addLoc("emptyCatch", i, line);
      }
    }

    if (isDuplicateCandidate(line)) {
      const key = trimmed.replace(/\s+/g, " ").toLowerCase();
      const prev = seen.get(key) ?? 0;
      if (prev > 0) {
        counts.duplicate++;
        addLoc("duplicate", i, line);
      }
      seen.set(key, prev + 1);
    }
  }

  return Object.keys(loc).length ? { lines: lines.length, counts, loc } : { lines: lines.length, counts };
}

export function addBundles(a: IssueBundle, b: IssueBundle): IssueBundle {
  const counts = { ...a.counts };
  for (const key of ISSUE_KEYS) counts[key] += b.counts[key];
  return { lines: a.lines + b.lines, counts };
}

export function emptyBundle(): IssueBundle {
  return { lines: 0, counts: { ...EMPTY_COUNTS } };
}

/** Baca `issues_json`; null berarti file belum dipindai (netral, bukan nol). */
export function readIssues(json: string | null | undefined): IssueBundle | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Partial<IssueBundle>;
    if (!parsed || typeof parsed.lines !== "number" || !parsed.counts) return null;
    const counts = { ...EMPTY_COUNTS };
    for (const key of ISSUE_KEYS) {
      const value = parsed.counts[key];
      counts[key] = typeof value === "number" && Number.isFinite(value) ? value : 0;
    }
    const loc = readLocations(parsed.loc);
    return loc ? { lines: parsed.lines, counts, loc } : { lines: parsed.lines, counts };
  } catch {
    return null;
  }
}

/** `loc` opsional: JSON versi lama hanya punya lines+counts. */
function readLocations(
  raw: Partial<Record<IssueKey, IssueLocation[]>> | undefined,
): Partial<Record<IssueKey, IssueLocation[]>> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Partial<Record<IssueKey, IssueLocation[]>> = {};
  for (const key of ISSUE_KEYS) {
    const list = raw[key];
    if (!Array.isArray(list)) continue;
    const clean: IssueLocation[] = [];
    for (const item of list.slice(0, MAX_LOCATIONS_PER_KEY)) {
      if (!item || typeof item.line !== "number" || typeof item.snippet !== "string") continue;
      clean.push({ line: item.line, snippet: item.snippet });
    }
    if (clean.length) out[key] = clean;
  }
  return Object.keys(out).length ? out : undefined;
}

export function serializeIssues(bundle: IssueBundle): string {
  const payload: Record<string, unknown> = {
    v: ISSUE_JSON_VERSION,
    lines: bundle.lines,
    counts: bundle.counts,
  };
  if (bundle.loc && Object.keys(bundle.loc).length) payload.loc = bundle.loc;
  return JSON.stringify(payload);
}

/** Satu baris data file berisi temuan, dipakai agregasi lokasi lintas file. */
export interface IssueLocationRow {
  sha: string;
  projectId: number;
  path: string;
  authoredAt: string;
  issuesJson: string | null;
}

export interface IssueLocationDetail {
  sha: string;
  projectId: number;
  path: string;
  authoredAt: string;
  line: number;
  snippet: string;
}

/**
 * Kumpulkan lokasi satu kategori lintas file, terbaru dulu. Baris tanpa `loc`
 * (file lama yang belum dipindai ulang) dilewati tanpa error.
 */
export function collectIssueLocations(
  key: IssueKey,
  rows: IssueLocationRow[],
  limit = 50,
): IssueLocationDetail[] {
  const out: IssueLocationDetail[] = [];
  for (const row of rows) {
    const bundle = readIssues(row.issuesJson);
    const list = bundle?.loc?.[key];
    if (!list) continue;
    for (const item of list) {
      out.push({
        sha: row.sha,
        projectId: row.projectId,
        path: row.path,
        authoredAt: row.authoredAt,
        line: item.line,
        snippet: item.snippet,
      });
    }
  }
  out.sort(
    (a, b) =>
      b.authoredAt.localeCompare(a.authoredAt) ||
      a.path.localeCompare(b.path) ||
      a.line - b.line,
  );
  return out.slice(0, limit);
}

export function per100(count: number, lines: number): number {
  return lines > 0 ? (count / lines) * 100 : 0;
}

export type IssueSeverity = "critical" | "warn" | "good";

export function severityOf(key: IssueKey, count: number, lines: number): IssueSeverity {
  if (key === "secret") {
    if (count >= 1) return "critical";
    return "good";
  }
  const density = per100(count, lines);
  const band = ISSUE_THRESHOLDS[key];
  if (density >= band.critical) return "critical";
  if (density >= band.warn) return "warn";
  return "good";
}

/**
 * Penalti satu jenis temuan. Dipakai juga oleh detail per bahasa agar angka
 * yang tampil di popup sama dengan yang dipakai skor.
 */
export function issuePenalty(key: IssueKey, count: number, lines: number): number {
  if (lines <= 0 || count <= 0) return 0;
  if (key === "secret") return Math.min(ISSUE_MAX_PENALTY.secret, 5 + count * 0.3);
  const density = per100(count, lines);
  const critical = ISSUE_THRESHOLDS[key].critical;
  return ISSUE_MAX_PENALTY[key] * Math.min(1, density / critical);
}

/**
 * Penalti Skill Kode dari temuan statis. Tiap jenis temuan dinormalkan ke
 * ambang kritisnya, lalu dikalikan plafonnya. Secret memakai ambang absolut
 * karena satu nilai rahasia yang lolos sudah merusak.
 */
export function staticPenalty(counts: IssueCounts, lines: number): number {
  if (lines <= 0) return 0;
  let penalty = 0;
  for (const key of ISSUE_KEYS) {
    penalty += issuePenalty(key, counts[key], lines);
  }
  return penalty;
}
