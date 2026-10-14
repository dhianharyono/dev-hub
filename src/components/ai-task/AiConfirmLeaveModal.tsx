'use client';

import React from 'react';
import { Minimize2, XCircle } from 'lucide-react';
import { Modal } from '@/components/Modal';

interface AiConfirmLeaveModalProps {
  isOpen: boolean;
  taskTitle: string;
  taskSubtitle?: string;
  onStay: () => void;
  onMinimize: () => void;
  onAbort: () => void;
}

export function AiConfirmLeaveModal({
  isOpen,
  taskTitle,
  taskSubtitle,
  onStay,
  onMinimize,
  onAbort,
}: AiConfirmLeaveModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onStay}
      size='md'
      closeOnBackdropClick={false}
      bodyClassName='p-5 sm:p-6'
    >
      <div className='flex flex-col gap-4'>
        {/* Header Title */}
        <div className='flex flex-col'>
          <span className='inline-block text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-0.5'>
            Konfirmasi Proses AI
          </span>
          <h3 className='text-base font-bold text-slate-text leading-snug m-0'>
            Proses Analisis AI Masih Berjalan
          </h3>
          <p className='text-xs text-slate-500 mt-1 m-0 leading-relaxed'>
            AI sedang aktif menghasilkan analisis untuk:
          </p>
          <div className='mt-2 p-2.5 rounded-lg bg-surface-subtle border border-border text-xs'>
            <div className='font-semibold text-slate-text truncate'>{taskTitle}</div>
            {taskSubtitle && (
              <div className='text-slate-500 text-[11px] truncate mt-0.5'>{taskSubtitle}</div>
            )}
          </div>
        </div>

        {/* Informative Explanation */}
        <div className='p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed'>
          Jika Anda menutup dialog ini tanpa meminimalkan, proses generate dengan AI akan dibatalkan
          dan Anda harus mengulang dari awal. Anda dapat memilih <strong>Minimize</strong> agar proses tetap
          berjalan di pojok kanan bawah selagi Anda mengecek halaman lain.
        </div>

        {/* Action Buttons - Clean, Balanced & Non-overflowing Layout */}
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-border'>
          <button
            type='button'
            onClick={onAbort}
            className='btn btn-outline btn-sm text-xs border border-rose-300 dark:border-rose-700/80 text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 rounded-lg font-medium shadow-2xs'
          >
            <XCircle size={14} />
            <span>Batalkan AI</span>
          </button>

          <div className='flex items-center gap-2 justify-end'>
            <button
              type='button'
              onClick={onStay}
              className='btn btn-outline btn-sm text-xs border border-slate-300 dark:border-slate-600 text-slate-text hover:bg-surface-subtle rounded-lg font-medium shadow-2xs'
            >
              <span>Tetap di Sini</span>
            </button>

            <button
              type='button'
              onClick={onMinimize}
              className='btn btn-primary btn-sm text-xs gap-1.5 font-semibold shadow-xs rounded-lg'
              autoFocus
            >
              <Minimize2 size={14} />
              <span>Minimize & Lanjutkan</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
