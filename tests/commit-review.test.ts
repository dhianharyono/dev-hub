import { describe, it, expect } from 'vitest';
import {
  REVIEW_MAX_LINES,
  averageReviewScore,
  buildReviewPrompt,
  parseReviewResponse,
  reviewHighlights,
  selectReviewCandidates,
  type ReviewCandidateInput,
} from '../src/lib/commit-review';

function candidate(index: number, overrides: Partial<ReviewCandidateInput> = {}): ReviewCandidateInput {
  return {
    sha: `sha${index}`,
    project_id: 1,
    title: `feat: commit ${index}`,
    authored_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    added: 200,
    ...overrides,
  };
}

describe('Review kode: pemilihan kandidat', () => {
  it('hanya mengambil commit di atas ambang yang belum pernah direview', () => {
    const rows = [
      candidate(1, { added: 99 }),
      candidate(2, { added: 100 }),
      candidate(3, { added: 500 }),
      candidate(4, { added: 400 }),
    ];
    const picked = selectReviewCandidates(rows, ['sha3'], { limit: 10 });
    expect(picked.map((row) => row.sha)).toEqual(['sha4', 'sha2']);
  });

  it('mengurutkan commit terbaru lebih dulu dan mematuhi limit', () => {
    const rows = [candidate(1), candidate(2), candidate(3), candidate(4)];
    const picked = selectReviewCandidates(rows, [], { limit: 2 });
    expect(picked.map((row) => row.sha)).toEqual(['sha4', 'sha3']);
    expect(selectReviewCandidates(rows, [], { limit: 0 })).toEqual([]);
  });

  it('memakai ambang kustom bila diberikan', () => {
    const rows = [candidate(1, { added: 60 }), candidate(2, { added: 120 })];
    const picked = selectReviewCandidates(rows, [], { minAdded: 50, limit: 5 });
    expect(picked.map((row) => row.sha)).toEqual(['sha2', 'sha1']);
  });
});

describe('Review kode: parsing respons LLM', () => {
  const valid = {
    score: 72,
    summary: 'Kode cukup rapi dengan beberapa catatan.',
    notes: ['Yang sudah baik: penamaan jelas.', 'Yang perlu diperbaiki: tambah tes.', 'Yang perlu diperbaiki: pisahkan fungsi.'],
  };

  it('membaca JSON murni dan JSON berpagar kode', () => {
    expect(parseReviewResponse(JSON.stringify(valid))).toEqual(valid);
    expect(parseReviewResponse('```json\n' + JSON.stringify(valid) + '\n```')).toEqual(valid);
  });

  it('menolak respons rusak, bukan JSON, atau tanpa skor', () => {
    expect(parseReviewResponse('maaf saya tidak bisa')).toBeNull();
    expect(parseReviewResponse('{"score":')).toBeNull();
    expect(parseReviewResponse('{"summary":"tanpa skor","notes":["a","b","c"]}')).toBeNull();
    expect(parseReviewResponse(JSON.stringify({ ...valid, score: 'tinggi' }))).toBeNull();
  });

  it('menolak catatan kurang dari tiga dan membatasi jumlahnya', () => {
    expect(parseReviewResponse(JSON.stringify({ ...valid, notes: ['satu', 'dua'] }))).toBeNull();
    const many = Array.from({ length: 9 }, (_, index) => `Catatan nomor ${index}`);
    const parsed = parseReviewResponse(JSON.stringify({ ...valid, notes: many }));
    expect(parsed?.notes).toHaveLength(6);
  });

  it('menjepit skor ke 0–100 dan membulatkan', () => {
    expect(parseReviewResponse(JSON.stringify({ ...valid, score: 140 }))?.score).toBe(100);
    expect(parseReviewResponse(JSON.stringify({ ...valid, score: -5 }))?.score).toBe(0);
    expect(parseReviewResponse(JSON.stringify({ ...valid, score: 72.6 }))?.score).toBe(73);
  });

  it('memakai catatan pertama sebagai ringkasan bila summary kosong', () => {
    const parsed = parseReviewResponse(JSON.stringify({ ...valid, summary: '' }));
    expect(parsed?.summary).toBe(valid.notes[0]);
  });
});

describe('Review kode: prompt dan agregasi', () => {
  it('merakit prompt dari baris tambahan dan memotong bila terlalu panjang', () => {
    const lines = Array.from({ length: REVIEW_MAX_LINES + 50 }, (_, index) => `const x${index} = ${index};`);
    const { prompt, lineCount, truncated } = buildReviewPrompt(
      { title: 'feat: besar', authored_at: '2026-02-01T10:00:00Z' },
      [
        { path: 'src/b.ts', lines: lines.slice(300, 600) },
        { path: 'src/a.ts', lines: lines.slice(0, 300) },
      ],
      500,
    );
    expect(lineCount).toBe(500);
    expect(truncated).toBe(true);
    expect(prompt).toContain('src/a.ts');
    expect(prompt).toContain('+ const x0 = 0;');
    expect(prompt).not.toContain('const x900 =');
  });

  it('menghitung rata-rata bulat dan null saat kosong', () => {
    expect(averageReviewScore([])).toBeNull();
    expect(averageReviewScore([{ score: 40 }, { score: 60 }, { score: 71 }])).toBe(57);
  });

  it('mengambil tiga commit dengan skor terendah, terbaru menang saat seri', () => {
    const reviews = [
      { sha: 'aaaaaaaa1', title: 'A', score: 80, summary: '', notes: [], authored_at: '2026-01-01T00:00:00Z' },
      { sha: 'bbbbbbbb2', title: 'B', score: 40, summary: '', notes: [], authored_at: '2026-01-02T00:00:00Z' },
      { sha: 'cccccccc3', title: 'C', score: 40, summary: '', notes: [], authored_at: '2026-01-03T00:00:00Z' },
      { sha: 'dddddddd4', title: 'D', score: 65, summary: '', notes: [], authored_at: '2026-01-04T00:00:00Z' },
    ];
    const top = reviewHighlights(reviews);
    expect(top.map((item) => item.shortSha)).toEqual(['cccccccc', 'bbbbbbbb', 'dddddddd']);
  });
});
