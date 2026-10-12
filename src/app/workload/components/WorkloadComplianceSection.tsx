'use client';

import { Sparkles } from 'lucide-react';
import type { WorkloadDaySummary } from '@/lib/workload';
import { DailyComplianceGrid } from '../WorkloadCharts';

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface WorkloadComplianceSectionProps {
  days: WorkloadDaySummary[];
  onOpenHealer: (day: WorkloadDaySummary | null) => void;
}

export function WorkloadComplianceSection({
  days,
  onOpenHealer,
}: WorkloadComplianceSectionProps) {
  const handleOpenHealer = () => {
    const todayStr = getTodayDateString();
    const todayDay = days.find((d) => d.date === todayStr);
    const firstGap = days.find((d) => d.isWeekday && d.hoursSpent < 7.5);
    const targetDay =
      todayDay && todayDay.isWeekday ? todayDay : firstGap || null;
    onOpenHealer(targetDay);
  };

  return (
    <section className='card animate-fade-up'>
      <div className='card-title flex items-center justify-between gap-4 flex-wrap mb-4'>
        <div className='flex items-center gap-2.5'>
          <span>Kepatuhan Jam Kerja Harian (Wajib 8 Jam / Hari Weekday)</span>
        </div>
        <div className='flex items-center gap-3 flex-wrap'>
          <button
            type='button'
            onClick={handleOpenHealer}
            className='btn btn-primary btn-sm px-3.5 py-2 text-xs rounded-xl inline-flex items-center gap-2 font-semibold'
            id='btn-open-gap-healer'
          >
            <Sparkles size={14} />
            <span>Timesheet Gap Healer (AI)</span>
          </button>
          <span className='row xs dim'>
            <span className='badge badge-green xs'>7.5 - 8.5 Jam: Fit</span>
            <span className='badge badge-cyan xs'>&gt; 8.5 Jam: Lembur</span>
            <span className='badge badge-amber xs'>− Kurang Jam</span>
          </span>
        </div>
      </div>
      <DailyComplianceGrid
        days={days}
        onSelectDay={(day) => onOpenHealer(day)}
      />
    </section>
  );
}
