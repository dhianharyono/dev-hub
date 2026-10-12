export function SettingsSkeleton() {
  return (
    <div className='flex flex-col gap-6'>
      {/* Skeleton Header */}
      <div className='mb-3'>
        <div className='flex flex-col gap-2'>
          <div className='h-3.5 w-28 rounded-lg bg-slate-200 animate-pulse' />
          <div className='h-7 w-56 rounded-lg bg-slate-200 animate-pulse' />
          <div className='h-3.5 w-90 rounded-lg bg-slate-200 animate-pulse' />
        </div>
      </div>

      {/* Skeleton Status Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='bg-surface border border-border rounded-[18px] p-[18px_20px] shadow-sm flex items-center justify-between gap-3.5'
          >
            <div className='flex items-center gap-3.5'>
              <div className='w-[42px] h-[42px] rounded-xl bg-slate-200 animate-pulse' />
              <div className='flex flex-col gap-1.5'>
                <div className='h-3.5 w-24 rounded-lg bg-slate-200 animate-pulse' />
                <div className='h-3 w-32 rounded-lg bg-slate-200 animate-pulse' />
              </div>
            </div>
            <div className='h-6 w-20 rounded-full bg-slate-200 animate-pulse' />
          </div>
        ))}
      </div>

      {/* Skeleton Form Sections */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className='bg-surface border border-border rounded-[18px] p-6 shadow-sm flex flex-col gap-4'
        >
          <div className='flex items-center justify-between'>
            <div className='h-5 w-52 rounded-lg bg-slate-200 animate-pulse' />
            <div className='h-8 w-24 rounded-lg bg-slate-200 animate-pulse' />
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3.5'>
            <div className='h-10 rounded-lg bg-slate-200 animate-pulse' />
            <div className='h-10 rounded-lg bg-slate-200 animate-pulse' />
            <div className='h-10 rounded-lg bg-slate-200 animate-pulse' />
          </div>
        </div>
      ))}
    </div>
  );
}
