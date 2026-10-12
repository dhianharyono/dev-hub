'use client';

export function WorkloadSkeleton() {
  return (
    <div className='stack gap-5'>
      {/* Skeleton User Profile Header Card */}
      <section className='card flex items-center justify-between flex-wrap gap-4 py-4.5 px-6'>
        <div className='row gap-4'>
          <div className='skeleton w-[52px] h-[52px] rounded-full shrink-0' />
          <div className='stack gap-1.5'>
            <div className='skeleton h-4.5 w-[180px]' />
            <div className='skeleton h-3 w-[240px]' />
          </div>
        </div>
        <div className='row gap-2'>
          <div className='skeleton h-6.5 w-20 rounded-full' />
          <div className='skeleton h-6.5 w-[110px] rounded-full' />
        </div>
      </section>

      {/* 6 Main KPI Cards Skeleton */}
      <div className='grid grid-3 gap-4'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className='card p-5 sm:p-[22px] min-h-[96px]'
          >
            <div className='skeleton h-3 w-[45%]' />
            <div className='skeleton h-6.5 w-3/5 mt-2' />
          </div>
        ))}
      </div>

      {/* Assignments & Insight 2 Columns Skeleton */}
      <div className='grid grid-2 gap-4.5'>
        <div className='card stack gap-3.5 min-h-[260px]'>
          <div className='row-between'>
            <div className='skeleton h-4 w-[140px]' />
            <div className='skeleton h-5.5 w-20 rounded-full' />
          </div>
          <div className='skeleton h-[180px] w-full rounded-xl' />
        </div>

        <div className='card stack gap-3.5 min-h-[260px]'>
          <div className='skeleton h-4 w-[130px]' />
          <div className='stack gap-2.5'>
            <div className='skeleton h-12 rounded-xl' />
            <div className='skeleton h-12 rounded-xl' />
            <div className='skeleton h-12 rounded-xl' />
          </div>
        </div>
      </div>

      {/* Trends Chart Skeleton */}
      <section className='card stack gap-3.5 min-h-[280px]'>
        <div className='skeleton h-4 w-[220px]' />
        <div className='skeleton h-[220px] w-full rounded-xl' />
      </section>

      {/* 2 Columns: Assignment Bar Chart & Donut Chart Skeleton */}
      <div className='grid grid-2 gap-4.5'>
        <div className='card stack gap-3.5 min-h-[260px]'>
          <div className='skeleton h-4 w-[180px]' />
          <div className='skeleton h-[200px] w-full rounded-xl' />
        </div>
        <div className='card stack gap-3.5 min-h-[260px]'>
          <div className='skeleton h-4 w-[180px]' />
          <div className='flex-1 flex items-center justify-center'>
            <div className='skeleton w-40 h-40 rounded-full' />
          </div>
        </div>
      </div>

      {/* Daily Compliance Calendar Grid Skeleton */}
      <section className='card stack gap-3.5'>
        <div className='skeleton h-4 w-[280px]' />
        <div className='skeleton h-40 w-full rounded-xl' />
      </section>
    </div>
  );
}
