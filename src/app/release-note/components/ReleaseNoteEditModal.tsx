'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Plus, Save } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Select } from '@/components/Select';
import { SmartTaskTimesheetLog } from '@/app/tasks/smart-task/SmartTaskTimesheetLog';
import type {
  ReleaseNoteDetail,
  ReleaseNoteTask,
} from '@/lib/release-note/model';
import type { ReleaseMember } from '@/lib/release-deployment/model';
import {
  buildNewTaskItem,
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

interface NewTaskForm {
  subject: string;
  description: string;
  statusId: number;
  assignedTo: number | null;
  activityDate: string;
  startTime: string;
  totalTimeSpentMinutes: number | null;
}

const EMPTY_TASK: NewTaskForm = {
  subject: '',
  description: '',
  statusId: 0,
  assignedTo: null,
  activityDate: '',
  startTime: '',
  totalTimeSpentMinutes: null,
};

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
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [tasks, setTasks] = useState<ReleaseTaskDraft[]>([]);
  const [members, setMembers] = useState<ReleaseMember[]>([]);
  const [userStoryStatuses, setUserStoryStatuses] = useState<StatusOption[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<StatusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState(false);
  const [newTask, setNewTask] = useState<NewTaskForm>(EMPTY_TASK);
  const [creatingTask, setCreatingTask] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
      fetch('/api/release-note/options')
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok) return [] as ReleaseMember[];
          return (payload.members ?? []) as ReleaseMember[];
        })
        .catch(() => [] as ReleaseMember[]),
    ])
      .then(([note, statuses, memberList]) => {
        if (ignore) return;
        setDetail(note);
        setSubject(note.subject);
        setDescription(note.description);
        setStatusId(note.statusId ?? 0);
        setAssignedTo(note.assignedTo ?? null);
        setTasks(toTaskDrafts(note.tasks));
        setUserStoryStatuses(statuses.userStory);
        setTaskStatuses(statuses.task);
        setMembers(memberList);
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

  function patchNewTask(changes: Partial<NewTaskForm>) {
    setNewTask((previous) => ({ ...previous, ...changes }));
  }

  async function createTask() {
    if (creatingTask || !detail) return;
    const subject = newTask.subject.trim();
    if (!subject) {
      setCreateError('Judul task tidak boleh kosong.');
      return;
    }

    setCreatingTask(true);
    setCreateError(null);
    try {
      const response = await fetch('/api/taiga/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: detail.projectId,
          items: [buildNewTaskItem(detail.id, { ...newTask, subject })],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Gagal menambah task');
      }
      const result = data.results?.[0] as
        | { ok: boolean; id?: number; ref?: number; url?: string; error?: string }
        | undefined;
      if (!result?.ok || !result.id || !result.ref) {
        throw new Error(result?.error ?? 'Gagal menambah task');
      }

      const created: ReleaseNoteTask = {
        id: result.id,
        ref: result.ref,
        subject,
        description: newTask.description,
        statusId: newTask.statusId || undefined,
        assignedTo: newTask.assignedTo,
        activityDate: newTask.activityDate,
        startTime: newTask.startTime,
        totalTimeSpentMinutes: newTask.totalTimeSpentMinutes,
        status: {
          name:
            taskStatuses.find((status) => status.id === newTask.statusId)
              ?.name ?? 'Baru',
          color: '#94a3b8',
          isClosed: false,
        },
        url: result.url ?? detail.url,
      };

      setDetail((previous) =>
        previous
          ? { ...previous, tasks: [...previous.tasks, created] }
          : previous,
      );
      setTasks((previous) => [
        ...previous,
        {
          id: created.id,
          subject,
          description: newTask.description,
          statusId: created.statusId ?? 0,
          assignedTo: newTask.assignedTo,
          activityDate: newTask.activityDate,
          startTime: newTask.startTime,
          totalTimeSpentMinutes: newTask.totalTimeSpentMinutes,
        },
      ]);
      setNewTask(EMPTY_TASK);
      setAddingTask(false);
    } catch (err) {
      setCreateError(messageOf(err));
    } finally {
      setCreatingTask(false);
    }
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
      const assigneeChanged = (assignedTo ?? null) !== (detail.assignedTo ?? null);
      const storyChanged =
        subject.trim() !== detail.subject.trim() ||
        description !== detail.description ||
        (statusId > 0 && statusId !== (detail.statusId ?? 0)) ||
        assigneeChanged;
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
            ...(assigneeChanged ? { assignedTo } : {}),
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
            <label htmlFor='edit-note-assignee' className='text-xs font-bold text-slate-700'>
              Assign To
            </label>
            <Select
              id='edit-note-assignee'
              aria-label='Assignee user story'
              value={assignedTo === null ? '' : String(assignedTo)}
              onChange={(event) =>
                setAssignedTo(
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              disabled={saving || members.length === 0}
            >
              <option value=''>Tanpa assignee</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
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
            <div className='flex items-center justify-between gap-2 mb-2'>
              <h2 className='card-title'>Task deployment ({tasks.length})</h2>
              {!addingTask && (
                <button
                  type='button'
                  className='btn btn-ghost btn-sm'
                  onClick={() => {
                    setCreateError(null);
                    setNewTask(EMPTY_TASK);
                    setAddingTask(true);
                  }}
                  disabled={saving}
                >
                  <Plus size={14} />
                  Tambah Task
                </button>
              )}
            </div>
            {addingTask && (
              <div className='rounded-xl border border-brand/40 bg-surface-subtle/60 p-3 space-y-2.5 mb-3'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-xs font-bold text-slate-500 uppercase tracking-wide'>
                    Task baru
                  </span>
                  <div className='flex items-center gap-2'>
                    <Select
                      aria-label='Assignee task baru'
                      value={
                        newTask.assignedTo === null
                          ? ''
                          : String(newTask.assignedTo)
                      }
                      onChange={(event) =>
                        patchNewTask({
                          assignedTo: event.target.value
                            ? Number(event.target.value)
                            : null,
                        })
                      }
                      disabled={creatingTask || members.length === 0}
                      className='!h-9 w-[190px] text-xs'
                    >
                      <option value=''>Tanpa assignee</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </Select>
                    <Select
                      aria-label='Status task baru'
                      value={newTask.statusId || ''}
                      onChange={(event) =>
                        patchNewTask({ statusId: Number(event.target.value) })
                      }
                      disabled={creatingTask || taskStatuses.length === 0}
                      className='!h-9 w-[190px] text-xs'
                    >
                      <option value=''>Default task status</option>
                      {taskStatuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <input
                  className='input h-10'
                  aria-label='Judul task baru'
                  placeholder='Judul task (wajib)'
                  value={newTask.subject}
                  onChange={(event) =>
                    patchNewTask({ subject: event.target.value })
                  }
                  disabled={creatingTask}
                />
                <textarea
                  className='input min-h-[64px] py-2 text-[13px]'
                  aria-label='Deskripsi task baru'
                  placeholder='Deskripsi task (opsional)'
                  value={newTask.description}
                  onChange={(event) =>
                    patchNewTask({ description: event.target.value })
                  }
                  disabled={creatingTask}
                />
                <SmartTaskTimesheetLog
                  activityDate={newTask.activityDate}
                  startTime={newTask.startTime}
                  totalTimeSpentMinutes={newTask.totalTimeSpentMinutes}
                  onUpdateDate={(date) => patchNewTask({ activityDate: date })}
                  onUpdateStartTime={(time) => patchNewTask({ startTime: time })}
                  onUpdateDuration={(mins) =>
                    patchNewTask({ totalTimeSpentMinutes: mins })
                  }
                />
                {createError && (
                  <div className='alert alert-error flex items-start gap-2'>
                    <AlertCircle size={16} className='mt-0.5 shrink-0' />
                    <span>{createError}</span>
                  </div>
                )}
                <div className='flex items-center justify-end gap-2'>
                  <button
                    type='button'
                    className='btn btn-ghost btn-sm'
                    onClick={() => {
                      setAddingTask(false);
                      setCreateError(null);
                      setNewTask(EMPTY_TASK);
                    }}
                    disabled={creatingTask}
                  >
                    Batal
                  </button>
                  <button
                    type='button'
                    className='btn btn-primary btn-sm'
                    onClick={() => void createTask()}
                    disabled={creatingTask}
                  >
                    {creatingTask ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : (
                      <Plus size={14} />
                    )}
                    {creatingTask ? 'Menyimpan...' : 'Simpan Task'}
                  </button>
                </div>
              </div>
            )}
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
                    <div className='flex items-center justify-between gap-2 flex-wrap'>
                      <span className='font-mono text-[12px] text-slate-500'>
                        #{detail.tasks.find((item) => item.id === task.id)?.ref}
                      </span>
                      <div className='flex items-center gap-2'>
                        <Select
                          aria-label={`Assignee task ${task.id}`}
                          value={
                            task.assignedTo === null
                              ? ''
                              : String(task.assignedTo)
                          }
                          onChange={(event) =>
                            patchTask(task.id, {
                              assignedTo: event.target.value
                                ? Number(event.target.value)
                                : null,
                            })
                          }
                          disabled={saving || members.length === 0}
                          className='!h-9 w-[190px] text-xs'
                        >
                          <option value=''>Tanpa assignee</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </Select>
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
