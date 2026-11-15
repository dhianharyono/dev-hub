import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';
import type { Status } from './types';

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
 * Susun daftar task aktif yang akan ditandai Done.
 * Semua task yang dimuat di board ikut, tanpa melihat tanggal.
 */
export function buildBulkDonePlan(
  tasks: AssignedTaskItem[],
  statusesByProject: Record<number, Status[]>,
): BulkDonePlan {
  const plan: BulkDonePlan = {
    targets: [],
    alreadyClosed: 0,
    withoutDoneStatus: 0,
  };

  for (const task of tasks) {
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
