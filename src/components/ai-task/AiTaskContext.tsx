'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { IncomingMRItem, PreReviewOutput } from '@/app/gitlab/reviews/types';
import type { AiTask, AiTaskType, MrReviewTaskParams } from './types';
import { AiTaskProgressDock } from './AiTaskProgressDock';
import { AiConfirmLeaveModal } from './AiConfirmLeaveModal';
import { useNotification } from '@/components/Notification';

interface ConfirmLeaveState {
  isOpen: boolean;
  taskId: string;
  taskTitle: string;
  taskSubtitle?: string;
  onStay: () => void;
  onMinimize: () => void;
  onAbort: () => void;
}

export interface RestoreTargetState {
  type: AiTaskType;
  mr?: IncomingMRItem;
  tab?: 'discussions' | 'ai_review';
  view?: string;
  projectId?: number | string;
  branch?: string;
  date?: string;
  timestamp: number;
}

export interface RunAiTaskConfig<T = unknown> {
  id: string;
  type: AiTaskType;
  title: string;
  subtitle?: string;
  initialStep?: string;
  params?: Record<string, unknown>;
  notifyOnComplete?: boolean;
  runner: (
    updateStep: (stepText: string, progressPercent: number) => void,
    signal: AbortSignal,
  ) => Promise<T>;
}

interface AiTaskContextType {
  tasks: Record<string, AiTask>;
  activeTaskId: string | null;
  hasRunningTasks: boolean;
  restoreTarget: RestoreTargetState | null;
  clearRestoreTarget: () => void;
  getTask: (id: string) => AiTask | undefined;
  startMrReviewTask: (params: MrReviewTaskParams) => Promise<PreReviewOutput>;
  runAiTask: <T = unknown>(config: RunAiTaskConfig<T>) => Promise<T>;
  minimizeTask: (id: string) => void;
  minimizeAllRunning: () => void;
  restoreTask: (id: string) => void;
  cancelTask: (id: string) => void;
  dismissTask: (id: string) => void;
  dismissAllCompleted: () => void;
  requestConfirmLeave: (
    taskId: string,
    callbacks: {
      onStay: () => void;
      onMinimize: () => void;
      onAbort: () => void;
    },
  ) => void;
}

const AiTaskContext = createContext<AiTaskContextType | null>(null);

