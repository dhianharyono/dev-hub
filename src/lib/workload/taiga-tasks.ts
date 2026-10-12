import 'server-only';
import { getSettings } from '../settings';
import { taiga } from '../taiga';
import type { CustomAttrDef, RawTaigaTask, WorkloadTask } from './types';

const attrDefsCache = new Map<number, CustomAttrDef[]>();

export async function getProjectAttrDefs(projectId: number): Promise<CustomAttrDef[]> {
  if (attrDefsCache.has(projectId)) {
    return attrDefsCache.get(projectId)!;
  }
  try {
    const defs = await taiga<CustomAttrDef[]>(
      `/task-custom-attributes?project=${projectId}`,
    );
    attrDefsCache.set(projectId, defs);
    return defs;
  } catch {
    return [];
  }
}

export async function fetchUserTasksWithDetails(
  userId: number,
  targetMonth: string,
): Promise<{
  rawTasks: RawTaigaTask[];
  tasksWithDetails: WorkloadTask[];
}> {
  const s = getSettings();
  const rawTasks = await taiga<RawTaigaTask[]>(
    `/tasks?assigned_to=${userId}&order_by=-created_date`,
  );

  const targetMonthTasks = rawTasks.filter((t) =>
    (t.created_date || '').startsWith(targetMonth),
  );

  const projectIds = Array.from(
    new Set(targetMonthTasks.map((t) => t.project)),
  );
  await Promise.all(projectIds.map((pid) => getProjectAttrDefs(pid)));

  const tasksWithDetails: WorkloadTask[] = await Promise.all(
    targetMonthTasks.map(async (t) => {
      const pSlug = t.project_extra_info?.slug || String(t.project);
      const pName = t.project_extra_info?.name || pSlug;
      const defs = attrDefsCache.get(t.project) || [];

      const actDateDef = defs.find((d) => /activity\s*date/i.test(d.name));
      const startTimeDef = defs.find((d) => /start\s*time/i.test(d.name));
      const timeSpentMinDef = defs.find((d) =>
        /total\s*time\s*spent/i.test(d.name),
      );
      const timeSpentHoursDef = defs.find((d) =>
        /time\s*spent\s*hours/i.test(d.name),
      );

      let cavVals: Record<string, unknown> = {};
      try {
        const cav = await taiga<{
          attributes_values?: Record<string, unknown>;
        }>(`/tasks/custom-attributes-values/${t.id}`);
        cavVals = cav.attributes_values || {};
      } catch {}

      // Resolve Activity Date
      let activityDate =
        (actDateDef ? String(cavVals[String(actDateDef.id)] || '') : '') ||
        t.created_date.slice(0, 10);
      if (!activityDate) activityDate = t.created_date.slice(0, 10);

      // Resolve Start Time
      const startTime =
        (startTimeDef ? String(cavVals[String(startTimeDef.id)] || '') : '') ||
        '08:00';

      // Resolve Time Spent Hours
      let hours = 0;
      if (
        timeSpentMinDef &&
        cavVals[String(timeSpentMinDef.id)] != null &&
        cavVals[String(timeSpentMinDef.id)] !== ''
      ) {
        const val = Number(cavVals[String(timeSpentMinDef.id)]);
        hours = isNaN(val) ? 0 : val / 60;
      } else if (
        timeSpentHoursDef &&
        cavVals[String(timeSpentHoursDef.id)] != null &&
        cavVals[String(timeSpentHoursDef.id)] !== ''
      ) {
        const val = Number(cavVals[String(timeSpentHoursDef.id)]);
        hours = isNaN(val) ? 0 : val;
      } else {
        hours = 0;
      }

      const statusName = t.status_extra_info?.name || 'In Progress';
      const isClosed = Boolean(t.is_closed || t.status_extra_info?.is_closed);

      const dObj = new Date(
        activityDate +
          'T' +
          (startTime.includes(':') ? startTime : '08:00') +
          ':00',
      );
      const updatedAtStr =
        dObj.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) + `, ${startTime}`;

      return {
        id: t.id,
        ref: t.ref,
        subject: t.subject,
        project: pSlug,
        projectName: pName,
        status: statusName,
        priority: 'Medium',
        activityDate,
        startTime,
        timeSpentHours: hours,
        isClosed,
        updatedAt: updatedAtStr,
        url: `${s.taigaBaseUrl}/project/${pSlug}/task/${t.ref}`,
      };
    }),
  );

  tasksWithDetails.sort((a, b) =>
    (b.activityDate + ' ' + b.startTime).localeCompare(
      a.activityDate + ' ' + a.startTime,
    ),
  );

  return { rawTasks, tasksWithDetails };
}
