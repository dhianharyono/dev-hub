'use client';

import { ExternalLink } from 'lucide-react';
import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';
import { AssignedTaskRow } from './AssignedTaskRow';
import type { ProjectTaskGroup, Status } from './types';

interface AssignedProjectGroupProps {
  group: ProjectTaskGroup;
  baseUrl: string;
  availableStatuses: Status[];
  updatingTaskId: number | null;
  updateSuccessTaskId: number | null;
  editingTaskId: number | null;
  editingSubject: string;
  savingEdit: boolean;
  onStartEdit: (task: AssignedTaskItem) => void;
  onCancelEdit: () => void;
  onSaveSubject: (task: AssignedTaskItem) => void;
  onEditingSubjectChange: (val: string) => void;
  onUpdateStatus: (task: AssignedTaskItem, newStatusId: number) => void;
}

export function AssignedProjectGroup({
  group,
  baseUrl,
  availableStatuses,
  updatingTaskId,
  updateSuccessTaskId,
  editingTaskId,
  editingSubject,
  savingEdit,
  onStartEdit,
  onCancelEdit,
  onSaveSubject,
  onEditingSubjectChange,
  onUpdateStatus,
}: AssignedProjectGroupProps) {
  return (
    <div className='border border-border rounded-2xl overflow-hidden bg-surface shadow-xs'>
      {/* Project Header Bar */}
      <div className='flex items-center justify-between px-5 py-3.5 bg-surface-hover border-b border-border'>
        <div className='flex items-center gap-2.5'>
          <span className='text-sm font-bold text-slate-text'>
            {group.projectName}
          </span>
          <span className='badge badge-neutral text-xs px-2.5 py-0.5 rounded-md'>
            {group.tasks.length} task
          </span>
        </div>

        <a
          href={`${baseUrl}/project/${group.projectSlug}/taskboard`}
          target='_blank'
          rel='noreferrer'
          className='btn btn-ghost btn-sm text-xs px-3 py-1.5 h-8 inline-flex items-center gap-1.5'
          title='Buka taskboard proyek di Taiga'
        >
          <span>Taskboard Proyek</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Table of Tasks */}
      <div className='overflow-x-auto'>
        <table className='table min-w-[780px]'>
          <thead>
            <tr className='bg-surface-subtle/50 whitespace-nowrap'>
              <th className='w-[85px]'>#Ref</th>
              <th className='min-w-[240px]'>Judul Task</th>
              <th className='w-[240px]'>
                User Story Induk
              </th>
              <th className='w-[105px] text-center'>
                Jam
              </th>
              <th className='w-[210px] text-right'>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {group.tasks.map((task) => (
              <AssignedTaskRow
                key={task.id}
                task={task}
                projectSlug={group.projectSlug}
                baseUrl={baseUrl}
                availableStatuses={availableStatuses}
                isUpdating={updatingTaskId === task.id}
                isSuccess={updateSuccessTaskId === task.id}
                isEditingThis={editingTaskId === task.id}
                editingSubject={editingSubject}
                savingEdit={savingEdit}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveSubject={onSaveSubject}
                onEditingSubjectChange={onEditingSubjectChange}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
