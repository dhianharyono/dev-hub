'use client';

export function AssignedTasksSkeleton() {
  return (
    <div className='flex flex-col gap-[22px] animate-in fade-in duration-200'>
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
          </div>

          {/* Table Rows Skeleton */}
          <div className='overflow-x-auto'>
            <table className='table min-w-[920px]'>
              <thead>
                <tr className='bg-surface-subtle/50 whitespace-nowrap'>
                  <th className='w-[85px]'>#Ref</th>
                  <th className='min-w-[240px]'>Judul Task</th>
                  <th className='w-[240px]'>User Story Induk</th>
                  <th className='w-[105px] text-center'>Jam</th>
                  <th className='w-[80px] text-center'>Waktu</th>
                  <th className='w-[210px] text-right'>Status</th>
                  <th className='w-[56px] text-right'>Aksi</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/60 text-xs sm:text-[13px]'>
                {[1, 2, 3, 4].map((rowIdx) => (
                  <tr key={rowIdx} className='h-[54px]'>
                    <td className='py-3.5 px-4 text-center'>
                      <div className='h-4 w-9 bg-slate-200 rounded animate-pulse mx-auto' />
                    </td>
                    <td className='py-3.5 px-4'>
                      <div className='flex flex-col gap-1.5'>
                        <div
                          className={`h-4 bg-slate-200 rounded animate-pulse ${
                            rowIdx % 2 === 1 ? 'w-3/4' : 'w-1/2'
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
                    <td className='py-3.5 px-4 text-center'>
                      <div className='h-4 w-9 bg-slate-200 rounded animate-pulse mx-auto' />
                    </td>
                    <td className='py-3.5 px-4 text-right'>
                      <div className='h-8 w-36 bg-slate-200 rounded-lg animate-pulse ml-auto' />
                    </td>
                    <td className='py-3.5 px-4 text-right'>
                      <div className='h-6 w-6 bg-slate-200 rounded-lg animate-pulse ml-auto' />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination Skeleton */}
          <div className='flex items-center justify-between px-5 py-3.5 bg-surface-subtle/50 border-t border-border flex-wrap gap-3'>
            <div className='h-3.5 w-44 bg-slate-200 rounded animate-pulse' />
            <div className='flex items-center gap-1.5'>
              <div className='h-7 w-14 bg-slate-200 rounded-md animate-pulse' />
              <div className='h-7 w-7 bg-slate-200 rounded-md animate-pulse' />
              <div className='h-7 w-7 bg-slate-200 rounded-md animate-pulse' />
              <div className='h-7 w-14 bg-slate-200 rounded-md animate-pulse' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
