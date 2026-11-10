import 'server-only';
import { glAll } from '../gitlab';
import { getSettings } from '../settings';
import { extractJsonFromAiResponse, runAiCompletion } from '../ai/client';
import { resolveReleaseNoteModel } from './ai-model';
import { formatWibDateTime } from './analyze';
import { getProjectInfo, type ReleaseNoteProject } from './generate';
import type { ReleaseNoteCandidateGroup, ReleaseNoteMr } from './types';

interface RawMr {
  iid: number;
  title: string;
  description?: string | null;
  merged_at: string | null;
  web_url: string;
  project_id: number;
  source_branch?: string | null;
  target_branch?: string | null;
  author?: { name?: string; username?: string } | null;
}

/** Minimal MR shape used by the pure candidate selection helpers. */
export interface CandidateMrLike {
  iid: number;
  title: string;
  description?: string | null;
  merged_at: string | null;
  source_branch?: string | null;
  target_branch?: string | null;
}

export interface SearchCandidatesInput {
  projectId: number;
  title: string;
  since: string;
  until: string;
  targetBranch?: string;
}

export interface SearchCandidatesOutput {
  project: ReleaseNoteProject;
  keywords: string[];
  candidates: ReleaseNoteMr[];
  groups: ReleaseNoteCandidateGroup[];
  usedAi: boolean;
  targetBranch?: string;
}

const STOPWORDS = new Set([
  'enhancement',
  'enhancements',
  'penambahan',
  'tambahan',
  'menambah',
  'update',
  'updates',
  'pembaruan',
  'perubahan',
  'perbaikan',
  'improve',
  'improvement',
  'adjustment',
  'implementasi',
  'feature',
  'features',
  'fitur',
  'feat',
  'fix',
  'bugfix',
  'hotfix',
  'baru',
  'new',
  'dan',
  'atau',
  'the',
  'and',
  'for',
  'with',
  'from',
  'into',
  'pada',
  'untuk',
  'dari',
  'yang',
  'serta',
  'by',
  'di',
  'ke',
  'of',
  'to',
  'in',
  'on',
  'is',
  'are',
]);

const DEFAULT_BRANCH_RE =
  /^(release|main|master|develop|development|staging|production|merge-release|merge-master|merge-prefix|.*into[-_]release)$/i;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface ReleaseTitleKeywords {
  /** Words outside the parentheses, e.g. "kurasi produk". */
  subjectKeywords: string[];
  /** Words inside the parentheses, e.g. "integrasi bigquery". */
  qualifierKeywords: string[];
  /** Subject then qualifier, unique. */
  keywords: string[];
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return [
    ...new Set(
      tokens.filter((token) => token.length >= 3 && !STOPWORDS.has(token)),
    ),
  ];
}

export function parseReleaseTitle(title: string): ReleaseTitleKeywords {
  const qualifierText = [...title.matchAll(/\(([^)]*)\)/g)]
    .map((match) => match[1])
    .join(' ');
  const subjectText = title.replace(/\([^)]*\)/g, ' ');
  const subjectKeywords = tokenize(subjectText);
  const qualifierKeywords = tokenize(qualifierText).filter(
    (keyword) => !subjectKeywords.includes(keyword),
  );
  return {
    subjectKeywords,
    qualifierKeywords,
    keywords: [...subjectKeywords, ...qualifierKeywords],
  };
}

export function extractKeywords(title: string): string[] {
  return parseReleaseTitle(title).keywords.slice(0, 6);
}

export function extractStoryRefs(text: string): string[] {
  return [
    ...new Set(text.match(/\b[A-Z][A-Z0-9]{1,9}-\d+\b/g) ?? []),
  ].slice(0, 20);
}

function isoOrDate(date: string, endOfDay = false): string {
  const suffix = endOfDay ? 'T23:59:59+07:00' : 'T00:00:00+07:00';
  return new Date(`${date}${suffix}`).toISOString();
}

