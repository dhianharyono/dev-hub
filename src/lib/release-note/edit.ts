import type { ReleaseNoteTask } from './model';

export interface ReleaseTaskDraft {
  id: number;
  subject: string;
  description: string;
  statusId: number;
}

export interface ReleaseTaskUpdate {
  taskId: number;
  subject: string;
  description: string;
  statusId?: number;
}

/** Nilai awal editor task dari data detail release note. */
export function toTaskDrafts(tasks: ReleaseNoteTask[]): ReleaseTaskDraft[] {
  return tasks.map((task) => ({
    id: task.id,
    subject: task.subject,
    description: task.description ?? '',
    statusId: task.statusId ?? 0,
  }));
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
    if (subject === before.subject.trim() && !statusChanged && !descriptionChanged) {
      continue;
    }

    updates.push({
      taskId: draft.id,
      subject,
      description: draft.description ?? '',
      ...(draft.statusId > 0 ? { statusId: draft.statusId } : {}),
    });
  }

  return updates;
}