export function AiTaskProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { notify } = useNotification();

  const [tasks, setTasks] = useState<Record<string, AiTask>>({});
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmLeaveState | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<RestoreTargetState | null>(null);

  // Store abort controllers in ref so they survive rerenders
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  const hasRunningTasks = Object.values(tasks).some((t) => t.status === 'running');

  // Warn on accidental tab close / reload when AI tasks are running
  useEffect(() => {
    if (!hasRunningTasks) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Proses analisis AI sedang berjalan di latar belakang. Yakin ingin keluar?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasRunningTasks]);

  const getTask = useCallback(
    (id: string) => {
      return tasks[id];
    },
    [tasks],
  );

  const minimizeTask = useCallback((id: string) => {
    setTasks((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      return {
        ...prev,
        [id]: { ...existing, isMinimized: true },
      };
    });
    setActiveTaskId(id);
    setConfirmModal(null);
  }, []);

  const minimizeAllRunning = useCallback(() => {
    setTasks((prev) => {
      let hasChanges = false;
      const next = { ...prev };
      Object.entries(next).forEach(([id, task]) => {
        if (task.status === 'running' && !task.isMinimized) {
          next[id] = { ...task, isMinimized: true };
          hasChanges = true;
        }
      });
      return hasChanges ? next : prev;
    });
    setConfirmModal(null);
  }, []);

  // Otomatis minimize proses AI yang sedang berjalan saat berpindah halaman/route
  const prevPathnameRef = useRef(pathname);
  const lastAutoMinimizeNoticeRef = useRef<number>(0);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;

      let didMinimize = false;
      setTasks((prev) => {
        let hasChanges = false;
        const next = { ...prev };
        Object.entries(next).forEach(([id, task]) => {
          if (task.status === 'running' && !task.isMinimized) {
            next[id] = { ...task, isMinimized: true };
            hasChanges = true;
          }
        });
        if (hasChanges) {
          didMinimize = true;
        }
        return hasChanges ? next : prev;
      });

      const now = Date.now();
      if (didMinimize && now - lastAutoMinimizeNoticeRef.current > 4000) {
        lastAutoMinimizeNoticeRef.current = now;
        notify.info(
          'Proses AI otomatis diminimalkan ke pojok kanan bawah agar tetap berjalan.',
          'Lanjut di Latar Belakang',
        );
      }
      setConfirmModal(null);
    }
  }, [pathname, notify]);

  // Otomatis minimize saat berpindah tab browser / minimize window
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        minimizeAllRunning();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [minimizeAllRunning]);

  const restoreTask = useCallback(
    (id: string) => {
      const task = tasks[id];
      if (!task) return;

      setTasks((prev) => {
        const existing = prev[id];
        if (!existing) return prev;
        return {
          ...prev,
          [id]: { ...existing, isMinimized: false },
        };
      });

      // Navigate and dispatch target based on task type
      if (task.type === 'mr_review') {
        if (task.params?.mr) {
          setRestoreTarget({
            type: 'mr_review',
            mr: task.params.mr as IncomingMRItem,
            tab: 'ai_review',
            timestamp: Date.now(),
          });
          if (!pathname.startsWith('/gitlab')) router.push('/gitlab');
        }
      } else if (task.type === 'mr_assistant') {
        setRestoreTarget({
          type: 'mr_assistant',
          view: 'mr_assistant',
          projectId: task.params?.projectId as number | undefined,
          branch: task.params?.branch as string | undefined,
          timestamp: Date.now(),
        });
        if (!pathname.startsWith('/gitlab')) router.push('/gitlab');
      } else if (task.type === 'pre_review') {
        setRestoreTarget({
          type: 'pre_review',
          view: 'pre_review',
          projectId: task.params?.projectId as number | undefined,
          branch: task.params?.branch as string | undefined,
          timestamp: Date.now(),
        });
        if (!pathname.startsWith('/gitlab')) router.push('/gitlab');
      } else if (task.type === 'smart_task') {
        setRestoreTarget({
          type: 'smart_task',
          timestamp: Date.now(),
        });
        if (!pathname.startsWith('/tasks')) router.push('/tasks');
      } else if (task.type === 'gap_healer') {
        setRestoreTarget({
          type: 'gap_healer',
          date: task.params?.date as string | undefined,
          timestamp: Date.now(),
        });
        if (!pathname.startsWith('/workload')) router.push('/workload');
      }
    },
    [tasks, pathname, router],
  );

  const cancelTask = useCallback(
    (id: string) => {
      const controller = abortControllersRef.current[id];
      if (controller) {
        controller.abort();
        delete abortControllersRef.current[id];
      }

      setTasks((prev) => {
        const existing = prev[id];
        if (!existing) return prev;
        return {
          ...prev,
          [id]: {
            ...existing,
            status: 'cancelled',
            stepText: 'Proses AI dibatalkan oleh pengguna.',
            completedAt: Date.now(),
          },
        };
      });

      setConfirmModal(null);
      notify.info('Proses analisis AI dibatalkan.', 'AI Dibatalkan');
    },
    [notify],
  );

  const dismissTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setActiveTaskId((curr) => (curr === id ? null : curr));
  }, []);

  const dismissAllCompleted = useCallback(() => {
    setTasks((prev) => {
      const next: Record<string, AiTask> = {};
      Object.entries(prev).forEach(([key, task]) => {
        if (task.status === 'running') {
          next[key] = task;
        }
      });
      return next;
    });
  }, []);

  const clearRestoreTarget = useCallback(() => {
    setRestoreTarget(null);
  }, []);

  const requestConfirmLeave = useCallback(
    (
      taskId: string,
      callbacks: {
        onStay: () => void;
        onMinimize: () => void;
        onAbort: () => void;
      },
    ) => {
      const task = tasks[taskId];
      if (!task || task.status !== 'running') {
        callbacks.onAbort();
        return;
      }

      setConfirmModal({
        isOpen: true,
        taskId,
        taskTitle: task.title,
        taskSubtitle: task.subtitle,
        onStay: () => {
          setConfirmModal(null);
          callbacks.onStay();
        },
        onMinimize: () => {
          minimizeTask(taskId);
          callbacks.onMinimize();
        },
        onAbort: () => {
          cancelTask(taskId);
          callbacks.onAbort();
        },
      });
    },
    [tasks, minimizeTask, cancelTask],
  );

  // Generic runner for any background AI task
  const runAiTask = useCallback(
    async <T = unknown>({
      id,
      type,
      title,
      subtitle,
      initialStep = 'Sedang memproses dengan AI...',
      params,
      notifyOnComplete = true,
      runner,
    }: RunAiTaskConfig<T>): Promise<T> => {
      if (abortControllersRef.current[id]) {
        abortControllersRef.current[id].abort();
      }

      const controller = new AbortController();
      abortControllersRef.current[id] = controller;

      const initialTask: AiTask = {
        id,
        type,
        title,
        subtitle,
        status: 'running',
        stepText: initialStep,
        progressPercent: 20,
        startedAt: Date.now(),
        isMinimized: false,
        params,
      };

      setTasks((prev) => ({ ...prev, [id]: initialTask }));
      setActiveTaskId(id);

      const updateStep = (stepText: string, progressPercent: number) => {
        setTasks((prev) => {
          const t = prev[id];
          if (!t || t.status !== 'running') return prev;
          return {
            ...prev,
            [id]: {
              ...t,
              stepText,
              progressPercent,
            },
          };
        });
      };

      try {
        const result = await runner(updateStep, controller.signal);

        const completedTask: AiTask = {
          ...initialTask,
          status: 'completed',
          stepText: 'Analisis AI selesai.',
          progressPercent: 100,
          completedAt: Date.now(),
          result,
        };

        setTasks((prev) => ({
          ...prev,
          [id]: completedTask,
        }));

        delete abortControllersRef.current[id];

        if (notifyOnComplete !== false) {
          notify.success(`${title} selesai!`, 'AI Selesai');
        }
        return result;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          throw err;
        }

        const errMsg = (err as Error).message || 'Gagal memproses analisis AI.';
        setTasks((prev) => {
          const t = prev[id];
          if (!t) return prev;
          return {
            ...prev,
            [id]: {
              ...t,
              status: 'error',
              error: errMsg,
              stepText: 'Gagal menyelesaikan proses AI.',
              completedAt: Date.now(),
            },
          };
        });

        delete abortControllersRef.current[id];
        throw err;
      }
    },
    [notify],
  );

  const startMrReviewTask = useCallback(
    async ({ mr, toneMode }: MrReviewTaskParams): Promise<PreReviewOutput> => {
      const taskId = `mr-review-${mr.projectId}-${mr.iid}`;
      return runAiTask<PreReviewOutput>({
        id: taskId,
        type: 'mr_review',
        title: `AI Review MR !${mr.iid}: ${mr.title}`,
        subtitle: `${mr.projectName} · ${mr.sourceBranch} → ${mr.targetBranch}`,
        initialStep: 'Mengambil Git Diff perubahan kode...',
        params: { mr, toneMode, projectId: mr.projectId, branch: mr.sourceBranch },
        runner: async (updateStep, signal) => {
          // Step 1: Fetch Git Diff
          const diffRes = await fetch(
            `/api/gitlab/incoming-reviews/diff?projectId=${mr.projectId}&mrIid=${mr.iid}`,
            { signal },
          );
          const diffData = await diffRes.json();
          if (!diffRes.ok || !diffData.ok) {
            throw new Error(diffData.error || 'Gagal mengambil diff MR.');
          }
          if (!diffData.diff?.trim()) {
            throw new Error('MR ini tidak memiliki baris perubahan kode.');
          }

          // Step 2: Analyzing with AI
          updateStep('Menganalisis kualitas & keamanan kode dengan model AI...', 60);

          // Step 3: Run AI Pre-Review
          const revRes = await fetch('/api/gitlab/pre-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              codeOrDiff: diffData.diff,
              context: `Review MR !${mr.iid}: ${mr.title} (${mr.sourceBranch} -> ${mr.targetBranch})`,
            }),
            signal,
          });

          const revData = await revRes.json();
          if (!revRes.ok || !revData.ok) {
            throw new Error(revData.error || 'Gagal generate review AI.');
          }

          updateStep('Menyusun rekomendasi & draf review...', 95);
          return revData;
        },
      });
    },
    [runAiTask],
  );

  // Collect tasks for floating dock: only tasks that are currently minimized and not cancelled
  const dockTasks = Object.values(tasks).filter(
    (t) => t.isMinimized && t.status !== 'cancelled',
  );

  return (
    <AiTaskContext.Provider
      value={{
        tasks,
        activeTaskId,
        hasRunningTasks,
        restoreTarget,
        clearRestoreTarget,
        getTask,
        startMrReviewTask,
        runAiTask,
        minimizeTask,
        minimizeAllRunning,
        restoreTask,
        cancelTask,
        dismissTask,
        dismissAllCompleted,
        requestConfirmLeave,
      }}
    >
      {children}

      {/* Persistent Bottom-Right Floating AI Task Progress Dock (Supports multiple tasks list) */}
      {dockTasks.length > 0 && (
        <AiTaskProgressDock
          tasks={dockTasks}
          onRestore={(t) => restoreTask(t.id)}
          onCancel={(t) => cancelTask(t.id)}
          onDismiss={(t) => dismissTask(t.id)}
          onDismissAllCompleted={dismissAllCompleted}
        />
      )}

      {/* Confirmation Modal when user attempts to leave/close active generation */}
      {confirmModal && (
        <AiConfirmLeaveModal
          isOpen={confirmModal.isOpen}
          taskTitle={confirmModal.taskTitle}
          taskSubtitle={confirmModal.taskSubtitle}
          onStay={confirmModal.onStay}
          onMinimize={confirmModal.onMinimize}
          onAbort={confirmModal.onAbort}
        />
      )}
    </AiTaskContext.Provider>
  );
}

export function useAiTask() {
  const context = useContext(AiTaskContext);
  if (!context) {
    throw new Error('useAiTask must be used within an AiTaskProvider');
  }
  return context;
}
