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
  /** Task yang dilewati karena project tidak punya status target. */
  withoutTargetStatus: number;
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
 * Cari status dengan nama yang sama di daftar status sebuah project.
 * Nama dibandingkan tanpa beda huruf besar/kecil dan spasi tepi.
 */
export function findStatusByName(
  statuses: Status[] | undefined,
  name: string,
): Status | null {
  if (!statuses || !name.trim()) return null;
  const target = name.trim().toLowerCase();
  return (
    statuses.find((s) => s.name.trim().toLowerCase() === target) ?? null
  );
}

/**
 * Daftar nama status unik dari semua project yang termuat, urut kemunculan.
 * Status proyek berbeda punya id sendiri, jadi pilihan lintas proyek memakai nama.
 */
export function buildBulkStatusOptions(
  statusesByProject: Record<number, Status[]>,
): string[] {
  const seen = new Map<string, string>();
  for (const list of Object.values(statusesByProject)) {
    for (const status of list) {
      const key = status.name.trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, status.name.trim());
    }
  }
  return [...seen.values()];
}

/**
 * Status target default: nama status Done bila ada, lalu status closed pertama,
 * lalu status pertama yang tersedia.
 */
export function pickDefaultTargetStatusName(
  statusesByProject: Record<number, Status[]>,
): string | null {
  const allStatuses = Object.values(statusesByProject).flat();
  const preferred = allStatuses.find(
    (s) => s.is_closed && PREFERRED_DONE_NAME.test(s.name.trim()),
  );
  if (preferred) return preferred.name.trim();
  const closed = allStatuses.find((s) => s.is_closed);
  if (closed) return closed.name.trim();
  return allStatuses[0]?.name.trim() ?? null;
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
 * Susun daftar task aktif yang akan diubah ke status target.
 * `day` membatasi ke satu hari; `ALL_DAYS` berarti semua tanggal ikut.
 * Tanpa `targetStatusName`, status target memakai status penutup project.
 */
export function buildBulkDonePlan(
  tasks: AssignedTaskItem[],
  statusesByProject: Record<number, Status[]>,
  day: string = ALL_DAYS,
  targetStatusName?: string | null,
): BulkDonePlan {
  const plan: BulkDonePlan = {
    targets: [],
    alreadyClosed: 0,
    withoutTargetStatus: 0,
  };

  const scopedTasks =
    day === ALL_DAYS ? tasks : tasks.filter((task) => taskDayKey(task) === day);

  for (const task of scopedTasks) {
    if (task.isClosed || task.statusExtraInfo?.is_closed) {
      plan.alreadyClosed += 1;
      continue;
    }

    const statuses = statusesByProject[task.projectId];
    const status = targetStatusName
      ? findStatusByName(statuses, targetStatusName)
      : pickDoneStatus(statuses);
    if (!status) {
      plan.withoutTargetStatus += 1;
      continue;
    }

    plan.targets.push({ task, status });
  }

  return plan;
}
