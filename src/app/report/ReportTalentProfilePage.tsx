import { referenceReportData, type FullReportData } from './reportData';
import { ReportFooter } from './ReportFooter';

interface ReportTalentProfilePageProps {
  data?: FullReportData;
  currentPage?: number;
  totalPages?: number;
}

export function ReportTalentProfilePage({
  data = referenceReportData,
  currentPage = 8,
  totalPages = 10,
}: ReportTalentProfilePageProps) {
  const { talentProfile, meta, overallScore } = data;
  const { metrics, componentScores, qualityIndicators, weeklyCommits, commitHeatmap, identity, narrative, areas } =
    talentProfile;

  const kpiCards: { title: string; value: string; detail?: string; sub?: string }[] = [
    metrics.tenure,
    metrics.commits,
    metrics.lines,
    metrics.releasePoints ?? metrics.projects,
    metrics.mergeRequests,
    metrics.masterReach ?? metrics.projects,
    metrics.codeSurvival,
  ];

  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[34px_38px_24px] mb-8 shadow-sm flex flex-col justify-between min-h-[1100px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        {/* Profile Header */}
        <div className='flex items-start justify-between gap-4 mb-3 print:mb-2'>
          <div>
            <h2 className='text-2xl font-black text-slate-900 tracking-tight leading-tight print:text-[17px]'>{meta.talentName}</h2>
            <div className='text-xs font-semibold text-slate-600 mt-0.5 print:text-[8.5px]'>
              {identity?.role ?? 'Software Engineer'}
              {identity ? (
                <>
                  {' · '}Peringkat #{identity.rank} dari {identity.rankTotal} · #{identity.roleRank} dari {identity.roleTotal}{' '}
                  {identity.role}
                </>
              ) : null}
            </div>
            <div className='text-[10px] text-slate-400 mt-1 max-w-[560px] print:text-[7.5px]'>{meta.periodText} · {meta.mergedIdentitiesNote}</div>
          </div>
          <div className='flex flex-col items-center p-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[72px] print:p-1'>
            <div className='text-xl font-black text-brand leading-none'>{overallScore.grade}</div>
            <div className='text-xs font-mono font-bold text-slate-700 mt-0.5'>{overallScore.score}</div>
            <div className='text-[9px] font-semibold text-slate-500'>{overallScore.gradeLabel}</div>
          </div>
        </div>

        {/* Narrative: movement, strengths, focus */}
        {narrative ? (
          <div className='grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3 mb-3.5 print:gap-2 print:mb-2'>
            <div className='border border-slate-200 rounded-xl p-3 bg-slate-50/50 print:p-1.5'>
              <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[8.5px] print:mb-1'>
                PERGERAKAN TALENT
              </h3>
              <div className='flex flex-col gap-1.5'>
                {narrative.movement.map((p, idx) => (
                  <p key={idx} className='text-[10.5px] text-slate-600 leading-snug print:text-[7.8px] print:leading-tight'>
                    {p}
                  </p>
                ))}
              </div>
            </div>
            <div className='flex flex-col gap-3 print:gap-2'>
              <div className='border border-emerald-200 rounded-xl p-3 bg-emerald-50/40 print:p-1.5'>
                <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-emerald-800 mb-1 print:text-[8.5px]'>
                  KEKUATAN
                </h3>
                <ul className='list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-700 print:text-[7.6px] print:leading-tight'>
                  {narrative.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className='border border-amber-200 rounded-xl p-3 bg-amber-50/40 print:p-1.5'>
                <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-amber-800 mb-1 print:text-[8.5px]'>
                  FOKUS PENGEMBANGAN
                </h3>
                <ul className='list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-700 print:text-[7.6px] print:leading-tight'>
                  {narrative.focus.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {/* 7 KPI Metric Cards Row */}
        <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-3.5 print:gap-1 print:mb-2'>
          {kpiCards.map((card, idx) => (
            <div key={`${card.title}-${idx}`} className='border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between min-h-[60px] print:p-1'>
              <div className='text-[8.5px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[7px]'>{card.title}</div>
              <div className={`text-sm font-extrabold leading-tight print:text-[12px] ${idx === 2 ? 'text-emerald-600' : 'text-slate-900'}`}>
                {card.value}
              </div>
              {'detail' in card && card.detail ? (
                <div className='text-[9.5px] text-slate-500 leading-tight print:text-[7.5px]'>{card.detail}</div>
              ) : null}
              {'sub' in card && card.sub ? <div className='text-[8.5px] text-slate-400 print:text-[7px]'>{card.sub}</div> : null}
            </div>
          ))}
        </div>

        {/* Split Section: SKOR KOMPONEN & INDIKATOR KUALITAS KODE */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5 print:gap-2 print:mb-2'>
          {/* Left: Skor Komponen */}
          <div className='border border-slate-200 rounded-xl p-3 bg-slate-50/50 print:p-1.5'>
            <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[8.5px] print:mb-1'>SKOR KOMPONEN</h3>
            <div className='flex flex-col gap-1.5'>
              {componentScores.map((c) => (
                <div key={c.name} className='flex items-center gap-2 text-xs'>
                  <span className='min-w-[90px] text-[11px] font-medium text-slate-700 print:text-[8px]'>{c.name}</span>
                  <div className='flex-1 h-3 rounded bg-slate-200/70 overflow-hidden print:h-2'>
                    {(() => {
                      const scoreWidthStyle: React.CSSProperties = { width: `${c.score}%` };
                      return <div className='h-full rounded bg-blue-600 transition-all' style={scoreWidthStyle} />;
                    })()}
                  </div>
                  <span className='min-w-[25px] text-right font-mono font-bold text-[11px] text-slate-800 print:text-[8px]'>{c.score}</span>
                </div>
              ))}
            </div>
            <div className='flex justify-between text-[8px] text-slate-400 font-mono mt-1 px-0.5 ml-[90px] mr-[25px]'>
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          {/* Right: Indikator Kualitas Kode */}
          <div className='border border-slate-200 rounded-xl p-3 bg-slate-50/50 print:p-1.5'>
            <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[8.5px] print:mb-1'>INDIKATOR KUALITAS KODE</h3>
            <div className='flex flex-col gap-1.5'>
              {qualityIndicators.map((qi) => (
                <div key={qi.label} className='flex items-center justify-between gap-2 text-xs border-b border-slate-200/60 pb-1.5 last:border-0'>
                  <span className='text-[11px] text-slate-700 print:text-[8px]'>{qi.label}</span>
                  <div className='flex items-center gap-2'>
                    <span className='font-mono font-bold text-[11.5px] text-slate-900 print:text-[8px]'>{qi.value}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded print:text-[7px] ${
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
            </div>
          </div>
        </div>

        {/* Area distribution */}
        {areas ? (
          <div className='border border-slate-200 rounded-xl p-3 bg-slate-50/50 mb-3.5 print:p-1.5 print:mb-2'>
            <div className='flex items-center justify-between mb-1.5 print:mb-1'>
              <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 print:text-[8.5px]'>
                KONTRIBUSI PER AREA
              </h3>
              <span className='text-[10px] font-semibold text-slate-500 print:text-[7.5px]'>Role utama: {areas.primaryRole}</span>
            </div>
            <div className='flex flex-col gap-1'>
              {areas.areas.map((a) => (
                <div key={a.key} className='flex items-center gap-2 text-xs'>
                  <span className='min-w-[70px] text-[10.5px] font-medium text-slate-700 print:text-[8px]'>{a.label}</span>
                  <div className='flex-1 h-2.5 rounded bg-slate-200/70 overflow-hidden print:h-2'>
                    <div className='h-full rounded bg-emerald-600' style={{ width: `${a.pct}%` } as React.CSSProperties} />
                  </div>
                  <span className='min-w-[110px] text-right font-mono text-[10.5px] text-slate-700 print:text-[8px]'>
                    {a.pct}% ({a.lines.toLocaleString('id-ID')} baris)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Weekly Commits Chart */}
        {(() => {
          const maxCount = Math.max(10, ...weeklyCommits.map((w) => w.count));
          const maxY = Math.ceil(maxCount / 20) * 20 || 100;
          return (
            <div className='my-3 print:my-1.5'>
              <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[8.5px] print:mb-1'>COMMIT PER MINGGU</h3>
              <div className='min-w-0 overflow-x-auto'>
                <div className='flex gap-2 items-end h-[100px] print:h-[60px] min-w-[420px]'>
                  <div className='flex flex-col justify-between text-[8px] font-mono text-slate-400 h-full pr-1 shrink-0'>
                    <span>{maxY}</span>
                    <span>{Math.round(maxY * 0.75)}</span>
                    <span>{Math.round(maxY * 0.5)}</span>
                    <span>{Math.round(maxY * 0.25)}</span>
                    <span>0</span>
                  </div>
                  <div className='flex items-end gap-1 flex-1 min-w-0 h-full border-b border-l border-slate-300 pl-1 pb-0.5'>
                    {weeklyCommits.map((w, idx) => {
                      const heightPct = maxY > 0 ? Math.min(100, Math.round((w.count / maxY) * 100)) : 0;
                      const parts = w.week.split('-');
                      const shortLabel = parts.length >= 3 ? `${parts[2]}/${parts[1]}` : w.week;
                      const labelEvery = Math.max(1, Math.ceil(weeklyCommits.length / 12));
                      const showWeek = idx % labelEvery === 0 || idx === weeklyCommits.length - 1;
                      const valueEvery = weeklyCommits.length > 30 ? 2 : 1;
                      const showValue = idx % valueEvery === 0;
                      return (
                        <div key={w.week} className='flex flex-col items-center flex-1 min-w-0 h-full justify-end'>
                          <div className='w-full min-w-0 flex flex-col items-center justify-end flex-1'>
                            {w.count > 0 && showValue && (
                              <span className='text-[7.5px] print:text-[7px] font-mono text-slate-500 mb-0.5 whitespace-nowrap'>{w.count}</span>
                            )}
                            {(() => {
                              const commitColHeightStyle: React.CSSProperties = {
                                height: w.count > 0 ? `${heightPct}%` : '0%',
                                minHeight: w.count > 0 ? '2px' : 0,
                              };
                              return (
                                <div
                                  className='w-full max-w-[14px] bg-blue-500 rounded-t-sm print:max-w-[8px]'
                                  style={commitColHeightStyle}
                                  title={`Minggu ${w.week}: ${w.count} commit`}
                                />
                              );
                            })()}
                          </div>
                          <span className='text-[8px] text-slate-400 font-mono mt-0.5 whitespace-nowrap'>
                            {showWeek ? shortLabel : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Commit Time Heatmap */}
        <div className='my-3 print:my-1.5'>
          <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[8.5px] print:mb-1'>POLA WAKTU COMMIT</h3>
          <div className='flex items-center justify-between gap-4 flex-wrap'>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-1'>
                <span className='w-7' />
                {commitHeatmap.slots.map((s) => (
                  <span key={s} className='text-[8px] text-slate-400 font-mono text-center w-5'>
                    {s}
                  </span>
                ))}
              </div>
              {commitHeatmap.days.map((day, dIdx) => (
                <div key={day} className='flex items-center gap-1'>
                  <span className='text-[9px] font-bold text-slate-500 w-7'>{day}</span>
                  {commitHeatmap.matrix[dIdx].map((lvl, sIdx) => {
                    const bgLvl =
                      lvl === 1 ? 'bg-blue-200' : lvl === 2 ? 'bg-blue-400' : lvl === 3 ? 'bg-blue-600' : lvl === 4 ? 'bg-blue-800' : 'bg-slate-100';
                    return <div key={sIdx} className={`w-5 h-4 rounded-xs border border-slate-200/50 print:w-3 print:h-2.5 ${bgLvl}`} />;
                  })}
                </div>
              ))}
            </div>
            <div className='flex items-center gap-1.5 text-[9px] text-slate-500'>
              <span>Lebih sedikit</span>
              <div className='flex items-center gap-0.5'>
                <span className='w-3.5 h-3.5 rounded-xs bg-slate-100 border border-slate-200/50' />
                <span className='w-3.5 h-3.5 rounded-xs bg-blue-200 border border-slate-200/50' />
                <span className='w-3.5 h-3.5 rounded-xs bg-blue-400 border border-slate-200/50' />
                <span className='w-3.5 h-3.5 rounded-xs bg-blue-600 border border-slate-200/50' />
                <span className='w-3.5 h-3.5 rounded-xs bg-blue-800 border border-slate-200/50' />
              </div>
              <span>Lebih banyak</span>
            </div>
          </div>
        </div>
      </div>

      <ReportFooter currentPage={currentPage} totalPages={totalPages} />
    </article>
  );
}
