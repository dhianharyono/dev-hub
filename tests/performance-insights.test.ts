import { describe, expect, it } from 'vitest';
import { buildPerformanceInsights } from '../src/lib/performance-insights';
import type { Scorecard } from '../src/lib/scoring';

/** Scorecard minimal dengan hanya field yang dipakai buildPerformanceInsights. */
function cardFixture(overrides: Partial<Scorecard> = {}): Scorecard {
  return {
    actions: [],
    skill: { issues: [], languages: [], examples: {}, scannedFiles: 0, scannedLines: 0, coverage: 1 },
    recurringIssues: [],
    hotspots: [],
    ...overrides,
  } as unknown as Scorecard;
}

describe('buildPerformanceInsights', () => {
  it('mengambil aksi P1 teratas dengan potensi poin', () => {
    const card = cardFixture({
      actions: [
        { priority: 'P2', title: 'Produktivitas: pertahankan', detail: '', steps: [], points: 4.8 },
        { priority: 'P1', title: 'Kualitas: bereskan file fix-berulang', detail: '', steps: [], points: 9.3 },
      ],
    } as unknown as Partial<Scorecard>);
    const insights = buildPerformanceInsights(card);
    expect(insights[0].tone).toBe('warn');
    expect(insights[0].text).toContain('+9,3 poin');
    expect(insights[0].text).toContain('Kualitas: bereskan file fix-berulang');
  });

  it('memilih isu statis kritis dengan temuan terbanyak dan contoh filenya', () => {
    const card = cardFixture({
      skill: {
        issues: [
          { key: 'duplicate', label: 'Baris duplikat', count: 28977, per100: 7.6, status: 'critical', statusLabel: 'Kritis', penalty: 10 },
          { key: 'secret', label: 'Secret tertulis', count: 65, per100: 0.02, status: 'critical', statusLabel: 'Kritis', penalty: 10 },
        ],
        languages: [],
        examples: { duplicate: { path: 'src/app/dashboard/ai-context/components/AiContextCanvas.tsx', count: 479 } },
        scannedFiles: 1,
        scannedLines: 100,
        coverage: 1,
      },
    } as unknown as Partial<Scorecard>);
    const insights = buildPerformanceInsights(card);
    const issueRow = insights.find((i) => i.text.includes('Isu statis terbanyak'));
    expect(issueRow?.tone).toBe('warn');
    expect(issueRow?.text).toContain('28.977 temuan');
    expect(issueRow?.text).toContain('app/dashboard/ai-context/components/AiContextCanvas.tsx');
  });

  it('memilih bahasa terlemah di antara yang Intensif/Aktif, abaikan Dasar', () => {
    const card = cardFixture({
      skill: {
        issues: [],
        languages: [
          { language: 'PHP', lines: 2217, commits: 27, intensity: 'Dasar', score: 30, findings: 1 },
          { language: 'TypeScript (React)', lines: 201899, commits: 792, intensity: 'Intensif', score: 51, findings: 90 },
          { language: 'SQL', lines: 1395, commits: 54, intensity: 'Aktif', score: 90, findings: 0 },
        ],
        examples: {},
        scannedFiles: 1,
        scannedLines: 100,
        coverage: 1,
      },
    } as unknown as Partial<Scorecard>);
    const insights = buildPerformanceInsights(card);
    const langRow = insights.find((i) => i.text.includes('Bahasa terlemah'));
    expect(langRow?.text).toContain('TypeScript (React)');
    expect(langRow?.text).not.toContain('PHP');
  });

  it('memilih isu berulang kritis lebih dulu dari perhatian', () => {
    const card = cardFixture({
      recurringIssues: [
        { key: 'fixOnFix', label: 'Fix atas fix', count: 61, unit: 'commit', ratio: 4.8, ratioLabel: '4.8 / 100 commit', status: 'warn', statusLabel: 'Perhatian' },
        { key: 'repeatedFix', label: 'File fix berulang', count: 148, unit: 'file', ratio: 11.6, ratioLabel: '11.6 / 100 commit', status: 'critical', statusLabel: 'Kritis' },
      ],
    } as Partial<Scorecard>);
    const insights = buildPerformanceInsights(card);
    const recurringRow = insights.find((i) => i.text.includes('Isu berulang'));
    expect(recurringRow?.tone).toBe('warn');
    expect(recurringRow?.text).toContain('file fix berulang');
    expect(recurringRow?.text).toContain('11.6 / 100 commit');
  });

  it('memilih hotspot dengan commit terbanyak dan menandai self-rework tinggi', () => {
    const card = cardFixture({
      hotspots: [
        { path: 'src/lib/ai/chat.ts', commits: 39, lines: 3163, selfReworkLines: 708, selfReworkPct: 22.4, fixCommits: 10 },
        { path: 'src/app/dashboard/chat/page.tsx', commits: 45, lines: 4051, selfReworkLines: 1071, selfReworkPct: 26.4, fixCommits: 12 },
      ],
    } as Partial<Scorecard>);
    const insights = buildPerformanceInsights(card);
    const hotspotRow = insights.find((i) => i.text.includes('Hotspot utama'));
    expect(hotspotRow?.tone).toBe('warn');
    expect(hotspotRow?.text).toContain('app/dashboard/chat/page.tsx');
    expect(hotspotRow?.text).toContain('1.071 baris self-rework');
  });

  it('tidak menghasilkan insight saat data kosong', () => {
    expect(buildPerformanceInsights(cardFixture())).toEqual([]);
  });
});
