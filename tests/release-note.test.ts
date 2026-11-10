import { describe, expect, it } from 'vitest';
import {
  analyzeDiffs,
  buildReleaseNoteContent,
  describeDbImpactFallback,
  formatWibDateTime,
} from '../src/lib/release-note/analyze';
import {
  extractKeywords,
  parseReleaseTitle,
  selectReleaseCandidates,
  type CandidateMrLike,
} from '../src/lib/release-note/search';
import type { DiffFile } from '../src/lib/release-note/types';

function file(newPath: string, lines: string[]): DiffFile {
  return {
    oldPath: newPath,
    newPath,
    newFile: false,
    deletedFile: false,
    diff: [
      '--- a/file',
      '+++ b/file',
      '@@ -1,1 +1,9 @@',
      ...lines.map((line) => `+${line}`),
    ].join('\n'),
  };
}

describe('release note analyzer', () => {
  it('detects new tables, columns, type changes, and env vars', () => {
    const impact = analyzeDiffs([
      file('scripts/init_db.sql', [
        'CREATE TABLE IF NOT EXISTS kurasi_produk (id bigint);',
        'ALTER TABLE ai_prompt_logs ADD COLUMN prompt_tokens integer;',
        'ALTER TABLE wad_workload_summaries ALTER COLUMN activities TYPE NUMERIC;',
      ]),
      file('src/lib/ai/client.ts', ['const key = process.env.NEW_AI_KEY;']),
    ]);

    expect(impact.hasDatabaseChanges).toBe(true);
    expect(impact.tables).toContain('kurasi_produk');
    expect(impact.columns).toEqual([
      { table: 'ai_prompt_logs', column: 'prompt_tokens' },
    ]);
    expect(impact.typeChanges).toEqual([
      { table: 'wad_workload_summaries', column: 'activities', type: 'NUMERIC' },
    ]);
    expect(impact.envVars).toContain('NEW_AI_KEY');
  });

  it('reports no database changes when no SQL or migration file changed', () => {
    const impact = analyzeDiffs([
      file('src/app/page.tsx', ['export default function Page() {}']),
    ]);

    expect(impact.hasDatabaseChanges).toBe(false);
    expect(describeDbImpactFallback(impact)).toBe(
      'Tidak ada perubahan database.',
    );
    expect(impact.envVars).toEqual([]);
  });

  it('detects default changes and tables written by SQL outside DDL files', () => {
    const impact = analyzeDiffs([
      file('scripts/init_db.sql', [
        'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscribe_insight BOOLEAN NOT NULL DEFAULT false;',
        'ALTER TABLE profiles ALTER COLUMN subscribe_insight SET DEFAULT false;',
      ]),
      file('src/app/api/ai-feedback/route.ts', [
        'const q = `UPDATE ai_prompt_logs SET is_valid = $1`;',
      ]),
    ]);

    expect(impact.columns).toEqual([
      { table: 'profiles', column: 'subscribe_insight' },
    ]);
    expect(impact.defaultChanges).toEqual([
      { table: 'profiles', column: 'subscribe_insight', value: 'false' },
    ]);
    expect(impact.writeTables).toEqual(['ai_prompt_logs']);

    const content = buildReleaseNoteContent({
      deployAt: '09 Nov 2026 13:28',
      service: 'dashboard-developer',
      mrLinks: ['https://gitlab.example/merge_requests/148'],
      databaseName: 'padi_transactions',
      impact,
      description: 'Mengubah default langganan insight pengguna menjadi nonaktif.',
    });

    expect(content).toContain('Nama Tabel Database: profiles, ai_prompt_logs');
    expect(content).toContain(
      '- Perubahan default di profiles: subscribe_insight menjadi false.',
    );
    expect(content).not.toContain('- Tambahan di profiles');
  });

  it('ignores SQL keywords and documentation prose when collecting write tables', () => {
    const impact = analyzeDiffs([
      file('src/lib/kurasi/bigquery/kurasi-bq-service.ts', [
        'const q = `INSERT INTO kurasi_produk (id) VALUES ($1) ON CONFLICT (product_id) DO UPDATE SET updated_at = now()`;',
        'const w = `UPDATE kurasi_validasi SET status = $1 WHERE id = $2`;',
        'const bad = `UPDATE set WHERE x = 1`;',
        'const single = `UPDATE x SET a = 1`;',
      ]),
      file('rules/sonarqube.md', [
        'Operasi batch insert/update dinamis pada beberapa tabel.',
      ]),
    ]);

    expect(impact.writeTables).toEqual([
      'kurasi_produk',
      'kurasi_validasi',
    ]);
    expect(impact.writeTables).not.toContain('set');
    expect(impact.writeTables).not.toContain('values');
    expect(impact.writeTables).not.toContain('dinamis');
    expect(impact.writeTables).not.toContain('x');
  });

  it('turns a release title into meaningful search keywords', () => {
    expect(extractKeywords('Enhancement Dakocan')).toEqual(['dakocan']);
    expect(extractKeywords('Penambahan fitur update')).toEqual([]);
  });

  it('builds the release note in the required format', () => {
    const impact = analyzeDiffs([
      file('scripts/init_db.sql', [
        'CREATE TABLE kurasi_produk (id bigint);',
        'ALTER TABLE ai_prompt_logs ADD COLUMN prompt_tokens integer;',
      ]),
    ]);

    const content = buildReleaseNoteContent({
      deployAt: '10 Nov 2026 13:04',
      service: 'dashboard-developer',
      mrLinks: ['https://gitlab.example/merge_requests/137'],
      databaseName: 'padi_transactions',
      impact,
      description: 'Menambah tabel kurasi produk.',
    });

    expect(content).toContain('Waktu Deploy: 10 Nov 2026 13:04');
    expect(content).toContain('Service: dashboard-developer');
    expect(content).toContain('Link MR:\nhttps://gitlab.example/merge_requests/137');
    expect(content).toContain('Database Yang Terdampak: PostgreSQL');
    expect(content).toContain('Nama Database: padi_transactions');
    expect(content).toContain(
      'Nama Tabel Database: kurasi_produk, ai_prompt_logs',
    );
    expect(content).toContain(
      'Nama Field/Kolom Database:\n- Tabel baru: seluruh kolom pada kurasi_produk.\n- Tambahan di ai_prompt_logs: prompt_tokens.',
    );
    expect(content).toContain(
      'Deskripsi Perubahan Database: Menambah tabel kurasi produk.',
    );
    expect(content).toContain('Env/Vault: Tidak ada perubahan');
  });

  it('fills dashes when there is no database impact', () => {
    const content = buildReleaseNoteContent({
      deployAt: '10 Nov 2026 13:04',
      service: 'dashboard-developer',
      mrLinks: ['https://gitlab.example/merge_requests/1'],
      impact: analyzeDiffs([]),
      description: '',
    });

    expect(content).toContain('Nama Database: -');
    expect(content).toContain('Nama Tabel Database: -');
    expect(content).toContain('Nama Field/Kolom Database:\n-');
    expect(content).toContain(
      'Deskripsi Perubahan Database: Tidak ada perubahan database.',
    );
  });

  it('formats deploy time in WIB', () => {
    expect(formatWibDateTime('2026-11-10T06:04:00.000Z')).toBe(
      '10 Nov 2026 13:04',
    );
  });
});

