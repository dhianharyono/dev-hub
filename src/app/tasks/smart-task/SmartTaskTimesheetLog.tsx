'use client';

import { Calendar, Clock } from 'lucide-react';
import { Select } from '@/components/Select';
import { TIME_SLOTS } from './types';

interface SmartTaskTimesheetLogProps {
  activityDate: string;
  startTime: string;
  totalTimeSpentMinutes: number | null;
  onUpdateDate: (date: string) => void;
  onUpdateStartTime: (time: string) => void;
  onUpdateDuration: (mins: number | null, hours: number | null) => void;
}

export function SmartTaskTimesheetLog({
  activityDate,
  startTime,
  totalTimeSpentMinutes,
  onUpdateDate,
  onUpdateStartTime,
  onUpdateDuration,
}: SmartTaskTimesheetLogProps) {
  return (
    <div className='mt-4 p-4 sm:p-5 bg-surface-subtle/80 rounded-2xl border border-border shadow-xs'>
      <div className='text-xs font-bold text-slate-muted mb-3.5 flex items-center justify-between tracking-wide'>
        <span className='flex items-center gap-2'>
          <Clock size={14} className='text-violet-600' />
          <span>Log Waktu &amp; Aktivitas Taiga</span>
        </span>
        <span className='text-xs text-slate-400'>Otomatis tersimpan ke timesheet task</span>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3.5'>
        <div className='m-0 flex flex-col gap-1.5'>
          <label className='text-xs text-slate-500 flex items-center gap-1.5 font-medium'>
            <Calendar size={12} /> Tanggal Aktivitas
          </label>
          <input
            type='date'
            className='input h-10 px-3 text-xs sm:text-sm rounded-xl'
            value={activityDate}
            onChange={(e) => onUpdateDate(e.target.value)}
          />
        </div>

        <div className='m-0 flex flex-col gap-1.5'>
          <label className='text-xs text-slate-500 flex items-center gap-1.5 font-medium'>
            <Clock size={12} /> Jam Mulai
          </label>
          <Select
            size='sm'
            value={startTime}
            onChange={(e) => onUpdateStartTime(e.target.value)}
            className='!h-10 text-xs sm:text-sm rounded-xl'
          >
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>

        <div className='m-0 flex flex-col gap-1.5'>
          <label className='text-xs text-slate-500 flex items-center gap-1.5 font-medium'>
            <span>⏱ Durasi (Menit)</span>
          </label>
          <div className='flex items-center gap-2'>
            <input
              type='number'
              className='input h-10 px-3 text-xs sm:text-sm flex-1 rounded-xl'
              value={totalTimeSpentMinutes ?? ''}
              placeholder='60'
              onChange={(e) => {
                const mins = e.target.value ? Number(e.target.value) : null;
                onUpdateDuration(
                  mins,
                  mins != null ? Number((mins / 60).toFixed(2)) : null,
                );
              }}
            />
            <span className='text-xs text-slate-500 whitespace-nowrap font-mono font-semibold'>
              {totalTimeSpentMinutes
                ? `(${(totalTimeSpentMinutes / 60).toFixed(1)}j)`
                : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
