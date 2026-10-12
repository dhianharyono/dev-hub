'use client';

export function SmartTaskSkeleton() {
  return (
    <div className='flex flex-col gap-[22px]'>
      {/* Skeleton Workspace Bar */}
      <div className='flex items-center justify-between gap-4 flex-wrap p-[14px_18px] bg-surface border border-border rounded-[18px] min-h-[66px] shadow-sm'>
        <div className='flex items-center gap-3.5 flex-wrap flex-1'>
          <div className='flex items-center gap-2'>
            <div className='h-3.5 w-[90px] rounded-lg bg-slate-200 animate-pulse' />
            <div className='h-[38px] w-[200px] rounded-lg bg-slate-200 animate-pulse' />
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-3.5 w-20 rounded-lg bg-slate-200 animate-pulse' />
            <div className='h-[38px] w-[220px] rounded-lg bg-slate-200 animate-pulse' />
          </div>
        </div>
        <div className='h-8 w-[130px] rounded-lg bg-slate-200 animate-pulse' />
      </div>

      {/* Skeleton 2-Column Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6.2fr)] gap-[22px] items-start'>
        {/* Left Column */}
        <div className='card flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <div className='h-4 w-[140px] rounded-lg bg-slate-200 animate-pulse' />
            <div className='h-9 w-40 rounded-[10px] bg-slate-200 animate-pulse' />
          </div>
          <div className='h-[190px] rounded-[10px] bg-slate-200 animate-pulse' />
          <div className='flex items-center justify-between'>
            <div className='h-3 w-[100px] rounded bg-slate-200 animate-pulse' />
            <div className='h-3 w-[120px] rounded bg-slate-200 animate-pulse' />
          </div>
          <div className='h-[42px] w-full rounded-[10px] bg-slate-200 animate-pulse' />
          <div className='flex flex-col gap-2 mt-2'>
            <div className='h-3.5 w-[120px] rounded bg-slate-200 animate-pulse' />
            <div className='h-[50px] rounded-[10px] bg-slate-200 animate-pulse' />
            <div className='h-[50px] rounded-[10px] bg-slate-200 animate-pulse' />
          </div>
        </div>

        {/* Right Column */}
        <div className='card flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <div className='h-4 w-[150px] rounded bg-slate-200 animate-pulse' />
              <div className='h-[22px] w-[50px] rounded-full bg-slate-200 animate-pulse' />
            </div>
            <div className='h-[34px] w-[110px] rounded-lg bg-slate-200 animate-pulse' />
          </div>
          <div className='border border-border rounded-[18px] p-[18px] bg-surface shadow-sm flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='h-[18px] w-[18px] rounded bg-slate-200 animate-pulse' />
                <div className='h-[18px] w-[60px] rounded-md bg-slate-200 animate-pulse' />
              </div>
              <div className='h-[22px] w-20 rounded-md bg-slate-200 animate-pulse' />
            </div>
            <div className='h-5 w-4/5 rounded bg-slate-200 animate-pulse' />
            <div className='h-3.5 w-11/12 rounded bg-slate-200 animate-pulse' />
            <div className='flex items-center gap-2 mt-1'>
              <div className='h-[26px] w-[100px] rounded-md bg-slate-200 animate-pulse' />
              <div className='h-[26px] w-20 rounded-md bg-slate-200 animate-pulse' />
              <div className='h-[26px] w-[70px] rounded-md bg-slate-200 animate-pulse' />
            </div>
          </div>
          <div className='border border-border rounded-[18px] p-[18px] bg-surface shadow-sm flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='h-[18px] w-[18px] rounded bg-slate-200 animate-pulse' />
                <div className='h-[18px] w-[60px] rounded-md bg-slate-200 animate-pulse' />
              </div>
              <div className='h-[22px] w-20 rounded-md bg-slate-200 animate-pulse' />
            </div>
            <div className='h-5 w-[65%] rounded bg-slate-200 animate-pulse' />
            <div className='h-3.5 w-[90%] rounded bg-slate-200 animate-pulse' />
            <div className='flex items-center gap-2 mt-1'>
              <div className='h-[26px] w-[100px] rounded-md bg-slate-200 animate-pulse' />
              <div className='h-[26px] w-20 rounded-md bg-slate-200 animate-pulse' />
              <div className='h-[26px] w-[70px] rounded-md bg-slate-200 animate-pulse' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
