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
  description?: string;
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
  hours: number | null;
  totalTimeSpentMinutes?: number | null;
  activityDate?: string | null;
  startTime?: string | null;
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

interface ProjectTimeDefs {
  minAttrId?: number;
  hoursAttrId?: number;
}
const projectTimeDefsCache = new Map<number, ProjectTimeDefs>();
const taskCavCache = new Map<number, { vals: Record<string, unknown>; modifiedDate: string }>();

export async function GET(req: Request) {
  try {
    const s = getSettings();
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get('activeOnly') === 'true';

    // Support single task detail lookup
    const singleTaskIdStr = url.searchParams.get('taskId');
    if (singleTaskIdStr) {
      const taskId = Number(singleTaskIdStr);
      const t = await taiga<RawTaigaTask & { description?: string }>(`/tasks/${taskId}`);
      const pSlug = t.project_extra_info?.slug || s.taigaProjectSlug || 'project';

      let vals: Record<string, unknown> = {};
      try {
        const cav = await taiga<{ attributes_values?: Record<string, unknown> }>(
          `/tasks/custom-attributes-values/${taskId}`,
        );
        vals = cav?.attributes_values || {};
      } catch {}

      let minAttrId: number | undefined;
      let hoursAttrId: number | undefined;
      let activityDateAttrId: number | undefined;
      let startTimeAttrId: number | undefined;
      try {
        const attrs = await taiga<Array<{ id: number; name: string }>>(`/task-custom-attributes?project=${t.project}`, {
          headers: { 'x-disable-pagination': 'true' },
        });
        const minAttr = attrs.find((a) =>
          !/start|end|date/i.test(a.name) &&
          (/total\s*time\s*spent/i.test(a.name) || /total\s*timespent/i.test(a.name) || /time\s*spent\s*\(min\)/i.test(a.name))
        );
        const hoursAttr = attrs.find((a) =>
          !/start|end|date/i.test(a.name) &&
          (/time\s*spent\s*hours/i.test(a.name) || /time\s*spent\s*\(h/i.test(a.name))
        );
        const dateAttr = attrs.find((a) => /activity\s*date/i.test(a.name));
        const startAttr = attrs.find((a) => /start\s*time/i.test(a.name));
        minAttrId = minAttr?.id;
        hoursAttrId = hoursAttr?.id;
        activityDateAttrId = dateAttr?.id;
        startTimeAttrId = startAttr?.id;
      } catch {}

      let foundHours: number | null = null;
      let totalMins: number | null = null;
      if (minAttrId && vals[String(minAttrId)] != null && vals[String(minAttrId)] !== '') {
        const num = Number(vals[String(minAttrId)]);
        if (!isNaN(num) && num > 0) {
          totalMins = num;
          foundHours = num >= 15 ? Math.round((num / 60) * 10) / 10 : num;
        }
      }
      if (foundHours == null && hoursAttrId && vals[String(hoursAttrId)] != null && vals[String(hoursAttrId)] !== '') {
        const num = Number(vals[String(hoursAttrId)]);
        if (!isNaN(num) && num > 0) {
          foundHours = Math.round(num * 10) / 10;
          totalMins = Math.round(num * 60);
        }
      }
      if (foundHours == null) {
        const estMatch = t.subject.match(/(\d+(?:[.,]\d+)?)\s*(?:jam|j|h|hours?)\b/i);
        if (estMatch) {
          const parsed = Number(estMatch[1].replace(',', '.'));
          if (!isNaN(parsed) && parsed > 0) {
            foundHours = parsed;
            totalMins = Math.round(parsed * 60);
          }
        }
      }

      const activityDate = activityDateAttrId && vals[String(activityDateAttrId)] ? String(vals[String(activityDateAttrId)]) : null;
      const startTime = startTimeAttrId && vals[String(startTimeAttrId)] ? String(vals[String(startTimeAttrId)]) : null;

      return NextResponse.json({
        ok: true,
        task: {
          id: t.id,
          ref: t.ref,
          subject: t.subject,
          description: t.description || '',
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
          hours: foundHours,
          totalTimeSpentMinutes: totalMins,
          activityDate,
          startTime,
          createdDate: t.created_date,
          modifiedDate: t.modified_date,
          url: `${s.taigaBaseUrl}/project/${pSlug}/task/${t.ref}`,
        },
      });
    }

    // 1. Fetch current Taiga user
    const me = await taiga<{
      id: number;
      username: string;
      full_name_display: string;
    }>('/users/me');

    // 2. Fetch all tasks assigned to me, ordered by most recently modified
    const statusFilterQuery = activeOnly ? '&status__is_closed=false' : '';
    const rawTasks = await taiga<Array<RawTaigaTask & { description?: string }>>(
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

    // 4. Fetch available task statuses and custom attributes for each unique project in parallel
    const projectStatuses: Record<number, TaigaStatus[]> = {};
    const projectTimeDefs: Record<number, ProjectTimeDefs> = {};

    await Promise.all(
      uniqueProjectIds.map(async (pid) => {
        try {
          const statuses = await taiga<TaigaStatus[]>(`/task-statuses?project=${pid}`);
          projectStatuses[pid] = statuses.sort((a, b) => a.order - b.order);
        } catch {
          projectStatuses[pid] = [];
        }

        if (projectTimeDefsCache.has(pid)) {
          projectTimeDefs[pid] = projectTimeDefsCache.get(pid)!;
        } else {
          try {
            const attrs = await taiga<Array<{ id: number; name: string }>>(`/task-custom-attributes?project=${pid}`, {
              headers: { 'x-disable-pagination': 'true' },
            });
            // Minute attributes: e.g. "Total Time Spent", "Total Timespent", "Time Spent (min)"
            // Exclude dates/start/end e.g. "Start Timespent", "End Timespent"
            const minAttr = attrs.find((a) =>
              !/start|end|date/i.test(a.name) &&
              (/total\s*time\s*spent/i.test(a.name) || /total\s*timespent/i.test(a.name) || /time\s*spent\s*\(min\)/i.test(a.name))
            );
            // Hour attributes: e.g. "Time Spent Hours Calculated", "Time Spent (Hours)"
            const hoursAttr = attrs.find((a) =>
              !/start|end|date/i.test(a.name) &&
              (/time\s*spent\s*hours/i.test(a.name) || /time\s*spent\s*\(h/i.test(a.name))
            );
            const defs = {
              minAttrId: minAttr?.id,
              hoursAttrId: hoursAttr?.id,
            };
            projectTimeDefsCache.set(pid, defs);
            projectTimeDefs[pid] = defs;
          } catch {}
        }
      }),
    );

    // 5. Fetch hours/time-spent for tasks
    const taskHoursMap = new Map<number, number>();
    await Promise.all(
      rawTasks.map(async (t) => {
        const def = projectTimeDefs[t.project];
        let foundHours: number | null = null;

        if (def?.minAttrId || def?.hoursAttrId) {
          try {
            let vals: Record<string, unknown> = {};
            const cached = taskCavCache.get(t.id);
            if (cached && cached.modifiedDate === t.modified_date) {
              vals = cached.vals;
            } else {
              const cav = await taiga<{ attributes_values?: Record<string, unknown> }>(
                `/tasks/custom-attributes-values/${t.id}`,
              );
              vals = cav?.attributes_values || {};
              taskCavCache.set(t.id, { vals, modifiedDate: t.modified_date });
            }

            // Check minutes attribute first (e.g. 60 -> 1h, 120 -> 2h, 30 -> 0.5h)
            if (def.minAttrId && vals[String(def.minAttrId)] != null && vals[String(def.minAttrId)] !== '') {
              const num = Number(vals[String(def.minAttrId)]);
              if (!isNaN(num) && num > 0) {
                foundHours = num >= 15 ? Math.round((num / 60) * 10) / 10 : num;
              }
            }

            // Check hours attribute if not found
            if (foundHours == null && def.hoursAttrId && vals[String(def.hoursAttrId)] != null && vals[String(def.hoursAttrId)] !== '') {
              const num = Number(vals[String(def.hoursAttrId)]);
              if (!isNaN(num) && num > 0) {
                foundHours = Math.round(num * 10) / 10;
              }
            }
          } catch {}
        }

        // Fallback: extract estimate hours or duration range from subject e.g. "(2 jam)", "(1.5j)", "[09:00 - 11:00]"
        if (foundHours == null) {
          const estMatch = t.subject.match(/(\d+(?:[.,]\d+)?)\s*(?:jam|j|h|hours?)\b/i);
          if (estMatch) {
            const parsed = Number(estMatch[1].replace(',', '.'));
            if (!isNaN(parsed) && parsed > 0) foundHours = parsed;
          }
        }

        if (foundHours == null) {
          const timeRangeMatch = t.subject.match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
          if (timeRangeMatch) {
            const startMins = Number(timeRangeMatch[1]) * 60 + Number(timeRangeMatch[2]);
            const endMins = Number(timeRangeMatch[3]) * 60 + Number(timeRangeMatch[4]);
            const diffHours = (endMins - startMins) / 60;
            if (diffHours > 0) foundHours = Math.round(diffHours * 10) / 10;
          }
        }

        if (foundHours != null) {
          taskHoursMap.set(t.id, foundHours);
        }
      }),
    );

    // 6. Format tasks
    const tasks: AssignedTaskItem[] = rawTasks.map((t) => {
      const pSlug = t.project_extra_info?.slug || s.taigaProjectSlug || 'project';
      return {
        id: t.id,
        ref: t.ref,
        subject: t.subject,
        description: t.description || '',
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
        hours: taskHoursMap.get(t.id) ?? null,
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
  hours: z.number().nullable().optional(),
  totalTimeSpentMinutes: z.number().nullable().optional(),
  activityDate: z.string().optional(),
  startTime: z.string().optional(),
});

export async function PATCH(req: Request) {
  try {
    const b = PatchBody.parse(await req.json());
    taskCavCache.delete(b.taskId);
    const updated = await updateTask(b.taskId, {
      statusId: b.statusId,
      subject: b.subject,
      description: b.description,
      isClosed: b.isClosed,
      hours: b.hours,
      totalTimeSpentMinutes: b.totalTimeSpentMinutes,
      activityDate: b.activityDate,
      startTime: b.startTime,
    });
    return NextResponse.json({ ok: true, task: updated });
  } catch (e) {
    return errorResponse(e);
  }
}

