import { NextResponse } from 'next/server';
import { z } from 'zod';
import { taiga, updateTask, type TaigaStatus } from '@/lib/taiga';
import { getSettings } from '@/lib/settings';
import { errorResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export interface AssignedTaskItem {
  id: number;
  ref: number;
  subject: string;
  status: number;
  statusExtraInfo: {
    name: string;
    color: string;
    is_closed: boolean;
  };
  projectId: number;
  projectName: string;
  projectSlug: string;
  userStory: {
    id: number;
    ref: number;
    subject: string;
  } | null;
  milestoneSlug: string | null;
  isClosed: boolean;
  createdDate: string;
  modifiedDate: string;
  url: string;
}

interface RawTaigaTask {
  id: number;
  ref: number;
  subject: string;
  status: number;
  status_extra_info?: {
    name: string;
    color: string;
    is_closed: boolean;
  };
  project: number;
  project_extra_info?: {
    id: number;
    name: string;
    slug: string;
  };
  user_story: number | null;
  user_story_extra_info?: {
    id: number;
    ref: number;
    subject: string;
  } | null;
  milestone: number | null;
  milestone_slug: string | null;
  is_closed: boolean;
  created_date: string;
  modified_date: string;
}

export async function GET(req: Request) {
  try {
    const s = getSettings();
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get('activeOnly') === 'true';

    // 1. Fetch current Taiga user
    const me = await taiga<{
      id: number;
      username: string;
      full_name_display: string;
    }>('/users/me');

    // 2. Fetch all tasks assigned to me, ordered by most recently modified
    const statusFilterQuery = activeOnly ? '&status__is_closed=false' : '';
    const rawTasks = await taiga<RawTaigaTask[]>(
      `/tasks?assigned_to=${me.id}&order_by=-modified_date${statusFilterQuery}`,
    );

    // 3. Extract unique project IDs
    const projectMap = new Map<number, { id: number; name: string; slug: string }>();
    for (const t of rawTasks) {
      if (t.project && !projectMap.has(t.project)) {
        projectMap.set(t.project, {
          id: t.project,
          name: t.project_extra_info?.name || `Project #${t.project}`,
          slug: t.project_extra_info?.slug || String(t.project),
        });
      }
    }

    const uniqueProjectIds = Array.from(projectMap.keys());

    // 4. Fetch available task statuses for each unique project in parallel
    const projectStatuses: Record<number, TaigaStatus[]> = {};
    await Promise.all(
      uniqueProjectIds.map(async (pid) => {
        try {
          const statuses = await taiga<TaigaStatus[]>(`/task-statuses?project=${pid}`);
          projectStatuses[pid] = statuses.sort((a, b) => a.order - b.order);
        } catch {
          projectStatuses[pid] = [];
        }
      }),
    );

    // 5. Format tasks
    const tasks: AssignedTaskItem[] = rawTasks.map((t) => {
      const pSlug = t.project_extra_info?.slug || s.taigaProjectSlug || 'project';
      return {
        id: t.id,
        ref: t.ref,
        subject: t.subject,
        status: t.status,
        statusExtraInfo: {
          name: t.status_extra_info?.name || 'Unknown',
          color: t.status_extra_info?.color || '#94a3b8',
          is_closed: Boolean(t.is_closed || t.status_extra_info?.is_closed),
        },
        projectId: t.project,
        projectName: t.project_extra_info?.name || `Project #${t.project}`,
        projectSlug: pSlug,
        userStory: t.user_story_extra_info
          ? {
              id: t.user_story_extra_info.id,
              ref: t.user_story_extra_info.ref,
              subject: t.user_story_extra_info.subject,
            }
          : null,
        milestoneSlug: t.milestone_slug,
        isClosed: Boolean(t.is_closed),
        createdDate: t.created_date,
        modifiedDate: t.modified_date,
        url: `${s.taigaBaseUrl}/project/${pSlug}/task/${t.ref}`,
      };
    });

    return NextResponse.json({
      ok: true,
      tasks,
      projectStatuses,
      projects: Array.from(projectMap.values()),
      me: {
        id: me.id,
        username: me.username,
        name: me.full_name_display,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

const PatchBody = z.object({
  taskId: z.number(),
  statusId: z.number().nullable().optional(),
  subject: z.string().min(1).optional(),
  description: z.string().optional(),
  isClosed: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const b = PatchBody.parse(await req.json());
    const updated = await updateTask(b.taskId, {
      statusId: b.statusId,
      subject: b.subject,
      description: b.description,
      isClosed: b.isClosed,
    });
    return NextResponse.json({ ok: true, task: updated });
  } catch (e) {
    return errorResponse(e);
  }
}
