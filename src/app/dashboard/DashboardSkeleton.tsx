'use client';

export function WadSkeletonCard() {
  return (
    <div
      className='bg-surface border border-border rounded-[18px] p-5 shadow-sm flex flex-col gap-4'
      aria-label='Memuat metrik WAD...'
    >
      <div className='flex flex-col gap-1.5'>
        <div className='h-5 w-48 rounded-[10px] bg-slate-100 animate-pulse' />
        <div className='h-3.5 w-80 rounded-[10px] bg-slate-100 animate-pulse' />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)] gap-3.5'>
        <div className='h-[120px] rounded-xl bg-slate-100 animate-pulse' />
        <div className='grid grid-cols-2 gap-2.5'>
          <div className='h-[55px] rounded-xl bg-slate-100 animate-pulse' />
          <div className='h-[55px] rounded-xl bg-slate-100 animate-pulse' />
          <div className='h-[55px] rounded-xl bg-slate-100 animate-pulse' />
          <div className='h-[55px] rounded-xl bg-slate-100 animate-pulse' />
        </div>
      </div>

      <div className='flex items-center justify-between pt-2.5 border-t border-border/70'>
        <div className='h-3 w-28 rounded bg-slate-100 animate-pulse' />
        <div className='h-3 w-56 rounded bg-slate-100 animate-pulse' />
      </div>
    </div>
  );
}

export function GitlabSkeletonCard() {
  return (
    <div
      className='bg-surface border border-border rounded-[18px] p-5 shadow-sm flex flex-col min-h-[560px] gap-4'
      aria-label='Memuat metrik GitLab...'
    >
      <div className='flex flex-col gap-1.5'>
        <div className='h-5 w-44 rounded-[10px] bg-slate-100 animate-pulse' />
        <div className='h-3.5 w-64 rounded-[10px] bg-slate-100 animate-pulse' />
      </div>
      {/* 3 Metric Chips */}
      <div className='grid grid-cols-3 gap-2'>
        <div className='h-[60px] rounded-xl bg-slate-100 animate-pulse' />
        <div className='h-[60px] rounded-xl bg-slate-100 animate-pulse' />
        <div className='h-[60px] rounded-xl bg-slate-100 animate-pulse' />
      </div>
      {/* Chart Placeholder */}
      <div className='h-[140px] rounded-xl bg-slate-100 animate-pulse' />
      {/* Tab Bar */}
      <div className='flex gap-1.5'>
        <div className='h-8 w-28 rounded-lg bg-slate-100 animate-pulse' />
        <div className='h-8 w-28 rounded-lg bg-slate-100 animate-pulse' />
      </div>
      {/* List Items */}
      <div className='flex flex-col gap-2 flex-1'>
        <div className='h-[42px] rounded-lg bg-slate-100 animate-pulse' />
        <div className='h-[42px] rounded-lg bg-slate-100 animate-pulse' />
        <div className='h-[42px] rounded-lg bg-slate-100 animate-pulse' />
      </div>
      {/* Footer */}
      <div className='h-3.5 w-28 rounded bg-slate-100 animate-pulse self-end' />
    </div>
  );
}

export function TaigaSkeletonCard() {
  return (
    <div
      className='bg-surface border border-border rounded-[18px] p-5 shadow-sm flex flex-col min-h-[560px] gap-4'
      aria-label='Memuat metrik Taiga...'
    >
      <div className='flex flex-col gap-1.5'>
        <div className='h-5 w-40 rounded-[10px] bg-slate-100 animate-pulse' />
        <div className='h-3.5 w-60 rounded-[10px] bg-slate-100 animate-pulse' />
      </div>
      {/* 4 Metric Chips */}
      <div className='grid grid-cols-4 gap-1.5'>
        <div className='h-[60px] rounded-xl bg-slate-100 animate-pulse' />
        <div className='h-[60px] rounded-xl bg-slate-100 animate-pulse' />
        <div className='h-[60px] rounded-xl bg-slate-100 animate-pulse' />
        <div className='h-[60px] rounded-xl bg-slate-100 animate-pulse' />
      </div>
      {/* Chart Placeholder */}
      <div className='h-[140px] rounded-xl bg-slate-100 animate-pulse' />
      {/* Content box placeholder */}
      <div className='h-[180px] rounded-xl bg-slate-100 animate-pulse' />
      {/* Footer */}
      <div className='h-3.5 w-32 rounded bg-slate-100 animate-pulse self-end' />
    </div>
  );
}

export function CalendarSkeletonCard() {
  return (
    <div
      className='bg-surface border border-border rounded-[18px] p-5 shadow-sm flex flex-col gap-3'
      aria-label='Memuat kalender beban kerja...'
    >
      <div className='flex justify-between items-center'>
        <div className='h-5 w-36 rounded bg-slate-100 animate-pulse' />
        <div className='h-7 w-28 rounded-lg bg-slate-100 animate-pulse' />
      </div>

      {/* 7-column weekday row */}
      <div className='grid grid-cols-7 gap-1'>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={`day-skel-${i}`}
            className='h-3 rounded bg-slate-100 animate-pulse'
          />
        ))}
      </div>

      {/* 5 rows x 7 date cells */}
      <div className='grid grid-cols-7 gap-1'>
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={`cell-skel-${i}`}
            className='h-[38px] rounded-lg bg-slate-100 animate-pulse'
          />
        ))}
      </div>

      {/* Detail strip */}
      <div className='h-9 rounded-lg bg-slate-100 animate-pulse' />

      {/* Legend row */}
      <div className='h-4 w-11/12 rounded bg-slate-100 animate-pulse' />
    </div>
  );
}

export function ActivityPanelSkeleton({
  customHeight,
}: {
  customHeight?: number;
}) {
  return (
    <div
      className='bg-surface border border-border rounded-[18px] p-5 shadow-sm flex flex-col flex-1 gap-3.5'
      style={customHeight ? { height: customHeight, maxHeight: customHeight } : {}}
      aria-label='Memuat linimasa aktivitas...'
    >
      <div className='h-5 w-36 rounded bg-slate-100 animate-pulse' />
      <div className='h-7 w-4/5 rounded-lg bg-slate-100 animate-pulse' />

      {/* Timeline item placeholders */}
      <div className='flex flex-col gap-3.5 pl-3 flex-1'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`act-skel-${i}`}
            className='flex flex-col gap-1.5'
          >
            <div className='h-3 w-20 rounded bg-slate-100 animate-pulse' />
            <div className='h-3.5 w-11/12 rounded bg-slate-100 animate-pulse' />
            <div className='h-5 w-40 rounded bg-slate-100 animate-pulse' />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className='flex flex-col gap-6' aria-label='Memuat dashboard...'>
      {/* Header Skeleton */}
      <div className='mb-6'>
        <div className='h-7 w-60 rounded mb-1 bg-slate-100 animate-pulse' />
        <div className='h-3.5 w-[440px] max-w-[90%] rounded bg-slate-100 animate-pulse' />
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start'>
        {/* Main Column Skeleton */}
        <div className='flex flex-col gap-6 min-w-0'>
          <WadSkeletonCard />
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <GitlabSkeletonCard />
            <TaigaSkeletonCard />
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className='flex flex-col gap-6 w-full xl:w-[340px] shrink-0'>
          <CalendarSkeletonCard />
          <ActivityPanelSkeleton />
        </div>
      </div>
    </div>
  );
}
