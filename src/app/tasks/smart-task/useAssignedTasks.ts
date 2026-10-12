'use client';

import { useCallback, useState } from 'react';
import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';
import type { Status } from './types';

export function useAssignedTasks() {
  const [assignedTasks, setAssignedTasks] = useState<AssignedTaskItem[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<Record<number, Status[]>>({});
  const [assignedProjects, setAssignedProjects] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [assignedError, setAssignedError] = useState<string | null>(null);
  const [assignedActiveOnly, setAssignedActiveOnly] = useState(true);

  const fetchAssignedTasks = useCallback(
    async (activeOnly = assignedActiveOnly) => {
      setLoadingAssigned(true);
      setAssignedError(null);
      try {
        const res = await fetch(`/api/taiga/assigned?activeOnly=${activeOnly}`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Gagal memuat task yang di-assign ke Anda.');
        }
        setAssignedTasks(data.tasks || []);
        setProjectStatuses(data.projectStatuses || {});
        setAssignedProjects(data.projects || []);
      } catch (e) {
        setAssignedError((e as Error).message);
      } finally {
        setLoadingAssigned(false);
      }
    },
    [assignedActiveOnly],
  );

  return {
    assignedTasks,
    setAssignedTasks,
    projectStatuses,
    assignedProjects,
    loadingAssigned,
    assignedError,
    assignedActiveOnly,
    setAssignedActiveOnly,
    fetchAssignedTasks,
  };
}
