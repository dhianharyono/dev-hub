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
      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-3.5'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`card h-20 flex items-center justify-between gap-3 p-3 sm:py-3 sm:px-3.5 ${
              i === 3 ? 'sm:col-span-2 xl:col-span-1' : ''
            }`}
          >
            <div className='flex items-center gap-3 min-w-0'>
              <div className='w-9 h-9 rounded-xl bg-slate-200 animate-pulse shrink-0' />
              <div className='flex flex-col gap-1.5'>
                <div className='h-3.5 w-20 rounded-md bg-slate-200 animate-pulse' />
                <div className='h-3 w-32 rounded-md bg-slate-200 animate-pulse' />
              </div>
            </div>
            <div className='h-5 w-20 rounded-full bg-slate-200 animate-pulse shrink-0' />
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
