import { NextResponse } from 'next/server';
import { gl } from '@/lib/gitlab';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export interface IncomingMRItem {
  id: number;
  iid: number;
  projectId: number;
  projectName: string;
  projectPath: string;
  title: string;
  description: string;
  state: 'opened' | 'closed' | 'merged' | 'locked';
  createdAt: string;
  updatedAt: string;
  webUrl: string;
  sourceBranch: string;
  targetBranch: string;
  author: {
    id: number;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  hasConflicts: boolean;
  draft: boolean;
  reference: string;
  userNotesCount: number;
  reviewers: { id: number; name: string; username: string }[];
  assignees: { id: number; name: string; username: string }[];
}

interface GLUserRaw {
  id: number;
  username: string;
  name: string;
}

interface GLMRRaw {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: 'opened' | 'closed' | 'merged' | 'locked';
  created_at: string;
  updated_at: string;
  web_url: string;
  source_branch: string;
  target_branch: string;
  author: {
    id: number;
    name: string;
    username: string;
    avatar_url: string | null;
  };
  has_conflicts: boolean;
  draft?: boolean;
  work_in_progress?: boolean;
  references?: {
    full: string;
    relative: string;
    short: string;
  };
  user_notes_count?: number;
  reviewers?: { id: number; name: string; username: string }[];
  assignees?: { id: number; name: string; username: string }[];
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const stateParam = url.searchParams.get('state') || 'opened'; // 'opened' | 'merged' | 'closed' | 'all'

    // 1. Get current authenticated GitLab user
    const me = await gl<GLUserRaw>('/user');

    const scopeParam = url.searchParams.get('scope') || 'assigned'; // 'assigned' | 'all_team' | 'authored'
    const stateQuery = stateParam === 'all' ? '' : `&state=${stateParam}`;

    let rawList: GLMRRaw[] = [];

    if (scopeParam === 'authored') {
      // MRs authored by current user
      rawList = await gl<GLMRRaw[]>(
        `/merge_requests?scope=all${stateQuery}&author_id=${me.id}&per_page=50`,
      ).catch(() => [] as GLMRRaw[]);
    } else if (scopeParam === 'all_team') {
      // All accessible MRs in projects/squad
      rawList = await gl<GLMRRaw[]>(
        `/merge_requests?scope=all${stateQuery}&per_page=50`,
      ).catch(() => [] as GLMRRaw[]);
    } else {
      // Default: assigned to me (reviewer or assignee)
      const reviewerMrs = await gl<GLMRRaw[]>(
        `/merge_requests?scope=all${stateQuery}&reviewer_id=${me.id}&per_page=50`,
      ).catch(() => [] as GLMRRaw[]);

      let assignedMrs: GLMRRaw[] = [];
      try {
        assignedMrs = await gl<GLMRRaw[]>(
          `/merge_requests?scope=all${stateQuery}&assignee_id=${me.id}&per_page=50`,
        );
      } catch {
        assignedMrs = [];
      }

      const mrMap = new Map<number, GLMRRaw>();
      for (const m of reviewerMrs) {
        mrMap.set(m.id, m);
      }
      for (const m of assignedMrs) {
        if (m.author?.id !== me.id && !mrMap.has(m.id)) {
          mrMap.set(m.id, m);
        }
      }
      rawList = Array.from(mrMap.values());
    }

    rawList.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );

    // Map to clean frontend interface
    const items: IncomingMRItem[] = rawList.map((m) => {
      const fullRef = m.references?.full || `!${m.iid}`;
      const projectPath = fullRef.includes('!') ? fullRef.split('!')[0] : '';
      const projectName = projectPath ? projectPath.split('/').pop() || projectPath : `Project #${m.project_id}`;

      return {
        id: m.id,
        iid: m.iid,
        projectId: m.project_id,
        projectName,
        projectPath,
        title: m.title,
        description: m.description || '',
        state: m.state,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        webUrl: m.web_url,
        sourceBranch: m.source_branch,
        targetBranch: m.target_branch,
        author: {
          id: m.author?.id ?? 0,
          name: m.author?.name || 'Unknown',
          username: m.author?.username || 'unknown',
          avatarUrl: m.author?.avatar_url || null,
        },
        hasConflicts: Boolean(m.has_conflicts),
        draft: Boolean(m.draft || m.work_in_progress),
        reference: m.references?.relative || `!${m.iid}`,
        userNotesCount: m.user_notes_count || 0,
        reviewers: m.reviewers || [],
        assignees: m.assignees || [],
      };
    });

    return NextResponse.json({
      ok: true,
      currentUser: { id: me.id, username: me.username, name: me.name },
      mrs: items,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
