'use client';

import { Select } from '@/components/Select';
import type { WorkloadDaySummary } from './types';

interface HealerDateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  gapDays: WorkloadDaySummary[];
  allDays: WorkloadDaySummary[];
  activeDay: WorkloadDaySummary | undefined;
  missingHours: number;
}

export function HealerDateSelector({
  selectedDate,
  onDateChange,
  gapDays,
  allDays,
  activeDay,
  missingHours,
}: HealerDateSelectorProps) {
  return (
    <div className='grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3'>
      <div>
        <label className='xs dim block mb-1.5 font-semibold'>
          PILIH TANGGAL KESENJANGAN (WEEKDAY)
        </label>
        <Select
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className='w-full h-10 text-[13px]'
        >
          {gapDays.map((d) => (
            <option key={d.date} value={d.date}>
              {d.dayName}, {d.date} (Tercatat: {d.hoursSpent.toFixed(1)}j / Kurang{' '}
              {(8 - d.hoursSpent).toFixed(1)}j)
            </option>
          ))}
          {allDays
            .filter((d) => d.isWeekday && d.hoursSpent >= 7.5)
            .map((d) => (
              <option key={d.date} value={d.date}>
                {d.dayName}, {d.date} (Fit: {d.hoursSpent.toFixed(1)}j)
              </option>
            ))}
        </Select>
      </div>

      {/* Gap Metric Card */}
      {activeDay && (
        <div className='bg-surface-subtle rounded-xl px-4 py-2.5 border border-border flex items-center justify-between'>
          <div>
            <div className='xs dim'>STATUS HARI INI</div>
            <div
              className={`font-bold text-[15px] mt-0.5 ${
                activeDay.hoursSpent < 7.5
                  ? 'text-amber-500'
                  : 'text-emerald-500'
              }`}
            >
              {activeDay.hoursSpent < 7.5
                ? `Kurang ${missingHours.toFixed(1)} Jam`
                : 'Sudah Memenuhi Target Fit'}
            </div>
          </div>
          <div className='text-right'>
            <div className='xs dim'>TERCATAT / TARGET</div>
            <div className='mono font-extrabold text-[15px] mt-0.5'>
              {activeDay.hoursSpent.toFixed(1)}j / 8.0j
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
