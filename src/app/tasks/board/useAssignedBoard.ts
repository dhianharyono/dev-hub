'use client';

import { useMemo, useState } from 'react';
import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';
import type { ProjectTaskGroup, Status } from './types';

interface UseAssignedBoardProps {
  assignedTasks: AssignedTaskItem[];
  setAssignedTasks: React.Dispatch<React.SetStateAction<AssignedTaskItem[]>>;
  projectStatuses: Record<number, Status[]>;
  assignedActiveOnly: boolean;
  onRefresh: (activeOnly?: boolean) => void;
}

export function useAssignedBoard({
  assignedTasks,
  setAssignedTasks,
  projectStatuses,
  assignedActiveOnly,
  onRefresh,
}: UseAssignedBoardProps) {
  const [assignedSearch, setAssignedSearch] = useState('');
  const [selectedAssignedProject, setSelectedAssignedProject] = useState<number | 'all'>('all');
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [updateSuccessTaskId, setUpdateSuccessTaskId] = useState<number | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<AssignedTaskItem | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingSubject, setEditingSubject] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const handleUpdateStatus = async (task: AssignedTaskItem, newStatusId: number) => {
    const prevStatus = task.status;
    const prevStatusExtra = task.statusExtraInfo;
    const statusesForProj = projectStatuses[task.projectId] || [];
    const newStatusObj = statusesForProj.find((s) => s.id === newStatusId);

    // Optimistic update
    setAssignedTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: newStatusId,
              statusExtraInfo: newStatusObj
                ? {
                    name: newStatusObj.name,
                    color: newStatusObj.color,
                    is_closed: newStatusObj.is_closed,
                  }
                : t.statusExtraInfo,
              isClosed: Boolean(newStatusObj?.is_closed),
            }
          : t,
      ),
    );

    setUpdatingTaskId(task.id);
    setUpdateSuccessTaskId(null);

    try {
      const res = await fetch('/api/taiga/assigned', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          statusId: newStatusId,
          isClosed: newStatusObj?.is_closed,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal memperbarui status task.');
      }
      setUpdateSuccessTaskId(task.id);
      setTimeout(() => setUpdateSuccessTaskId(null), 2500);
    } catch (e) {
      setAssignedTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: prevStatus,
                statusExtraInfo: prevStatusExtra,
              }
            : t,
        ),
      );
      alert((e as Error).message);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleStartEdit = (task: AssignedTaskItem) => {
    setEditingTaskId(task.id);
    setEditingSubject(task.subject);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingSubject('');
  };

  const handleSaveSubject = async (task: AssignedTaskItem) => {
    if (!editingSubject.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/taiga/assigned', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          subject: editingSubject.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal menyimpan perubahan judul.');
      }
      setAssignedTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, subject: editingSubject.trim() } : t,
        ),
      );
      setEditingTaskId(null);
      setUpdateSuccessTaskId(task.id);
      setTimeout(() => setUpdateSuccessTaskId(null), 2500);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSavingEdit(false);
    }
  };

  const groupedTasksByProject = useMemo(() => {
    const filtered = assignedTasks.filter((t) => {
      if (
        selectedAssignedProject !== 'all' &&
        t.projectId !== selectedAssignedProject
      ) {
        return false;
      }
      if (assignedSearch.trim()) {
        const q = assignedSearch.toLowerCase().trim();
        return (
          t.subject.toLowerCase().includes(q) ||
          String(t.ref).includes(q) ||
          t.projectName.toLowerCase().includes(q) ||
          (t.userStory && t.userStory.subject.toLowerCase().includes(q))
        );
      }
      return true;
    });

    const groups: ProjectTaskGroup[] = [];
    const map = new Map<number, AssignedTaskItem[]>();
    for (const t of filtered) {
      if (!map.has(t.projectId)) {
        map.set(t.projectId, []);
      }
      map.get(t.projectId)!.push(t);
    }

    for (const [pId, pTasks] of map.entries()) {
      const first = pTasks[0];
      groups.push({
        projectId: pId,
        projectName: first.projectName,
        projectSlug: first.projectSlug,
        tasks: pTasks,
      });
    }

    return groups;
  }, [assignedTasks, selectedAssignedProject, assignedSearch]);

  const [taskToEdit, setTaskToEdit] = useState<AssignedTaskItem | null>(null);

  const handleOpenEditModal = (task: AssignedTaskItem) => {
    setTaskToEdit(task);
  };

  const handleCloseEditModal = () => {
    setTaskToEdit(null);
  };

  const handleSaveTaskEdit = async (
    taskId: number,
    payload: {
      subject: string;
      description: string;
      statusId: number;
      hours: number | null;
      totalTimeSpentMinutes: number | null;
      activityDate?: string;
      startTime?: string;
      projectId: number;
      userStoryId: number | null;
    },
  ) => {
    const res = await fetch('/api/taiga/assigned', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId,
        subject: payload.subject,
        description: payload.description,
        statusId: payload.statusId,
        hours: payload.hours,
        totalTimeSpentMinutes: payload.totalTimeSpentMinutes,
        activityDate: payload.activityDate,
        startTime: payload.startTime,
        projectId: payload.projectId,
        userStoryId: payload.userStoryId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Gagal menyimpan perubahan task.');
    }

    const targetTask = assignedTasks.find((t) => t.id === taskId);
    const projectChanged = Boolean(
      targetTask && targetTask.projectId !== payload.projectId,
    );
    const statusesForProj = projectStatuses[payload.projectId] || [];
    const newStatusObj = statusesForProj.find((s) => s.id === payload.statusId);
    const updatedTask = data.task || {};
    const nextProjectId =
      updatedTask.projectId ?? updatedTask.project ?? payload.projectId;
    const nextProjectName =
      updatedTask.projectName ??
      updatedTask.project_extra_info?.name ??
      (projectChanged ? `Project #${nextProjectId}` : targetTask?.projectName);
    const nextProjectSlug =
      updatedTask.projectSlug ??
      updatedTask.project_extra_info?.slug ??
      targetTask?.projectSlug;
    const nextUserStory =
      payload.userStoryId == null
        ? null
        : updatedTask.userStory ??
          (targetTask?.userStory?.id === payload.userStoryId
            ? targetTask.userStory
            : null);

    setAssignedTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          ref: updatedTask.ref ?? t.ref,
          url: updatedTask.url ?? t.url,
          subject: payload.subject,
          description: payload.description,
          status: payload.statusId,
          statusExtraInfo: newStatusObj
            ? {
                name: newStatusObj.name,
                color: newStatusObj.color,
                is_closed: newStatusObj.is_closed,
              }
            : t.statusExtraInfo,
          isClosed: newStatusObj ? Boolean(newStatusObj.is_closed) : t.isClosed,
          projectId: nextProjectId,
          projectName: nextProjectName ?? t.projectName,
          projectSlug: nextProjectSlug ?? t.projectSlug,
          userStory: nextUserStory,
          hours: payload.hours,
          totalTimeSpentMinutes: payload.totalTimeSpentMinutes,
          activityDate: payload.activityDate,
          startTime: payload.startTime,
        };
      }),
    );

    if (projectChanged) {
      // Muat ulang agar status dan daftar project untuk grup baru ikut tersinkron.
      onRefresh(assignedActiveOnly);
    }

    setUpdateSuccessTaskId(taskId);
    setTimeout(() => setUpdateSuccessTaskId(null), 2500);
  };

  const handleRequestDelete = (task: AssignedTaskItem) => {
    setTaskToDelete(task);
    setDeleteError(null);
  };

  const handleCancelDelete = () => {
    if (deletingTaskId != null) return;
    setTaskToDelete(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    const target = taskToDelete;
    setDeletingTaskId(target.id);
    setDeleteError(null);

    try {
      const res = await fetch('/api/taiga/assigned', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: target.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal menghapus task.');
      }

      setAssignedTasks((prev) => prev.filter((t) => t.id !== target.id));
      setTaskToDelete(null);
    } catch (e) {
      setDeleteError((e as Error).message || 'Gagal menghapus task.');
    } finally {
      setDeletingTaskId(null);
    }
  };

  return {
    assignedSearch,
    setAssignedSearch,
    selectedAssignedProject,
    setSelectedAssignedProject,
    updatingTaskId,
    updateSuccessTaskId,
    editingTaskId,
    editingSubject,
    setEditingSubject,
    savingEdit,
    taskToEdit,
    taskToDelete,
    deletingTaskId,
    deleteError,
    handleRequestDelete,
    handleCancelDelete,
    handleConfirmDelete,
    handleOpenEditModal,
    handleCloseEditModal,
    handleSaveTaskEdit,
    handleUpdateStatus,
    handleStartEdit,
    handleCancelEdit,
    handleSaveSubject,
    groupedTasksByProject,
  };
}

