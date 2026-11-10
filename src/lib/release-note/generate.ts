import 'server-only';
import { gl, glAll, pool } from '../gitlab';
import { getSettings } from '../settings';
import { runAiCompletion } from '../ai/client';
import {
  analyzeDiffs,
  buildReleaseNoteContent,
  describeDbImpactFallback,
  formatWibDateTime,
} from './analyze';
import { resolveReleaseNoteModel } from './ai-model';
import type {
  DbImpact,
  DiffFile,
  ReleaseNoteMr,
  ReleaseNoteResult,
} from './types';

interface RawProject {
  id: number;
  name: string;
  path_with_namespace: string;
}

interface RawMr {
  iid: number;
  title: string;
  description?: string | null;
  merged_at: string | null;
  web_url: string;
  project_id: number;
  source_branch?: string | null;
  author?: { name?: string; username?: string } | null;
}

interface RawDiffFile {
  old_path: string;
  new_path: string;
  diff: string;
  new_file?: boolean;
  deleted_file?: boolean;
}

export interface ReleaseNoteProject {
  id: number;
  name: string;
  pathWithNamespace: string;
}

export interface GenerateReleaseNoteInput {
  projectId: number;
  releaseTitle: string;
  service?: string;
  databaseName?: string | null;
  mrIids: number[];
  targetBranch?: string;
}

export interface GenerateReleaseNoteOutput {
  project: ReleaseNoteProject;
  result: ReleaseNoteResult;
}

function isoOrDate(date: string, endOfDay = false): string {
  const suffix = endOfDay ? 'T23:59:59+07:00' : 'T00:00:00+07:00';
  return new Date(`${date}${suffix}`).toISOString();
}

export async function getProjectInfo(
  projectId: number,
): Promise<ReleaseNoteProject> {
  const project = await gl<RawProject>(`/projects/${projectId}`);
  return {
    id: project.id,
    name: project.name,
    pathWithNamespace: project.path_with_namespace,
  };
}

export async function listMergedMrs(
  projectId: number,
  since: string,
  until: string,
): Promise<ReleaseNoteMr[]> {
  const sinceMs = new Date(isoOrDate(since)).getTime();
  const untilMs = new Date(isoOrDate(until, true)).getTime();

  const raw = await glAll<RawMr>(
    `/projects/${projectId}/merge_requests?state=merged&scope=all&order_by=updated_at&sort=desc&updated_after=${encodeURIComponent(isoOrDate(since))}`,
  );

  return raw
    .filter((mr) => {
      if (!mr.merged_at) return false;
      const mergedMs = new Date(mr.merged_at).getTime();
      return mergedMs >= sinceMs && mergedMs <= untilMs;
    })
    .map((mr) => ({
      iid: mr.iid,
      title: mr.title,
      description: mr.description ?? '',
      mergedAt: mr.merged_at as string,
      mergedAtLabel: formatWibDateTime(mr.merged_at as string),
      author: mr.author?.name || mr.author?.username || '-',
      webUrl: mr.web_url,
      projectId: mr.project_id ?? projectId,
      sourceBranch: mr.source_branch ?? '',
    }))
    .sort(
      (a, b) => new Date(b.mergedAt).getTime() - new Date(a.mergedAt).getTime(),
    );
}

async function fetchMrDiffs(
  projectId: number,
  iid: number,
): Promise<DiffFile[]> {
  const toDiffFile = (file: RawDiffFile): DiffFile => ({
    oldPath: file.old_path,
    newPath: file.new_path,
    diff: file.diff ?? '',
    newFile: Boolean(file.new_file),
    deletedFile: Boolean(file.deleted_file),
  });

  const paged: RawDiffFile[] = [];
  try {
    for (let page = 1; page <= 10; page++) {
      const batch = await gl<RawDiffFile[]>(
        `/projects/${projectId}/merge_requests/${iid}/diffs?per_page=100&page=${page}`,
      );
      paged.push(...batch);
      if (batch.length < 100) break;
    }
  } catch {
    // Older GitLab versions may not expose the paginated /diffs endpoint.
  }

  if (paged.length > 0) return paged.map(toDiffFile);

  try {
    const changes = await gl<{ changes?: RawDiffFile[] }>(
      `/projects/${projectId}/merge_requests/${iid}/changes`,
    );
    return (changes.changes ?? []).map(toDiffFile);
  } catch {
    return [];
  }
}

