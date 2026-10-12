import 'server-only';
import { runAiCompletion, extractJsonFromAiResponse } from './client';
import { getSettings } from '../settings';

export interface MrAssistantInput {
  title?: string;
  branch?: string;
  targetBranch?: string;
  diff?: string;
  commits?: string[];
  targetStoryRef?: number | null;
  targetStorySubject?: string | null;
  targetTaskRef?: number | null;
  targetTaskSubject?: string | null;
  ticketType?: 'task' | 'story' | 'both' | null;
  assignee?: string | null;
  reviewer?: string | null;
  projectSlug?: string | null;
}

export interface MrAssistantOutput {
  mrTitle: string;
  description: string;
  releaseNotes: string;
  source: 'gemini' | 'fallback';
}

export function formatMrTitleWithTicket(
  rawTitle: string,
  projectSlug?: string | null,
  taskRef?: number | null,
  storyRef?: number | null,
): string {
  let title = rawTitle.trim();
  const ticketRef = taskRef || storyRef;
  const slug = (projectSlug || getSettings().taigaProjectSlug || '').toUpperCase();

  if (ticketRef) {
    const expectedPrefix = slug ? `[${slug}-${ticketRef}]` : `[#${ticketRef}]`;
    if (title.startsWith(expectedPrefix)) {
      return title;
    }
    // Remove any existing bracket prefix like [SPC-12154] or [TASK-123] or [#123]
    title = title.replace(/^\[[A-Za-z0-9_#-]+\]\s*/, '').trim();
    return `${expectedPrefix} ${title}`;
  }

  return title;
}

export async function generateMrDescription(
  input: MrAssistantInput,
): Promise<MrAssistantOutput> {
  const s = getSettings();
  const hasAi = Boolean(s.aiApiKey || s.geminiApiKey || s.aiProvider === 'custom');
  if (!hasAi) {
    return fallbackMrAssistant(input);
  }

  const system = `Kamu adalah Lead Software Engineer yang bertugas membuat deskripsi GitLab Merge Request (MR) standar enterprise berkualitas tinggi.
Format output markdown wajib memuat:
1. **Ringkasan / Konteks**: Apa masalah yang dipecahkan dan latar belakangnya.
2. **Detail Perubahan**: Bullet points perubahan teknis penting (fitur, bugfix, refactor, config).
3. **Relasi Tiket**: Cantumkan tautan "Closes #..." atau "Relates to #..." untuk referensi tiket Taiga (User Story dan/atau Task) jika disediakan.

Aturan Penulisan:
- JANGAN sertakan bagian atau judul Penugasan (Assignee/Reviewer) di dalam teks deskripsi MR, karena penugasan sudah diatur langsung di GitLab metadata MR.
- JANGAN sertakan checklist pengujian atau checklist testing apapun di deskripsi MR.
- Gunakan Bahasa Indonesia profesional dan istilah teknis standar (API, endpoint, schema, auth, dsb).
- Buat judul MR dengan format Conventional Commits (mis. "feat(auth): ...", "fix(dashboard): ...", "refactor(api): ...").
- Jika referensi tiket tersedia, sertakan kode tiket [PROJECT-REF] di paling depan judul (contoh: "[SPC-12154] feat(...): ...").
- Jangan gunakan tanda hubung em dash di teks apa pun.`;

  const storyInfo = input.targetStoryRef
    ? `#${input.targetStoryRef}${input.targetStorySubject ? ` (${input.targetStorySubject})` : ''}`
    : '(tidak ada)';
  const taskInfo = input.targetTaskRef
    ? `#${input.targetTaskRef}${input.targetTaskSubject ? ` (${input.targetTaskSubject})` : ''}`
    : '(tidak ada)';

  const prompt = `Data Merge Request:
- Branch: ${input.branch || 'feature/dev'} -> ${input.targetBranch || 'main'}
- Topik / Judul Dasar: ${input.title || '(belum ditentukan)'}
- Referensi User Story Taiga: ${storyInfo}
- Referensi Task Taiga: ${taskInfo}
- Assignee: ${input.assignee || '(tidak ada)'}
- Reviewer: ${input.reviewer || '(tidak ada)'}

Daftar Commit Terkait:
${input.commits?.length ? input.commits.map((c) => `- ${c}`).join('\n') : '(Tidak ada daftar commit terpisah)'}

Cuplikan Git Diff / Ringkasan Kode:
"""
${(input.diff || '').slice(0, 7000) || '(Tidak ada diff langsung)'}
"""`;

  const jsonSchema = {
    type: 'object',
    properties: {
      mrTitle: {
        type: 'string',
        description: 'Judul MR format Conventional Commits',
      },
      description: {
        type: 'string',
        description: 'Isi lengkap deskripsi MR dalam format Markdown',
      },
      releaseNotes: {
        type: 'string',
        description: 'Ringkasan 1-2 kalimat untuk catatan rilis / QA',
      },
    },
    required: ['mrTitle', 'description', 'releaseNotes'],
  };

  try {
    const raw = await runAiCompletion({
      systemInstruction: system,
      prompt,
      temperature: 0.3,
      responseFormat: 'json',
      jsonSchema,
    });

    const parsed = JSON.parse(extractJsonFromAiResponse(raw));
    const baseTitle = parsed.mrTitle || input.title || 'feat: update implementation';
    const mrTitle = formatMrTitleWithTicket(
      baseTitle,
      input.projectSlug,
      input.targetTaskRef,
      input.targetStoryRef,
    );
    return {
      mrTitle,
      description: parsed.description,
      releaseNotes: parsed.releaseNotes,
      source: 'gemini',
    };
  } catch (e) {
    console.warn('[AI MR Assistant] Generation failed, falling back to heuristic:', e);
    return fallbackMrAssistant(input);
  }
}

export function fallbackMrAssistant(input: MrAssistantInput): MrAssistantOutput {
  const commitSummary = input.commits?.length
    ? input.commits.map((c) => `- ${c}`).join('\n')
    : '- Pembaruan dan perbaikan kode fungsional';

  const taigaRefs: string[] = [];
  if (input.targetTaskRef) {
    taigaRefs.push(
      `- Task #${input.targetTaskRef}${input.targetTaskSubject ? `: ${input.targetTaskSubject}` : ''} (Closes #${input.targetTaskRef})`,
    );
  }
  if (input.targetStoryRef) {
    taigaRefs.push(
      `- User Story #${input.targetStoryRef}${input.targetStorySubject ? `: ${input.targetStorySubject}` : ''} (Closes #${input.targetStoryRef})`,
    );
  }
  const taigaSection = taigaRefs.length
    ? `\n\n### Referensi Taiga\n${taigaRefs.join('\n')}`
    : '';

  const title =
    input.title ||
    input.targetTaskSubject ||
    input.targetStorySubject ||
    'implement scheduled improvements';
  const conventionalTitle =
    title.startsWith('feat') || title.startsWith('fix') ? title : `feat: ${title}`;
  const mrTitle = formatMrTitleWithTicket(
    conventionalTitle,
    input.projectSlug,
    input.targetTaskRef,
    input.targetStoryRef,
  );

  return {
    mrTitle,
    description: `## Ringkasan Perubahan
Merge Request ini berisi pembaruan kode untuk branch \`${input.branch || 'feature'}\` ke \`${input.targetBranch || 'main'}\`.

### Perubahan Utama
${commitSummary}${taigaSection}`,
    releaseNotes: `Pembaruan branch ${input.branch || 'fitur'} dengan implementasi fungsional dan peningkatan stabilitas sistem.`,
    source: 'fallback',
  };
}
