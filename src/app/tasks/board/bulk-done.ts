import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';
import { groupTasksByDate, toDateKey } from './task-date-groups';
import type { Status } from './types';

/** Pilihan hari yang berarti semua task aktif, apa pun tanggalnya. */
export const ALL_DAYS = 'all';
/** Kunci untuk task yang belum punya tanggal aktivitas. */
export const NO_DATE_DAY = 'no-date';

export interface BulkDoneDayOption {
  /** Kunci tanggal `YYYY-MM-DD`, `no-date`, atau `all`. */
  value: string;
  label: string;
  /** Jumlah task aktif pada hari itu. */
  count: number;
}

export interface BulkDoneTarget {
  task: AssignedTaskItem;
  status: Status;
}

export interface BulkDonePlan {
  targets: BulkDoneTarget[];
  /** Task yang dilewati karena sudah closed. */
  alreadyClosed: number;
  /** Task yang dilewati karena project tidak punya status closed. */
  withoutDoneStatus: number;
}

const PREFERRED_DONE_NAME =
  /^(done|selesai|closed|complete|completed|finish|finished)$/i;

/**
 * Pilih status penutup untuk sebuah project.
 * Utamakan nama seperti Done/Selesai/Closed, lalu fallback ke status closed pertama.
 */
export function pickDoneStatus(statuses: Status[] | undefined): Status | null {
  if (!statuses || statuses.length === 0) return null;
  const closedStatuses = statuses.filter((s) => s.is_closed);
  if (closedStatuses.length === 0) return null;
  return (
    closedStatuses.find((s) => PREFERRED_DONE_NAME.test(s.name.trim())) ??
    closedStatuses[0]
  );
}

/**
 * Kunci hari sebuah task, dipakai untuk mencocokkan pilihan hari di dialog.
 */
export function taskDayKey(task: AssignedTaskItem): string {
  return toDateKey(task.activityDate) ?? NO_DATE_DAY;
}

/**
 * Susun pilihan hari untuk dialog: semua hari yang punya task aktif, plus
 * opsi "Semua hari" di urutan pertama.
 */
export function buildBulkDoneDayOptions(
  tasks: AssignedTaskItem[],
  today: Date = new Date(),
): BulkDoneDayOption[] {
  const openTasks = tasks.filter(
    (task) => !(task.isClosed || task.statusExtraInfo?.is_closed),
  );

  return [
    { value: ALL_DAYS, label: 'Semua hari', count: openTasks.length },
    ...groupTasksByDate(openTasks, today).map((group) => ({
      value: group.key,
      label: group.label,
      count: group.tasks.length,
    })),
  ];
}

/**
 * Susun daftar task aktif yang akan ditandai Done.
 * `day` membatasi ke satu hari; `ALL_DAYS` berarti semua tanggal ikut.
 */
export function buildBulkDonePlan(
  tasks: AssignedTaskItem[],
  statusesByProject: Record<number, Status[]>,
  day: string = ALL_DAYS,
): BulkDonePlan {
  const plan: BulkDonePlan = {
    targets: [],
    alreadyClosed: 0,
    withoutDoneStatus: 0,
  };

  const scopedTasks =
    day === ALL_DAYS ? tasks : tasks.filter((task) => taskDayKey(task) === day);

  for (const task of scopedTasks) {
    if (task.isClosed || task.statusExtraInfo?.is_closed) {
      plan.alreadyClosed += 1;
      continue;
    }

    const status = pickDoneStatus(statusesByProject[task.projectId]);
    if (!status) {
      plan.withoutDoneStatus += 1;
      continue;
    }

    plan.targets.push({ task, status });
  }

  return plan;
}
