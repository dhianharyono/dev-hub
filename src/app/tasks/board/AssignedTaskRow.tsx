'use client';

import { CheckCircle2, Clock, ExternalLink, Pencil, X } from 'lucide-react';
import { Select } from '@/components/Select';
import { formatTaskSubject } from '@/lib/task-utils';
import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';
import type { Status } from './types';

interface AssignedTaskRowProps {
  task: AssignedTaskItem;
  projectSlug: string;
  baseUrl: string;
  availableStatuses: Status[];
  isUpdating: boolean;
  isSuccess: boolean;
  isEditingThis: boolean;
  editingSubject: string;
  savingEdit: boolean;
  onStartEdit: (task: AssignedTaskItem) => void;
  onCancelEdit: () => void;
  onSaveSubject: (task: AssignedTaskItem) => void;
  onEditingSubjectChange: (val: string) => void;
  onUpdateStatus: (task: AssignedTaskItem, newStatusId: number) => void;
}

export function AssignedTaskRow({
  task,
  projectSlug,
  baseUrl,
  availableStatuses,
  isUpdating,
  isSuccess,
  isEditingThis,
  editingSubject,
  savingEdit,
  onStartEdit,
  onCancelEdit,
  onSaveSubject,
  onEditingSubjectChange,
  onUpdateStatus,
}: AssignedTaskRowProps) {
  const taskFormatted = formatTaskSubject(task.subject);

  return (
    <tr
      className={`border-b border-border transition-colors ${
        task.isClosed ? 'bg-black/[0.02]' : 'hover:bg-surface-hover/60'
      }`}
    >
      {/* Ref & Link */}
      <td className='align-middle whitespace-nowrap'>
        <a
          href={`${baseUrl}/project/${projectSlug}/task/${task.ref}`}
          target='_blank'
          rel='noreferrer'
          className='font-bold text-cyan-600 dark:text-cyan-400 inline-flex items-center gap-1 hover:underline text-xs sm:text-[13px]'
          title='Lihat detail di Taiga'
        >
          #{task.ref}
          <ExternalLink size={11} />
        </a>
      </td>

      {/* Subject & Inline Edit */}
      <td className='align-middle min-w-[240px]'>
        {isEditingThis ? (
          <div className='flex items-center gap-2'>
            <input
              type='text'
              className='input !h-9 !text-xs sm:!text-[13px] flex-1 px-3 rounded-lg'
              value={editingSubject}
              onChange={(e) => onEditingSubjectChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSaveSubject(task);
                } else if (e.key === 'Escape') {
                  onCancelEdit();
                }
              }}
              autoFocus
            />
            <button
              type='button'
              className='btn btn-primary btn-sm px-3 py-1 text-xs'
              onClick={() => onSaveSubject(task)}
              disabled={savingEdit}
            >
              {savingEdit ? <span className='spinner' /> : 'Simpan'}
            </button>
            <button
              type='button'
              className='btn btn-ghost btn-sm px-2.5 py-1 text-xs'
              onClick={onCancelEdit}
              disabled={savingEdit}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className='flex items-center gap-2.5 flex-wrap'>
            <span
              className={`text-xs sm:text-sm ${
                task.isClosed
                  ? 'text-slate-400 line-through font-normal'
                  : 'text-slate-text font-medium'
              }`}
            >
              {taskFormatted}
            </span>

            <button
              type='button'
              onClick={() => onStartEdit(task)}
              className='w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors'
              title='Edit judul task'
            >
              <Pencil size={12} />
            </button>
          </div>
        )}
      </td>

      {/* User Story Parent */}
      <td className='align-middle whitespace-nowrap'>
        {task.userStory ? (
          <a
            href={`${baseUrl}/project/${projectSlug}/us/${task.userStory.ref}`}
            target='_blank'
            rel='noreferrer'
            className='text-xs sm:text-[13px] text-slate-600 hover:text-slate-900 inline-block max-w-[240px] truncate'
            title={`#${task.userStory.ref} ${task.userStory.subject}`}
          >
            <span className='font-bold text-violet-600 mr-1'>
              #{task.userStory.ref}
            </span>
            <span>{task.userStory.subject}</span>
          </a>
        ) : (
          <span className='text-xs text-slate-400'>-</span>
        )}
      </td>

      {/* Hours / Jam Cell */}
      <td className='align-middle text-center whitespace-nowrap'>
        {task.hours != null ? (
          <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 font-mono'>
            <Clock size={11} className='text-sky-600 shrink-0' />
            <span>{task.hours}h</span>
          </span>
        ) : (
          <span className='text-xs text-slate-400 font-mono'>-</span>
        )}
      </td>

      {/* Status Selector Cell */}
      <td className='align-middle text-right whitespace-nowrap'>
        <div className='inline-flex items-center justify-end gap-2'>
          <div className='relative inline-flex items-center w-[165px]'>
            <Select
              size='sm'
              value={task.status}
              disabled={isUpdating}
              aria-label={`Ubah status task #${task.ref}`}
              onChange={(e) => onUpdateStatus(task, Number(e.target.value))}
              className='w-full !h-9 text-xs font-semibold rounded-lg'
            >
              {availableStatuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.is_closed ? '(Closed)' : ''}
                </option>
              ))}
            </Select>
          </div>

          {/* Update Spinner / Success Feedback */}
          {isUpdating && (
            <span className='spinner w-3.5 h-3.5 shrink-0' />
          )}
          {isSuccess && (
            <span
              className='text-emerald-600 inline-flex items-center shrink-0'
              title='Status berhasil diperbarui di Taiga!'
            >
              <CheckCircle2 size={16} />
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
