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
  const textToneClass =
    value >= 70
      ? 'text-emerald-600'
      : value >= 55
        ? 'text-amber-600'
        : 'text-red-600';
  const bgToneClass =
    value >= 70
      ? 'bg-emerald-500'
      : value >= 55
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-center justify-between gap-2.5 text-[13px]'>
        <span className='text-slate-muted'>
          {label}{' '}
          {weight && (
            <span className='text-[10px] text-slate-dim font-medium'>
              ({weight})
            </span>
          )}
        </span>
        <strong className={textToneClass}>{value}</strong>
      </div>
      <div className='h-2 bg-slate-200 rounded-full overflow-hidden'>
        {(() => {
          const barFillStyle: React.CSSProperties = { width: `${value}%` };
          return (
            <span
              className={`block h-full rounded-full transition-all duration-500 ${bgToneClass}`}
              style={barFillStyle}
            />
          );
        })()}
      </div>
    </div>
  );
}
