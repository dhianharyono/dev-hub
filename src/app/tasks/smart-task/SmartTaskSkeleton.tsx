'use client';

export function SmartTaskSkeleton() {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6.2fr)] gap-7 items-start animate-in fade-in duration-200'>
      {/* Left Column: Input Form Skeleton */}
      <section className='card flex flex-col gap-5' aria-label='Memuat input form...'>
        {/* Header & Tabs */}
        <div className='flex items-center justify-between gap-4 flex-wrap'>
          <div className='h-5 w-36 bg-slate-200 rounded-md animate-pulse' />
          <div className='inline-flex items-center p-1 bg-surface-subtle border border-border rounded-xl gap-1 shadow-2xs'>
            <div className='h-8 w-20 bg-slate-200 rounded-lg animate-pulse' />
            <div className='h-8 w-16 bg-slate-100 rounded-lg' />
          </div>
        </div>

        {/* Project & Sprint Select Box */}
        <div className='p-3.5 bg-surface-subtle/80 rounded-2xl border border-border flex flex-col gap-2.5'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
            <div className='flex flex-col gap-1.5'>
              <div className='h-3.5 w-24 bg-slate-200 rounded animate-pulse' />
              <div className='h-10 w-full rounded-xl bg-slate-200/80 animate-pulse' />
            </div>
            <div className='flex flex-col gap-1.5'>
              <div className='h-3.5 w-32 bg-slate-200 rounded animate-pulse' />
              <div className='h-10 w-full rounded-xl bg-slate-200/80 animate-pulse' />
            </div>
          </div>
        </div>

        {/* Target Item Type & User Story Segmented Buttons */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <div className='flex flex-col gap-1.5'>
            <div className='h-3.5 w-28 bg-slate-200 rounded animate-pulse' />
            <div className='h-11 w-full rounded-xl bg-slate-200/80 animate-pulse' />
          </div>
          <div className='flex flex-col gap-1.5'>
            <div className='h-3.5 w-36 bg-slate-200 rounded animate-pulse' />
            <div className='h-11 w-full rounded-xl bg-slate-200/80 animate-pulse' />
          </div>
        </div>

        {/* Textarea Area */}
        <div className='relative flex flex-col'>
          <div className='h-[200px] w-full rounded-2xl bg-slate-200/60 animate-pulse border border-border' />
          <div className='flex items-center justify-between mt-2 px-1'>
            <div className='h-3 w-28 bg-slate-200 rounded animate-pulse' />
            <div className='h-3 w-24 bg-slate-200 rounded animate-pulse' />
          </div>
        </div>

        {/* Action Button */}
        <div>
          <div className='h-11 w-full rounded-xl bg-brand/20 animate-pulse border border-brand/30' />
        </div>
      </section>

      {/* Right Column: Drafts Section Skeleton */}
      <section className='flex flex-col gap-3.5' aria-label='Memuat draft...'>
        {/* Header Bar */}
        <div className='flex items-center justify-between gap-3 flex-wrap'>
          <div className='h-5 w-40 bg-slate-200 rounded-md animate-pulse' />
          <div className='flex items-center gap-2 flex-wrap'>
            <div className='h-8 w-16 rounded-lg bg-slate-200 animate-pulse' />
            <div className='h-8 w-16 rounded-lg bg-slate-200 animate-pulse' />
            <div className='h-8 w-24 rounded-lg bg-slate-200 animate-pulse' />
          </div>
        </div>

        {/* Empty State Card Placeholder */}
        <div className='py-11 px-6 text-center bg-surface border border-dashed border-border-strong rounded-[18px] flex flex-col items-center gap-3.5'>
          <div className='w-[58px] h-[58px] rounded-[18px] bg-slate-100 border border-border grid place-items-center animate-pulse'>
            <div className='w-6 h-6 rounded-md bg-slate-200' />
          </div>
          <div className='flex flex-col items-center gap-2'>
            <div className='h-4 w-44 bg-slate-200 rounded animate-pulse' />
            <div className='h-3 w-72 max-w-full bg-slate-200 rounded animate-pulse' />
            <div className='h-3 w-56 max-w-full bg-slate-200 rounded animate-pulse' />
          </div>
        </div>
      </section>
    </div>
  );
}
