import { NextResponse } from 'next/server';
import { gl } from '@/lib/gitlab';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export interface GitLabBranchSummary {
  name: string;
  default: boolean;
  protected: boolean;
  commitTitle: string;
  commitDate: string;
  commitAuthor: string;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    if (!projectId) {
      throw new Error('Parameter projectId wajib diisi.');
    }

    interface RawGLBranch {
      name: string;
      default: boolean;
      protected: boolean;
      commit: {
        id: string;
        title: string;
        authored_date: string;
        author_name: string;
      };
    }

    const raw = await gl<RawGLBranch[]>(
      `/projects/${encodeURIComponent(projectId)}/repository/branches?per_page=100`,
    );

    const branches: GitLabBranchSummary[] = (raw || []).map((b) => ({
      name: b.name,
      default: Boolean(b.default),
      protected: Boolean(b.protected),
      commitTitle: b.commit?.title || '',
      commitDate: b.commit?.authored_date || '',
      commitAuthor: b.commit?.author_name || '',
    }));

    return NextResponse.json({ ok: true, branches });
  } catch (e) {
    return errorResponse(e);
  }
}
