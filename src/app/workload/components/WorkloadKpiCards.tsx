'use client';

import type { WorkloadData } from '@/lib/workload';

interface WorkloadKpiCardsProps {
  kpis: WorkloadData['kpis'];
}

export function WorkloadKpiCards({ kpis }: WorkloadKpiCardsProps) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up'>
      {/* Card 1: Workload Status */}
      <div className='card kpi flex flex-col min-h-[100px] gap-4'>
        <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
          Workload Status
        </div>
        <div
          className={`font-extrabold text-2xl sm:text-[28px] tracking-tight leading-none ${
            kpis.status === 'Fit'
              ? 'text-emerald-600'
              : kpis.status === 'Overload'
                ? 'text-rose-600'
                : 'text-amber-600'
          }`}
        >
          {kpis.status}
        </div>
      </div>

      {/* Card 2: Workload Percentage */}
      <div className='card kpi flex flex-col min-h-[100px] gap-4'>
        <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
          Workload Percentage
        </div>
        <div className='font-extrabold text-2xl sm:text-[28px] tracking-tight leading-none text-slate-text'>
          {kpis.percentage.toFixed(2)}%
        </div>
      </div>

      {/* Card 3: Activity Compliance */}
      <div className='card kpi flex flex-col min-h-[100px] gap-4'>
        <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
          Activity Compliance
        </div>
        <div className='font-extrabold text-xl sm:text-2xl tracking-tight leading-none text-cyan-600'>
          {kpis.compliance}
        </div>
      </div>

      {/* Card 4: Expected Work Hours */}
      <div className='card kpi flex flex-col min-h-[100px] gap-4'>
        <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
          Expected Work Hours
        </div>
        <div className='font-extrabold text-2xl sm:text-[28px] tracking-tight leading-none text-slate-text'>
          {kpis.expectedHours.toFixed(2)}{' '}
          <span className='text-xs sm:text-sm font-medium text-slate-400'>
            hours
          </span>
        </div>
      </div>

      {/* Card 5: Time Spent */}
      <div className='card kpi flex flex-col min-h-[100px] gap-4'>
        <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
          Time Spent
        </div>
        <div className='font-extrabold text-2xl sm:text-[28px] tracking-tight leading-none text-emerald-600'>
          {kpis.timeSpent.toFixed(2)}{' '}
          <span className='text-xs sm:text-sm font-medium text-slate-400'>
            hours
          </span>
        </div>
      </div>

      {/* Card 6: Activities */}
      <div className='card kpi flex flex-col min-h-[100px] gap-4'>
        <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
          Activities
        </div>
        <div className='font-extrabold text-2xl sm:text-[28px] tracking-tight leading-none text-slate-text'>
          {kpis.activitiesCount}
        </div>
      </div>
    </div>
  );
}
