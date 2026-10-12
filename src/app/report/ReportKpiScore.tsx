import type { MetricsData } from '@/components/hooks';

interface ReportKpiScoreProps {
  data: MetricsData;
  userName: string;
}

const fmt = (n: number) => n.toLocaleString('id-ID');

export function ReportKpiScore({ data, userName }: ReportKpiScoreProps) {
  return (
    <>
      {/* 4 KPI Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3.5 print:gap-1.5 print:mb-2'>
        <div className='border border-slate-200 rounded-lg p-3 bg-slate-50 print:p-1.5 print:border-slate-300'>
          <div className='text-[9.5px] font-extrabold tracking-wider uppercase text-slate-500 mb-1 print:text-[7.5px]'>KONTRIBUTOR</div>
          <div className='text-xl font-extrabold text-slate-900 tracking-tight print:text-[15px]'>1</div>
          <div className='text-[10.5px] text-slate-500 mt-0.5 truncate print:text-[8px]'>
            {userName || data.user?.name || 'Developer'} (@{data.user?.username || 'developer'})
          </div>
        </div>

        <div className='border border-slate-200 rounded-lg p-3 bg-slate-50 print:p-1.5 print:border-slate-300'>
          <div className='text-[9.5px] font-extrabold tracking-wider uppercase text-slate-500 mb-1 print:text-[7.5px]'>COMMIT</div>
          <div className='text-xl font-extrabold text-slate-900 tracking-tight print:text-[15px]'>{fmt(data.kpis.commits)}</div>
          <div className='text-[10.5px] text-slate-500 mt-0.5 truncate print:text-[8px]'>
            {fmt(data.kpis.mergeCommits)} merge diabaikan
          </div>
        </div>

        <div className='border border-slate-200 rounded-lg p-3 bg-slate-50 print:p-1.5 print:border-slate-300'>
          <div className='text-[9.5px] font-extrabold tracking-wider uppercase text-slate-500 mb-1 print:text-[7.5px]'>BARIS KODE</div>
          <div className='text-xl font-extrabold tracking-tight text-emerald-600 print:text-[15px]'>
            +{fmt(data.kpis.linesAdded)}
          </div>
          <div className='text-[10.5px] text-slate-500 mt-0.5 truncate print:text-[8px]'>
            −{fmt(data.kpis.linesDeleted)} dihapus (bersih)
          </div>
        </div>

        <div className='border border-slate-200 rounded-lg p-3 bg-slate-50 print:p-1.5 print:border-slate-300'>
          <div className='text-[9.5px] font-extrabold tracking-wider uppercase text-slate-500 mb-1 print:text-[7.5px]'>MERGE REQUEST</div>
          <div className='text-xl font-extrabold text-slate-900 tracking-tight print:text-[15px]'>{fmt(data.kpis.mrsCreated)}</div>
          <div className='text-[10.5px] text-slate-500 mt-0.5 truncate print:text-[8px]'>
            {fmt(data.kpis.mrsMerged)} merged · {fmt(data.kpis.reviews)} review
          </div>
        </div>
      </div>

      {/* Skor Keseluruhan */}
      <div className='my-6 print:my-2'>
        <div className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[8.5px] print:mb-1'>SKOR KESELURUHAN</div>
        <div className='flex items-center gap-3.5'>
          <span className='min-w-[160px] font-bold text-sm'>
            {userName}
          </span>
          <div className='flex-1 h-[18px] rounded bg-slate-100 border border-slate-300 overflow-hidden print:h-3.5'>
            {(() => {
              const overallBarStyle: React.CSSProperties = {
                width: `${data.scores.overall}%`,
              };
              return (
                <div
                  className='h-full rounded-[3px] bg-blue-600'
                  style={overallBarStyle}
                />
              );
            })()}
          </div>
          <span className='mono font-extrabold text-base min-w-[60px] text-right'>
            {data.scores.overall} · {data.scores.grade}
          </span>
        </div>
        <div className='flex justify-between text-[9px] text-slate-400 font-mono mt-1 px-0.5 ml-[174px] mr-[74px] print:text-[8px]'>
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>
    </>
  );
}