function isReleaseBranch(branch: string): boolean {
  return Boolean(branch) && DEFAULT_BRANCH_RE.test(branch);
}

function toReleaseNoteMr(mr: RawMr): ReleaseNoteMr {
  return {
    iid: mr.iid,
    title: mr.title,
    description: mr.description ?? '',
    mergedAt: mr.merged_at as string,
    mergedAtLabel: formatWibDateTime(mr.merged_at as string),
    author: mr.author?.name || mr.author?.username || '-',
    webUrl: mr.web_url,
    projectId: mr.project_id,
    sourceBranch: mr.source_branch ?? '',
  };
}

async function allMerged(
  projectId: number,
  sinceIso: string,
  targetBranch?: string,
): Promise<RawMr[]> {
  const params = new URLSearchParams({
    state: 'merged',
    scope: 'all',
    order_by: 'updated_at',
    sort: 'desc',
    updated_after: sinceIso,
  });
  if (targetBranch) params.set('target_branch', targetBranch);
  return glAll<RawMr>(`/projects/${projectId}/merge_requests?${params}`);
}

export interface ScoredMr<T extends CandidateMrLike> {
  mr: T;
  hits: number;
  phraseMatch: boolean;
  isSeed: boolean;
  reason: string;
}

export interface SelectedCandidate<T extends CandidateMrLike> {
  mr: T;
  hits: number;
  phraseMatch: boolean;
  reason: string;
}

function hasWholeWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

/**
 * Scores one MR against the release title.
 *
 * Seed rules:
 * - must match at least one subject keyword,
 * - and either hit at least 2 distinct keywords, or contain the complete
 *   title phrase (without stopwords) in the MR title.
 */
export function scoreReleaseMr<T extends CandidateMrLike>(
  mr: T,
  parsed: ReleaseTitleKeywords,
): ScoredMr<T> {
  const titleText = normalize(mr.title);
  const text = normalize(`${mr.title} ${mr.description ?? ''}`);
  const hits = parsed.keywords.filter((keyword) =>
    text.includes(keyword),
  ).length;
  const subjectMatch = parsed.subjectKeywords.some((keyword) =>
    text.includes(keyword),
  );
  const fullPhrase = parsed.keywords.join(' ');
  const phraseMatch = titleText.includes(fullPhrase);
  const branchText = normalize(mr.source_branch ?? '');
  const branchCoversSubject =
    parsed.subjectKeywords.length > 0 &&
    parsed.subjectKeywords.every((keyword) => branchText.includes(keyword));
  const titleCoversQualifiers =
    parsed.qualifierKeywords.length > 0 &&
    parsed.qualifierKeywords.every((keyword) =>
      hasWholeWord(titleText, keyword),
    );

  let isSeed = false;
  if (hits > 0 && subjectMatch) {
    if (phraseMatch) {
      isSeed = true;
    } else if (parsed.qualifierKeywords.length > 0) {
      isSeed =
        hits >= 2 && (titleCoversQualifiers || branchCoversSubject);
    } else {
      isSeed = hits >= 2;
    }
  }

  const reason = phraseMatch
    ? 'Cocok frasa lengkap'
    : `Cocok ${hits} kata kunci`;

  return { mr, hits, phraseMatch, isSeed, reason };
}

function timeOf(mr: CandidateMrLike): number {
  if (!mr.merged_at) return 0;
  return new Date(mr.merged_at).getTime();
}

/**
 * Selects the final candidate list from a pool of merged MRs.
 *
 * Seeds come first. Story and source-branch expansion only starts from seeds
 * and stays within 7 days of the seed. Final order: complete phrase, then
 * keyword hits, then newest merged.
 */
