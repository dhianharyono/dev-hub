'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';

const emptySubscribe = () => () => {};

interface DeleteTaskDialogProps {
  task: AssignedTaskItem;
  error: string | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteTaskDialog({
  task,
  error,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteTaskDialogProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleting, onCancel]);

  if (!mounted) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200'
      role='dialog'
      aria-modal='true'
      aria-labelledby='delete-task-title'
      onClick={() => {
        if (!isDeleting) onCancel();
      }}
    >
      <div
        className='relative w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-5 py-4 border-b border-border bg-surface-subtle/50'>
          <h2
            id='delete-task-title'
            className='text-sm font-bold text-slate-text inline-flex items-center gap-2'
          >
            <AlertTriangle size={16} className='text-rose-500' />
            Hapus Task #{task.ref}
          </h2>
          <button
            type='button'
            className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors'
            onClick={onCancel}
            disabled={isDeleting}
            aria-label='Tutup dialog'
          >
            <X size={18} />
          </button>
        </div>

        <div className='p-5 flex flex-col gap-3'>
          <p className='text-sm font-semibold text-slate-text'>
            {task.subject}
          </p>
          <p className='text-xs text-slate-600 leading-relaxed'>
            Task ini akan dihapus permanen dari Taiga dan tidak bisa
            dikembalikan. Lanjutkan?
          </p>

          {error && (
            <div
              role='alert'
              className='p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl'
            >
              {error}
            </div>
          )}
        </div>

        <div className='flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-surface-subtle/50'>
          <button
            type='button'
            className='btn btn-ghost btn-sm px-4 text-xs'
            onClick={onCancel}
            disabled={isDeleting}
            autoFocus
          >
            Batal
          </button>
          <button
            type='button'
            className='btn btn-sm px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 border border-rose-700'
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className='spinner w-3.5 h-3.5' />
            ) : (
              <Trash2 size={14} className='mr-1.5' />
            )}
            <span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
