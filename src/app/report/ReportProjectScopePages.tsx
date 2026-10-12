import { referenceReportData, type FullReportData } from './reportData';
import { ReportFooter } from './ReportFooter';

interface ReportProjectScopePagesProps {
  data?: FullReportData;
  totalPages?: number;
}

export function ReportProjectScopePages({
  data = referenceReportData,
  totalPages = data.meta.totalPages || 10,
}: ReportProjectScopePagesProps) {
  const { meta, summaryKpis, overallScore, rankingTable, projects } = data;

  // Filter projects for Page 1 (projects with page === 1, or first 12 if dynamic)
  const page1Projects = projects.filter((p) => p.page === 1);
  const maxProjectPage = projects.length > 0 ? Math.max(...projects.map((p) => p.page)) : 1;

  // Build continuation pages if projects span more than 1 page
  const continuationPages: { pageNum: number; items: typeof projects }[] = [];
  for (let p = 2; p <= maxProjectPage; p++) {
    const pageItems = projects.filter((proj) => proj.page === p);
    if (pageItems.length > 0) {
      continuationPages.push({ pageNum: p, items: pageItems });
    }
  }

  return (
    <>
      {/* PAGE 1: Executive Summary & Project Scope Start */}
      <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[34px_38px_24px] mb-8 shadow-sm flex flex-col justify-between min-h-[1100px] box-border'>
        <div className='flex-1 print:overflow-hidden'>
          <div className='text-[9.5px] font-extrabold tracking-widest text-slate-500 uppercase mb-1 print:text-[9px] print:mb-0.5'>GITLAB TALENT TRACER</div>
          <h1 className='text-2xl font-extrabold text-slate-900 tracking-tight mb-1 print:text-[18px] print:mb-0.5'>{meta.title}</h1>
          <div className='text-xs text-slate-500 mb-3 print:text-[9px] print:mb-2'>
            {meta.periodText} · {meta.createdText} · {meta.totalProjectsCount} proyek
          </div>

          {/* 4 Summary KPIs */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3.5 print:gap-1.5 print:mb-2'>
            <div className='border border-slate-200 rounded-lg p-3 bg-slate-50 print:p-1.5 print:border-slate-300'>
              <div className='text-[9.5px] font-extrabold tracking-wider uppercase text-slate-500 mb-1 print:text-[7.5px]'>KONTRIBUTOR</div>
              <div className='text-xl font-extrabold text-slate-900 tracking-tight print:text-[15px]'>{summaryKpis.contributors.value}</div>
              <div className='text-[10.5px] text-slate-500 mt-0.5 truncate print:text-[8px]'>{summaryKpis.contributors.detail}</div>
            </div>

            <div className='border border-slate-200 rounded-lg p-3 bg-slate-50 print:p-1.5 print:border-slate-300'>
              <div className='text-[9.5px] font-extrabold tracking-wider uppercase text-slate-500 mb-1 print:text-[7.5px]'>COMMIT</div>
              <div className='text-xl font-extrabold text-slate-900 tracking-tight print:text-[15px]'>{summaryKpis.commits.value}</div>
              <div className='text-[10.5px] text-slate-500 mt-0.5 truncate print:text-[8px]'>{summaryKpis.commits.detail}</div>
            </div>

            <div className='border border-slate-200 rounded-lg p-3 bg-slate-50 print:p-1.5 print:border-slate-300'>
              <div className='text-[9.5px] font-extrabold tracking-wider uppercase text-slate-500 mb-1 print:text-[7.5px]'>BARIS KODE</div>
              <div className='text-xl font-extrabold text-slate-900 tracking-tight print:text-[15px]'>
                {summaryKpis.lines.added}
              </div>
              <div className='text-[10.5px] text-slate-500 mt-0.5 truncate print:text-[8px]'>{summaryKpis.lines.deleted}</div>
            </div>

            <div className='border border-slate-200 rounded-lg p-3 bg-slate-50 print:p-1.5 print:border-slate-300'>
              <div className='text-[9.5px] font-extrabold tracking-wider uppercase text-slate-500 mb-1 print:text-[7.5px]'>MERGE REQUEST</div>
              <div className='text-xl font-extrabold text-slate-900 tracking-tight print:text-[15px]'>{summaryKpis.mergeRequests.value}</div>
              <div className='text-[10.5px] text-slate-500 mt-0.5 truncate print:text-[8px] invisible'>
                -
              </div>
            </div>
          </div>

          {/* Skor Keseluruhan Bar */}
          <div className='my-4 print:my-2'>
            <div className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[8.5px] print:mb-1'>SKOR KESELURUHAN</div>
            <div className='flex items-center gap-3.5'>
              <span className='w-[130px] shrink-0 font-bold text-sm text-slate-900 print:text-[11px] print:w-[110px]'>{overallScore.name}</span>
              <div className='flex-1 flex flex-col gap-1'>
                <div className='w-full h-[18px] rounded bg-slate-100 border border-slate-300 overflow-hidden print:h-3.5'>
                  {(() => {
                    const overallScopeBarStyle: React.CSSProperties = {
                      width: `${overallScore.score}%`,
                    };
                    return (
                      <div
                        className='h-full rounded-[3px] bg-blue-600'
                        style={overallScopeBarStyle}
                      />
                    );
                  })()}
                </div>
                <div className='flex justify-between text-[9px] text-slate-400 font-mono print:text-[7.5px] px-0.5'>
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>
              <span className='font-mono font-extrabold text-sm text-slate-900 min-w-[72px] shrink-0 text-right whitespace-nowrap print:text-xs'>
                {overallScore.score} · {overallScore.grade}
              </span>
            </div>
          </div>

          {/* Peringkat & Skor Table */}
          <div className='my-4 print:my-2'>
            <div className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[8.5px] print:mb-1'>PERINGKAT</div>
            <div className='overflow-x-auto'>
              <table className='w-full table-fixed border-collapse text-[11px] print:text-[8px]'>
                <thead>
                  <tr className='bg-slate-50 border-b-[1.5px] border-slate-300 text-slate-500 font-extrabold text-[9.5px] tracking-wider uppercase'>
                    <th className='py-2 px-2 text-left w-7'>#</th>
                    <th className='py-2 px-2.5 text-left w-36'>NAMA</th>
                    <th className='py-2 px-2 text-center w-20'>NILAI</th>
                    <th className='py-2 px-2 text-right font-mono tabular-nums w-14'>SKOR</th>
                    <th className='py-2 px-2 text-right font-mono tabular-nums w-14'>PROD.</th>
                    <th className='py-2 px-2 text-right font-mono tabular-nums w-14'>KUAL.</th>
                    <th className='py-2 px-2 text-right font-mono tabular-nums w-14'>KOLAB.</th>
                    <th className='py-2 px-2 text-right font-mono tabular-nums w-16'>KONSIST.</th>
                    <th className='py-2 px-2 text-right font-mono tabular-nums w-14'>BULAN</th>
                    <th className='py-2 px-2 text-right font-mono tabular-nums w-24'>COMMIT/BLN</th>
                    <th className='py-2 px-2 text-right font-mono tabular-nums w-24'>SELF-REWORK</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className='border-b border-slate-200 text-slate-900'>
                    <td className='py-2 px-2 text-left text-slate-500 font-mono'>{rankingTable.rank}</td>
                    <td className='py-2 px-2.5 text-left font-bold truncate'>{rankingTable.name}</td>
                    <td className='py-2 px-2 text-center'>
                      <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-800'>
                        {rankingTable.grade} {rankingTable.gradeLabel}
                      </span>
                    </td>
                    <td className='py-2 px-2 text-right font-mono font-extrabold tabular-nums'>{rankingTable.overall}</td>
                    <td className='py-2 px-2 text-right font-mono tabular-nums'>{rankingTable.productivity}</td>
                    <td className='py-2 px-2 text-right font-mono tabular-nums'>{rankingTable.quality}</td>
                    <td className='py-2 px-2 text-right font-mono tabular-nums'>{rankingTable.collaboration}</td>
                    <td className='py-2 px-2 text-right font-mono tabular-nums'>{rankingTable.consistency}</td>
                    <td className='py-2 px-2 text-right font-mono tabular-nums'>{rankingTable.months}</td>
                    <td className='py-2 px-2 text-right font-mono tabular-nums'>{rankingTable.commitsPerMonth}</td>
                    <td className='py-2 px-2 text-right font-mono tabular-nums'>{rankingTable.selfRework}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className='text-[9.5px] text-slate-500 mt-1.5 leading-normal print:text-[7.5px] print:mt-1'>{rankingTable.footnote}</div>
          </div>

          {/* Cakupan Proyek (Halaman 1) */}
          <div className='mt-4 print:mt-2'>
            <div className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[8.5px] print:mb-1'>CAKUPAN PROYEK</div>
            <table className='w-full table-fixed border-collapse text-[10.5px] print:text-[7.8px]'>
              <thead>
                <tr className='bg-slate-50 border-b-[1.5px] border-slate-300 text-slate-500 font-extrabold text-[9.5px] tracking-wider uppercase'>
                  <th className='py-2 px-3 text-left w-[46%]'>PROYEK</th>
                  <th className='py-2 px-3 text-right font-mono tabular-nums w-[16%]'>COMMIT</th>
                  <th className='py-2 px-3 text-center font-mono tabular-nums w-[12%]'>MR</th>
                  <th className='py-2 px-4 text-left w-[26%]'>CATATAN</th>
                </tr>
              </thead>
              <tbody>
                {page1Projects.map((p, idx) => (
                  <tr key={idx} className='border-b border-slate-200 hover:bg-slate-50/60 transition-colors'>
                    <td className='py-2 px-3 font-semibold text-slate-900 truncate print:text-[7.8px]'>{p.name}</td>
                    <td className='py-2 px-3 text-right font-mono tabular-nums text-slate-800'>{p.commits.toLocaleString('id-ID')}</td>
                    <td className='py-2 px-3 text-center font-mono tabular-nums text-slate-800'>{p.mrs.toLocaleString('id-ID')}</td>
                    <td className='py-2 px-4 text-left text-slate-500 text-[10px] print:text-[7.2px] truncate'>{p.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ReportFooter currentPage={1} totalPages={totalPages} />
      </article>

      {/* Continuation of Cakupan Proyek (Only rendered if projects span > 1 page) */}
      {continuationPages.map((cp) => (
        <article key={cp.pageNum} className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[34px_38px_24px] mb-8 shadow-sm flex flex-col justify-between min-h-[1100px] box-border'>
          <div className='flex-1 print:overflow-hidden'>
            <div className='mt-0'>
              <table className='w-full table-fixed border-collapse text-[10.5px] print:text-[7.8px]'>
                <thead>
                  <tr className='bg-slate-50 border-b-[1.5px] border-slate-300 text-slate-500 font-extrabold text-[9.5px] tracking-wider uppercase'>
                    <th className='py-2 px-3 text-left w-[46%]'>PROYEK</th>
                    <th className='py-2 px-3 text-right font-mono tabular-nums w-[16%]'>COMMIT</th>
                    <th className='py-2 px-3 text-center font-mono tabular-nums w-[12%]'>MR</th>
                    <th className='py-2 px-4 text-left w-[26%]'>CATATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {cp.items.map((p, idx) => (
                    <tr key={idx} className='border-b border-slate-200 hover:bg-slate-50/60 transition-colors'>
                      <td className='py-2 px-3 font-semibold text-slate-900 truncate print:text-[7.8px]'>{p.name}</td>
                      <td className='py-2 px-3 text-right font-mono tabular-nums text-slate-800'>{p.commits.toLocaleString('id-ID')}</td>
                      <td className='py-2 px-3 text-center font-mono tabular-nums text-slate-800'>{p.mrs.toLocaleString('id-ID')}</td>
                      <td className='py-2 px-4 text-left text-slate-500 text-[10px] print:text-[7.2px] truncate'>{p.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ReportFooter currentPage={cp.pageNum} totalPages={totalPages} />
        </article>
      ))}
    </>
  );
}
