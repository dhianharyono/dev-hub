'use client';

import { useMemo, useState } from 'react';
import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';
import type { ProjectTaskGroup, Status } from './types';

interface UseAssignedBoardProps {
  assignedTasks: AssignedTaskItem[];
  setAssignedTasks: React.Dispatch<React.SetStateAction<AssignedTaskItem[]>>;
  projectStatuses: Record<number, Status[]>;
}

export function useAssignedBoard({
  assignedTasks,
  setAssignedTasks,
  projectStatuses,
}: UseAssignedBoardProps) {
  const [assignedSearch, setAssignedSearch] = useState('');
  const [selectedAssignedProject, setSelectedAssignedProject] = useState<number | 'all'>('all');
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [updateSuccessTaskId, setUpdateSuccessTaskId] = useState<number | null>(null);

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
    handleUpdateStatus,
    handleStartEdit,
    handleCancelEdit,
    handleSaveSubject,
    groupedTasksByProject,
  };
}
