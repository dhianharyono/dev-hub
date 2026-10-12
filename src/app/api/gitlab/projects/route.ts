import { NextResponse } from 'next/server';
import { gl } from '@/lib/gitlab';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export interface GitLabProjectSummary {
  id: number;
  name: string;
  nameWithNamespace: string;
  pathWithNamespace: string;
  defaultBranch: string;
  webUrl: string;
  lastActivityAt: string;
}

export async function GET() {
  try {
    interface RawGLProject {
      id: number;
      name: string;
      name_with_namespace: string;
      path_with_namespace: string;
      default_branch: string | null;
      web_url: string;
      last_activity_at: string;
    }

    const raw = await gl<RawGLProject[]>(
      '/projects?membership=true&simple=true&per_page=100&order_by=last_activity_at',
    );

    const projects: GitLabProjectSummary[] = (raw || []).map((p) => ({
      id: p.id,
      name: p.name,
      nameWithNamespace: p.name_with_namespace,
      pathWithNamespace: p.path_with_namespace,
      defaultBranch: p.default_branch || 'main',
      webUrl: p.web_url,
      lastActivityAt: p.last_activity_at,
    }));

    return NextResponse.json({ ok: true, projects });
  } catch (e) {
    return errorResponse(e);
  }
}
