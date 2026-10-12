'use client';

import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { AssignedProjectGroup } from './board/AssignedProjectGroup';
import { AssignedTasksEmptyState } from './board/AssignedTasksEmptyState';
import { AssignedTasksToolbar } from './board/AssignedTasksToolbar';
import type { AssignedTasksBoardProps } from './board/types';
import { useAssignedBoard } from './board/useAssignedBoard';

export type { Status, AssignedTasksBoardProps } from './board/types';

export default function AssignedTasksBoard({
  assignedTasks,
  setAssignedTasks,
  projectStatuses,
  assignedProjects,
  loadingAssigned,
  assignedError,
  assignedActiveOnly,
  setAssignedActiveOnly,
  onRefresh,
  baseUrl = 'https://tree.taiga.io',
  onNavigateToStudio,
}: AssignedTasksBoardProps) {
  const board = useAssignedBoard({
    assignedTasks,
    setAssignedTasks,
    projectStatuses,
  });

  return (
    <section
      className='card'
      aria-labelledby='my-tasks-title'
    >
      <AssignedTasksToolbar
        loadingAssigned={loadingAssigned}
        assignedActiveOnly={assignedActiveOnly}
        setAssignedActiveOnly={setAssignedActiveOnly}
        onRefresh={onRefresh}
        assignedProjects={assignedProjects}
        selectedAssignedProject={board.selectedAssignedProject}
        setSelectedAssignedProject={board.setSelectedAssignedProject}
        assignedSearch={board.assignedSearch}
        setAssignedSearch={board.setAssignedSearch}
      />

      {loadingAssigned && assignedTasks.length === 0 ? (
        <div className='py-10 px-5 text-center flex flex-col items-center gap-2'>
          <span className='spinner w-[22px] h-[22px]' />
          <span className='dim xs'>Memuat daftar task Anda dari Taiga...</span>
        </div>
      ) : assignedError ? (
        <EmptyState
          tone='rose'
          icon={<AlertCircle size={26} strokeWidth={2.2} />}
          title='Gagal Memuat Task dari Taiga'
          description={assignedError}
          action={
            <div className='flex items-center gap-2.5 flex-wrap'>
              <button
                type='button'
                className='btn btn-sm text-[12.5px] gap-1.5'
                onClick={() => onRefresh(assignedActiveOnly)}
              >
                <RefreshCw size={13} />
                <span>Coba Muat Ulang</span>
              </button>
              <Link
                href='/settings'
                className='btn btn-sm btn-ghost text-[12.5px] border border-(--border)'
              >
                Pengaturan Token
              </Link>
            </div>
          }
        />
      ) : board.groupedTasksByProject.length === 0 ? (
        <AssignedTasksEmptyState
          assignedActiveOnly={assignedActiveOnly}
          setAssignedActiveOnly={setAssignedActiveOnly}
          onRefresh={onRefresh}
          onNavigateToStudio={onNavigateToStudio}
          searchQuery={board.assignedSearch}
          onClearSearch={() => board.setAssignedSearch('')}
          selectedProject={board.selectedAssignedProject}
          onResetProject={() => board.setSelectedAssignedProject('all')}
          hasAnyTasks={assignedTasks.length > 0}
        />
      ) : (
        <div className='flex flex-col gap-[22px]'>
          {board.groupedTasksByProject.map((group) => (
            <AssignedProjectGroup
              key={group.projectId}
              group={group}
              baseUrl={baseUrl}
              availableStatuses={projectStatuses[group.projectId] || []}
              updatingTaskId={board.updatingTaskId}
              updateSuccessTaskId={board.updateSuccessTaskId}
              editingTaskId={board.editingTaskId}
              editingSubject={board.editingSubject}
              savingEdit={board.savingEdit}
              onStartEdit={board.handleStartEdit}
              onCancelEdit={board.handleCancelEdit}
              onSaveSubject={board.handleSaveSubject}
              onEditingSubjectChange={board.setEditingSubject}
              onUpdateStatus={board.handleUpdateStatus}
            />
          ))}
        </div>
      )}
    </section>
  );
}
