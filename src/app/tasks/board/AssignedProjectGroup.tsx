'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';
import { AssignedTaskRow } from './AssignedTaskRow';
import type { ProjectTaskGroup, Status } from './types';

interface AssignedProjectGroupProps {
  group: ProjectTaskGroup;
  isAllTasks?: boolean;
  baseUrl: string;
  availableStatuses: Status[];
  updatingTaskId: number | null;
  updateSuccessTaskId: number | null;
  deletingTaskId: number | null;
  editingTaskId: number | null;
  editingSubject: string;
  savingEdit: boolean;
  onCancelEdit: () => void;
  onSaveSubject: (task: AssignedTaskItem) => void;
  onEditingSubjectChange: (val: string) => void;
  onOpenEditModal: (task: AssignedTaskItem) => void;
  onUpdateStatus: (task: AssignedTaskItem, newStatusId: number) => void;
  onRequestDelete: (task: AssignedTaskItem) => void;
}

export function AssignedProjectGroup({
  group,
  isAllTasks = false,
  baseUrl,
  availableStatuses,
  updatingTaskId,
  updateSuccessTaskId,
  deletingTaskId,
  editingTaskId,
  editingSubject,
  savingEdit,
  onCancelEdit,
  onSaveSubject,
  onEditingSubjectChange,
  onOpenEditModal,
  onUpdateStatus,
  onRequestDelete,
}: AssignedProjectGroupProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalTasks = group.tasks.length;
  const totalPages = isAllTasks ? Math.max(1, Math.ceil(totalTasks / pageSize)) : 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);

  // Urutkan per project: startTime terbaru di atas, yang kosong di akhir.
  // Task tanpa startTime diurutkan ref ascending; waktu sama tetap stabil.
  const sortedTasks = useMemo(
    () =>
      group.tasks
        .map((task, index) => ({ task, index }))
        .sort((a, b) => {
          const aTime = a.task.startTime || '';
          const bTime = b.task.startTime || '';
          if (!aTime && !bTime) return a.task.ref - b.task.ref;
          if (!aTime) return 1;
          if (!bTime) return -1;
          if (aTime !== bTime) return bTime.localeCompare(aTime);
          return a.index - b.index;
        })
        .map(({ task }) => task),
    [group.tasks],
  );

  const displayedTasks = isAllTasks
    ? sortedTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedTasks;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalTasks);

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
      </div>

      {/* Table of Tasks */}
      <div className='overflow-x-auto'>
        <table className='table min-w-[920px]'>
          <thead>
            <tr className='bg-surface-subtle/50 whitespace-nowrap'>
              <th className='w-[85px]'>#Ref</th>
              <th className='min-w-[240px]'>Judul Task</th>
              <th className='w-[240px]'>User Story Induk</th>
              <th className='w-[105px] text-center'>Jam</th>
              <th className='w-[80px] text-center'>Waktu</th>
              <th className='w-[210px] text-right'>Status</th>
              <th className='w-[56px] text-right'>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {displayedTasks.map((task) => (
              <AssignedTaskRow
                key={task.id}
                task={task}
                projectSlug={group.projectSlug}
                baseUrl={baseUrl}
                availableStatuses={availableStatuses}
                isUpdating={updatingTaskId === task.id}
                isSuccess={updateSuccessTaskId === task.id}
                isDeleting={deletingTaskId === task.id}
                isEditingThis={editingTaskId === task.id}
                editingSubject={editingSubject}
                savingEdit={savingEdit}
                onCancelEdit={onCancelEdit}
                onSaveSubject={onSaveSubject}
                onEditingSubjectChange={onEditingSubjectChange}
                onOpenEditModal={onOpenEditModal}
                onUpdateStatus={onUpdateStatus}
                onRequestDelete={onRequestDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination (Semua Task) */}
      {isAllTasks && totalTasks > 0 && (
        <div className='flex items-center justify-between px-5 py-3.5 bg-surface-subtle/50 border-t border-border flex-wrap gap-3'>
          <div className='text-xs text-slate-muted'>
            Menampilkan <span className='font-semibold text-slate-text'>{startIndex + 1}</span> -{' '}
            <span className='font-semibold text-slate-text'>{endIndex}</span> dari{' '}
            <span className='font-semibold text-slate-text'>{totalTasks}</span> task
            {totalPages > 1 && (
              <>
                {' '}(Halaman <span className='font-semibold text-slate-text'>{currentPage}</span> dari{' '}
                <span className='font-semibold text-slate-text'>{totalPages}</span>)
              </>
            )}
          </div>

          {totalPages > 1 && (
            <div className='flex items-center gap-1.5'>
              <button
                type='button'
                className='btn btn-ghost btn-sm text-xs px-2.5 py-1 h-7 text-slate-600 hover:text-slate-900 border border-border bg-surface'
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label='Halaman Sebelumnya'
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((pNum) => {
                  return (
                    pNum === 1 ||
                    pNum === totalPages ||
                    Math.abs(pNum - currentPage) <= 1
                  );
                })
                .reduce<Array<number | string>>((acc, pNum, idx, arr) => {
                  if (idx > 0 && pNum - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(pNum);
                  return acc;
                }, [])
                .map((item, idx) =>
                  typeof item === 'string' ? (
                    <span key={`dots-${idx}`} className='text-slate-400 text-xs px-1 select-none'>
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      type='button'
                      className={`btn ${
                        item === currentPage
                          ? 'btn-primary font-bold shadow-xs'
                          : 'btn-ghost font-medium text-slate-600 hover:text-slate-900 border border-border bg-surface'
                      } btn-sm px-2.5 py-1 min-w-7 h-7 text-xs`}
                      onClick={() => setPage(item)}
                      aria-current={item === currentPage ? 'page' : undefined}
                    >
                      {item}
                    </button>
                  ),
                )}

              <button
                type='button'
                className='btn btn-ghost btn-sm text-xs px-2.5 py-1 h-7 text-slate-600 hover:text-slate-900 border border-border bg-surface'
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label='Halaman Selanjutnya'
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