export function selectReleaseCandidates<T extends CandidateMrLike>(
  pool: T[],
  title: string,
  options: { max?: number; targetBranch?: string } = {},
): Array<SelectedCandidate<T>> {
  const max = options.max ?? 20;
  const scoped = options.targetBranch
    ? pool.filter((mr) => (mr.target_branch ?? '') === options.targetBranch)
    : pool;
  const parsed = parseReleaseTitle(title);
  const scored = scoped.map((mr) => scoreReleaseMr(mr, parsed));
  const byIid = new Map(scored.map((item) => [item.mr.iid, item]));
  const seeds = scored.filter((item) => item.isSeed);
  const selected = new Map<number, SelectedCandidate<T>>();

  for (const seed of seeds) {
    selected.set(seed.mr.iid, {
      mr: seed.mr,
      hits: seed.hits,
      phraseMatch: seed.phraseMatch,
      reason: seed.reason,
    });
  }

  const addExpanded = (mr: T, reason: string) => {
    if (selected.has(mr.iid)) return;
    const score = byIid.get(mr.iid);
    selected.set(mr.iid, {
      mr,
      hits: score?.hits ?? 0,
      phraseMatch: false,
      reason,
    });
  };

  for (const seed of seeds) {
    const seedTime = timeOf(seed.mr);

    const refs = extractStoryRefs(
      `${seed.mr.title} ${seed.mr.description ?? ''}`,
    );
    for (const ref of refs) {
      const pattern = new RegExp(`\\b${ref}\\b`, 'i');
      for (const candidate of scoped) {
        if (selected.has(candidate.iid)) continue;
        if (Math.abs(timeOf(candidate) - seedTime) > WEEK_MS) continue;
        if (
          !pattern.test(`${candidate.title} ${candidate.description ?? ''}`)
        ) {
          continue;
        }
        addExpanded(
          candidate,
          `Satu story ${ref} dengan kandidat lain`,
        );
      }
    }

    const branch = seed.mr.source_branch ?? '';
    if (branch && !isReleaseBranch(branch)) {
      for (const candidate of scoped) {
        if (selected.has(candidate.iid)) continue;
        if (candidate.source_branch !== branch) continue;
        if (Math.abs(timeOf(candidate) - seedTime) > WEEK_MS) continue;
        addExpanded(
          candidate,
          'Satu source branch dengan kandidat lain',
        );
      }
    }
  }

  const selectedList = [...selected.values()];
  const featureOnly = selectedList.filter(
    (item) => !isReleaseBranch(item.mr.source_branch ?? ''),
  );
  const finalList = featureOnly.length > 0 ? featureOnly : selectedList;

  finalList.sort(
    (a, b) =>
      Number(b.phraseMatch) - Number(a.phraseMatch) ||
      b.hits - a.hits ||
      timeOf(b.mr) - timeOf(a.mr),
  );

  return finalList.slice(0, max);
}

interface CandidateEntry {
  mr: ReleaseNoteMr;
  reason: string;
}

function fallbackGroups(
  title: string,
  entries: CandidateEntry[],
): ReleaseNoteCandidateGroup[] {
  if (entries.length === 0) return [];
  return [
    {
      name: title.trim() || 'Release',
      mrs: entries.map((entry) => ({
        iid: entry.mr.iid,
        reason: entry.reason,
      })),
    },
  ];
}

