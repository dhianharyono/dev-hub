const BLOCK = 'skeleton animate-pulse';

const HEAD_WIDTHS = [
  'w-[38%]',
  'w-[24%]',
  'w-[30%]',
  'w-[21%]',
  'w-[27%]',
  'w-[18%]',
];

const CELL_WIDTHS = [
  'w-[72%]',
  'w-[56%]',
  'w-[64%]',
  'w-[48%]',
  'w-[68%]',
  'w-[60%]',
  'w-[75%]',
  'w-[52%]',
];

const ACTION_TITLES = ['w-[58%]', 'w-[46%]', 'w-[63%]', 'w-[52%]', 'w-[44%]'];
const ACTION_DETAILS = ['w-[92%]', 'w-[86%]', 'w-[95%]', 'w-[88%]', 'w-[90%]'];
const ACTION_STEPS = [
  ['w-[74%]', 'w-[58%]', 'w-[42%]'],
  ['w-[68%]', 'w-[49%]', 'w-[36%]'],
  ['w-[81%]', 'w-[63%]', 'w-[45%]'],
  ['w-[71%]', 'w-[55%]', 'w-[39%]'],
  ['w-[66%]', 'w-[47%]', 'w-[34%]'],
];

function Block({ className }: { className: string }) {
  return <div className={`${BLOCK} ${className}`} />;
}

function TableSkeleton({
  titleWidth,
  badge,
  columns,
  rows,
  minHeight,
}: {
  titleWidth: string;
  badge?: string;
  columns: number;
  rows: number;
  minHeight?: string;
}) {
  return (
    <section className={`card h-full flex flex-col ${minHeight ?? ''}`}>
      <div className='card-title'>
        <Block className={`h-3.5 ${titleWidth}`} />
        {badge && <Block className={`h-5 rounded-full ${badge}`} />}
      </div>

      <div className='overflow-x-auto'>
        <table className='table'>
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index}>
                  <Block className={`h-2.5 ${HEAD_WIDTHS[index % HEAD_WIDTHS.length]}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex}>
                    <div className='py-2'>
                      <Block
                        className={`h-3 ${
                          CELL_WIDTHS[(rowIndex + colIndex * 2) % CELL_WIDTHS.length]
                        }`}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='mt-3 space-y-1.5'>
        <Block className='h-2.5 w-[86%]' />
        <Block className='h-2.5 w-[58%]' />
      </div>
    </section>
  );
}

/** Skeleton rapor produktivitas dengan urutan dan proporsi kartu aslinya. */
export function ProductivitySkeleton() {
  return (
    <div
      className='flex flex-col gap-6'
      aria-busy='true'
      aria-label='Memuat rapor produktivitas'
    >
      <section className='card'>
        <div className='flex flex-col lg:flex-row gap-5 items-stretch lg:items-center'>
          <div className='shrink-0 self-center lg:self-auto flex flex-col items-center justify-center gap-2 min-w-[150px] h-[130px] px-6 py-4 rounded-2xl border border-border bg-surface-subtle'>
            <Block className='h-9 w-16' />
            <Block className='h-5 w-24 rounded-full' />
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2.5 flex-wrap'>
              <Block className='h-4 w-[240px]' />
              <Block className='h-5 w-14 rounded-full' />
            </div>

            <div className='mt-2 space-y-1.5'>
              <Block className='h-3 w-[78%]' />
              <Block className='h-3 w-[56%]' />
            </div>

            <div className='mt-3.5'>
              <div className='flex justify-between mb-1.5'>
                <Block className='h-2.5 w-24' />
                <Block className='h-2.5 w-20' />
              </div>
              <div className='relative h-2.5 rounded-full bg-slate-200 overflow-hidden'>
                <Block className='h-full w-[60%] rounded-full' />
                <div
                  className='absolute top-0 bottom-0 w-0.5 bg-amber-600'
                  style={{ left: '70%' }}
                  aria-hidden
                />
              </div>
              <Block className='h-2.5 w-[46%] mt-1.5' />
            </div>
          </div>
        </div>
      </section>

      <section className='card'>
        <div className='card-title'>
          <Block className='h-3.5 w-[230px]' />
          <Block className='h-5 w-20 rounded-full' />
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3'>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className='rounded-xl border border-border bg-surface-subtle p-3 min-w-0'
            >
              <div className='flex items-baseline justify-between gap-2'>
                <Block
                  className={`h-2.5 ${['w-[70%]', 'w-[61%]', 'w-[76%]', 'w-[55%]', 'w-[66%]', 'w-[68%]'][index]}`}
                />
                <Block className='h-2 w-5 shrink-0' />
              </div>
              <Block className='h-6 w-12 mt-2' />
              <Block className='h-1.5 w-full mt-2 rounded-full' />
              <Block className='h-2.5 w-[72%] mt-2' />
            </div>
          ))}
        </div>

        <div className='mt-3 space-y-1.5'>
          <Block className='h-2.5 w-full' />
          <Block className='h-2.5 w-[46%]' />
        </div>
      </section>

      <section className='card'>
        <div className='card-title'>
          <Block className='h-3.5 w-[130px]' />
          <Block className='h-5 w-24 rounded-full' />
        </div>

        <div className='flex flex-col gap-2.5'>
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className='flex items-start gap-3 rounded-xl border border-border bg-surface-subtle p-3 min-h-[118px]'
            >
              <Block className='h-7 w-7 rounded-full shrink-0 mt-0.5' />
              <div className='min-w-0 flex-1 flex flex-col gap-2'>
                <Block className={`h-3 ${ACTION_TITLES[index]}`} />
                <Block className={`h-2.5 ${ACTION_DETAILS[index]}`} />
                <div className='space-y-1.5 pt-1'>
                  <Block className={`h-2 ${ACTION_STEPS[index][0]}`} />
                  <Block className={`h-2 ${ACTION_STEPS[index][1]}`} />
                  <Block className={`h-2 ${ACTION_STEPS[index][2]}`} />
                </div>
              </div>
              <Block className='h-3 w-8 shrink-0' />
            </div>
          ))}
        </div>

        <div className='mt-3 space-y-1.5'>
          <Block className='h-2.5 w-full' />
          <Block className='h-2.5 w-[52%]' />
        </div>
      </section>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch'>
        <TableSkeleton
          titleWidth='w-[150px]'
          badge='w-16'
          columns={5}
          rows={8}
          minHeight='lg:min-h-[700px]'
        />
        <TableSkeleton
          titleWidth='w-[120px]'
          badge='w-20'
          columns={4}
          rows={8}
          minHeight='lg:min-h-[700px]'
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch'>
        <TableSkeleton
          titleWidth='w-[170px]'
          badge='w-14'
          columns={6}
          rows={6}
          minHeight='lg:min-h-[480px]'
        />
        <TableSkeleton
          titleWidth='w-[160px]'
          columns={5}
          rows={6}
          minHeight='lg:min-h-[480px]'
        />
      </div>

      <TableSkeleton
        titleWidth='w-[250px]'
        columns={5}
        rows={8}
        minHeight='lg:min-h-[580px]'
      />
    </div>
  );
}
