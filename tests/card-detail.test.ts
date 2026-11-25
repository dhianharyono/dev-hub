import { describe, it, expect } from 'vitest';
import {
  buildHotspotDetail,
  buildLanguageDetail,
  buildRecurringDetail,
} from '../src/lib/card-detail';
import { emptyBundle, type IssueCounts } from '../src/lib/code-issues';
import type { ReworkAnalysis } from '../src/lib/scoring';

const counts = (patch: Partial<IssueCounts>): IssueCounts => ({
  ...emptyBundle().counts,
  ...patch,
});

const emptyRework = (): ReworkAnalysis => ({
  selfReworkLines: 0,
  selfBugFixCommits: 0,
  backAndForthLines: 0,
  fixOnFixCommits: 0,
  fixOnFixLines: 0,
  repeatedFixFiles: [],
  hotspots: [],
  revertCount: 0,
  fixOnFixFiles: [],
  backAndForthFiles: [],
  selfReworkExamples: [],
  fixOnFixExamples: [],
  revertCommits: [],
});

describe('Detail bahasa', () => {
  it('mengagregasi temuan hanya untuk bahasa terpilih dan menyertakan lokasi', () => {
    const detail = buildLanguageDetail('TypeScript (React)', [
      {
        sha: 'aaa',
        path: 'src/app/page.tsx',
        authoredAt: '2026-05-01T00:00:00Z',
        issuesJson: JSON.stringify({
          v: 2,
          lines: 100,
          counts: counts({ deepNesting: 4, duplicate: 2 }),
          loc: { deepNesting: [{ line: 12, snippet: 'if (a) {' }] },
        }),
      },
      {
        sha: 'bbb',
        path: 'src/lib/db.ts',
        authoredAt: '2026-05-02T00:00:00Z',
        issuesJson: JSON.stringify({
          v: 2,
          lines: 50,
          counts: counts({ secret: 1 }),
        }),
      },
    ]);

    expect(detail.lines).toBe(100);
    expect(detail.commits).toBe(1);
    expect(detail.findings.map((finding) => finding.key)).toContain('deepNesting');
    expect(detail.findings.map((finding) => finding.key)).not.toContain('secret');
    const nesting = detail.findings.find((finding) => finding.key === 'deepNesting');
    expect(nesting?.locations[0].path).toBe('src/app/page.tsx');
    expect(nesting?.locations[0].line).toBe(12);
    expect(nesting?.files[0].count).toBe(4);
  });

  it('mengurutkan temuan dari penalti terbesar dan memberi skor bahasa', () => {
    const detail = buildLanguageDetail('TypeScript', [
      {
        sha: 'aaa',
        path: 'src/a.ts',
        authoredAt: '2026-05-01T00:00:00Z',
        issuesJson: JSON.stringify({
          v: 2,
          lines: 1000,
          counts: counts({ anyType: 50, todo: 1 }),
        }),
      },
    ]);
    expect(detail.findings[0].key).toBe('anyType');
    expect(detail.score).toBeLessThan(100);
    expect(detail.score).not.toBeNull();
  });
});

describe('Detail isu berulang', () => {
  it('mengambil file fix berulang beserta contoh commit', () => {
    const rework = emptyRework();
    rework.repeatedFixFiles = [
      {
        path: 'package.json',
        fixCount: 3,
        avgLines: 7.5,
        kind: 'perbaikan kecil rutin',
        shas: ['aaa', 'bbb'],
      },
    ];
    const detail = buildRecurringDetail('repeatedFix', rework, [
      { sha: 'aaa', title: 'fix(deps): pin version', authored_at: '2026-05-01T00:00:00Z' },
      { sha: 'bbb', title: 'fix(deps): pin again', authored_at: '2026-05-03T00:00:00Z' },
      { sha: 'ccc', title: 'feat(x): unrelated', authored_at: '2026-05-04T00:00:00Z' },
    ]);
    expect(detail.files[0]).toMatchObject({ path: 'package.json', count: 3, avgLines: 7.5 });
    expect(detail.commits.map((commit) => commit.sha)).toEqual(['bbb', 'aaa']);
  });

  it('memakai daftar revert saat isu revert dipilih', () => {
    const rework = emptyRework();
    rework.revertCommits = [
      { sha: 'ddd', title: 'Revert "feat(x): change"', authored_at: '2026-06-01T00:00:00Z' },
    ];
    const detail = buildRecurringDetail('revert', rework, []);
    expect(detail.files).toHaveLength(0);
    expect(detail.commits[0].sha).toBe('ddd');
  });
});

describe('Detail hotspot', () => {
  it('mengurutkan commit terbaru dan membatasi jumlah baris', () => {
    const rows = Array.from({ length: 15 }, (_, index) => ({
      sha: `sha${index}`,
      title: `commit ${index}`,
      authored_at: `2026-05-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
      is_fix: index % 2,
    }));
    const detail = buildHotspotDetail('src/app/page.tsx', rows);
    expect(detail.commits).toHaveLength(12);
    expect(detail.commits[0].sha).toBe('sha14');
    expect(detail.commits[0].isFix).toBe(false);
  });
});
