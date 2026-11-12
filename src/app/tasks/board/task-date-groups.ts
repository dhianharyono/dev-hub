import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';

export interface TaskDateGroup {
  key: string;
  label: string;
  tasks: AssignedTaskItem[];
}

const NO_DATE_KEY = 'no-date';

export function toDateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function toUtcDay(dateKey: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatTaskDateLabel(
  dateKey: string | null,
  today: Date = new Date(),
): string {
  if (!dateKey) return 'Tanpa tanggal';

  const day = toUtcDay(dateKey);
  const todayDay = toUtcDay(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate(),
    ).padStart(2, '0')}`,
  );
  if (day == null || todayDay == null) return 'Tanpa tanggal';

  const diffDays = Math.round((day - todayDay) / 86_400_000);
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Besok';
  if (diffDays === -1) return 'Kemarin';

  const [year, month, date] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function groupRank(dateKey: string | null, todayKey: string): number {
  if (!dateKey) return 3;
  if (dateKey === todayKey) return 0;
  return dateKey > todayKey ? 1 : 2;
}

export function groupTasksByDate(
  tasks: AssignedTaskItem[],
  today: Date = new Date(),
): TaskDateGroup[] {
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(today.getDate()).padStart(2, '0')}`;

  const buckets = new Map<string, AssignedTaskItem[]>();
  for (const task of tasks) {
    const key = toDateKey(task.activityDate) ?? NO_DATE_KEY;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(task);
    } else {
      buckets.set(key, [task]);
    }
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => {
      const aKey = a === NO_DATE_KEY ? null : a;
      const bKey = b === NO_DATE_KEY ? null : b;
      const rankDiff = groupRank(aKey, todayKey) - groupRank(bKey, todayKey);
      if (rankDiff !== 0) return rankDiff;
      if (aKey == null || bKey == null) return 0;
      const bothFuture = aKey > todayKey && bKey > todayKey;
      return bothFuture ? aKey.localeCompare(bKey) : bKey.localeCompare(aKey);
    })
    .map(([key, groupTasks]) => ({
      key,
      label: formatTaskDateLabel(key === NO_DATE_KEY ? null : key, today),
      tasks: groupTasks,
    }));
}
