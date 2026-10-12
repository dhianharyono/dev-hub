export function GitlabSkeletonGrid() {
  return (
    <div className='stack gap-5'>
      {/* Top 3 Cards Skeleton: Score, Radar, Insight */}
      <div className='grid grid-3'>
        <div className='card stack gap-4 min-h-[280px]'>
          <div className='row-between'>
            <div className='skeleton h-4 w-[140px]' />
            <div className='skeleton h-6 w-[100px] rounded-full' />
          </div>
          <div className='row gap-5 items-center'>
            <div className='skeleton w-[140px] h-[140px] rounded-full shrink-0' />
            <div className='stack flex-1 gap-2.5'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='stack gap-1'>
                  <div className='skeleton h-[11px] w-3/5' />
                  <div className='skeleton h-2 w-full rounded-full' />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='card stack gap-4 min-h-[280px]'>
          <div className='skeleton h-4 w-[120px]' />
          <div className='flex-1 flex items-center justify-center'>
            <div className='skeleton w-[180px] h-[180px] rounded-full' />
          </div>
        </div>

        <div className='card stack gap-4 min-h-[280px]'>
          <div className='skeleton h-4 w-[130px]' />
          <div className='stack gap-2.5 flex-1'>
            <div className='skeleton h-12 rounded-xl' />
            <div className='skeleton h-12 rounded-xl' />
            <div className='skeleton h-12 rounded-xl' />
          </div>
        </div>
      </div>

      {/* 8 KPI Cards Grid Skeleton */}
      <div className='grid grid-4'>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className='card relative min-h-[105px]'
          >
            <div className='skeleton h-3 w-[45%]' />
            <div className='skeleton h-7 w-3/5 mt-2' />
            <div className='skeleton h-3 w-4/5 mt-1.5' />
            <div className='skeleton absolute top-4.5 right-4.5 w-9 h-9 rounded-xl' />
          </div>
        ))}
      </div>

      {/* Trend & Hour Charts Grid Skeleton */}
      <div className='grid grid-trend-hour'>
        <div className='card stack gap-3.5 min-h-[220px]'>
          <div className='skeleton h-3.5 w-[140px]' />
          <div className='skeleton h-[170px] w-full rounded-xl' />
        </div>
        <div className='card stack gap-3.5 min-h-[220px]'>
          <div className='skeleton h-3.5 w-[160px]' />
          <div className='skeleton h-[170px] w-full rounded-xl' />
        </div>
      </div>
    </div>
  );
}
