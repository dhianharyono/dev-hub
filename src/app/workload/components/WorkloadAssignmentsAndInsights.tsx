'use client';

import type { WorkloadData } from '@/lib/workload';

interface WorkloadAssignmentsAndInsightsProps {
  assignments: WorkloadData['assignments'];
  insights: WorkloadData['insights'];
}

export function WorkloadAssignmentsAndInsights({
  assignments,
  insights,
}: WorkloadAssignmentsAndInsightsProps) {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up'>
      {/* Left: Assignments */}
      <section className='card flex flex-col'>
        <div className='card-title mb-4'>
          <span>Assignments</span>
          <span className='badge badge-cyan xs'>Tribe SMB</span>
        </div>
        <div className='overflow-x-auto flex-1'>
          <table className='w-full border-collapse text-left text-xs sm:text-sm'>
            <thead>
              <tr className='border-b border-border text-slate-muted text-[11px] font-bold uppercase tracking-wider bg-surface-subtle/50'>
                <th className='px-5 py-3.5'>Assignment</th>
                <th className='px-5 py-3.5'>Project</th>
                <th className='px-5 py-3.5'>Availability</th>
                <th className='px-5 py-3.5 text-right whitespace-nowrap min-w-[150px]'>
                  Time Spent
                </th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((asg) => (
                <tr
                  key={asg.name}
                  className='border-b border-border-subtle hover:bg-surface-hover/60 transition-colors'
                >
                  <td className='px-5 py-4 font-semibold text-slate-text'>
                    {asg.name}
                  </td>
                  <td className='px-5 py-4'>
                    <span className='font-mono text-cyan-600 font-semibold'>
                      {asg.project}
                    </span>
                  </td>
                  <td className='px-5 py-4 text-slate-600'>
                    {asg.availability.toFixed(2)}%
                  </td>
                  <td className='px-5 py-4 text-right font-bold text-slate-text whitespace-nowrap'>
                    {asg.timeSpent.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Right: Insight & saran */}
      <section
        className='card flex flex-col'
        aria-labelledby='workload-insight-title'
      >
        <div className='card-title mb-4' id='workload-insight-title'>
          <span>Insight &amp; saran</span>
          {insights && insights.length > 0 && (
            <span className='badge badge-violet xs'>
              {insights.length} insight
            </span>
          )}
        </div>
        <div className='flex-1 flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1'>
          {(!insights || insights.length === 0) && (
            <div className='text-xs text-slate-400 p-4 text-center'>
              Belum ada insight untuk periode ini.
            </div>
          )}
          {insights?.map((ins, i) => (
            <div key={i} className='flex items-start gap-3'>
              <span
                className={`badge ${ins.tone === 'good' ? 'badge-green' : ins.tone === 'warn' ? 'badge-amber' : 'badge-cyan'} shrink-0 text-xs px-2 py-0.5 rounded-md`}
              >
                {ins.tone === 'good' ? '▲' : ins.tone === 'warn' ? '!' : 'i'}
              </span>
              <span className='text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal'>
                {ins.text}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
