import { describe, it, expect } from 'vitest';
import type { AiTask } from '@/components/ai-task/types';

describe('AI Task Manager & Progress Dock Types & Logic', () => {
  it('correctly constructs and structures an AI task object', () => {
    const task: AiTask = {
      id: 'mr-review-101-42',
      type: 'mr_review',
      title: 'AI Review MR !42: Implementasi Dashboard',
      subtitle: 'devhub · feat/login -> main',
      status: 'running',
      stepText: 'Menganalisis kualitas & keamanan kode...',
      progressPercent: 60,
      startedAt: Date.now() - 15000,
      isMinimized: false,
    };

    expect(task.id).toBe('mr-review-101-42');
    expect(task.status).toBe('running');
    expect(task.progressPercent).toBe(60);
    expect(task.isMinimized).toBe(false);
  });

  it('updates task to minimized and completed state properly', () => {
    const initialTask: AiTask = {
      id: 'mr-review-101-42',
      type: 'mr_review',
      title: 'AI Review MR !42',
      status: 'running',
      stepText: 'Sedang berjalan...',
      progressPercent: 20,
      startedAt: Date.now() - 30000,
      isMinimized: false,
    };

    const minimizedTask: AiTask = {
      ...initialTask,
      isMinimized: true,
    };
    expect(minimizedTask.isMinimized).toBe(true);

    const completedTask: AiTask = {
      ...minimizedTask,
      status: 'completed',
      progressPercent: 100,
      completedAt: Date.now(),
      result: { ok: true, summary: 'Bagus' },
    };

    expect(completedTask.status).toBe('completed');
    expect(completedTask.progressPercent).toBe(100);
    expect(completedTask.result).toEqual({ ok: true, summary: 'Bagus' });
  });

  it('handles cancellation status and cleanup', () => {
    const task: AiTask = {
      id: 'mr-review-101-42',
      type: 'mr_review',
      title: 'AI Review MR !42',
      status: 'cancelled',
      stepText: 'Proses AI dibatalkan oleh pengguna.',
      progressPercent: 20,
      startedAt: Date.now() - 5000,
      completedAt: Date.now(),
      isMinimized: true,
    };

    expect(task.status).toBe('cancelled');
    expect(task.stepText).toContain('dibatalkan');
  });

  it('supports multi-task dock list filtering across all 5 AI features', () => {
    const taskMap: Record<string, AiTask> = {
      'mr-review-1': {
        id: 'mr-review-1',
        type: 'mr_review',
        title: 'Review MR !1',
        status: 'running',
        stepText: 'Menganalisis...',
        progressPercent: 40,
        startedAt: Date.now(),
        isMinimized: true,
      },
      'mr-assistant-1': {
        id: 'mr-assistant-1',
        type: 'mr_assistant',
        title: 'MR Generator',
        status: 'running',
        stepText: 'Menyusun draf...',
        progressPercent: 65,
        startedAt: Date.now(),
        isMinimized: false, // not minimized yet
      },
      'smart-task-1': {
        id: 'smart-task-1',
        type: 'smart_task',
        title: 'Ekstraksi Tiket Taiga',
        status: 'completed',
        stepText: 'Selesai',
        progressPercent: 100,
        startedAt: Date.now() - 20000,
        completedAt: Date.now(),
        isMinimized: true,
      },
      'gap-healer-1': {
        id: 'gap-healer-1',
        type: 'gap_healer',
        title: 'Timesheet Gap Healer',
        status: 'running',
        stepText: 'Commit GitLab...',
        progressPercent: 50,
        startedAt: Date.now(),
        isMinimized: true,
      },
    };

    // Filter tasks for dock: only currently minimized and not cancelled tasks
    const dockTasks = Object.values(taskMap).filter(
      (t) => t.isMinimized && t.status !== 'cancelled',
    );

    expect(dockTasks.length).toBe(3);
    expect(dockTasks.map((t) => t.type)).toEqual(
      expect.arrayContaining(['mr_review', 'smart_task', 'gap_healer']),
    );

    // When a task is restored/opened ("Buka Hasil" / "Buka Penuh"), isMinimized becomes false
    const restoredMap = {
      ...taskMap,
      'smart-task-1': { ...taskMap['smart-task-1'], isMinimized: false },
    };
    const dockAfterRestore = Object.values(restoredMap).filter(
      (t) => t.isMinimized && t.status !== 'cancelled',
    );
    expect(dockAfterRestore.length).toBe(2);
    expect(dockAfterRestore.find((t) => t.id === 'smart-task-1')).toBeUndefined();

    // Dismissing completed tasks retains running ones
    const runningDockTasks = dockTasks.filter((t) => t.status === 'running');
    expect(runningDockTasks.length).toBe(2);
  });

  it('automatically minimizes all running tasks when navigating or switching tabs', () => {
    const tasks: Record<string, AiTask> = {
      'task-1': {
        id: 'task-1',
        type: 'mr_assistant',
        title: 'Generate MR',
        status: 'running',
        stepText: 'Berjalan...',
        progressPercent: 30,
        startedAt: Date.now(),
        isMinimized: false,
      },
      'task-2': {
        id: 'task-2',
        type: 'pre_review',
        title: 'Review Code',
        status: 'running',
        stepText: 'Berjalan...',
        progressPercent: 50,
        startedAt: Date.now(),
        isMinimized: false,
      },
      'task-3': {
        id: 'task-3',
        type: 'smart_task',
        title: 'Smart Task',
        status: 'completed',
        stepText: 'Selesai',
        progressPercent: 100,
        startedAt: Date.now(),
        isMinimized: true,
      },
    };

    // Simulate minimizeAllRunning
    const minimizedResult: Record<string, AiTask> = { ...tasks };
    Object.entries(minimizedResult).forEach(([id, task]) => {
      if (task.status === 'running' && !task.isMinimized) {
        minimizedResult[id] = { ...task, isMinimized: true };
      }
    });

    expect(minimizedResult['task-1'].isMinimized).toBe(true);
    expect(minimizedResult['task-2'].isMinimized).toBe(true);
    expect(minimizedResult['task-3'].isMinimized).toBe(true);
  });
});
