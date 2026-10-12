import { NextResponse } from 'next/server';
import { gl } from '@/lib/gitlab';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    if (!projectId || !from || !to) {
      throw new Error('Parameter projectId, from, dan to wajib disertakan.');
    }

    interface GLCompareCommit {
      id: string;
      short_id: string;
      title: string;
      message: string;
      author_name: string;
      authored_date: string;
    }

    interface GLCompareDiff {
      old_path: string;
      new_path: string;
      diff: string;
      new_file: boolean;
      renamed_file: boolean;
      deleted_file: boolean;
    }

    interface GLCompareResponse {
      commits: GLCompareCommit[];
      diffs: GLCompareDiff[];
      compare_timeout: boolean;
      compare_same_ref: boolean;
    }

    const raw = await gl<GLCompareResponse>(
      `/projects/${encodeURIComponent(projectId)}/repository/compare?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );

    const commits = (raw.commits || []).map((c) => c.title || c.message.split('\n')[0]);
    
    // Combine file diffs into unified diff format
    const fullDiff = (raw.diffs || [])
      .map((d) => {
        const header = `diff --git a/${d.old_path} b/${d.new_path}\n--- a/${d.old_path}\n+++ b/${d.new_path}`;
        return `${header}\n${d.diff}`;
      })
      .join('\n\n');

    return NextResponse.json({
      ok: true,
      commits,
      diff: fullDiff,
      filesCount: raw.diffs?.length || 0,
      commitsCount: raw.commits?.length || 0,
      compareSameRef: Boolean(raw.compare_same_ref),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