function impactSummary(impact: DbImpact): string {
  const lines: string[] = [];
  if (impact.tables.length > 0)
    lines.push(`Tabel baru: ${impact.tables.join(', ')}`);
  if (impact.columns.length > 0)
    lines.push(
      `Kolom baru: ${impact.columns
        .map((c) => `${c.table}.${c.column}`)
        .join(', ')}`,
    );
  if (impact.typeChanges.length > 0)
    lines.push(
      `Perubahan tipe: ${impact.typeChanges
        .map((c) => `${c.table}.${c.column} -> ${c.type}`)
        .join(', ')}`,
    );
  if (impact.defaultChanges.length > 0)
    lines.push(
      `Perubahan default: ${impact.defaultChanges
        .map((c) => `${c.table}.${c.column} -> ${c.value}`)
        .join(', ')}`,
    );
  if (impact.writeTables.length > 0)
    lines.push(
      `Tabel lama yang ditulis ulang (bukan tabel baru): ${impact.writeTables.join(', ')}`,
    );
  if (impact.envVars.length > 0)
    lines.push(`Env baru: ${impact.envVars.join(', ')}`);
  return lines.length > 0
    ? lines.join('\n')
    : 'Tidak ada detail perubahan terdeteksi.';
}

async function describeWithAi(
  impact: DbImpact,
  mrTitles: string[],
  releaseTitle: string,
): Promise<{ description: string; usedAi: boolean }> {
  const fallback = describeDbImpactFallback(impact);
  if (!impact.hasDatabaseChanges)
    return { description: fallback, usedAi: false };

  const s = getSettings();
  const hasAi = Boolean(
    s.aiApiKey || s.geminiApiKey || s.aiProvider === 'custom',
  );
  if (!hasAi) return { description: fallback, usedAi: false };

  const system =
    'Kamu adalah backend engineer yang menulis ringkasan perubahan database untuk release note. ' +
    'Tulis 1 sampai 3 kalimat bahasa Indonesia yang jelas dan faktual. ' +
    'Gunakan hanya nama tabel dan kolom yang ada pada data yang diberikan, jangan mengarang. ' +
    'Tanpa markdown, tanpa bullet, tanpa tanda hubung em dash.';

  const prompt = `Judul release: ${releaseTitle}
Perubahan database yang terdeteksi dari diff merge request:
${impactSummary(impact)}

Judul MR terkait:
${mrTitles.map((t) => `- ${t}`).join('\n') || '- (tidak ada)'}

Tulis hanya deskripsi singkat perubahan database (1-3 kalimat), tanpa label atau awalan.`;

  try {
    const raw = await runAiCompletion({
      feature: 'release-note',
      modelOverride: resolveReleaseNoteModel(s),
      systemInstruction: system,
      prompt,
      temperature: 0.2,
    });
    const text = raw
      .replace(/```[a-z]*\n?/gi, '')
      .replace(/```/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return { description: fallback, usedAi: false };
    return { description: text, usedAi: true };
  } catch {
    return { description: fallback, usedAi: false };
  }
}

export async function generateReleaseNote(
  input: GenerateReleaseNoteInput,
): Promise<GenerateReleaseNoteOutput> {
  const project = await getProjectInfo(input.projectId);
  const iids = [...new Set(input.mrIids)].filter(
    (iid) => Number.isInteger(iid) && iid > 0,
  );

  const rawMrs = await pool(iids, 4, (iid) =>
    gl<RawMr>(`/projects/${input.projectId}/merge_requests/${iid}`).catch(
      () => null,
    ),
  );
  const mrs = rawMrs.filter((mr): mr is RawMr => Boolean(mr));
  if (mrs.length === 0) {
    throw new Error('Tidak ada MR valid pada pilihan ini.');
  }

  const diffSets = await pool(mrs, 3, (mr) =>
    fetchMrDiffs(input.projectId, mr.iid),
  );
  const impact = analyzeDiffs(diffSets.flat());

  const sortedMrs = [...mrs].sort(
    (a, b) =>
      new Date(a.merged_at ?? 0).getTime() -
      new Date(b.merged_at ?? 0).getTime(),
  );
  const latestMerged = sortedMrs
    .map((mr) => mr.merged_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  const deployAt = formatWibDateTime(latestMerged ?? new Date());
  const service = input.service?.trim() || project.name;
  const databaseName = input.databaseName?.trim() || 'padi_transactions';
  const releaseTitle = input.releaseTitle.trim() || 'Release';
  const { description, usedAi } = await describeWithAi(
    impact,
    mrs.map((mr) => mr.title),
    releaseTitle,
  );

  return {
    project,
    result: {
      title: releaseTitle,
      mrIids: sortedMrs.map((mr) => mr.iid),
      deployAt,
      dbImpact: impact,
      usedAi,
      targetBranch: input.targetBranch,
      content: buildReleaseNoteContent({
        deployAt,
        service,
        mrLinks: sortedMrs.map((mr) => mr.web_url),
        databaseName,
        impact,
        description,
      }),
    },
  };
}
