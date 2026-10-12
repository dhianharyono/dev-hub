'use client';

import React from 'react';
import type { WorkloadDaySummary } from '@/lib/workload';

export function DailyComplianceGrid({
  days,
  onSelectDay,
}: {
  days: WorkloadDaySummary[];
  onSelectDay?: (day: WorkloadDaySummary) => void;
}) {
  const weekdaysOnly = days.filter((d) => d.isWeekday);

  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3 sm:gap-3.5'>
      {weekdaysOnly.map((d) => {
        const isFit = d.hoursSpent >= 7.5 && d.hoursSpent <= 8.5;
        const isOver = d.hoursSpent > 8.5;
        const isZero = d.hoursSpent === 0;

        const cardStyle = isFit
          ? 'border-emerald-300 bg-emerald-50/60 hover:border-emerald-400'
          : isOver
            ? 'border-purple-300 bg-purple-50/60 hover:border-purple-400'
            : isZero
              ? 'border-border bg-surface-subtle/80 hover:border-border-strong'
              : 'border-amber-300 bg-amber-50/60 hover:border-amber-400';

        const textCol = isFit
          ? 'text-emerald-700'
          : isOver
            ? 'text-purple-700'
            : isZero
              ? 'text-slate-400'
              : 'text-amber-700';

        return (
          <div
            key={d.date}
            onClick={() => onSelectDay?.(d)}
            className={`p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between min-h-[92px] gap-2 transition-all hover:-translate-y-0.5 hover:shadow-xs ${cardStyle} ${onSelectDay ? 'cursor-pointer' : 'cursor-default'}`}
            title={
              onSelectDay
                ? `${d.dayName}, ${d.date}: ${d.hoursSpent.toFixed(1)} jam. Klik untuk sembuhkan jam dengan AI.`
                : undefined
            }
          >
            <div className='flex items-center justify-between text-xs'>
              <span className='font-semibold text-slate-700'>{d.dayName}</span>
              <span className='font-mono text-[10.5px] text-slate-400'>
                {d.date.slice(8)}/{d.date.slice(5, 7)}
              </span>
            </div>

            <div className='flex items-baseline gap-1.5 my-0.5'>
              <span
                className={`text-xl font-extrabold tracking-tight font-mono ${textCol}`}
              >
                {d.hoursSpent.toFixed(1)}
              </span>
              <span className='text-xs text-slate-400 font-normal'>
                / 8.0 jam
              </span>
            </div>

            <div className='flex items-center justify-between text-[11px] pt-1 border-t border-black/[0.04]'>
              <span className='text-slate-500'>{d.tasksCount} task</span>
              <span className={`font-bold ${textCol}`}>
                {isFit
                  ? '✓ Fit'
                  : isOver
                    ? '⚡ Lembur'
                    : isZero
                      ? 'Kosong'
                      : '− Kurang'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