async function groupWithAi(
  title: string,
  entries: CandidateEntry[],
): Promise<{ groups: ReleaseNoteCandidateGroup[]; usedAi: boolean }> {
  const fallback = fallbackGroups(title, entries);
  if (entries.length === 0) return { groups: fallback, usedAi: false };

  const s = getSettings();
  if (!s.aiApiKey && !s.geminiApiKey && s.aiProvider !== 'custom') {
    return { groups: fallback, usedAi: false };
  }

  const valid = new Map(entries.map((entry) => [entry.mr.iid, entry]));
  const list = entries
    .slice(0, 80)
    .map((entry) => {
      const description = (entry.mr.description || '')
        .replace(/\s+/g, ' ')
        .slice(0, 240);
      return [
        `!${entry.mr.iid} | ${entry.mr.mergedAtLabel} | branch ${entry.mr.sourceBranch || '-'} | ${entry.mr.title}`,
        description ? `  ${description}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const system =
    'Kamu membantu menyusun release note. Pilih merge request yang relevan dengan judul release, ' +
    'lalu kelompokkan per fitur. Jangan mengarang iid. Balas hanya JSON valid.';

  const prompt = [
    `Judul release: "${title.trim()}"`,
    '',
    'Kandidat merge request merged:',
    list,
    '',
    'Aturan:',
    '- Utamakan MR yang membentuk satu rangkaian rilis: kata kunci judul, referensi story yang sama, atau source branch yang sama.',
    '- Setiap MR hanya boleh muncul di satu grup.',
    '- Beri alasan singkat satu baris per MR, dalam bahasa Indonesia.',
    '- Gunakan hanya iid dari daftar kandidat.',
    '',
    'Balas dengan format JSON:',
    '{"groups":[{"name":"Nama fitur","mrs":[{"iid":148,"reason":"alasan singkat"}]}]}',
  ].join('\n');

  try {
    const raw = await runAiCompletion({
      feature: 'release-note',
      modelOverride: resolveReleaseNoteModel(s),
      systemInstruction: system,
      prompt,
      temperature: 0.1,
      responseFormat: 'json',
    });

    const parsed = JSON.parse(extractJsonFromAiResponse(raw)) as {
      groups?: Array<{
        name?: unknown;
        mrs?: Array<{ iid?: unknown; reason?: unknown }>;
      }>;
    };

    const groups: ReleaseNoteCandidateGroup[] = [];
    const seen = new Set<number>();
    for (const group of Array.isArray(parsed.groups) ? parsed.groups : []) {
      const name =
        typeof group.name === 'string' && group.name.trim()
          ? group.name.trim()
          : 'Fitur';
      const mrs: Array<{ iid: number; reason: string }> = [];
      for (const item of Array.isArray(group.mrs) ? group.mrs : []) {
        const iid = Number(item.iid);
        if (!Number.isInteger(iid) || !valid.has(iid) || seen.has(iid)) continue;
        seen.add(iid);
        mrs.push({
          iid,
          reason: valid.get(iid)?.reason ?? 'Relevan dengan judul release.',
        });
      }
      if (mrs.length > 0) groups.push({ name, mrs });
    }

    if (groups.length === 0) return { groups: fallback, usedAi: false };

    const missing = entries.filter((entry) => !seen.has(entry.mr.iid));
    if (missing.length > 0) {
      groups.push({
        name: 'Lainnya',
        mrs: missing.map((entry) => ({
          iid: entry.mr.iid,
          reason: entry.reason,
        })),
      });
    }

    return { groups, usedAi: true };
  } catch {
    return { groups: fallback, usedAi: false };
  }
}

export async function searchReleaseCandidates(
  input: SearchCandidatesInput,
): Promise<SearchCandidatesOutput> {
  const title = input.title.trim();
  const project = await getProjectInfo(input.projectId);
  const parsed = parseReleaseTitle(title);
  const sinceIso = isoOrDate(input.since);
  const sinceMs = new Date(sinceIso).getTime();
  const untilMs = new Date(isoOrDate(input.until, true)).getTime();

  const merged = await allMerged(
    input.projectId,
    sinceIso,
    input.targetBranch,
  );
  const pool = merged.filter((mr) => {
    if (!mr.merged_at) return false;
    const mergedMs = new Date(mr.merged_at).getTime();
    return mergedMs >= sinceMs && mergedMs <= untilMs;
  });

  const selected = selectReleaseCandidates(pool, title, {
    targetBranch: input.targetBranch,
  });
  const entries = selected.map((item) => ({
    mr: toReleaseNoteMr(item.mr as RawMr),
    reason: item.reason,
  }));

  const { groups, usedAi } = await groupWithAi(title, entries);

  return {
    project,
    keywords: parsed.keywords,
    candidates: entries.map((entry) => entry.mr),
    groups,
    usedAi,
    targetBranch: input.targetBranch,
  };
}
