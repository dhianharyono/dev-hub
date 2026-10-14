'use client';

import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  GitPullRequest,
  FileCode,
  ShieldCheck,
  CheckSquare,
  Clock,
  Bot,
} from 'lucide-react';
import type { AiTask, AiTaskType } from './types';

interface AiTaskProgressDockProps {
  tasks: AiTask[];
  onRestore: (task: AiTask) => void;
  onCancel: (task: AiTask) => void;
  onDismiss: (task: AiTask) => void;
  onDismissAllCompleted?: () => void;
}

function formatElapsed(startedAt: number, completedAt?: number): string {
  const end = completedAt || Date.now();
  const diffSec = Math.max(0, Math.floor((end - startedAt) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getTaskBadge(type: AiTaskType): { label: string; icon: React.ReactNode; colorClass: string } {
  switch (type) {
    case 'mr_review':
      return {
        label: 'MR Review',
        icon: <GitPullRequest size={12} />,
        colorClass: 'bg-blue-500/10 text-primary border-blue-500/20',
      };
    case 'mr_assistant':
      return {
        label: 'MR Generator',
        icon: <FileCode size={12} />,
        colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      };
    case 'pre_review':
      return {
        label: 'Review Code',
        icon: <ShieldCheck size={12} />,
        colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      };
    case 'smart_task':
      return {
        label: 'Buat Tiket',
        icon: <CheckSquare size={12} />,
        colorClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      };
    case 'gap_healer':
      return {
        label: 'Gap Healer',
        icon: <Clock size={12} />,
        colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      };
    default:
      return {
        label: 'AI Task',
        icon: <Bot size={12} />,
        colorClass: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
      };
  }
}

export function AiTaskProgressDock({
  tasks,
  onRestore,
  onCancel,
  onDismiss,
  onDismissAllCompleted,
}: AiTaskProgressDockProps) {
  const [isPill, setIsPill] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Timer tick for running tasks
  useEffect(() => {
    const hasRunning = tasks.some((t) => t.status === 'running');
    if (!hasRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  if (!tasks || tasks.length === 0) return null;

  const runningTasks = tasks.filter((t) => t.status === 'running');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const errorTasks = tasks.filter((t) => t.status === 'error');

  // Collapsed Pill View
  if (isPill) {
    return (
      <div
        className='fixed bottom-5 right-5 z-[9998] flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-surface/95 backdrop-blur-md border border-border shadow-xl hover:shadow-2xl transition-all cursor-pointer select-none text-xs font-semibold text-slate-text animate-fade-up'
        onClick={() => setIsPill(false)}
        role='button'
        tabIndex={0}
        aria-label='Buka panel progress AI'
        title='Klik untuk memperbesar panel aktivitas AI'
      >
        {runningTasks.length > 0 ? (
          <div className='w-5 h-5 rounded-full bg-blue-500/10 text-primary flex items-center justify-center shrink-0'>
            <span className='spinner w-3 h-3 border-primary' />
          </div>
        ) : (
          <div className='w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0'>
            <CheckCircle2 size={13} />
          </div>
        )}

        <div className='flex items-center gap-1.5'>
          <span>Aktivitas AI ({tasks.length})</span>
          {runningTasks.length > 0 && (
            <span className='badge badge-cyan xs'>{runningTasks.length} berjalan</span>
          )}
          {completedTasks.length > 0 && (
            <span className='badge badge-green xs'>{completedTasks.length} selesai</span>
          )}
        </div>

        <ChevronUp size={14} className='text-slate-400 ml-1' />
      </div>
    );
  }

  // Multi-Task List View
  return (
    <aside
      aria-live='polite'
      className='fixed bottom-5 right-5 z-[9998] w-[390px] max-w-[calc(100vw-2.5rem)] rounded-2xl bg-surface/95 backdrop-blur-md border border-border shadow-2xl overflow-hidden select-none animate-fade-up'
    >
      {/* Top Header */}
      <div className='px-4 py-3 border-b border-border flex items-center justify-between gap-3 bg-surface-subtle/80'>
        <div className='flex items-center gap-2 min-w-0'>
          <div className='w-6 h-6 rounded-lg bg-blue-500/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs'>
            {runningTasks.length > 0 ? (
              <span className='spinner w-3.5 h-3.5 border-primary' />
            ) : (
              <CheckCircle2 size={14} className='text-emerald-600' />
            )}
          </div>
          <div className='flex items-center gap-1.5 min-w-0'>
            <h4 className='text-xs font-bold text-slate-text truncate m-0'>
              Aktivitas AI Latar Belakang
            </h4>
            <span className='text-[11px] font-mono font-bold text-slate-500'>
              ({tasks.length})
            </span>
          </div>
        </div>

        <div className='flex items-center gap-1 shrink-0'>
          {/* Collapse to Pill Button */}
          <button
            type='button'
            onClick={() => setIsPill(true)}
            className='p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
            title='Minimize ke pill kecil'
            aria-label='Minimize ke pill kecil'
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Task List Items */}
      <div className='p-3 max-h-[360px] overflow-y-auto space-y-2.5'>
        {tasks.map((task) => {
          const badge = getTaskBadge(task.type);
          const isRunning = task.status === 'running';
          const isCompleted = task.status === 'completed';
          const isError = task.status === 'error';
          const elapsed = formatElapsed(
            task.startedAt,
            task.completedAt || (isRunning ? now : undefined),
          );

          return (
            <div
              key={task.id}
              className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-2 ${
                isRunning
                  ? 'border-blue-500/30 bg-blue-500/[0.02]'
                  : isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                    : 'border-rose-500/30 bg-rose-500/[0.02]'
              }`}
            >
              {/* Row 1: Badge + Title + Quick Actions */}
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-1.5 min-w-0'>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider shrink-0 ${badge.colorClass}`}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                  <span className='font-bold text-slate-text truncate' title={task.title}>
                    {task.title}
                  </span>
                </div>

                <div className='flex items-center gap-1 shrink-0'>
                  {/* Cancel / Dismiss */}
                  <button
                    type='button'
                    onClick={() => (isRunning ? onCancel(task) : onDismiss(task))}
                    className='p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors'
                    title={isRunning ? 'Batalkan AI' : 'Hapus dari daftar'}
                    aria-label={isRunning ? 'Batalkan AI' : 'Hapus dari daftar'}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Row 2: Subtitle if exists */}
              {task.subtitle && (
                <div className='text-[11px] text-slate-500 truncate -mt-0.5' title={task.subtitle}>
                  {task.subtitle}
                </div>
              )}

              {/* Row 3: Progress or Status description */}
              {isRunning && (
                <div className='flex flex-col gap-1.5 pt-0.5'>
                  <div className='flex items-center justify-between text-[11px]'>
                    <span className='text-slate-600 font-medium truncate max-w-[240px]'>
                      {task.stepText || 'Sedang memproses...'}
                    </span>
                    <span className='font-mono text-primary font-bold'>{task.progressPercent}%</span>
                  </div>

                  <div className='w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative'>
                    <div
                      className='h-full bg-primary rounded-full transition-all duration-300'
                      style={{ width: `${Math.min(100, Math.max(5, task.progressPercent))}%` }}
                    />
                  </div>
                </div>
              )}

              {isCompleted && (
                <div className='text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1'>
                  <CheckCircle2 size={13} />
                  <span>Selesai dalam {elapsed}</span>
                </div>
              )}

              {isError && (
                <div className='text-[11px] text-rose-600 dark:text-rose-400 truncate flex items-center gap-1'>
                  <AlertCircle size={13} />
                  <span>{task.error || 'Gagal menghasilkan output AI.'}</span>
                </div>
              )}

              {/* Row 4: Footer with Timer & Primary Action */}
              <div className='flex items-center justify-between pt-1 border-t border-border/60 text-[11px] text-slate-400'>
                <span>{isRunning ? `Waktu: ${elapsed}` : `Waktu total: ${elapsed}`}</span>

                <button
                  type='button'
                  onClick={() => onRestore(task)}
                  className={`btn btn-sm text-[11px] px-2.5 py-1 gap-1 font-semibold ${
                    isCompleted
                      ? 'btn-primary'
                      : isRunning
                        ? 'btn-outline text-primary border-primary/30 hover:bg-primary/5'
                        : 'btn-ghost'
                  }`}
                >
                  {isCompleted ? <ExternalLink size={12} /> : <Maximize2 size={12} />}
                  <span>{isCompleted ? 'Buka Hasil' : 'Buka Penuh'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional Footer: Dismiss All Completed */}
      {completedTasks.length > 1 && onDismissAllCompleted && (
        <div className='px-4 py-2 border-t border-border bg-surface-subtle/50 flex items-center justify-between'>
          <span className='text-[11px] text-slate-500'>
            {completedTasks.length} task telah selesai
          </span>
          <button
            type='button'
            onClick={onDismissAllCompleted}
            className='text-[11px] font-semibold text-primary hover:underline'
          >
            Bersihkan yang Selesai
          </button>
        </div>
      )}
    </aside>
  );
}
