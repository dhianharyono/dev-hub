import type { DbImpact, DiffFile } from './types';

/** Format an ISO timestamp into "DD Mmm YYYY HH:mm" in WIB (Asia/Jakarta). */
export function formatWibDateTime(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const pick = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? '';
  const hour = pick('hour') === '24' ? '00' : pick('hour');
  return `${pick('day')} ${pick('month')} ${pick('year')} ${hour}:${pick('minute')}`;
}

const CREATE_TABLE_RE =
  /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?(?:[a-z0-9_]+\.)?["`]?([a-z0-9_]+)["`]?/i;

const ADD_COLUMN_RE =
  /\balter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(?:[a-z0-9_]+\.)?["`]?([a-z0-9_]+)["`]?\s+add\s+(?:column\s+)?(?:if\s+not\s+exists\s+)?["`]?([a-z0-9_]+)["`]?/i;

const TYPE_CHANGE_RE =
  /\balter\s+table\s+(?:only\s+)?(?:[a-z0-9_]+\.)?["`]?([a-z0-9_]+)["`]?\s+alter\s+(?:column\s+)?["`]?([a-z0-9_]+)["`]?\s+(?:set\s+data\s+)?type\s+([^;\n]+)/i;

const DEFAULT_CHANGE_RE =
  /\balter\s+table\s+(?:only\s+)?(?:[a-z0-9_]+\.)?["`]?([a-z0-9_]+)["`]?\s+alter\s+(?:column\s+)?["`]?([a-z0-9_]+)["`]?\s+set\s+default\s+([^;\n]+)/i;

const RESERVED_ADD_TOKENS = new Set([
  'constraint',
  'primary',
  'foreign',
  'unique',
  'check',
  'exclude',
  'index',
]);

const PROCESS_ENV_RE = /process\.env\.([A-Z][A-Z0-9_]*)/g;
const PROCESS_ENV_BRACKET_RE = /process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g;
const ENV_FILE_LINE_RE = /^\s*(?:export\s+)?([A-Z][A-Z0-9_]{2,})\s*=/;

const SQL_WRITE_TABLE_RE =
  /\b(?:update|insert\s+into|delete\s+from)\s+(?:only\s+)?(?:[a-z0-9_]+\.)?["`]?([a-z0-9_]+)["`]?/gi;

/** Captured tokens that are SQL keywords, not table names. */
const SQL_WRITE_RESERVED = new Set([
  'set',
  'values',
  'where',
  'select',
  'from',
  'into',
  'on',
  'conflict',
  'table',
  'only',
  'cascade',
  'restrict',
  'default',
]);

function isDocumentationFile(filePath: string): boolean {
  return /\.(md|mdx|txt|rst|adoc)$/i.test(filePath);
}

function isPlausibleWriteTable(name: string): boolean {
  return (
    name.length >= 2 &&
    /^[a-z_][a-z0-9_]*$/.test(name) &&
    !SQL_WRITE_RESERVED.has(name)
  );
}

function isTestFile(filePath: string): boolean {
  return (
    /(^|\/)(__tests__|tests?)\//.test(filePath) ||
    /\.(test|spec)\.[a-z]+$/i.test(filePath)
  );
}

/** SQL files and migration folders whose added lines describe database changes. */
export function isSqlLikeFile(filePath: string): boolean {
  return (
    /\.sql$/i.test(filePath) ||
    /(^|\/)(migrations?|db\/migrate)\//i.test(filePath) ||
    /(^|\/)migration\//i.test(filePath)
  );
}

function isEnvConfigFile(filePath: string): boolean {
  const base = filePath.split('/').pop() || '';
  return (
    /^\.env($|\.)/i.test(base) ||
    /env\.(example|sample|template)$/i.test(base) ||
    /(^|\/)config\//i.test(filePath) ||
    /(^|\/)config\.[a-z]+$/i.test(filePath)
  );
}

function addedLines(diff: string): string[] {
  return diff
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1));
}

function removedLines(diff: string): string[] {
  return diff
    .split('\n')
    .filter((line) => line.startsWith('-') && !line.startsWith('---'))
    .map((line) => line.slice(1));
}

function collectEnvVars(line: string, isEnvConfig: boolean): string[] {
  const found: string[] = [];
  for (const match of line.matchAll(PROCESS_ENV_RE)) found.push(match[1]);
  for (const match of line.matchAll(PROCESS_ENV_BRACKET_RE)) found.push(match[1]);
  if (isEnvConfig) {
    const match = line.match(ENV_FILE_LINE_RE);
    if (match) found.push(match[1]);
  }
  return found;
}

function cleanType(type: string): string {
  return type.replace(/[;,]+$/, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function cleanDefaultValue(value: string): string {
  return value.replace(/[;,]+$/, '').replace(/\s+/g, ' ').trim();
}

export function analyzeDiffs(files: DiffFile[]): DbImpact {
  const tables = new Set<string>();
  const columns = new Map<string, Set<string>>();
  const typeChanges = new Map<string, Map<string, string>>();
  const defaultChanges = new Map<string, Map<string, string>>();
  const envVars = new Set<string>();
  const removedEnvVars = new Set<string>();
  const sqlFiles = new Set<string>();
  const writeTables = new Set<string>();

  for (const file of files) {
    const filePath = file.newPath || file.oldPath;
    if (!filePath) continue;
    const added = addedLines(file.diff || '');

    if (!isTestFile(filePath) && !isDocumentationFile(filePath)) {
      for (const line of added) {
        for (const match of line.matchAll(SQL_WRITE_TABLE_RE)) {
          const name = match[1].toLowerCase();
          const before = line.slice(0, match.index).toLowerCase();
          // `ON CONFLICT ... DO UPDATE SET` is not a table write.
          if (/\bdo\s+$/.test(before)) continue;
          if (!isPlausibleWriteTable(name)) continue;
          writeTables.add(name);
        }
      }
    }

    if (isSqlLikeFile(filePath)) {
      sqlFiles.add(filePath);
      for (const line of added) {
        const statement = line.trim();
        if (statement.startsWith('--') || statement.startsWith('//')) continue;

        const createMatch = line.match(CREATE_TABLE_RE);
        if (createMatch) tables.add(createMatch[1].toLowerCase());

        const addMatch = line.match(ADD_COLUMN_RE);
        if (addMatch) {
          const table = addMatch[1].toLowerCase();
          const column = addMatch[2].toLowerCase();
          if (!RESERVED_ADD_TOKENS.has(column)) {
            const set = columns.get(table) ?? new Set<string>();
            set.add(column);
            columns.set(table, set);
          }
        }

        const typeMatch = line.match(TYPE_CHANGE_RE);
        if (typeMatch) {
          const table = typeMatch[1].toLowerCase();
          const column = typeMatch[2].toLowerCase();
          const type = cleanType(typeMatch[3]);
          if (type) {
            const map = typeChanges.get(table) ?? new Map<string, string>();
            map.set(column, type);
            typeChanges.set(table, map);
          }
        }

        const defaultMatch = line.match(DEFAULT_CHANGE_RE);
        if (defaultMatch) {
          const table = defaultMatch[1].toLowerCase();
          const column = defaultMatch[2].toLowerCase();
          const value = cleanDefaultValue(defaultMatch[3]);
          if (value) {
            const map = defaultChanges.get(table) ?? new Map<string, string>();
            map.set(column, value);
            defaultChanges.set(table, map);
          }
        }
      }
      continue;
    }

    const isEnvConfig = isEnvConfigFile(filePath);
    for (const line of added) {
      for (const name of collectEnvVars(line, isEnvConfig)) envVars.add(name);
    }
    for (const line of removedLines(file.diff || '')) {
      for (const name of collectEnvVars(line, isEnvConfig))
        removedEnvVars.add(name);
    }
  }

  for (const name of removedEnvVars) envVars.delete(name);

  return {
    tables: [...tables],
    columns: [...columns.entries()].flatMap(([table, cols]) =>
      [...cols].map((column) => ({ table, column })),
    ),
    typeChanges: [...typeChanges.entries()].flatMap(([table, cols]) =>
      [...cols.entries()].map(([column, type]) => ({ table, column, type })),
    ),
    defaultChanges: [...defaultChanges.entries()].flatMap(([table, cols]) =>
      [...cols.entries()].map(([column, value]) => ({ table, column, value })),
    ),
    writeTables: [...writeTables],
    envVars: [...envVars],
    sqlFiles: [...sqlFiles],
    hasDatabaseChanges: sqlFiles.size > 0,
  };
}

export function describeDbImpactFallback(impact: DbImpact): string {
  if (!impact.hasDatabaseChanges) return 'Tidak ada perubahan database.';

  const sentences: string[] = [];
  if (impact.tables.length > 0) {
    sentences.push(`Menambah tabel ${impact.tables.join(', ')}.`);
  }

  const defaultKeys = new Set(
    impact.defaultChanges.map((change) => `${change.table}.${change.column}`),
  );
  const columnGroups = new Map<string, string[]>();
  for (const change of impact.columns) {
    if (defaultKeys.has(`${change.table}.${change.column}`)) continue;
    const list = columnGroups.get(change.table) ?? [];
    list.push(change.column);
    columnGroups.set(change.table, list);
  }
  if (columnGroups.size > 0) {
    const detail = [...columnGroups.entries()]
      .map(([table, cols]) => `kolom ${cols.join(', ')} pada tabel ${table}`)
      .join('; ');
    sentences.push(`Menambah ${detail}.`);
  }

  if (impact.typeChanges.length > 0) {
    const detail = impact.typeChanges
      .map(
        (change) =>
          `${change.column} pada tabel ${change.table} menjadi ${change.type}`,
      )
      .join('; ');
    sentences.push(`Mengubah tipe ${detail}.`);
  }

  if (impact.defaultChanges.length > 0) {
    const detail = impact.defaultChanges
      .map(
        (change) =>
          `${change.column} pada tabel ${change.table} menjadi ${change.value}`,
      )
      .join('; ');
    sentences.push(`Mengubah nilai default ${detail}.`);
  }

  if (sentences.length === 0) {
    sentences.push(
      'Ada perubahan pada file SQL/migration, detail belum terdeteksi otomatis.',
    );
  }

  return sentences.slice(0, 3).join(' ');
}

export interface BuildReleaseNoteInput {
  deployAt: string;
  service: string;
  mrLinks: string[];
  databaseName?: string | null;
  impact: DbImpact;
  description: string;
}

export function buildReleaseNoteContent(input: BuildReleaseNoteInput): string {
  const { impact } = input;

  const affectedTables = [
    ...new Set([
      ...impact.tables,
      ...impact.columns.map((c) => c.table),
      ...impact.typeChanges.map((c) => c.table),
      ...impact.defaultChanges.map((c) => c.table),
      ...impact.writeTables,
    ]),
  ];

  const fieldLines: string[] = [];
  for (const table of impact.tables) {
    fieldLines.push(`- Tabel baru: seluruh kolom pada ${table}.`);
  }

  const defaultKeys = new Set(
    impact.defaultChanges.map((change) => `${change.table}.${change.column}`),
  );
  const columnGroups = new Map<string, string[]>();
  for (const change of impact.columns) {
    if (defaultKeys.has(`${change.table}.${change.column}`)) continue;
    const list = columnGroups.get(change.table) ?? [];
    list.push(change.column);
    columnGroups.set(change.table, list);
  }
  for (const [table, cols] of columnGroups) {
    fieldLines.push(`- Tambahan di ${table}: ${cols.join(', ')}.`);
  }

  for (const change of impact.typeChanges) {
    fieldLines.push(
      `- Perubahan tipe di ${change.table}: ${change.column} menjadi ${change.type}.`,
    );
  }

  for (const change of impact.defaultChanges) {
    fieldLines.push(
      `- Perubahan default di ${change.table}: ${change.column} menjadi ${change.value}.`,
    );
  }

  if (fieldLines.length === 0) fieldLines.push('-');

  const tablesLine =
    affectedTables.length > 0 ? affectedTables.join(', ') : '-';
  const envLine =
    impact.envVars.length > 0
      ? impact.envVars.join(', ')
      : 'Tidak ada perubahan';
  const description =
    input.description.trim() || describeDbImpactFallback(impact);

  return [
    `Waktu Deploy: ${input.deployAt || '-'}`,
    `Service: ${input.service || '-'}`,
    'Link MR:',
    ...(input.mrLinks.length > 0 ? input.mrLinks : ['-']),
    '',
    'Database Yang Terdampak: PostgreSQL',
    `Nama Database: ${input.databaseName?.trim() || '-'}`,
    `Nama Tabel Database: ${tablesLine}`,
    'Nama Field/Kolom Database:',
    ...fieldLines,
    `Deskripsi Perubahan Database: ${description}`,
    `Env/Vault: ${envLine}`,
  ].join('\n');
}
