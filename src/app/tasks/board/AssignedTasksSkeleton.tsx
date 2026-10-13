'use client';

export function AssignedTasksSkeleton() {
  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-200'>
      {[1, 2].map((cardIdx) => (
        <div
          key={cardIdx}
          className='border border-border rounded-2xl overflow-hidden bg-surface shadow-xs'
        >
          {/* Project Header Bar Skeleton */}
          <div className='flex items-center justify-between px-5 py-3.5 bg-surface-hover border-b border-border'>
            <div className='flex items-center gap-2.5'>
              <div className='h-4 w-36 sm:w-48 bg-slate-200 rounded-md animate-pulse' />
              <div className='h-5 w-16 bg-slate-200 rounded-md animate-pulse' />
            </div>
            <div className='h-7 w-28 bg-slate-200 rounded-lg animate-pulse' />
          </div>

          {/* Table Rows Skeleton */}
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse min-w-[780px]'>
              <thead>
                <tr className='border-b border-border/80 bg-surface text-[11px] font-bold text-slate-muted uppercase tracking-wider whitespace-nowrap'>
                  <th className='py-3 px-4 w-[85px] text-center'>Ref</th>
                  <th className='py-3 px-4 min-w-[240px]'>Subject / Nama Task</th>
                  <th className='py-3 px-4 w-[240px]'>User Story Terkait</th>
                  <th className='py-3 px-4 w-[105px] text-center'>Jam</th>
                  <th className='py-3 px-4 w-[210px] text-right'>Status</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/60 text-xs sm:text-[13px]'>
                {[1, 2, 3].map((rowIdx) => (
                  <tr key={rowIdx} className='h-[54px]'>
                    <td className='py-3.5 px-4 text-center'>
                      <div className='h-4 w-9 bg-slate-200 rounded animate-pulse mx-auto' />
                    </td>
                    <td className='py-3.5 px-4'>
                      <div className='flex flex-col gap-1.5'>
                        <div
                          className={`h-4 bg-slate-200 rounded animate-pulse ${
                            rowIdx === 1 ? 'w-3/4' : rowIdx === 2 ? 'w-1/2' : 'w-2/3'
                          }`}
                        />
                      </div>
                    </td>
                    <td className='py-3.5 px-4'>
                      <div className='h-4 w-32 bg-slate-200 rounded animate-pulse' />
                    </td>
                    <td className='py-3.5 px-4 text-center'>
                      <div className='h-5 w-11 bg-slate-200 rounded-md animate-pulse mx-auto' />
                    </td>
                    <td className='py-3.5 px-4 text-right'>
                      <div className='h-8 w-36 bg-slate-200 rounded-lg animate-pulse ml-auto' />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
