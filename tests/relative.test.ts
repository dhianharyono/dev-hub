import { describe, it, expect } from 'vitest';
import {
  buildTalentIndex,
  computeRelativeScores,
  isLimitedTalent,
  normalizeIdentity,
  parseTalentAliases,
  percentileRank,
  resolveTalent,
  talentCollaboration,
  talentProductivity,
  type TalentDatum,
  type TalentRelativeMetric,
} from '../src/lib/relative';

const datum = (patch: Partial<TalentDatum> = {}): TalentDatum => ({
  name: 'A',
  commits: 20,
  lines: 5000,
  mrsCreated: 4,
  mrsMerged: 3,
  activeDays: 12,
  reviews: 8,
  reviewKnown: true,
  releaseScore: 40,
  ...patch,
});

const metric = (
  name: string,
  productivity: number | null,
  collaboration: number | null,
  releaseFlow: number | null,
  limited = false,
): TalentRelativeMetric => ({ name, productivity, collaboration, releaseFlow, limited });

describe('Alias talent', () => {
  it('menormalkan huruf besar/kecil dan spasi', () => {
    expect(normalizeIdentity('  Naufal   HERWANDI ')).toBe('naufal herwandi');
  });

  it('mengabaikan JSON rusak tanpa melempar error', () => {
    expect(parseTalentAliases('{bukan json')).toEqual({});
    expect(parseTalentAliases('')).toEqual({});
  });

  it('menggabungkan nama kanonik, email, dan username', () => {
    const index = buildTalentIndex(
      'Naufal Herwandi, Dika Brenda',
      JSON.stringify({
        'Naufal Herwandi': ['naufalherwandi', 'Naufal@Telkom.co.id'],
      }),
    );
    expect(resolveTalent(index, 'naufalherwandi', null)).toBe('Naufal Herwandi');
    expect(resolveTalent(index, null, 'naufal@telkom.co.id')).toBe('Naufal Herwandi');
    expect(resolveTalent(index, 'Dika Brenda', null)).toBe('Dika Brenda');
    expect(resolveTalent(index, 'Orang Lain', 'lain@x.id')).toBeNull();
  });

  it('memakai alias sebagai roster bila daftar roster kosong', () => {
    const index = buildTalentIndex('', JSON.stringify({ 'Yogi Prasetya': ['yogiprasetya'] }));
    expect(index.roster).toEqual(['Yogi Prasetya']);
    expect(resolveTalent(index, 'yogiprasetya', null)).toBe('Yogi Prasetya');
  });
});

describe('Peringkat persentil', () => {
  it('memberi 0 untuk terendah dan 100 untuk tertinggi', () => {
    expect(percentileRank(10, [10, 20, 30, 40])).toBe(0);
    expect(percentileRank(40, [10, 20, 30, 40])).toBe(100);
  });

  it('memakai midrank untuk nilai seri', () => {
    expect(percentileRank(30, [10, 20, 30, 40])).toBe(67);
    expect(percentileRank(20, [10, 20, 20, 30])).toBe(50);
  });

  it('null bila pembanding kurang dari dua', () => {
    expect(percentileRank(20, [20])).toBeNull();
  });
});

describe('Skor absolut talent', () => {
  it('produktivitas memakai rumus scorecard dan null tanpa commit', () => {
    const value = talentProductivity(datum(), 3, 60);
    expect(value).not.toBeNull();
    expect(value!).toBeGreaterThan(0);
    expect(value!).toBeLessThanOrEqual(100);
    expect(talentProductivity(datum({ commits: 0 }), 3, 60)).toBeNull();
  });

  it('kolaborasi dinormalkan saat data review tidak tersedia', () => {
    const known = talentCollaboration(datum({ reviews: 0, mrsCreated: 0 }), 3);
    expect(known).toBe(0);
    const unknown = talentCollaboration(
      datum({ reviews: 0, reviewKnown: false, mrsCreated: 0 }),
      3,
    );
    expect(unknown).toBeNull();
    expect(
      talentCollaboration(datum({ reviewKnown: false, mrsCreated: 30 }), 3),
    ).toBeGreaterThan(0);
  });

  it('menandai talent dengan data tipis sebagai limited', () => {
    expect(isLimitedTalent({ commits: 4, lines: 500, months: 3 })).toBe(true);
    expect(isLimitedTalent({ commits: 10, lines: 40, months: 3 })).toBe(true);
    expect(isLimitedTalent({ commits: 10, lines: 500, months: 0.5 })).toBe(true);
    expect(isLimitedTalent({ commits: 10, lines: 500, months: 3 })).toBe(false);
  });
});

describe('Skor relatif tim', () => {
  it('fallback absolut bila roster kosong', () => {
    const result = computeRelativeScores('A', [metric('A', 50, 50, 50)], 0, 6);
    expect(result.applied).toBe(false);
    expect(result.reason).toMatch(/Roster/);
    expect(result.overrides).toEqual({});
  });

  it('fallback bila talent tersinkron kurang dari tiga', () => {
    const result = computeRelativeScores(
      'A',
      [metric('A', 50, 50, 50), metric('B', 40, 40, 40)],
      10,
      6,
    );
    expect(result.applied).toBe(false);
    expect(result.reason).toMatch(/minimal 3/);
  });

  it('memberi fallback absolut untuk talent berdata terbatas', () => {
    const result = computeRelativeScores(
      'A',
      [
        metric('A', 50, 50, 50, true),
        metric('B', 40, 40, 40),
        metric('C', 70, 70, 70),
        metric('D', 30, 30, 30),
      ],
      4,
      6,
    );
    expect(result.applied).toBe(true);
    expect(result.meLimited).toBe(true);
    expect(result.overrides).toEqual({});
  });

  it('menghitung persentil dan peringkat gabungan', () => {
    const result = computeRelativeScores(
      'A',
      [
        metric('A', 20, 20, 20),
        metric('B', 10, 10, 10),
        metric('C', 30, 30, 30),
        metric('D', 40, 40, 40),
      ],
      4,
      6,
    );
    expect(result.applied).toBe(true);
    expect(result.meLimited).toBe(false);
    expect(result.peers).toBe(4);
    expect(result.overrides.productivity).toBe(33);
    expect(result.overrides.collaboration).toBe(33);
    expect(result.overrides.releaseFlow).toBe(33);
    expect(result.rankOverall).toMatch(/^#\d+ dari 4$/);
  });

  it('talent terbaik mendapat persentil 100', () => {
    const result = computeRelativeScores(
      'C',
      [
        metric('A', 10, 10, 10),
        metric('B', 20, 20, 20),
        metric('C', 30, 30, 30),
      ],
      3,
      6,
    );
    expect(result.overrides.productivity).toBe(100);
    expect(result.rankOverall).toBe('#1 dari 3');
  });

  it('fallback bila identitas tidak cocok dengan roster', () => {
    const result = computeRelativeScores(
      'Z',
      [metric('A', 10, 10, 10), metric('B', 20, 20, 20), metric('C', 30, 30, 30)],
      3,
      6,
    );
    expect(result.applied).toBe(false);
    expect(result.reason).toMatch(/Identitas/);
  });
});
