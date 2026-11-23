'use client';

import { useMemo, useState } from 'react';
import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';
import { useToast } from '@/components/Notification';
import {
  buildBulkDoneDayOptions,
  buildBulkDonePlan,
  buildBulkStatusOptions,
  pickDefaultTargetStatusName,
  ALL_DAYS,
} from './bulk-done';
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
  const [selectedAssignedStatus, setSelectedAssignedStatus] = useState<string | 'all'>('all');
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [updateSuccessTaskId, setUpdateSuccessTaskId] = useState<number | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<AssignedTaskItem | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [bulkDoneOpen, setBulkDoneOpen] = useState(false);
  const [bulkDoneRunning, setBulkDoneRunning] = useState(false);
  const [bulkDoneDay, setBulkDoneDay] = useState<string>(ALL_DAYS);
  const [bulkDoneTargetStatus, setBulkDoneTargetStatus] = useState<string | null>(null);
  const { notify } = useToast();

  const bulkDoneDayOptions = useMemo(
    () => buildBulkDoneDayOptions(assignedTasks),
    [assignedTasks],
  );

  const bulkStatusOptions = useMemo(
    () => buildBulkStatusOptions(projectStatuses),
    [projectStatuses],
  );

  const defaultBulkTargetStatus = useMemo(
    () => pickDefaultTargetStatusName(projectStatuses),
    [projectStatuses],
  );

  const bulkTargetStatus = bulkDoneTargetStatus ?? defaultBulkTargetStatus ?? '';

  const bulkDonePlan = useMemo(
    () =>
      buildBulkDonePlan(
        assignedTasks,
        projectStatuses,
        bulkDoneDay,
        bulkTargetStatus || null,
      ),
    [assignedTasks, projectStatuses, bulkDoneDay, bulkTargetStatus],
  );

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

  const handleRequestBulkDone = () => {
    if (bulkDonePlan.targets.length === 0) return;
    setBulkDoneOpen(true);
  };

  const handleCancelBulkDone = () => {
    if (bulkDoneRunning) return;
    setBulkDoneOpen(false);
    setBulkDoneDay(ALL_DAYS);
    setBulkDoneTargetStatus(null);
  };

  const handleConfirmBulkDone = async () => {
    if (bulkDoneRunning || bulkDonePlan.targets.length === 0) return;
    setBulkDoneRunning(true);
    const targetLabel = bulkTargetStatus || 'Done';

    const scopeLabel =
      bulkDoneDay === ALL_DAYS
        ? 'task aktif'
        : `task aktif (${bulkDoneDayOptions.find((o) => o.value === bulkDoneDay)?.label ?? bulkDoneDay})`;
    const successIds = new Set<number>();
    const failedRefs: string[] = [];

    for (const { task, status } of bulkDonePlan.targets) {
      try {
        const res = await fetch('/api/taiga/assigned', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: task.id,
            statusId: status.id,
            isClosed: Boolean(status.is_closed),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Gagal memperbarui status task.');
        }
        successIds.add(task.id);
      } catch {
        failedRefs.push(`#${task.ref}`);
      }
    }

    if (successIds.size > 0) {
      setAssignedTasks((prev) =>
        prev.map((t) => {
          if (!successIds.has(t.id)) return t;
          const status = bulkDonePlan.targets.find(
            (target) => target.task.id === t.id,
          )?.status;
          if (!status) return t;
          return {
            ...t,
            status: status.id,
            statusExtraInfo: {
              name: status.name,
              color: status.color,
              is_closed: status.is_closed,
            },
            isClosed: Boolean(status.is_closed),
          };
        }),
      );
    }

    setBulkDoneRunning(false);
    setBulkDoneOpen(false);
    setBulkDoneDay(ALL_DAYS);
    setBulkDoneTargetStatus(null);

    if (failedRefs.length === 0) {
      notify.success(
        `${successIds.size} ${scopeLabel} berhasil diubah ke status ${targetLabel}.`,
        'Status task diperbarui',
      );
    } else if (successIds.size === 0) {
      notify.error(
        `Gagal mengubah ${failedRefs.length} ${scopeLabel} ke status ${targetLabel} (${failedRefs.join(', ')}). Coba lagi.`,
        'Tidak ada task yang berubah',
      );
    } else {
      notify.warning(
        `${successIds.size} task diubah ke ${targetLabel}, ${failedRefs.length} gagal (${failedRefs.join(', ')}).`,
        'Sebagian berhasil',
      );
    }
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

  const groupedTasks = useMemo(() => {
    const filtered = assignedTasks.filter((t) => {
      if (
        selectedAssignedProject !== 'all' &&
        t.projectId !== selectedAssignedProject
      ) {
        return false;
      }
      if (
        selectedAssignedStatus !== 'all' &&
        (t.statusExtraInfo?.name ?? '').trim().toLowerCase() !==
          selectedAssignedStatus.trim().toLowerCase()
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

    // Semua proyek: satu daftar per hari, tanpa pengelompokan proyek.
    if (selectedAssignedProject === 'all') {
      if (filtered.length === 0) return [];
      return [
        {
          projectId: -1,
          projectName: 'Semua Task',
          projectSlug: '',
          tasks: filtered,
        },
      ];
    }

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
  }, [
    assignedTasks,
    selectedAssignedProject,
    selectedAssignedStatus,
    assignedSearch,
  ]);

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
    selectedAssignedStatus,
    setSelectedAssignedStatus,
    assignedStatusOptions: bulkStatusOptions,
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
    groupedTasks,
    bulkDonePlan,
    bulkDoneDay,
    setBulkDoneDay,
    bulkDoneDayOptions,
    bulkDoneTargetStatus: bulkTargetStatus,
    setBulkDoneTargetStatus,
    bulkStatusOptions,
    bulkDoneOpen,
    bulkDoneRunning,
    handleRequestBulkDone,
    handleCancelBulkDone,
    handleConfirmBulkDone,
  };
}

