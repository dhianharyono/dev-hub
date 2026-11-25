import { describe, it, expect } from 'vitest';
import {
  COMPONENT_KEYS,
  COMPONENT_WEIGHTS,
  PDF_REFERENCE,
  TALENT_WEIGHTS,
  analyzeRework,
  computeScorecard,
  computeSelfReworkLines,
  gradeOfScore,
  type ScoreCommit,
  type ScoreEvent,
  type ScoreFile,
} from '../src/lib/scoring';
import type { FlowMr, ReachRow } from '../src/lib/talent-report';

const start = new Date('2026-01-01T00:00:00+07:00');
const end = new Date('2026-03-01T00:00:00+07:00');

const at = (dayOffset: number) =>
  new Date(start.getTime() + dayOffset * 86_400_000).toISOString();

function commit(index: number, overrides: Partial<ScoreCommit> = {}): ScoreCommit {
  return {
    sha: `c${index}`,
    project_id: 1,
    authored_at: at(index * 2),
    title: `feat(scope): perubahan ${index}`,
    is_fix: 0,
    adj_additions: 50,
    adj_deletions: 10,
    ...overrides,
  };
}

function file(index: number, overrides: Partial<ScoreFile> = {}): ScoreFile {
  return {
    sha: `c${index}`,
    project_id: 1,
    path: 'src/app/page.tsx',
    added: 50,
    deleted: 10,
    added_hashes: JSON.stringify([`h${index}`]),
    deleted_hashes: '[]',
    ...overrides,
  };
}

