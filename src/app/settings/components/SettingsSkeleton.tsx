export function SettingsSkeleton() {
  return (
    <div className='flex flex-col gap-0'>
      {/* 1. Skeleton Page Header */}
      <div className='page-header !items-start relative z-40 mb-3'>
        <div className='max-w-2xl flex flex-col gap-2'>
          <div className='h-3 w-28 rounded-md bg-slate-200 animate-pulse' />
          <div className='h-7 w-60 rounded-xl bg-slate-200 animate-pulse' />
          <div className='h-3.5 w-80 sm:w-96 rounded-md bg-slate-200 animate-pulse mt-0.5' />
        </div>
      </div>

      {/* 2. Skeleton Mode Tampilan Sistem Section */}
      <div className='card p-5 sm:p-6 mb-5 flex flex-col gap-4 border border-border bg-surface shadow-xs rounded-2xl'>
        <div className='flex items-center gap-3 pb-3.5 border-b border-border'>
          <div className='w-9 h-9 rounded-xl bg-slate-200 animate-pulse shrink-0' />
          <div className='flex flex-col gap-1.5 flex-1'>
            <div className='h-4 w-44 rounded-md bg-slate-200 animate-pulse' />
            <div className='h-3 w-72 sm:w-96 rounded-md bg-slate-200 animate-pulse' />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-3.5'>
          {[1, 2].map((i) => (
            <div
              key={i}
              className='p-4 rounded-xl border border-border bg-surface flex items-start gap-3.5'
            >
              <div className='w-9 h-9 rounded-xl bg-slate-200 animate-pulse shrink-0 mt-0.5' />
              <div className='flex-1 flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <div className='h-3.5 w-28 rounded-md bg-slate-200 animate-pulse' />
                  <div className='h-4 w-16 rounded-full bg-slate-200 animate-pulse' />
                </div>
                <div className='h-3 w-full rounded-md bg-slate-200 animate-pulse' />
                <div className='h-3 w-4/5 rounded-md bg-slate-200 animate-pulse' />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Skeleton Status Integrasi Grid (4 cards) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5'>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className='card h-20 flex items-center justify-between gap-3 p-3 sm:py-3 sm:px-5'
          >
            <div className='flex items-center gap-3 min-w-0'>
              <div className='w-9 h-9 rounded-xl bg-slate-200 animate-pulse shrink-0' />
              <div className='flex flex-col gap-1.5'>
                <div className='h-3.5 w-20 rounded-md bg-slate-200 animate-pulse' />
                <div className='h-3 w-28 rounded-md bg-slate-200 animate-pulse' />
              </div>
            </div>
            <div className='h-5 w-20 rounded-full bg-slate-200 animate-pulse shrink-0' />
          </div>
        ))}
      </div>

      {/* 4. Skeleton Quick Action Bar */}
      <div className='flex items-center justify-between px-1 pt-6 pb-4'>
        <div className='h-3 w-36 rounded-md bg-slate-200 animate-pulse' />
        <div className='h-7 w-40 rounded-xl bg-slate-200 animate-pulse' />
      </div>

      {/* 5. Skeleton Modul Konfigurasi Cards (4 minimized cards) */}
      <div className='flex flex-col gap-6'>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className='card p-5 sm:p-6 flex items-center justify-between gap-4 border border-border shadow-xs rounded-2xl'
          >
            <div className='flex items-start gap-2.5 flex-1 min-w-0'>
              <div className='w-[26px] h-[26px] rounded-lg bg-slate-200 animate-pulse shrink-0 mt-0.5' />
              <div className='flex flex-col gap-1.5 flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <div className='h-4 w-44 sm:w-56 rounded-md bg-slate-200 animate-pulse' />
                  <div className='h-4 w-20 rounded-full bg-slate-200 animate-pulse' />
                </div>
                <div className='h-3 w-64 sm:w-80 rounded-md bg-slate-200 animate-pulse' />
              </div>
            </div>

            <div className='shrink-0 flex items-center gap-2'>
              <div className='h-8 w-28 sm:w-32 rounded-xl bg-slate-200 animate-pulse' />
              <div className='w-8 h-8 rounded-lg bg-slate-200 animate-pulse' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
