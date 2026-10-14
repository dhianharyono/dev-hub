'use client';

import { useCallback, useRef, useState } from 'react';
import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';
import type { Status } from './types';

export function useAssignedTasks() {
  const [assignedTasks, setAssignedTasks] = useState<AssignedTaskItem[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<Record<number, Status[]>>({});
  const [assignedProjects, setAssignedProjects] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [assignedError, setAssignedError] = useState<string | null>(null);
  const [assignedActiveOnly, setAssignedActiveOnlyState] = useState(true);

  const activeOnlyRef = useRef(assignedActiveOnly);
  const reqIdRef = useRef(0);

  const setAssignedActiveOnly = useCallback((active: boolean) => {
    activeOnlyRef.current = active;
    setAssignedActiveOnlyState(active);
  }, []);

  const fetchAssignedTasks = useCallback(
    async (activeOnly?: boolean) => {
      const targetActiveOnly = activeOnly !== undefined ? activeOnly : activeOnlyRef.current;
      setLoadingAssigned(true);
      setAssignedError(null);
      const curReqId = ++reqIdRef.current;
      try {
        const res = await fetch(`/api/taiga/assigned?activeOnly=${targetActiveOnly}`);
        const data = await res.json();
        // Ignore stale response if another fetch was requested
        if (curReqId !== reqIdRef.current) return;
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Gagal memuat task yang di-assign ke Anda.');
        }
        setAssignedTasks(data.tasks || []);
        setProjectStatuses(data.projectStatuses || {});
        setAssignedProjects(data.projects || []);
      } catch (e) {
        if (curReqId === reqIdRef.current) {
          setAssignedError((e as Error).message);
        }
      } finally {
        if (curReqId === reqIdRef.current) {
          setLoadingAssigned(false);
        }
      }
    },
    [],
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