describe('Mesin skor: bobot dan skala', () => {
  it('memakai bobot 20/25/15/15/10/15 dan total 100', () => {
    expect(COMPONENT_WEIGHTS).toEqual({
      productivity: 20,
      quality: 25,
      skill: 15,
      collaboration: 15,
      consistency: 10,
      releaseFlow: 15,
    });
    expect(Object.values(COMPONENT_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it('mereproduksi skor keseluruhan 60 dari komponen pembanding PDF', () => {
    const overall = Math.round(
      (PDF_REFERENCE.productivity * COMPONENT_WEIGHTS.productivity +
        PDF_REFERENCE.quality * COMPONENT_WEIGHTS.quality +
        PDF_REFERENCE.skill * COMPONENT_WEIGHTS.skill +
        PDF_REFERENCE.collaboration * COMPONENT_WEIGHTS.collaboration +
        PDF_REFERENCE.consistency * COMPONENT_WEIGHTS.consistency +
        PDF_REFERENCE.releaseFlow * COMPONENT_WEIGHTS.releaseFlow) /
        100,
    );
    expect(overall).toBe(PDF_REFERENCE.overall);
  });

  it('memetakan skala A–E sesuai metodologi', () => {
    expect(gradeOfScore(85)).toEqual({ grade: 'A', label: 'Sangat Baik' });
    expect(gradeOfScore(70)).toEqual({ grade: 'B', label: 'Baik' });
    expect(gradeOfScore(55)).toEqual({ grade: 'C', label: 'Cukup' });
    expect(gradeOfScore(40)).toEqual({ grade: 'D', label: 'Perlu Perhatian' });
    expect(gradeOfScore(39)).toEqual({ grade: 'E', label: 'Kurang' });
  });
});

describe('Mesin skor: self-rework', () => {
  it('hanya menghitung baris yang dihapus dalam 21 hari', () => {
    const commitAt = new Map([
      ['a', new Date(at(0)).getTime()],
      ['b', new Date(at(10)).getTime()],
      ['c', new Date(at(40)).getTime()],
    ]);
    const files: ScoreFile[] = [
      file(0, { sha: 'a', added_hashes: '["h1","h2"]', deleted_hashes: '[]' }),
      file(1, { sha: 'b', added_hashes: '[]', deleted_hashes: '["h1"]' }),
      file(2, { sha: 'c', added_hashes: '[]', deleted_hashes: '["h2"]' }),
    ];
    expect(computeSelfReworkLines(files, commitAt)).toBe(1);
  });
});

describe('Mesin skor: komponen', () => {
  const commits = Array.from({ length: 20 }, (_, index) => commit(index));
  const files = commits.map((_, index) =>
    file(index, {
      path: index % 4 === 0 ? 'src/app/page.test.tsx' : 'src/app/page.tsx',
      issues_json: '{"lines":50,"counts":{}}',
    }),
  );
  const mrs: FlowMr[] = [
    { project_id: 1, role: 'author', created_at: at(2), merged_at: at(6), source_branch: 'feat/a', target_branch: 'develop' },
    { project_id: 1, role: 'author', created_at: at(10), merged_at: at(14), source_branch: 'feat/b', target_branch: 'master' },
    { project_id: 1, role: 'author', created_at: at(20), merged_at: null, source_branch: 'feat/c', target_branch: 'release' },
  ];
  const events: ScoreEvent[] = [
    ...Array.from({ length: 6 }, (_, index) => ({
      created_at: at(index + 1),
      action: 'commented on',
      project_id: 1,
      ref: '!1',
      noteable_type: 'MergeRequest',
    })),
    { created_at: at(8), action: 'approved', project_id: 1, ref: '!2', noteable_type: null },
  ];
  const reaches: ReachRow[] = commits.slice(0, 4).map((item) => ({ sha: item.sha, stage: 'master' }));

  const card = computeScorecard({ start, end, commits, files, mrs, events, reaches });

  it('mengembalikan enam komponen bernilai 0–100', () => {
    expect(card.components).toHaveLength(6);
    for (const key of COMPONENT_KEYS) {
      const score = card.scores[key];
      if (score !== null) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
    expect(card.scores.productivity).not.toBeNull();
    expect(card.scores.quality).not.toBeNull();
    expect(card.scores.skill).not.toBeNull();
    expect(card.scores.collaboration).not.toBeNull();
    expect(card.scores.consistency).not.toBeNull();
    expect(card.scores.releaseFlow).not.toBeNull();
    expect(card.overall).toBeGreaterThan(0);
    expect(['A', 'B', 'C', 'D', 'E']).toContain(card.grade);
  });

  it('menormalisasi bobot efektif ke 100%', () => {
    const sum = Object.values(card.effectiveWeights).reduce((total, value) => total + value, 0);
    expect(sum).toBeCloseTo(100, 0);
  });

  it('memberi langkah konkret 1–4 butir untuk tiap prioritas aksi', () => {
    expect(card.actions.length).toBeGreaterThan(0);
    for (const action of card.actions) {
      expect(action.steps.length).toBeGreaterThanOrEqual(1);
      expect(action.steps.length).toBeLessThanOrEqual(4);
      expect(action.steps.every((step) => step.trim().length > 10)).toBe(true);
    }
  });

  it('menghitung potensi kenaikan dari bobot efektif', () => {
    for (const component of card.components) {
      if (!component.available) continue;
      expect(component.potentialToTarget).toBeGreaterThanOrEqual(0);
      expect(component.potentialToMax).toBeGreaterThanOrEqual(component.potentialToTarget);
    }
    expect(card.potential.toMax).toBeGreaterThanOrEqual(card.potential.toTarget);
  });

  it('menurunkan skor Kualitas saat ada self-rework', () => {
    const cleanCard = computeScorecard({
      start,
      end,
      commits,
      files,
      mrs,
      events,
      reaches,
    });
    const reworkFiles = commits.map((item, index) =>
      file(index, {
        sha: item.sha,
        added_hashes: JSON.stringify([`r${index}`]),
        deleted_hashes: index === 0 ? '[]' : JSON.stringify([`r${index - 1}`]),
      }),
    );
    const reworkCard = computeScorecard({
      start,
      end,
      commits,
      files: reworkFiles,
      mrs,
      events,
      reaches,
    });
    expect(reworkCard.scores.quality!).toBeLessThan(cleanCard.scores.quality!);
  });
});

describe('Mesin skor: komponen tanpa data', () => {
  it('menandai komponen tanpa diff tidak tersedia dan menormalisasi bobot', () => {
    const commits = Array.from({ length: 5 }, (_, index) => commit(index));
    const card = computeScorecard({
      start,
      end,
      commits,
      files: [],
      mrs: [],
      events: [],
      reaches: [],
    });

    expect(card.scores.productivity).not.toBeNull();
    expect(card.scores.consistency).not.toBeNull();
    // Tanpa baris diff, Kualitas/Skill tidak boleh memakai angka palsu.
    expect(card.scores.quality).toBeNull();
    expect(card.scores.skill).toBeNull();
    expect(card.scores.collaboration).toBeNull();
    expect(card.scores.releaseFlow).toBeNull();
    expect(card.diffReady).toBe(false);
    expect(card.quality.breakdown).toEqual([]);
    expect(card.recurringIssues).toEqual([]);
    expect(card.hotspots).toEqual([]);

    const quality = card.components.find((component) => component.key === 'quality');
    expect(quality?.available).toBe(false);
    expect(quality?.effectiveWeight).toBe(0);

    const sum = Object.values(card.effectiveWeights).reduce((total, value) => total + value, 0);
    expect(sum).toBeCloseTo(100, 0);
  });
});

describe('Fase 1: agregasi rework dan hotspot', () => {
  const fixtures: { commits: ScoreCommit[]; files: ScoreFile[] } = {
    commits: [
      { ...commit(0), sha: 'a0', title: 'feat(a): tambah fitur', authored_at: at(0) },
      { ...commit(1), sha: 'a1', title: 'fix(a): rapikan fitur', is_fix: 1, authored_at: at(5) },
      { ...commit(2), sha: 'a2', title: 'fix(a): rapikan lagi', is_fix: 1, authored_at: at(30) },
      { ...commit(3), sha: 'b0', title: 'fix(b): perbaiki parser', is_fix: 1, authored_at: at(2) },
      { ...commit(4), sha: 'b1', title: 'fix(b): perbaiki parser lagi', is_fix: 1, authored_at: at(10) },
      { ...commit(5), sha: 'b2', title: 'fix(b): perbaiki parser ketiga', is_fix: 1, authored_at: at(12) },
      { ...commit(6), sha: 'b3', title: 'chore(b): hapus baris', authored_at: at(20) },
      { ...commit(7), sha: 'b4', title: 'chore(b): kembalikan baris', authored_at: at(25) },
      { ...commit(8), sha: 'r0', title: 'Revert "feat(b): tambah parser"', authored_at: at(40) },
    ],
    files: [
      file(0, { sha: 'a0', path: 'src/a.ts', added: 20, deleted: 0, added_hashes: '["h1","h2"]', deleted_hashes: '[]' }),
      file(1, { sha: 'a1', path: 'src/a.ts', added: 1, deleted: 1, added_hashes: '[]', deleted_hashes: '["h1"]' }),
      file(2, { sha: 'a2', path: 'src/a.ts', added: 1, deleted: 1, added_hashes: '[]', deleted_hashes: '["h2"]' }),
      file(3, { sha: 'b0', path: 'src/b.ts', added: 5, deleted: 0, added_hashes: '["f1"]', deleted_hashes: '[]' }),
      file(4, { sha: 'b1', path: 'src/b.ts', added: 2, deleted: 1, added_hashes: '["f2"]', deleted_hashes: '["f1"]' }),
      file(5, { sha: 'b2', path: 'src/b.ts', added: 1, deleted: 1, added_hashes: '["f3"]', deleted_hashes: '["f2"]' }),
      file(6, { sha: 'b3', path: 'src/b.ts', added: 0, deleted: 3, added_hashes: '[]', deleted_hashes: '["x1"]' }),
      file(7, { sha: 'b4', path: 'src/b.ts', added: 3, deleted: 0, added_hashes: '["x1"]', deleted_hashes: '[]' }),
      file(8, { sha: 'r0', path: 'src/b.ts', added: 0, deleted: 4, added_hashes: '[]', deleted_hashes: '["f3"]' }),
    ],
  };

  it('menghitung self-rework, fix-atas-fix, back-and-forth, dan revert', () => {
    const result = analyzeRework(fixtures.files, fixtures.commits);
    expect(result.selfReworkLines).toBe(3);
    expect(result.fixOnFixCommits).toBe(2);
    expect(result.fixOnFixLines).toBe(2);
    expect(result.backAndForthLines).toBe(1);
    expect(result.revertCount).toBe(1);
  });

  it('mengelompokkan file fix berulang dan hotspot', () => {
    const result = analyzeRework(fixtures.files, fixtures.commits);
    expect(result.repeatedFixFiles).toHaveLength(1);
    expect(result.repeatedFixFiles[0]).toMatchObject({ path: 'src/b.ts', fixCount: 3, kind: 'perbaikan kecil rutin' });
    // Hotspot diurutkan berdasarkan baris self-rework terbanyak (sesuai PDF)
    expect(result.hotspots[0]).toMatchObject({ path: 'src/b.ts', commits: 6, selfReworkLines: 2 });
    expect(result.hotspots[1]).toMatchObject({ path: 'src/a.ts', selfReworkLines: 1 });
    expect(result.selfReworkExamples.length).toBeGreaterThan(0);
    expect(result.fixOnFixExamples.length).toBeGreaterThan(0);
  });

  it('tidak menghitung revert yang hanya menyebut kata revert', () => {
    const commits = [
      { ...commit(0), sha: 'r1', title: 'fix: revert accidental changes' },
      { ...commit(1), sha: 'r2', title: 'Revert "feat: sesuatu"' },
    ];
    const result = analyzeRework([], commits);
    expect(result.revertCount).toBe(1);
  });
});

describe('Fase 1: penalti kualitas dan prioritas aksi', () => {
  const commits = Array.from({ length: 12 }, (_, index) => commit(index));
  const files = commits.map((item, index) =>
    file(index, {
      sha: item.sha,
      path: 'src/app/page.tsx',
      added_hashes: JSON.stringify([`p${index}`]),
      deleted_hashes: index === 0 ? '[]' : JSON.stringify([`p${index - 1}`]),
    }),
  );

  it('menjumlahkan penalti menjadi 100 dikurangi skor Kualitas', () => {
    const card = computeScorecard({ start, end, commits, files, mrs: [], events: [], reaches: [] });
    expect(card.quality.score).not.toBeNull();
    const totalPenalty = card.quality.breakdown.reduce((sum, item) => sum + item.penalty, 0);
    expect(totalPenalty).toBeCloseTo(card.quality.penalty, 0);
    expect(card.quality.score).toBe(Math.round(100 - card.quality.penalty));
    for (const item of card.quality.breakdown) {
      expect(item.penalty).toBeGreaterThanOrEqual(0);
      expect(item.penalty).toBeLessThanOrEqual(item.maxPenalty);
    }
  });

  it('memberi status isu berulang sesuai pita FINDING_THRESHOLDS', () => {
    const card = computeScorecard({ start, end, commits, files, mrs: [], events: [], reaches: [] });
    expect(card.recurringIssues.map((issue) => issue.key)).toEqual([
      'fixOnFix',
      'repeatedFix',
      'backAndForth',
      'revert',
    ]);
    for (const issue of card.recurringIssues) {
      expect(['Kritis', 'Perhatian', 'Baik']).toContain(issue.statusLabel);
      expect(issue.ratioLabel).toContain('/');
    }
  });

  it('menghitung poin aksi dari bobot talenta dan gap ke 100', () => {
    const card = computeScorecard({ start, end, commits, files, mrs: [], events: [], reaches: [] });
    expect(TALENT_WEIGHTS).toEqual(COMPONENT_WEIGHTS);
    expect(card.actions.length).toBeGreaterThan(0);
    expect(card.actions.length).toBeLessThanOrEqual(5);

    for (const action of card.actions) {
      const component = card.components.find((item) => item.key === action.component)!;
      const expected = Math.round((100 - (component.score as number)) * (component.effectiveWeight / 100) * 10) / 10;
      expect(action.points).toBe(expected);
      expect(['P1', 'P2', 'P3']).toContain(action.priority);
    }
    for (let i = 1; i < card.actions.length; i++) {
      expect(card.actions[i - 1].points).toBeGreaterThanOrEqual(card.actions[i].points);
    }
  });
});

describe('Fase 2: skor Skill dari pemindai statis', () => {
  const issues = (lines: number, counts: Partial<Record<string, number>> = {}) =>
    JSON.stringify({
      lines,
      counts: {
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
        ...counts,
      },
    });

  const commits = Array.from({ length: 6 }, (_, index) => commit(index));

  const files: ScoreFile[] = [
    file(0, {
      sha: 'c0',
      path: 'src/app/a.tsx',
      added: 2500,
      issues_json: issues(2500, { deepNesting: 600, duplicate: 80, secret: 2 }),
    }),
    file(1, {
      sha: 'c1',
      path: 'src/app/a.test.tsx',
      added: 700,
      issues_json: issues(700),
    }),
    file(2, { sha: 'c2', path: 'src/lib/b.ts', added: 500, issues_json: issues(500, { anyType: 4 }) }),
    file(3, { sha: 'c3', path: 'src/db/q.sql', added: 200, issues_json: issues(200) }),
  ];

  it('menghitung skor Skill dari temuan dan mengelompokkan bahasa', () => {
    const card = computeScorecard({ start, end, commits, files, mrs: [], events: [], reaches: [] });
    expect(card.skill.score).not.toBeNull();
    expect(card.scores.skill).toBe(card.skill.score);
    expect(card.skill.issues).toHaveLength(10);
    expect(card.skill.scannedFiles).toBe(4);
    expect(card.skill.scannedLines).toBe(3900);
    expect(card.skill.coverage).toBe(100);

    const secret = card.skill.issues.find((issue) => issue.key === 'secret');
    expect(secret?.statusLabel).toBe('Kritis');
    const nesting = card.skill.issues.find((issue) => issue.key === 'deepNesting');
    expect(nesting?.penalty).toBe(30);

    expect(card.skill.languages[0]).toMatchObject({
      language: 'TypeScript (React)',
      lines: 3200,
      intensity: 'Intensif',
    });
    expect(card.skill.languages.find((language) => language.language === 'TypeScript')?.intensity).toBe(
      'Dasar',
    );
    expect(card.skill.languages.find((language) => language.language === 'SQL')?.score).toBe(100);
  });

  it('memberi bonus porsi kode tes di atas 30%', () => {
    const testFiles: ScoreFile[] = [
      file(0, { sha: 'c0', path: 'src/app/main.tsx', added: 600, issues_json: issues(600) }),
      file(1, { sha: 'c1', path: 'src/app/main.test.tsx', added: 400, issues_json: issues(400) }),
    ];
    const card = computeScorecard({
      start,
      end,
      commits,
      files: testFiles,
      mrs: [],
      events: [],
      reaches: [],
    });
    expect(card.evidence.testPct).toBeGreaterThanOrEqual(30);
    expect(card.skill.testBonus).toBe(3);
    expect(card.skill.score).toBe(100);
  });

  it('menandai Skill tidak tersedia bila belum ada file terpindai', () => {
    const unscanned = files.map((item) => ({ ...item, issues_json: null }));
    const card = computeScorecard({
      start,
      end,
      commits,
      files: unscanned,
      mrs: [],
      events: [],
      reaches: [],
    });
    expect(card.skill.score).toBeNull();
    expect(card.scores.skill).toBeNull();
    expect(card.skill.issues).toEqual([]);
    expect(card.skill.languages).toEqual([]);
    expect(card.skill.coverage).toBe(0);
  });
});

describe('Fase 3: Review Kode AI', () => {
  const commits = Array.from({ length: 4 }, (_, index) => commit(index));
  const files: ScoreFile[] = [
    file(0, { sha: 'c0', path: 'src/app/a.tsx', added: 300, issues_json: '{"lines":300,"counts":{}}' }),
  ];

  const reviews = [
    {
      sha: 'caaaaaaa1111',
      title: 'feat: tambah form',
      authored_at: at(1),
      score: 80,
      summary: 'Rapi.',
      notes: ['Yang sudah baik: struktur jelas.'],
    },
    {
      sha: 'cbbbbbbb2222',
      title: 'fix: perbaiki validasi',
      authored_at: at(2),
      score: 40,
      summary: 'Perlu rework.',
      notes: ['Yang perlu diperbaiki: tes belum menutup kasus kosong.'],
    },
    {
      sha: 'cccccccc3333',
      title: 'chore: rapikan util',
      authored_at: at(3),
      score: 60,
      summary: 'Cukup.',
      notes: ['Yang perlu diperbaiki: duplikasi kecil.'],
    },
  ];

  it('menghitung rata-rata skor commit yang sudah direview', () => {
    const card = computeScorecard({
      start,
      end,
      commits,
      files,
      mrs: [],
      events: [],
      reaches: [],
      reviews,
    });
    expect(card.review.score).toBe(60);
    expect(card.review.count).toBe(3);
    expect(card.review.highlights).toHaveLength(3);
    expect(card.review.highlights[0].shortSha).toBe('cbbbbbbb');
  });

  it('netral tanpa review dan tidak mengubah skor enam komponen', () => {
    const base = computeScorecard({ start, end, commits, files, mrs: [], events: [], reaches: [] });
    const withReviews = computeScorecard({
      start,
      end,
      commits,
      files,
      mrs: [],
      events: [],
      reaches: [],
      reviews,
    });
    expect(base.review.score).toBeNull();
    expect(base.review.count).toBe(0);
    expect(base.review.highlights).toEqual([]);
    expect(withReviews.overall).toBe(base.overall);
    expect(withReviews.scores).toEqual(base.scores);
  });
});
