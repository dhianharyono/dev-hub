/**
 * Skor relatif tim (Fase 4): aturan murni untuk alias talent, peringkat
 * persentil, dan fallback. Tanpa DB/jaringan supaya bisa diuji langsung.
 */
export type RelativeComponent = "productivity" | "collaboration" | "releaseFlow";

export interface TalentAliasMap {
  [canonical: string]: string[];
}

export interface TalentIndex {
  roster: string[];
  aliases: TalentAliasMap;
  variants: Map<string, string>;
}

export interface TalentRelativeMetric {
  name: string;
  limited: boolean;
  productivity: number | null;
  collaboration: number | null;
  releaseFlow: number | null;
}

export interface RelativeComputation {
  applied: boolean;
  reason: string | null;
  talents: number;
  peers: number;
  meLimited: boolean;
  overrides: Partial<Record<RelativeComponent, number>>;
  rankOverall: string | null;
}

/** Huruf besar/kecil, spasi ganda, dan spasi tepi tidak membedakan identitas. */
export function normalizeIdentity(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** JSON {"Nama Kanonik": ["email", "username"]} → peta yang sudah dinormalkan. */
export function parseTalentAliases(raw: string): TalentAliasMap {
  if (!raw.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  const out: TalentAliasMap = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    const canonical = key.trim();
    if (!canonical) continue;
    const list = Array.isArray(value) ? value : [value];
    out[canonical] = [
      ...new Set(
        list
          .filter((item): item is string => typeof item === "string")
          .map(normalizeIdentity)
          .filter(Boolean),
      ),
    ];
  }
  return out;
}

/**
 * Indeks pencarian identitas: nama roster dan semua aliasnya menunjuk ke nama
 * kanonik. Roster kosong tetapi alias terisi tetap bisa dipakai.
 */
export function buildTalentIndex(rosterRaw: string, aliasesRaw: string): TalentIndex {
  const aliases = parseTalentAliases(aliasesRaw);
  const roster = rosterRaw
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  const canonicalNames = roster.length ? roster : Object.keys(aliases);
  const variants = new Map<string, string>();

  for (const canonical of canonicalNames) {
    variants.set(normalizeIdentity(canonical), canonical);
    for (const variant of aliases[canonical] ?? []) variants.set(variant, canonical);
  }

  // Alias untuk nama kanonik yang tidak ada di roster tetap dihormati.
  for (const [canonical, list] of Object.entries(aliases)) {
    if (canonicalNames.includes(canonical)) continue;
    variants.set(normalizeIdentity(canonical), canonical);
    for (const variant of list) variants.set(variant, canonical);
  }

  return { roster: canonicalNames, aliases, variants };
}

export function resolveTalent(
  index: TalentIndex,
  name: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const byName = name ? index.variants.get(normalizeIdentity(name)) : undefined;
  if (byName) return byName;
  const byEmail = email ? index.variants.get(normalizeIdentity(email)) : undefined;
  return byEmail ?? null;
}

/** Talent dengan data tipis tidak ikut distribusi persentil. */
export function isLimitedTalent(input: {
  commits: number;
  lines: number;
  months: number;
}): boolean {
  return input.commits < 5 || input.lines < 50 || input.months < 1;
}

/**
 * Peringkat persentil 0–100 dengan penanganan nilai seri (midrank).
 * Nilai terendah = 0, tertinggi = 100 bila tidak ada seri.
 */
export function percentileRank(value: number, values: number[]): number | null {
  if (values.length < 2) return null;
  let below = 0;
  let equal = 0;
  for (const item of values) {
    if (item < value) below += 1;
    else if (item === value) equal += 1;
  }
  if (equal === 0) return null;
  return Math.round(((below + (equal - 1) / 2) / (values.length - 1)) * 100);
}

/** Data mentah satu talent dalam periode; dipakai untuk skor absolut tim. */
export interface TalentDatum {
  name: string;
  commits: number;
  lines: number;
  mrsCreated: number;
  mrsMerged: number;
  activeDays: number;
  reviews: number;
  reviewKnown: boolean;
  releaseScore: number | null;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Rumus Produktivitas yang sama dengan scorecard, tetapi dari data agregat tim
 * (tanpa query file). Null bila talent tidak punya commit pada periode.
 */
export function talentProductivity(
  datum: TalentDatum,
  months: number,
  workdays: number,
): number | null {
  if (datum.commits === 0) return null;
  const m = Math.max(1, months);
  const days = Math.max(1, workdays);
  return (
    30 * clamp01(datum.commits / m / 180) +
    25 * clamp01(Math.log10(1 + datum.lines / m) / Math.log10(1 + 120_000)) +
    25 * clamp01(datum.mrsMerged / m / 50) +
    20 * clamp01(datum.activeDays / days / 0.85)
  );
}

/**
 * Kolaborasi dari MR dibuat + aksi review. Data review hanya tersedia untuk
 * pengguna yang token-nya dipakai sinkron, jadi talent lain memakai bagian MR
 * saja yang dinormalkan (tidak dihukum karena data review tidak tersedia).
 */
export function talentCollaboration(datum: TalentDatum, months: number): number | null {
  const m = Math.max(1, months);
  const mrPart = clamp01(datum.mrsCreated / m / 60);
  if (!datum.reviewKnown) return datum.mrsCreated === 0 ? null : 100 * mrPart;
  return 60 * clamp01(datum.reviews / m / 40) + 40 * mrPart;
}

const COMPONENT_WEIGHT: Record<RelativeComponent, number> = {
  productivity: 20,
  collaboration: 15,
  releaseFlow: 15,
};

function valuesOf(talent: TalentRelativeMetric): Record<RelativeComponent, number> | null {
  if (talent.limited) return null;
  if (
    talent.productivity === null ||
    talent.collaboration === null ||
    talent.releaseFlow === null
  ) {
    return null;
  }
  return {
    productivity: talent.productivity,
    collaboration: talent.collaboration,
    releaseFlow: talent.releaseFlow,
  };
}

function percentileMap(
  talent: TalentRelativeMetric,
  pool: TalentRelativeMetric[],
): Record<RelativeComponent, number> | null {
  const own = valuesOf(talent);
  if (!own) return null;
  const result = {} as Record<RelativeComponent, number>;
  for (const key of Object.keys(COMPONENT_WEIGHT) as RelativeComponent[]) {
    const values = pool
      .map((peer) => valuesOf(peer)?.[key])
      .filter((value): value is number => value !== null && value !== undefined);
    const percentile = percentileRank(own[key], values);
    if (percentile === null) return null;
    result[key] = percentile;
  }
  return result;
}

/**
 * Persentil tiga komponen untuk talent utama, plus peringkat gabungan roster.
 * Roster kosong / talent <3 / periode <1 bulan → fallback absolut.
 */
export function computeRelativeScores(
  meName: string,
  talents: TalentRelativeMetric[],
  rosterSize: number,
  months: number,
): RelativeComputation {
  const base: RelativeComputation = {
    applied: false,
    reason: null,
    talents: talents.length,
    peers: 0,
    meLimited: false,
    overrides: {},
    rankOverall: null,
  };

  if (rosterSize === 0) {
    return { ...base, reason: "Roster tim belum diisi di Pengaturan." };
  }
  if (talents.length < 3) {
    return {
      ...base,
      reason: `Talent tersinkron baru ${talents.length}; minimal 3 untuk skor relatif.`,
    };
  }
  if (months < 1) {
    return { ...base, reason: "Periode kurang dari 1 bulan; skor relatif belum stabil." };
  }

  const me = talents.find((talent) => talent.name === meName);
  if (!me) {
    return { ...base, reason: "Identitas Anda tidak cocok dengan roster atau alias." };
  }

  const pool = talents.filter((talent) => valuesOf(talent) !== null);
  if (pool.length < 3) {
    return {
      ...base,
      peers: pool.length,
      meLimited: valuesOf(me) === null,
      reason: "Talent dengan data cukup belum mencapai 3 orang.",
    };
  }

  const meLimited = valuesOf(me) === null;
  if (meLimited) {
    return {
      ...base,
      applied: true,
      peers: pool.length,
      meLimited: true,
      reason: "Data Anda di periode ini terbatas; tiga komponen relatif memakai skor absolut.",
    };
  }

  const mine = percentileMap(me, pool);
  if (!mine) {
    return {
      ...base,
      peers: pool.length,
      meLimited: true,
      reason: "Persentil talent utama belum bisa dihitung.",
    };
  }

  const overallOf = (talent: TalentRelativeMetric): number | null => {
    const percentiles = percentileMap(talent, pool);
    if (!percentiles) return null;
    return (
      (percentiles.productivity * COMPONENT_WEIGHT.productivity +
        percentiles.collaboration * COMPONENT_WEIGHT.collaboration +
        percentiles.releaseFlow * COMPONENT_WEIGHT.releaseFlow) /
      50
    );
  };

  const mineOverall = overallOf(me);
  const rank =
    mineOverall === null
      ? null
      : 1 +
        pool.filter((talent) => {
          const value = overallOf(talent);
          return value !== null && value > mineOverall;
        }).length;

  return {
    applied: true,
    reason: null,
    talents: talents.length,
    peers: pool.length,
    meLimited: false,
    overrides: mine,
    rankOverall: rank === null ? null : `#${rank} dari ${talents.length}`,
  };
}