function mr(
  iid: number,
  title: string,
  branch: string,
  mergedAt: string,
  description = '',
  targetBranch = 'release',
): CandidateMrLike {
  return {
    iid,
    title,
    description,
    merged_at: mergedAt,
    source_branch: branch,
    target_branch: targetBranch,
  };
}

describe('release note candidate search', () => {
  it('splits the title into subject and qualifier keywords', () => {
    expect(parseReleaseTitle('Kurasi Produk (Integrasi BigQuery)')).toEqual({
      subjectKeywords: ['kurasi', 'produk'],
      qualifierKeywords: ['integrasi', 'bigquery'],
      keywords: ['kurasi', 'produk', 'integrasi', 'bigquery'],
    });
    expect(parseReleaseTitle('Enhancement Dakocan')).toEqual({
      subjectKeywords: ['dakocan'],
      qualifierKeywords: [],
      keywords: ['dakocan'],
    });
  });

  it('keeps only kurasi produk seeds for the BigQuery title', () => {
    const pool: CandidateMrLike[] = [
      mr(
        145,
        '[SPC-12386] feat(ai-context): integrasikan domain release tracker ke studio konteks AI dan router intent',
        'feat/integrasi-ai',
        '2026-11-06T14:29:50+07:00',
        'Integrasi modul Release Tracker. Modul: Kurasi Produk, WAD, BigQuery.',
      ),
      mr(
        144,
        '[SPC-12223] feat(dashboard): implementasi fitur list kurasi produk dan modularisasi workflow',
        'feat/kurasi-produk',
        '2026-11-05T17:40:24+07:00',
        'Fitur List Kurasi Produk pada Dashboard Dakocan.',
      ),
      mr(
        143,
        'feat(kurasi-produk): centralize schema initialization and remove runtime DDL',
        'feat/kurasi-produk',
        '2026-11-05T13:58:15+07:00',
        'Skema kurasi produk dipusatkan di scripts/init_db.sql.',
      ),
      mr(
        142,
        '[SPC-12374] feat(kurasi-produk): integrasi sinkronisasi data dengan BigQuery',
        'feat/kurasi-produk',
        '2026-11-05T12:15:47+07:00',
        'Fitur Kurasi Produk memerlukan integrasi langsung dengan BigQuery.',
      ),
      mr(
        141,
        '[SPC-12374] feat(kurasi-produk): integrasi dataset BigQuery dan panel validasi katalog',
        'feat/kurasi-produk',
        '2026-11-05T10:31:08+07:00',
        'Pengembangan fitur Kurasi Produk untuk mengintegrasikan data dari BigQuery.',
      ),
      mr(
        140,
        '[SPC-12229] test(release-tracker): mock bigquery auto-sync pada unit test SSR page',
        'feat/release-tracker',
        '2026-11-04T17:16:06+07:00',
        'Mock syncReleaseTrackerFromBigQuery pada Release Tracker.',
      ),
      mr(
        139,
        '[SPC-12372] feat(release-tracker): integrasi data BigQuery dan penyesuaian spesifikasi production',
        'feat/release-tracker',
        '2026-11-04T16:58:06+07:00',
        'Pipeline data Release Tracker dari BigQuery.',
      ),
      mr(
        129,
        '[SPC-12326] feat(release-tracker): integrasi tarik data dengan Microsoft Teams',
        'feat/integrasi-teams',
        '2026-10-30T16:13:36+07:00',
        'Release Tracker menarik data dari Microsoft Teams.',
      ),
      mr(
        128,
        '[SPC-12326] fix(ci): prevent jest worker oom, clean deprecated release files, and restore required csv headers',
        'feat/integrasi-teams',
        '2026-10-30T15:20:33+07:00',
        'Release Tracker CI.',
      ),
      mr(
        127,
        '[SPC-12326] feat(release-tracker): integrate microsoft teams deployment sync',
        'feat/integrasi-teams',
        '2026-10-30T14:39:42+07:00',
        'Release Tracker dan Microsoft Teams.',
      ),
      mr(
        120,
        'feat(sonarqube): extend static analysis safeguards for wad, kurasi, workload, and registration',
        'feat/sonarqube-gate-remediation',
        '2026-10-23T16:00:58+07:00',
        'Pengamanan modul wad, kurasi-produk, workload, registration.',
      ),
      mr(
        118,
        '[SPC-12279] feat(kurasi): implementasi auto-retry adaptif dan status interupsi kurasi produk',
        'feat/wad',
        '2026-10-23T14:16:24+07:00',
        'Auto-retry proses kurasi produk.',
      ),
      mr(
        117,
        'feat(wad): remove local csv filesystem write to prevent eacces error',
        'feat/wad',
        '2026-10-23T12:59:56+07:00',
        '',
        'master',
      ),
      mr(
        116,
        '[SPC-12275] feat(wad): adjust activity columns to numeric to support fractional values',
        'feat/wad',
        '2026-10-23T11:24:55+07:00',
        '',
        'master',
      ),
      mr(
        113,
        '[SPC-12271] feat(knowledge): unifikasi knowledge base MoM dan integrasi sintesis wawasan eksekutif',
        'feat/update-table',
        '2026-10-22T12:20:23+07:00',
        'Unified Knowledge Base MoM Produk.',
      ),
      mr(
        112,
        '[SPC-12268] feat: integrasi kurasi produk dan wad ke studio konteks ai',
        'feat/integration-ai',
        '2026-10-21T17:34:09+07:00',
      ),
      mr(
        108,
        '[SPC-12253] feat(wad): integrasi sinkronisasi data WAD berbasis token',
        'feat/signup',
        '2026-10-19T17:29:53+07:00',
        'WAD direct API.',
      ),
      mr(
        105,
        '[SPC-12251] feat(workload): implementasi integrasi direct API berbasis token pada dashboard WAD',
        'feat/signup',
        '2026-10-19T13:00:07+07:00',
      ),
      mr(
        103,
        '[SPC-12248] feat(registration): accommodate central ddl management for registration requests',
        'feat/signup',
        '2026-10-19T09:55:31+07:00',
      ),
      mr(
        102,
        '[SPC-12247] feat(registration): implement sign-up request to admin with NDA workflow',
        'feat/signup',
        '2026-10-19T08:49:44+07:00',
      ),
    ];

    const result = selectReleaseCandidates(
      pool,
      'Kurasi Produk (Integrasi BigQuery)',
      { targetBranch: 'release' },
    );
    const iids = result.map((item) => item.mr.iid);

    expect(result.length).toBeLessThanOrEqual(6);
    expect(iids).toEqual(expect.arrayContaining([141, 142, 143]));
    for (const wrong of [
      139, 140, 127, 128, 129, 102, 103, 117, 116, 105, 108,
    ]) {
      expect(iids).not.toContain(wrong);
    }
    expect(result.every((item) => item.reason.length > 0)).toBe(true);
  });

  it('still finds the Dakocan MR chain through its shared branch', () => {
    const pool: CandidateMrLike[] = [
      mr(
        153,
        '[SPC-12399] feat(month-issues): add pic responder dropdown filter adjacent to category filter',
        'feat/eskalasi-isu',
        '2026-11-10T13:04:48+07:00',
      ),
      mr(
        152,
        '[SPC-12398] feat(dashboard-charts): perataan tinggi kartu chart dan pengurutan ranking talent',
        'feat/eskalasi-isu',
        '2026-11-09T20:41:09+07:00',
        'Penyempurnaan tampilan menu Eskalasi Isu di Dashboard Dakocan.',
      ),
      mr(
        151,
        '[SPC-12399] feat: PIC Responder - Perbaikan Modal Tambah PIC',
        'feat/eskalasi-isu',
        '2026-11-09T17:21:14+07:00',
      ),
      mr(
        150,
        '[SPC-12393] feat(chat): isolasi metadata provider LLM dan penyelarasan signature handler API',
        'feat/ai-insight-feedback-3d',
        '2026-11-09T13:28:25+07:00',
      ),
      mr(
        149,
        '[SPC-12393] feat(ai-analytics): perbarui tab insight menjadi analisis feedback respons AI',
        'feat/ai-insight-feedback-3d',
        '2026-11-09T11:53:32+07:00',
      ),
      mr(
        148,
        '[SPC-12395] feat: Add konteks AI 3D, Feedback Chat AI, and Enhancement Dashboard Dakocan',
        'feat/ai-insight-feedback-3d',
        '2026-11-09T08:42:03+07:00',
      ),
      mr(
        147,
        '[SPC-12391] feat(dashboard-ui): adjust filter bar alignment and controls across modules',
        'feat/adjustment-filter',
        '2026-11-06T16:56:26+07:00',
        'Penyesuaian filter pada Dashboard Dakocan.',
      ),
    ];

    const result = selectReleaseCandidates(pool, 'Enhancement Dakocan', {
      targetBranch: 'release',
    });
    const iids = result.map((item) => item.mr.iid);

    expect(result).toHaveLength(3);
    expect([...iids].sort((a, b) => a - b)).toEqual([148, 149, 150]);
    expect(result.find((item) => item.mr.iid === 148)?.reason).toBe(
      'Cocok frasa lengkap',
    );
    expect(result.find((item) => item.mr.iid === 149)?.reason).toBe(
      'Satu source branch dengan kandidat lain',
    );
    expect(result.find((item) => item.mr.iid === 150)?.reason).toBe(
      'Satu source branch dengan kandidat lain',
    );
  });
});
