import { NextResponse } from 'next/server';
import {
  taiga,
  type TaigaProjectRef,
  type TaigaStatus,
  type TaigaUserStory,
} from '@/lib/taiga';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const projectIdRaw = new URL(req.url).searchParams.get('projectId');

    let projects: TaigaProjectRef[] = [];
    try {
      const me = await taiga<{ id: number }>('/users/me');
      projects = await taiga<TaigaProjectRef[]>(
        `/projects?member=${me.id}&order_by=user_order`,
      );
    } catch {
      projects = await taiga<TaigaProjectRef[]>('/projects');
    }

    const projectList = projects.map(({ id, name, slug }) => ({
      id,
      name,
      slug,
    }));

    if (!projectIdRaw) {
      return NextResponse.json({
        ok: true,
        projects: projectList,
        statuses: [],
        userStories: [],
      });
    }

    const projectId = Number(projectIdRaw);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json(
        { error: 'projectId tidak valid.' },
        { status: 400 },
      );
    }

    const [statuses, userStories] = await Promise.all([
      taiga<TaigaStatus[]>(`/task-statuses?project=${projectId}`).catch(
        () => [] as TaigaStatus[],
      ),
      taiga<TaigaUserStory[]>(
        `/userstories?project=${projectId}&status__is_closed=false`,
      ).catch(() => [] as TaigaUserStory[]),
    ]);

    return NextResponse.json({
      ok: true,
      projects: projectList,
      statuses: [...statuses].sort((a, b) => a.order - b.order),
      userStories: userStories
        .filter((u) => !u.is_closed)
        .map(({ id, ref, subject }) => ({ id, ref, subject })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
