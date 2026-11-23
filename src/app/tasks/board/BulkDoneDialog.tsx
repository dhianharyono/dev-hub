'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { CheckCheck, CalendarDays, Info, Tag, X } from 'lucide-react';
import { Select } from '@/components/Select';
import type { BulkDoneDayOption, BulkDonePlan } from './bulk-done';
import { ALL_DAYS } from './bulk-done';

const emptySubscribe = () => () => {};

interface BulkDoneDialogProps {
  plan: BulkDonePlan;
  isRunning: boolean;
  day: string;
  dayOptions: BulkDoneDayOption[];
  targetStatus: string;
  statusOptions: string[];
  onDayChange: (day: string) => void;
  onTargetStatusChange: (name: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function BulkDoneDialog({
  plan,
  isRunning,
  day,
  dayOptions,
  targetStatus,
  statusOptions,
  onDayChange,
  onTargetStatusChange,
  onCancel,
  onConfirm,
}: BulkDoneDialogProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRunning) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, onCancel]);

  if (!mounted) return null;

  const preview = plan.targets.slice(0, 6);
  const remaining = plan.targets.length - preview.length;
  const allDays = day === ALL_DAYS;
  const dayLabel =
    dayOptions.find((option) => option.value === day)?.label ?? 'Semua hari';

  return createPortal(
    <div
      className='fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200'
      role='dialog'
      aria-modal='true'
      aria-labelledby='bulk-done-title'
      onClick={() => {
        if (!isRunning) onCancel();
      }}
    >
      <div
        className='relative w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-5 py-4 border-b border-border bg-surface-subtle/50'>
          <h2
            id='bulk-done-title'
            className='text-sm font-bold text-slate-text inline-flex items-center gap-2'
          >
            <CheckCheck size={16} className='text-brand' />
            Tandai Semua ke {targetStatus}
          </h2>
          <button
            type='button'
            className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors'
            onClick={onCancel}
            disabled={isRunning}
            aria-label='Tutup dialog'
          >
            <X size={18} />
          </button>
        </div>

        <div className='p-5 flex flex-col gap-3'>
          <div className='flex flex-col gap-1.5'>
            <label
              htmlFor='bulk-done-status'
              className='text-xs font-medium text-slate-600 flex items-center gap-1.5'
            >
              <Tag size={12} className='text-slate-400' />
              <span>Status target</span>
            </label>
            <Select
              id='bulk-done-status'
              size='sm'
              value={targetStatus}
              onChange={(e) => onTargetStatusChange(e.target.value)}
              disabled={isRunning}
              className='h-9 text-xs sm:text-sm rounded-lg'
            >
              {statusOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>

          <div className='flex flex-col gap-1.5'>
            <label
              htmlFor='bulk-done-day'
              className='text-xs font-medium text-slate-600 flex items-center gap-1.5'
            >
              <CalendarDays size={12} className='text-slate-400' />
              <span>Pilih hari</span>
            </label>
            <Select
              id='bulk-done-day'
              size='sm'
              value={day}
              onChange={(e) => onDayChange(e.target.value)}
              disabled={isRunning}
              className='h-9 text-xs sm:text-sm rounded-lg'
            >
              {dayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count} task)
                </option>
              ))}
            </Select>
          </div>

          {plan.targets.length === 0 ? (
            <p className='text-sm font-semibold text-slate-text'>
              Tidak ada task aktif{allDays ? '' : ` pada ${dayLabel}`} yang bisa
              diubah ke status {targetStatus}.
            </p>
          ) : (
            <p className='text-sm font-semibold text-slate-text'>
              {plan.targets.length} task aktif
              {allDays ? '' : ` pada ${dayLabel}`} akan diubah ke status{' '}
              {targetStatus}.
            </p>
          )}
          <p className='text-xs text-slate-600 leading-relaxed'>
            {allDays
              ? 'Semua task aktif yang sedang tampil di board ikut diubah, apa pun tanggalnya. Task yang sudah selesai dilewati.'
              : 'Hanya task pada hari terpilih yang diubah. Task di hari lain dan task yang sudah selesai tidak disentuh.'}
          </p>

          <ul className='flex flex-col gap-1.5 m-0 p-0 list-none max-h-44 overflow-y-auto'>
            {preview.map(({ task }) => (
              <li
                key={task.id}
                className='flex items-center gap-2 text-xs text-slate-700'
              >
                <span className='min-w-0 flex-1 truncate'>
                  <span className='font-semibold text-slate-500'>
                    #{task.ref}
                  </span>{' '}
                  {task.subject}
                </span>
                <span className='shrink-0 font-semibold text-slate-500'>
                  {targetStatus}
                </span>
              </li>
            ))}
            {remaining > 0 && (
              <li className='text-xs text-slate-500'>
                +{remaining} task lainnya
              </li>
            )}
          </ul>

          {(plan.alreadyClosed > 0 || plan.withoutTargetStatus > 0) && (
            <div className='flex items-start gap-2 p-3 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl'>
              <Info size={14} className='shrink-0 mt-0.5' />
              <span>
                {plan.alreadyClosed > 0 &&
                  `${plan.alreadyClosed} task sudah selesai dilewati. `}
                {plan.withoutTargetStatus > 0 &&
                  `${plan.withoutTargetStatus} task dilewati karena project tidak punya status ${targetStatus}.`}
              </span>
            </div>
          )}
        </div>

        <div className='flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-surface-subtle/50'>
          <button
            type='button'
            className='btn btn-ghost btn-sm px-4 text-xs'
            onClick={onCancel}
            disabled={isRunning}
            autoFocus
          >
            Batal
          </button>
          <button
            type='button'
            className='btn btn-primary btn-sm px-4 text-xs font-semibold'
            onClick={onConfirm}
            disabled={isRunning || plan.targets.length === 0}
          >
            {isRunning ? (
              <span className='spinner w-3.5 h-3.5' />
            ) : (
              <CheckCheck size={14} className='mr-1.5' />
            )}
            <span>
              {isRunning
                ? 'Memproses...'
                : `Tandai ${plan.targets.length} ke ${targetStatus}`}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
