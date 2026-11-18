'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Select } from '@/components/Select';
import { TIME_SLOTS } from '@/app/tasks/smart-task/types';
import {
  TASK_TEMPLATES,
  type DeploymentTask,
  type ReleaseMember,
} from '@/lib/release-deployment/model';

interface TaskChecklistProps {
  tasks: DeploymentTask[];
  members: ReleaseMember[];
  onAddTemplate: (label: string) => void;
  onAddManual: () => void;
  onChange: (id: string, changes: Partial<DeploymentTask>) => void;
  onRemove: (id: string) => void;
}

export function TaskChecklist({
  tasks,
  members,
  onAddTemplate,
  onAddManual,
  onChange,
  onRemove,
}: TaskChecklistProps) {
  return (
    <div>
      <p className='hint mb-2'>
        Klik chip untuk menambah task ke daftar. Task dari chip diberi badge
        TEMPLATE. Assignee, Activity Date, Start Time, dan Total Time Spent
        opsional; assignee dan waktu dikirim ke task Taiga.
      </p>

      <div className='flex flex-wrap gap-2 mb-3'>
        {TASK_TEMPLATES.map((template) => (
          <button
            key={template.key}
            type='button'
            onClick={() => onAddTemplate(template.label)}
            className='inline-flex items-center gap-1 rounded-full border border-dashed border-brand px-3.5 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand-light'
          >
            <Plus size={12} />
            {template.label}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <p className='rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-slate-400'>
          Belum ada task. Tambahkan dari chip atau tombol task manual.
        </p>
      ) : (
        <ul className='space-y-2'>
          {tasks.map((task, index) => (
            <li
              key={task.id}
              className='rounded-lg border border-border px-3 py-2.5'
            >
              <div className='flex items-center gap-2.5'>
                <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-[11px] font-bold text-brand'>
                  {index + 1}
                </span>
                <input
                  type='text'
                  value={task.subject}
                  onChange={(event) =>
                    onChange(task.id, { subject: event.target.value })
                  }
                  placeholder='Nama task deployment...'
                  aria-label={`Task ${index + 1}`}
                  className='input !h-9 flex-1 text-[13px]'
                />
                {task.template && (
                  <span className='shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700'>
                    TEMPLATE
                  </span>
                )}
                <button
                  type='button'
                  onClick={() => onRemove(task.id)}
                  aria-label={`Hapus task ${index + 1}`}
                  className='btn btn-ghost btn-icon !h-8 !w-8 shrink-0 text-slate-400 hover:text-rose-600'
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className='mt-2 grid grid-cols-1 gap-2 pl-8 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='field !gap-1'>
                  <label
                    htmlFor={`task-date-${task.id}`}
                    className='!text-[11px]'
                  >
                    Activity Date
                  </label>
                  <input
                    id={`task-date-${task.id}`}
                    type='date'
                    className='input !h-8 text-[12px]'
                    value={task.activityDate}
                    onChange={(event) =>
                      onChange(task.id, { activityDate: event.target.value })
                    }
                  />
                </div>
                <div className='field !gap-1'>
                  <label
                    htmlFor={`task-start-${task.id}`}
                    className='!text-[11px]'
                  >
                    Start Time
                  </label>
                  <Select
                    id={`task-start-${task.id}`}
                    aria-label={`Start Time task ${index + 1}`}
                    size='sm'
                    value={task.startTime}
                    placeholder='Pilih jam'
                    onChange={(event) =>
                      onChange(task.id, { startTime: event.target.value })
                    }
                  >
                    <option value=''>Tanpa jam</option>
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className='field !gap-1'>
                  <label
                    htmlFor={`task-spent-${task.id}`}
                    className='!text-[11px]'
                  >
                    Total Time Spent (menit)
                  </label>
                  <div className='relative flex w-full items-center'>
                    <input
                      id={`task-spent-${task.id}`}
                      type='number'
                      min={0}
                      step={15}
                      placeholder='60'
                      className='input !h-8 pr-9 text-[12px] font-mono'
                      value={task.totalTimeSpent}
                      onChange={(event) =>
                        onChange(task.id, {
                          totalTimeSpent: event.target.value,
                        })
                      }
                    />
                    {task.totalTimeSpent.trim() ? (
                      <span className='pointer-events-none absolute right-2 text-[11px] font-mono font-semibold text-slate-400'>
                        {(Number(task.totalTimeSpent) / 60).toFixed(1)}j
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className='field !gap-1'>
                  <label
                    htmlFor={`task-assignee-${task.id}`}
                    className='!text-[11px]'
                  >
                    Assignee
                  </label>
                  <Select
                    id={`task-assignee-${task.id}`}
                    aria-label={`Assignee task ${index + 1}`}
                    size='sm'
                    value={task.assigneeId === null ? '' : String(task.assigneeId)}
                    placeholder='Tanpa assignee'
                    onChange={(event) =>
                      onChange(task.id, {
                        assigneeId: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                    options={[
                      { value: '', label: 'Tanpa assignee' },
                      ...members.map((member) => ({
                        value: String(member.id),
                        label: member.name,
                      })),
                    ]}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type='button'
        onClick={onAddManual}
        className='btn btn-ghost btn-sm mt-3 text-brand'
      >
        <Plus size={14} />
        Tambah task manual
      </button>
    </div>
  );
}
