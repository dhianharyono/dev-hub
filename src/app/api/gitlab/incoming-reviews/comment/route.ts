import { NextResponse } from 'next/server';
import { z } from 'zod';
import { gl } from '@/lib/gitlab';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

const FindingSchema = z.object({
  file: z.string().optional(),
  line: z.number().optional(),
  severity: z.string().default('important'),
  category: z.string().optional(),
  title: z.string(),
  description: z.string(),
  suggestionSnippet: z.string().optional(),
});

const Body = z.object({
  projectId: z.number(),
  mrIid: z.number(),
  comment: z.string().optional(),
  summary: z.string().optional(),
  findings: z.array(FindingSchema).optional(),
  mode: z.enum(['audit', 'lgtm']).optional(),
});

interface GLDiffRefs {
  base_sha: string;
  start_sha: string;
  head_sha: string;
}

interface GLMergeRequest {
  id: number;
  iid: number;
  diff_refs?: GLDiffRefs;
}

interface GLVersion {
  id: number;
  base_commit_sha: string;
  start_commit_sha: string;
  head_commit_sha: string;
}

interface GLDiscussionResponse {
  id: string;
  notes: Array<{
    id: number;
    body: string;
    created_at: string;
    position?: Record<string, unknown>;
  }>;
}

interface GLNoteResponse {
  id: number;
  body: string;
  created_at: string;
  author: {
    id: number;
    username: string;
    name: string;
  };
}

async function getMrDiffRefs(projectId: number, mrIid: number): Promise<GLDiffRefs | null> {
  try {
    const mr = await gl<GLMergeRequest>(`/projects/${projectId}/merge_requests/${mrIid}`);
    if (mr.diff_refs?.head_sha && mr.diff_refs?.base_sha) {
      return mr.diff_refs;
    }
  } catch (e) {
    console.warn('[GitLab Review] Failed fetching MR diff_refs:', e);
  }

  try {
    const versions = await gl<GLVersion[]>(
      `/projects/${projectId}/merge_requests/${mrIid}/versions?per_page=1`,
    );
    if (versions && versions.length > 0) {
      return {
        base_sha: versions[0].base_commit_sha,
        start_sha: versions[0].start_commit_sha,
        head_sha: versions[0].head_commit_sha,
      };
    }
  } catch (e) {
    console.warn('[GitLab Review] Failed fetching MR versions:', e);
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());

    // 1. If structured findings are provided, post each finding as an inline diff discussion
    if (b.findings && b.findings.length > 0) {
      const diffRefs = await getMrDiffRefs(b.projectId, b.mrIid);
      let diffDiscussionsCount = 0;
      let generalDiscussionsCount = 0;

      for (const finding of b.findings) {
        const severity = finding.severity || 'important';
        const title = finding.title.trim();
        const desc = finding.description.trim();

        let body = `**${severity}**: ${title}\n\n${desc}`;
        if (finding.suggestionSnippet?.trim()) {
          const snippet = finding.suggestionSnippet.trim();
          if (snippet.startsWith('```')) {
            body += `\n\n${snippet}`;
          } else {
            body += `\n\n\`\`\`suggestion\n${snippet}\n\`\`\``;
          }
        }

        const filePath = finding.file ? finding.file.replace(/^\.?\/+/, '') : '';
        const lineNum = typeof finding.line === 'number' && finding.line > 0 ? finding.line : undefined;

        let postedAsDiff = false;
        if (diffRefs && filePath && lineNum) {
          try {
            await gl<GLDiscussionResponse>(
              `/projects/${b.projectId}/merge_requests/${b.mrIid}/discussions`,
              {
                method: 'POST',
                body: JSON.stringify({
                  body,
                  position: {
                    base_sha: diffRefs.base_sha,
                    start_sha: diffRefs.start_sha,
                    head_sha: diffRefs.head_sha,
                    position_type: 'text',
                    old_path: filePath,
                    new_path: filePath,
                    new_line: lineNum,
                  },
                }),
              },
            );
            diffDiscussionsCount++;
            postedAsDiff = true;
          } catch (posErr) {
            console.warn(
              `[GitLab Review] Inline diff discussion rejected on ${filePath}:${lineNum}, falling back to general thread:`,
              posErr,
            );
          }
        }

        if (!postedAsDiff) {
          // Fallback to discussion without position
          const locationHeader = filePath
            ? `di \`${filePath}${lineNum ? `:${lineNum}` : ''}\`\n\n`
            : '';
          await gl<GLDiscussionResponse>(
            `/projects/${b.projectId}/merge_requests/${b.mrIid}/discussions`,
            {
              method: 'POST',
              body: JSON.stringify({
                body: locationHeader + body,
              }),
            },
          );
          generalDiscussionsCount++;
        }
      }

      // Post high-level summary note if available
      let summaryNoteId: number | undefined;
      if (b.summary?.trim()) {
        try {
          const note = await gl<GLNoteResponse>(
            `/projects/${b.projectId}/merge_requests/${b.mrIid}/notes`,
            {
              method: 'POST',
              body: JSON.stringify({ body: b.summary.trim() }),
            },
          );
          summaryNoteId = note.id;
        } catch (sumErr) {
          console.warn('[GitLab Review] Failed posting summary note:', sumErr);
        }
      }

      const totalThreads = diffDiscussionsCount + generalDiscussionsCount;
      return NextResponse.json({
        ok: true,
        diffDiscussionsCreated: diffDiscussionsCount,
        generalDiscussionsCreated: generalDiscussionsCount,
        threadsCreated: totalThreads,
        summaryNoteId,
        message: `Berhasil membuat ${diffDiscussionsCount} thread komentar inline pada diff MR dan ${generalDiscussionsCount} komentar umum.`,
      });
    }

    // 2. Fallback: single general comment note (e.g. LGTM or manual comment)
    const content = (b.comment || b.summary || '').trim();
    if (!content) {
      return NextResponse.json(
        { ok: false, error: 'Isi review atau komentar tidak boleh kosong.' },
        { status: 400 },
      );
    }

    const note = await gl<GLNoteResponse>(
      `/projects/${b.projectId}/merge_requests/${b.mrIid}/notes`,
      {
        method: 'POST',
        body: JSON.stringify({ body: content }),
      },
    );

    return NextResponse.json({
      ok: true,
      noteId: note.id,
      createdAt: note.created_at,
      author: note.author,
      threadsCreated: 1,
      message: 'Komentar review berhasil diposting ke MR.',
    });
  } catch (e) {
    const rawMsg = (e as Error)?.message || '';
    if (rawMsg.toLowerCase().includes('insufficient_scope')) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "GitLab 403 (insufficient_scope): Token Personal Access Token (PAT) GitLab Anda kekurangan izin. Untuk memposting review, komentar, atau membuat MR, token harus memiliki scope 'api'. Buka GitLab > Preferences > Access Tokens, buat token baru dengan mencentang scope 'api', lalu perbarui di Settings DevHub.",
        },
        { status: 403 },
      );
    }
    return errorResponse(e);
  }
}
