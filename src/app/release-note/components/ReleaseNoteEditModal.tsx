'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Select } from '@/components/Select';
import { SmartTaskTimesheetLog } from '@/app/tasks/smart-task/SmartTaskTimesheetLog';
import type { ReleaseNoteDetail } from '@/lib/release-note/model';
import {
  changedTaskUpdates,
  toTaskDrafts,
  type ReleaseTaskDraft,
} from '@/lib/release-note/edit';

interface StatusOption {
  id: number;
  name: string;
}

interface ReleaseNoteEditModalProps {
  noteRef: number;
  onClose: () => void;
  onSaved: () => void;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Edit judul, status, dan deskripsi release note beserta task deployment-nya. */
export function ReleaseNoteEditModal({
  noteRef,
  onClose,
  onSaved,
}: ReleaseNoteEditModalProps) {
  const [detail, setDetail] = useState<ReleaseNoteDetail | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState(0);
  const [tasks, setTasks] = useState<ReleaseTaskDraft[]>([]);
  const [userStoryStatuses, setUserStoryStatuses] = useState<StatusOption[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<StatusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([
      fetch(`/api/release-note/detail?ref=${noteRef}`).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? 'Gagal memuat release note');
        }
        return payload.note as ReleaseNoteDetail;
      }),
      fetch('/api/release-note/statuses')
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok) return { userStory: [], task: [] };
          return payload as { userStory: StatusOption[]; task: StatusOption[] };
        })
        .catch(() => ({ userStory: [], task: [] })),
    ])
      .then(([note, statuses]) => {
        if (ignore) return;
        setDetail(note);
        setSubject(note.subject);
        setDescription(note.description);
        setStatusId(note.statusId ?? 0);
        setTasks(toTaskDrafts(note.tasks));
        setUserStoryStatuses(statuses.userStory);
        setTaskStatuses(statuses.task);
      })
      .catch((err) => {
        if (!ignore) setLoadError(messageOf(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [noteRef]);

  function patchTask(id: number, changes: Partial<ReleaseTaskDraft>) {
    setTasks((previous) =>
      previous.map((task) => (task.id === id ? { ...task, ...changes } : task)),
    );
  }

  async function save() {
    if (saving || !detail) return;
    if (!subject.trim()) {
      setError('Judul release note tidak boleh kosong.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const storyChanged =
        subject.trim() !== detail.subject.trim() ||
        description !== detail.description ||
        (statusId > 0 && statusId !== (detail.statusId ?? 0));
      const updates = changedTaskUpdates(detail.tasks, tasks);

      if (!storyChanged && updates.length === 0) {
        onClose();
        return;
      }

      if (storyChanged) {
        const storyResponse = await fetch('/api/taiga/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'userstory',
            userStoryId: detail.id,
            subject: subject.trim(),
            description,
            ...(statusId > 0 ? { statusId } : {}),
          }),
        });
        const storyData = await storyResponse.json();
        if (!storyResponse.ok) {
          throw new Error(storyData.error ?? 'Gagal menyimpan release note');
        }
      }

      const failures: string[] = [];
      for (const item of updates) {
        const response = await fetch('/api/taiga/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          failures.push(data.error ?? `Task #${item.taskId} gagal disimpan`);
        }
      }

      onSaved();
      if (failures.length > 0) {
        setError(
          `Release note tersimpan, tetapi ${failures.length} task gagal: ${failures.join('; ')}`,
        );
        return;
      }
      onClose();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setSaving(false);
    }
  }

  const currentUserStoryStatus = detail
    ? userStoryStatuses.some((status) => status.id === statusId)
      ? null
      : { id: statusId, name: detail.status.name }
    : null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      size='xl'
      title={`Edit Release Note #${noteRef}`}
      subtitle='Perubahan langsung disimpan ke Taiga.'
      footer={
        <div className='flex flex-wrap items-center justify-end gap-2'>
          <button
            type='button'
            className='btn btn-ghost'
            onClick={onClose}
            disabled={saving}
          >
            Batal
          </button>
          <button
            type='button'
            className='btn btn-primary'
            onClick={() => void save()}
            disabled={saving || loading || !detail}
          >
            {saving ? (
              <Loader2 size={16} className='animate-spin' />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      }
    >
      {loading ? (
        <div className='py-12 flex items-center justify-center gap-2 text-slate-500 text-sm'>
          <Loader2 size={16} className='animate-spin' />
          Memuat release note...
        </div>
      ) : loadError ? (
        <div className='alert alert-error flex items-start gap-2'>
          <AlertCircle size={16} className='mt-0.5 shrink-0' />
          <span>{loadError}</span>
        </div>
      ) : detail ? (
        <div className='space-y-5'>
          {error && (
            <div className='alert alert-error flex items-start gap-2'>
              <AlertCircle size={16} className='mt-0.5 shrink-0' />
              <span>{error}</span>
            </div>
          )}

          <div className='field'>
            <label htmlFor='edit-note-subject' className='text-xs font-bold text-slate-700'>
              Judul user story <span className='text-rose-500'>*</span>
            </label>
            <input
              id='edit-note-subject'
              className='input'
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              disabled={saving}
            />
          </div>

          <div className='field'>
            <label htmlFor='edit-note-status' className='text-xs font-bold text-slate-700'>
              Status
            </label>
            <Select
              id='edit-note-status'
              aria-label='Status user story'
              value={statusId}
              onChange={(event) => setStatusId(Number(event.target.value))}
              disabled={saving || userStoryStatuses.length === 0}
            >
              {currentUserStoryStatus && (
                <option value={currentUserStoryStatus.id}>
                  {currentUserStoryStatus.name}
                </option>
              )}
              {userStoryStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Select>
          </div>

          <div className='field'>
            <label htmlFor='edit-note-description' className='text-xs font-bold text-slate-700'>
              Deskripsi
            </label>
            <textarea
              id='edit-note-description'
              className='input min-h-[140px] py-2'
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={saving}
            />
          </div>

          <section>
            <h2 className='card-title mb-2'>
              Task deployment ({tasks.length})
            </h2>
            {tasks.length === 0 ? (
              <p className='muted text-[13px]'>
                Belum ada task di bawah user story ini.
              </p>
            ) : (
              <div className='space-y-3'>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className='rounded-xl border border-border p-3 space-y-2.5'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-mono text-[12px] text-slate-500'>
                        #{detail.tasks.find((item) => item.id === task.id)?.ref}
                      </span>
                      <Select
                        aria-label={`Status task ${task.id}`}
                        value={task.statusId}
                        onChange={(event) =>
                          patchTask(task.id, { statusId: Number(event.target.value) })
                        }
                        disabled={saving || taskStatuses.length === 0}
                        className='!h-9 w-[190px] text-xs'
                      >
                        {!taskStatuses.some((status) => status.id === task.statusId) && (
                          <option value={task.statusId}>
                            {detail.tasks.find((item) => item.id === task.id)?.status.name ??
                              'Status saat ini'}
                          </option>
                        )}
                        {taskStatuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <input
                      className='input h-10'
                      aria-label={`Judul task ${task.id}`}
                      value={task.subject}
                      onChange={(event) =>
                        patchTask(task.id, { subject: event.target.value })
                      }
                      disabled={saving}
                    />
                    <textarea
                      className='input min-h-[64px] py-2 text-[13px]'
                      aria-label={`Deskripsi task ${task.id}`}
                      placeholder='Deskripsi task (opsional)'
                      value={task.description}
                      onChange={(event) =>
                        patchTask(task.id, { description: event.target.value })
                      }
                      disabled={saving}
                    />
                    <SmartTaskTimesheetLog
                      activityDate={task.activityDate}
                      startTime={task.startTime}
                      totalTimeSpentMinutes={task.totalTimeSpentMinutes}
                      onUpdateDate={(date) =>
                        patchTask(task.id, { activityDate: date })
                      }
                      onUpdateStartTime={(time) =>
                        patchTask(task.id, { startTime: time })
                      }
                      onUpdateDuration={(mins) =>
                        patchTask(task.id, {
                          totalTimeSpentMinutes: mins,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
