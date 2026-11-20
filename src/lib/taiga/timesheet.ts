import 'server-only';
import { taiga } from './client';

export interface TaskTimesheet {
  activityDate: string;
  startTime: string;
  totalTimeSpentMinutes: number | null;
}

interface AttributeIds {
  minutes?: number;
  hours?: number;
  activityDate?: number;
  startTime?: number;
}

const attributeIdsCache = new Map<number, AttributeIds>();

/** Id atribut timesheet satu project, diambil sekali per proses. */
async function projectAttributes(projectId: number): Promise<AttributeIds> {
  const cached = attributeIdsCache.get(projectId);
  if (cached) return cached;

  const attributes = await taiga<Array<{ id: number; name: string }>>(
    `/task-custom-attributes?project=${projectId}`,
    { headers: { 'x-disable-pagination': 'true' } },
  ).catch(() => []);

  const ids: AttributeIds = {
    minutes: attributes.find(
      (attr) =>
        !/start|end|date/i.test(attr.name) &&
        (/total\s*time\s*spent/i.test(attr.name) ||
          /total\s*timespent/i.test(attr.name) ||
          /time\s*spent\s*\(min\)/i.test(attr.name)),
    )?.id,
    hours: attributes.find(
      (attr) =>
        !/start|end|date/i.test(attr.name) &&
        (/time\s*spent\s*hours/i.test(attr.name) ||
          /time\s*spent\s*\(h/i.test(attr.name)),
    )?.id,
    activityDate: attributes.find((attr) => /activity\s*date/i.test(attr.name))
      ?.id,
    startTime: attributes.find((attr) => /start\s*time/i.test(attr.name))?.id,
  };

  attributeIdsCache.set(projectId, ids);
  return ids;
}

/** Nilai atribut start time Taiga menjadi HH:mm. */
function normalizeStartTime(value: unknown): string {
  if (value == null || value === '') return '';
  const match = String(value).trim().match(/(\d{1,2}):(\d{2})/);
  if (!match) return String(value).trim();
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

/** Timesheet task yang tersimpan di atribut kustom Taiga. */
export async function readTaskTimesheet(
  taskId: number,
  projectId: number,
): Promise<TaskTimesheet> {
  const empty: TaskTimesheet = {
    activityDate: '',
    startTime: '',
    totalTimeSpentMinutes: null,
  };

  const [ids, customValues] = await Promise.all([
    projectAttributes(projectId),
    taiga<{ attributes_values?: Record<string, unknown> }>(
      `/tasks/custom-attributes-values/${taskId}`,
    ).catch(() => ({ attributes_values: {} })),
  ]);
  const values: Record<string, unknown> =
    customValues.attributes_values ?? {};

  const minutes = ids.minutes ? toNumber(values[String(ids.minutes)]) : null;
  const hours = ids.hours ? toNumber(values[String(ids.hours)]) : null;

  return {
    activityDate: ids.activityDate
      ? String(values[String(ids.activityDate)] ?? '')
      : empty.activityDate,
    startTime: ids.startTime
      ? normalizeStartTime(values[String(ids.startTime)])
      : empty.startTime,
    totalTimeSpentMinutes:
      minutes != null && minutes > 0
        ? minutes
        : hours != null && hours > 0
          ? Math.round(hours * 60)
          : null,
  };
}
