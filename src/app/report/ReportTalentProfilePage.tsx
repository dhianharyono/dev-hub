import { referenceReportData, type FullReportData } from './reportData';
import { ReportFooter } from './ReportFooter';

interface ReportTalentProfilePageProps {
  data?: FullReportData;
  currentPage?: number;
  totalPages?: number;
  onPrint?: () => void;
}

export function ReportTalentProfilePage({
  data = referenceReportData,
  currentPage = 1,
  totalPages = 7,
  onPrint,
}: ReportTalentProfilePageProps) {
  const { talentProfile, meta, overallScore } = data;
  const { metrics, componentScores, qualityIndicators, narrative, areas } = talentProfile;

  const kpiCards: { title: string; value: string; detail?: string; sub?: string }[] = [
    metrics.commits,
    metrics.lines,
    metrics.mergeRequests,
    metrics.releasePoints,
    metrics.masterReach,
    metrics.codeSurvival,
  ];

  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[36px_42px_26px] mb-8 shadow-sm flex flex-col justify-between min-h-[1350px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        {/* Profil */}
        <div className='flex items-start justify-between gap-4 mb-3 print:mb-2'>
          <div className='flex items-start gap-4 print:gap-2'>
            <div className='flex flex-col items-center p-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[72px] print:p-1'>
              <div className='text-xl font-black text-brand leading-none'>{overallScore.grade}</div>
              <div className='text-xs font-mono font-bold text-slate-700 mt-0.5'>{overallScore.score}</div>
              <div className='text-[11.7px] font-semibold text-slate-500'>{overallScore.gradeLabel}</div>
            </div>
            <div>
              <h2 className='text-2xl font-black text-slate-900 tracking-tight leading-tight print:text-[21.2px]'>{meta.talentName}</h2>
              <div className='text-xs font-semibold text-slate-600 mt-0.5 print:text-[10.6px]'>
                {areas?.primaryRole ?? '-'}
                {areas?.roleLabel ? <span className='text-slate-400'> · {areas.roleLabel}</span> : null}
              </div>
              <div className='text-[13.0px] text-slate-400 mt-1 print:text-[9.4px]'>
                {meta.periodText} · mulai {metrics.tenure.detail.replace('mulai ', '')}
              </div>
            </div>
          </div>
          <div className='print:hidden'>
            {onPrint ? (
              <button
                type='button'
                onClick={onPrint}
                className='btn btn-primary font-bold whitespace-nowrap'
                id='btn-report-print'
              >
                Cetak PDF
              </button>
            ) : null}
          </div>
        </div>

        {/* Narasi + kekuatan/fokus */}
        {narrative ? (
          <div className='grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3 mb-3 print:gap-2 print:mb-2'>
            <div className='border border-slate-200 rounded-xl p-3 bg-slate-50/50 print:p-1.5'>
              <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[10.6px] print:mb-1'>
                PERGERAKAN TALENT
              </h3>
              <div className='flex flex-col gap-1.5'>
                {narrative.movement.map((p, idx) => (
                  <p key={idx} className='text-[13.7px] text-slate-600 leading-snug print:text-[9.5px] print:leading-tight'>
                    {p}
                  </p>
                ))}
              </div>
            </div>
            <div className='flex flex-col gap-3 print:gap-2'>
              <div className='border border-emerald-200 rounded-xl p-3 bg-emerald-50/40 print:p-1.5'>
                <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-emerald-800 mb-1 print:text-[10.6px]'>
                  KEKUATAN
                </h3>
                <ul className='list-disc pl-4 space-y-0.5 text-[13.7px] text-slate-700 print:text-[9.5px] print:leading-tight'>
                  {narrative.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                  {!narrative.strengths.length ? <li className='list-none text-slate-400'>-</li> : null}
                </ul>
              </div>
              <div className='border border-amber-200 rounded-xl p-3 bg-amber-50/40 print:p-1.5'>
                <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-amber-800 mb-1 print:text-[10.6px]'>
                  FOKUS PENGEMBANGAN
                </h3>
                <ul className='list-disc pl-4 space-y-0.5 text-[13.7px] text-slate-700 print:text-[9.5px] print:leading-tight'>
                  {narrative.focus.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                  {!narrative.focus.length ? <li className='list-none text-slate-400'>-</li> : null}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {/* KPI */}
        <div className='grid grid-cols-3 md:grid-cols-6 gap-2 mb-3 print:gap-1 print:mb-2'>
          {kpiCards.map((card, idx) => (
            <div key={`${card.title}-${idx}`} className='border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between min-h-[60px] print:p-1'>
              <div className='text-[11.1px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[8.8px]'>{card.title}</div>
              <div className={`text-sm font-extrabold leading-tight print:text-[13.8px] ${idx === 1 ? 'text-emerald-600' : 'text-slate-900'}`}>
                {card.value}
              </div>
              {card.detail ? <div className='text-[12.3px] text-slate-500 leading-tight print:text-[9.0px]'>{card.detail}</div> : null}
              {'sub' in card && card.sub ? <div className='text-[11.1px] text-slate-400 print:text-[8.8px]'>{card.sub}</div> : null}
            </div>
          ))}
        </div>

        {/* Skor komponen + indikator kualitas */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3 print:gap-2 print:mb-2'>
          <div className='border border-slate-200 rounded-xl p-3 bg-slate-50/50 print:p-1.5'>
            <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[10.6px] print:mb-1'>SKOR KOMPONEN</h3>
            <div className='flex flex-col gap-1.5'>
              {componentScores.map((c) => (
                <div key={c.name} className='flex items-center gap-2 text-xs'>
                  <span className='min-w-[102px] text-[14.3px] font-medium text-slate-700 print:text-[10.0px]'>
                    {c.name}
                    <span className='text-slate-400'> · {c.weight}%</span>
                  </span>
                  <div className='flex-1 h-3 rounded bg-slate-200/70 overflow-hidden print:h-2'>
                    <div className='h-full rounded bg-blue-600 transition-all' style={{ width: `${c.score ?? 0}%` }} />
                  </div>
                  <span className='min-w-[25px] text-right font-mono font-bold text-[14.3px] text-slate-800 print:text-[10.0px]'>
                    {c.score ?? '-'}
                  </span>
                </div>
              ))}
              {!componentScores.length ? <div className='text-[13.0px] text-slate-400'>-</div> : null}
            </div>
            <div className='flex justify-between text-[10.4px] text-slate-400 font-mono mt-1 px-0.5 ml-[102px] mr-[25px]'>
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          <div className='border border-slate-200 rounded-xl p-3 bg-slate-50/50 print:p-1.5'>
            <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[10.6px] print:mb-1'>INDIKATOR KUALITAS KODE</h3>
            <div className='flex flex-col gap-1.5'>
              {qualityIndicators.map((qi) => (
                <div key={qi.label} className='flex items-center justify-between gap-2 text-xs border-b border-slate-200/60 pb-1.5 last:border-0'>
                  <span className='text-[13.7px] text-slate-700 print:text-[9.5px]'>{qi.label}</span>
                  <div className='flex items-center gap-2 shrink-0'>
                    <span className='font-mono font-bold text-[13.7px] text-slate-900 print:text-[9.5px]'>{qi.value}</span>
                    <span
                      className={`text-[12.3px] font-bold px-1.5 py-0.5 rounded print:text-[8.5px] ${
                        qi.status === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : qi.status === 'warn'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {qi.statusText}
                    </span>
                  </div>
                </div>
              ))}
              {!qualityIndicators.length ? <div className='text-[13.0px] text-slate-400'>-</div> : null}
            </div>
          </div>
        </div>
      </div>

      <ReportFooter currentPage={currentPage} totalPages={totalPages} />
    </article>
  );
}
