import { NextResponse } from 'next/server';
import { gl } from '@/lib/gitlab';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export interface GitLabMemberSummary {
  id: number;
  name: string;
  username: string;
  avatarUrl?: string;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    if (!projectId) {
      throw new Error('Parameter projectId wajib diisi.');
    }

    interface RawGLMember {
      id: number;
      name: string;
      username: string;
      avatar_url?: string;
      state?: string;
    }

    let membersRaw: RawGLMember[] = [];
    try {
      membersRaw = await gl<RawGLMember[]>(
        `/projects/${encodeURIComponent(projectId)}/members/all?per_page=100`,
      );
    } catch {
      try {
        membersRaw = await gl<RawGLMember[]>(
          `/projects/${encodeURIComponent(projectId)}/members?per_page=100`,
        );
      } catch {
        membersRaw = await gl<RawGLMember[]>(
          `/projects/${encodeURIComponent(projectId)}/users?per_page=100`,
        );
      }
    }

    let currentUser: { id: number; name: string; username: string } | null = null;
    try {
      currentUser = await gl<{ id: number; name: string; username: string }>('/user');
    } catch {
      // Silently ignore if /user endpoint fails
    }

    const memberMap = new Map<number, GitLabMemberSummary>();

    for (const m of membersRaw || []) {
      if ((!m.state || m.state === 'active') && m.id && m.name) {
        memberMap.set(m.id, {
          id: m.id,
          name: m.name,
          username: m.username,
          avatarUrl: m.avatar_url,
        });
      }
    }

    if (currentUser && currentUser.id && !memberMap.has(currentUser.id)) {
      memberMap.set(currentUser.id, {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
      });
    }

    const members: GitLabMemberSummary[] = Array.from(memberMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ ok: true, members, currentUser });
  } catch (e) {
    return errorResponse(e);
  }
}
