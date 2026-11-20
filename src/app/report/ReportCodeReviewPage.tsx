import { referenceReportData, type FullReportData } from './reportData';
import { ReportFooter } from './ReportFooter';

interface ReportCodeReviewPageProps {
  data?: FullReportData;
  currentPage?: number;
  totalPages?: number;
}

export function ReportCodeReviewPage({
  data = referenceReportData,
  currentPage = 5,
  totalPages = 8,
}: ReportCodeReviewPageProps) {
  const review = data.talentProfile.review;
  const weekly = data.talentProfile.weeklyCommits;
  const maxCount = Math.max(10, ...weekly.map((w) => w.count));
  const maxY = Math.ceil(maxCount / 20) * 20 || 100;

  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[36px_42px_26px] mb-8 shadow-sm flex flex-col justify-between min-h-[1350px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        <div className='flex items-start justify-between gap-3 mb-2 print:mb-1'>
          <div>
            <h2 className='text-xl font-extrabold text-slate-900 tracking-tight print:text-base print:mb-1'>CATATAN REVIEW KODE</h2>
            <p className='text-[13.0px] text-slate-500 print:text-[9.4px]'>
              Dinilai otomatis oleh model AI. Commit berskor terendah ditampilkan lebih dulu.
            </p>
          </div>
          <div className='text-right shrink-0'>
            <div className='text-[11.7px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[8.8px]'>SKOR REVIEW</div>
            <div className='text-xl font-black text-slate-900 print:text-[18.8px]'>{review?.score ?? '-'}</div>
            <div className='text-[11.7px] text-slate-400 print:text-[8.8px]'>{review?.count ?? 0} commit dinilai</div>
          </div>
        </div>

        <div className='flex flex-col gap-2.5 mb-3 print:gap-1.5 print:mb-2'>
          {(review?.highlights ?? []).map((h) => (
            <div key={h.sha} className='border border-slate-200 rounded-xl p-3 bg-slate-50/50 print:p-1.5'>
              <div className='flex items-start justify-between gap-2 mb-1 print:mb-0.5'>
                <div className='min-w-0'>
                  <div className='text-[11.7px] font-mono text-slate-400 print:text-[8.8px]'>{h.shortSha}</div>
                  <div className='text-[14.3px] font-bold text-slate-800 leading-tight print:text-[10.0px]'>{h.title}</div>
                </div>
                <span
                  className={`shrink-0 text-[13.0px] font-bold px-1.5 py-0.5 rounded print:text-[8.8px] ${
                    h.score >= 80
                      ? 'bg-emerald-100 text-emerald-800'
                      : h.score >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {h.score}/100
                </span>
              </div>
              <p className='text-[13.0px] text-slate-600 leading-snug mb-1 print:text-[9.2px] print:leading-tight'>{h.summary}</p>
              <ul className='list-disc pl-4 text-[12.3px] text-slate-600 leading-snug print:text-[9.0px] print:leading-tight'>
                {h.notes.slice(0, 4).map((n, idx) => (
                  <li key={idx}>{n}</li>
                ))}
              </ul>
            </div>
          ))}
          {!review?.highlights.length ? (
            <div className='border border-dashed border-slate-300 rounded-xl p-4 text-center text-[13.0px] text-slate-400 print:text-[9.4px]'>
              Belum ada commit yang dinilai pada periode ini.
            </div>
          ) : null}
        </div>

        {weekly.length ? (
          <div className='my-3 print:my-1.5'>
            <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[10.6px] print:mb-1'>COMMIT PER MINGGU</h3>
            <div className='min-w-0 overflow-x-auto'>
              <div className='flex gap-2 items-end h-[120px] print:h-[75px] min-w-0'>
                <div className='flex flex-col justify-between text-[10.4px] font-mono text-slate-400 h-full pr-1 shrink-0'>
                  <span>{maxY}</span>
                  <span>{Math.round(maxY * 0.75)}</span>
                  <span>{Math.round(maxY * 0.5)}</span>
                  <span>{Math.round(maxY * 0.25)}</span>
                  <span>0</span>
                </div>
                <div className='flex items-end gap-1 flex-1 min-w-0 h-full border-b border-l border-slate-300 pl-1 pb-0.5'>
                  {weekly.map((w, idx) => {
                    const heightPct = maxY > 0 ? Math.min(100, Math.round((w.count / maxY) * 100)) : 0;
                    const parts = w.week.split('-');
                    const shortLabel = parts.length >= 3 ? `${parts[2]}/${parts[1]}` : w.week;
                    const labelEvery = Math.max(1, Math.ceil(weekly.length / 12));
                    const showWeek = idx % labelEvery === 0 || idx === weekly.length - 1;
                    return (
                      <div key={w.week} className='flex flex-col items-center flex-1 min-w-0 h-full justify-end'>
                        <div className='w-full min-w-0 flex flex-col items-center justify-end flex-1'>
                          {w.count > 0 ? (
                            <span className='text-[9.1px] print:text-[8.1px] font-mono text-slate-500 mb-0.5 whitespace-nowrap'>{w.count}</span>
                          ) : null}
                          <div
                            className='w-full max-w-[12px] bg-blue-500 rounded-t-sm print:max-w-[7px]'
                            style={{ height: w.count > 0 ? `${heightPct}%` : '0%', minHeight: w.count > 0 ? '2px' : 0 }}
                            title={`Minggu ${w.week}: ${w.count} commit`}
                          />
                        </div>
                        <span className='text-[9.8px] text-slate-400 font-mono mt-0.5 whitespace-nowrap'>
                          {showWeek ? shortLabel : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <ReportFooter currentPage={currentPage} totalPages={totalPages} />
    </article>
  );
}
