import type { ReleaseNoteTask } from './model';

export interface ReleaseTaskDraft {
  id: number;
  subject: string;
  description: string;
  statusId: number;
  assignedTo: number | null;
  activityDate: string;
  startTime: string;
  totalTimeSpentMinutes: number | null;
}

export interface ReleaseTaskUpdate {
  taskId: number;
  subject: string;
  description: string;
  statusId?: number;
  assignedTo?: number | null;
  activityDate?: string;
  startTime?: string;
  totalTimeSpentMinutes?: number | null;
}

/** Nilai awal editor task dari data detail release note. */
export function toTaskDrafts(tasks: ReleaseNoteTask[]): ReleaseTaskDraft[] {
  return tasks.map((task) => ({
    id: task.id,
    subject: task.subject,
    description: task.description ?? '',
    statusId: task.statusId ?? 0,
    assignedTo: task.assignedTo ?? null,
    activityDate: task.activityDate ?? '',
    startTime: task.startTime ?? '',
    totalTimeSpentMinutes: task.totalTimeSpentMinutes ?? null,
  }));
}

export interface NewTaskValues {
  subject: string;
  description: string;
  statusId: number;
  assignedTo: number | null;
  activityDate: string;
  startTime: string;
  totalTimeSpentMinutes: number | null;
}

/** Payload task baru untuk POST /api/taiga/items; field kosong tidak dikirim. */
export function buildNewTaskItem(userStoryId: number, values: NewTaskValues) {
  return {
    kind: 'task' as const,
    subject: values.subject.trim(),
    userStoryId,
    ...(values.description ? { description: values.description } : {}),
    ...(values.statusId > 0 ? { statusId: values.statusId } : {}),
    ...(values.assignedTo != null ? { assignedTo: values.assignedTo } : {}),
    ...(values.activityDate ? { activityDate: values.activityDate } : {}),
    ...(values.startTime ? { startTime: values.startTime } : {}),
    ...(values.totalTimeSpentMinutes != null
      ? { totalTimeSpentMinutes: values.totalTimeSpentMinutes }
      : {}),
  };
}

/** Hanya task yang benar-benar berubah yang dikirim ke Taiga. */
export function changedTaskUpdates(
  original: ReleaseNoteTask[],
  drafts: ReleaseTaskDraft[],
): ReleaseTaskUpdate[] {
  const updates: ReleaseTaskUpdate[] = [];

  for (const draft of drafts) {
    const before = original.find((task) => task.id === draft.id);
    if (!before) continue;

    const subject = draft.subject.trim();
    if (!subject) continue;

    const statusChanged =
      draft.statusId > 0 && draft.statusId !== before.statusId;
    const descriptionChanged =
      (draft.description ?? '') !== (before.description ?? '');
    const assigneeChanged =
      (draft.assignedTo ?? null) !== (before.assignedTo ?? null);
    const timesheetChanged =
      draft.activityDate !== (before.activityDate ?? '') ||
      draft.startTime !== (before.startTime ?? '') ||
      (draft.totalTimeSpentMinutes ?? null) !==
        (before.totalTimeSpentMinutes ?? null);
    if (
      subject === before.subject.trim() &&
      !statusChanged &&
      !descriptionChanged &&
      !assigneeChanged &&
      !timesheetChanged
    ) {
      continue;
    }

    updates.push({
      taskId: draft.id,
      subject,
      description: draft.description ?? '',
      ...(draft.statusId > 0 ? { statusId: draft.statusId } : {}),
      ...(assigneeChanged ? { assignedTo: draft.assignedTo } : {}),
      ...(timesheetChanged
        ? {
            activityDate: draft.activityDate || undefined,
            startTime: draft.startTime || undefined,
            totalTimeSpentMinutes: draft.totalTimeSpentMinutes,
          }
        : {}),
    });
  }

  return updates;
}
