'use client';

import React from 'react';

export function ScoreBar({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));
  const textToneClass =
    safeValue >= 70
      ? 'text-emerald-600'
      : safeValue >= 55
        ? 'text-amber-600'
        : 'text-red-600';
  const bgToneClass =
    safeValue >= 70
      ? 'bg-emerald-500'
      : safeValue >= 55
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className='flex flex-col gap-1.5 w-full min-w-0'>
      <div className='flex items-center justify-between gap-2 text-[12.5px] sm:text-[13px]'>
        <span className='text-slate-muted truncate'>
          {label}{' '}
          {weight && (
            <span className='text-[10px] text-slate-dim font-medium'>
              ({weight})
            </span>
          )}
        </span>
        <strong className={`${textToneClass} shrink-0`}>{value}</strong>
      </div>
      <div className='h-2 bg-slate-200 rounded-full overflow-hidden w-full'>
        <span
          className={`block h-full rounded-full transition-all duration-500 ${bgToneClass}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
