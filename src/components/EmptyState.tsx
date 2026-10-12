'use client';

import React from 'react';

export type EmptyStateTone =
  | 'emerald'
  | 'blue'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'neutral';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  tone?: EmptyStateTone;
  badge?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const toneIconClasses: Record<EmptyStateTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  rose: 'bg-red-50 text-red-600 border-red-200',
  purple: 'bg-violet-50 text-violet-600 border-violet-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
};

export function EmptyState({
  icon,
  tone = 'neutral',
  title,
  description,
  action,
  children,
  className = '',
}: EmptyStateProps) {
  const iconClasses = toneIconClasses[tone] || toneIconClasses.neutral;

  return (
    <div
      className={`w-full text-center py-10 px-6 flex flex-col items-center justify-center rounded-2xl transition-all border border-(--border) bg-[#fafcff] shadow-[0_2px_10px_rgba(27,46,94,0.02)] ${className}`}
    >
      {icon && (
        <div
          className={`w-13 h-13 rounded-2xl flex items-center justify-center mb-3.5 border ${iconClasses}`}
        >
          {icon}
        </div>
      )}

      <strong className='text-[15px] font-bold tracking-tight text-(--text)'>
        {title}
      </strong>

      {description && (
        <p className='text-[12.5px] max-w-md mt-1.5 mb-4 leading-relaxed text-(--text-2)'>
          {description}
        </p>
      )}

      {action && (
        <div className='flex flex-wrap items-center justify-center gap-3 mt-3'>
          {action}
        </div>
      )}

      {children}
    </div>
  );
}
