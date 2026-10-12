'use client';

import React from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import type { WorkloadDaySummary } from './types';

interface HealerEmptyStateProps {
  generating: boolean;
  missingHours: number;
  activeDay: WorkloadDaySummary | undefined;
  onGenerate: () => void;
}

export function HealerEmptyState({
  generating,
  missingHours,
  activeDay,
  onGenerate,
}: HealerEmptyStateProps) {
  if (generating) {
    return (
      <div className='border border-border rounded-xl p-8 text-center flex flex-col items-center gap-3 transition-all bg-surface-subtle'>
        <div className='w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-600 flex items-center justify-center'>
          <span className='spinner w-5.5 h-5.5' />
        </div>
        <div className='max-w-[440px]'>
          <strong className='text-sm sm:text-base font-bold text-slate-text'>
            Otomatis Menganalisis Commit GitLab Hari Ini...
          </strong>
          <p className='text-xs mt-1 text-slate-text-3'>
            Menyelaraskan commit riil dengan kekurangan {missingHours.toFixed(1)} jam WAD dan User Story Taiga aktif.
          </p>
        </div>
      </div>
    );
  }

  return (
    <EmptyState
      icon={<Clock size={24} />}
      tone='blue'
      title={`Sembuhkan Kekurangan ${missingHours.toFixed(1)} Jam Secara Otomatis`}
      description={`AI akan menyusun draf task Taiga berbasis commit GitLab hari ini (${activeDay?.date}) yang langsung terhubung ke User Story aktif.`}
      action={
        <button
          type='button'
          className='btn btn-primary inline-flex items-center gap-2 px-4.5 py-2 text-[13px] font-semibold'
          disabled={generating}
          onClick={onGenerate}
        >
          <Sparkles size={16} />
          <span>Generate Task dengan AI</span>
        </button>
      }
    />
  );
}
