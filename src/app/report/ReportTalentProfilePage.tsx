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
  const { metrics, componentScores, qualityIndicators, weeklyCommits, monthlyContributions, commitHeatmap } =
    talentProfile;

  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[34px_38px_24px] mb-8 shadow-sm flex flex-col justify-between min-h-[1100px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        {/* Profile Header */}
        <div className='flex items-center justify-between gap-4 mb-3.5 print:mb-2'>
          <div>
            <h2 className='text-2xl font-black text-slate-900 tracking-tight leading-tight print:text-[17px]'>{meta.talentName}</h2>
            <div className='text-xs font-semibold text-slate-500 mt-0.5 print:text-[8.5px]'>
              @{meta.username} · {meta.email}
            </div>
            <div className='text-[10px] text-slate-400 mt-1 max-w-[540px] print:text-[7.5px]'>{meta.mergedIdentitiesNote}</div>
          </div>
          <div className='flex flex-col items-center p-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[70px] print:p-1'>
            <div className='text-xl font-black text-brand leading-none'>{overallScore.grade}</div>
            <div className='text-xs font-mono font-bold text-slate-700 mt-0.5'>{overallScore.score}</div>
            <div className='text-[9px] font-semibold text-slate-500'>{overallScore.gradeLabel}</div>
          </div>
        </div>

        {/* 7 KPI Metric Cards Row */}
        <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-3.5 print:gap-1 print:mb-2'>
          <div className='border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between min-h-[60px] print:p-1'>
            <div className='text-[8.5px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[7px]'>{metrics.tenure.title}</div>
            <div className='text-sm font-extrabold text-slate-900 leading-tight print:text-[12px]'>{metrics.tenure.value}</div>
            <div className='text-[9.5px] text-slate-500 leading-tight print:text-[7.5px]'>{metrics.tenure.detail}</div>
            <div className='text-[8.5px] text-slate-400 print:text-[7px]'>{metrics.tenure.sub}</div>
          </div>

          <div className='border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between min-h-[60px] print:p-1'>
            <div className='text-[8.5px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[7px]'>{metrics.commits.title}</div>
            <div className='text-sm font-extrabold text-slate-900 leading-tight print:text-[12px]'>{metrics.commits.value}</div>
            <div className='text-[9.5px] text-slate-500 leading-tight print:text-[7.5px]'>{metrics.commits.detail}</div>
            <div className='text-[8.5px] text-slate-400 print:text-[7px]'>{metrics.commits.sub}</div>
          </div>

          <div className='border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between min-h-[60px] print:p-1'>
            <div className='text-[8.5px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[7px]'>{metrics.lines.title}</div>
            <div className='text-sm font-extrabold text-emerald-600 leading-tight print:text-[12px]'>{metrics.lines.value}</div>
          </div>

          <div className='border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between min-h-[60px] print:p-1'>
            <div className='text-[8.5px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[7px]'>{metrics.projects.title}</div>
            <div className='text-sm font-extrabold text-slate-900 leading-tight print:text-[12px]'>{metrics.projects.value}</div>
            <div className='text-[9.5px] text-slate-500 leading-tight print:text-[7.5px]'>{metrics.projects.detail}</div>
          </div>

          <div className='border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between min-h-[60px] print:p-1'>
            <div className='text-[8.5px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[7px]'>{metrics.mergeRequests.title}</div>
            <div className='text-sm font-extrabold text-slate-900 leading-tight print:text-[12px]'>{metrics.mergeRequests.value}</div>
            <div className='text-[9.5px] text-slate-500 leading-tight print:text-[7.5px]'>{metrics.mergeRequests.detail}</div>
          </div>

          <div className='border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between min-h-[60px] print:p-1'>
            <div className='text-[8.5px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[7px]'>{metrics.reviews.title}</div>
            <div className='text-sm font-extrabold text-slate-900 leading-tight print:text-[12px]'>{metrics.reviews.value}</div>
            <div className='text-[9.5px] text-slate-500 leading-tight print:text-[7.5px]'>{metrics.reviews.detail}</div>
          </div>

          <div className='border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between min-h-[60px] print:p-1'>
            <div className='text-[8.5px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[7px]'>{metrics.codeSurvival.title}</div>
            <div className='text-sm font-extrabold text-slate-900 leading-tight print:text-[12px]'>{metrics.codeSurvival.value}</div>
            <div className='text-[9.5px] text-slate-500 leading-tight print:text-[7.5px]'>{metrics.codeSurvival.detail}</div>
          </div>
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
                      return (
                        <div
                          className='h-full rounded bg-blue-600 transition-all'
                          style={scoreWidthStyle}
                        />
                      );
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

        {/* Weekly Commits Chart */}
        {(() => {
          const maxCount = Math.max(10, ...weeklyCommits.map((w) => w.count));
          const maxY = Math.ceil(maxCount / 20) * 20 || 100;
          return (
            <div className='my-3 print:my-1.5'>
              <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[8.5px] print:mb-1'>COMMIT PER MINGGU</h3>
              <div className='flex gap-2 items-end h-[100px] print:h-[60px]'>
                <div className='flex flex-col justify-between text-[8px] font-mono text-slate-400 h-full pr-1'>
                  <span>{maxY}</span>
                  <span>{Math.round(maxY * 0.75)}</span>
                  <span>{Math.round(maxY * 0.5)}</span>
                  <span>{Math.round(maxY * 0.25)}</span>
                  <span>0</span>
                </div>
                <div className='flex items-end gap-1 flex-1 h-full border-b border-l border-slate-300 pl-1 pb-0.5'>
                  {weeklyCommits.map((w) => {
                    const heightPct = maxY > 0 ? Math.min(100, Math.round((w.count / maxY) * 100)) : 0;
                    const parts = w.week.split('-');
                    const shortLabel = parts.length >= 3 ? `${parts[2]}/${parts[1]}` : w.week;
                    return (
                      <div key={w.week} className='flex flex-col items-center flex-1 h-full justify-end'>
                        <div className='w-full flex flex-col items-center justify-end flex-1'>
                          {w.count > 0 && (
                            <span className='text-[8px] font-mono text-slate-500 mb-0.5'>{w.count}</span>
                          )}
                          {(() => {
                            const commitColHeightStyle: React.CSSProperties = {
                              height: w.count > 0 ? `${Math.max(6, heightPct)}%` : '0%',
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
                        <span className='text-[8px] text-slate-400 font-mono mt-0.5'>{shortLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Monthly Contributions Table */}
        <div className='my-3 print:my-1.5'>
          <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[8.5px] print:mb-1'>KONTRIBUSI BULANAN SELAMA PENUGASAN</h3>
          <table className='w-full border-collapse text-xs print:text-[7.8px] [&_th]:text-left [&_th]:text-[9.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1.5 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1.5 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th>BULAN</th>
                <th className='num'>COMMIT</th>
                <th className='num'>HARI AKTIF</th>
                <th className='num'>BARIS DIUBAH</th>
                <th className='num'>MR MERGED</th>
                <th className='num'>REVIEW</th>
              </tr>
            </thead>
            <tbody>
              {monthlyContributions.map((m, idx) => {
                const isTotal = idx === monthlyContributions.length - 1;
                return (
                  <tr key={m.month} className={isTotal ? 'font-bold bg-slate-50' : undefined}>
                    <td className={isTotal ? 'font-bold' : undefined}>{m.month}</td>
                    <td className='num mono'>{m.commits}</td>
                    <td className='num mono'>{m.activeDays}</td>
                    <td className='num mono'>{m.linesChanged}</td>
                    <td className='num mono'>{m.mrsMerged}</td>
                    <td className='num mono'>{m.reviews}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className='text-[9.5px] text-slate-500 mt-1.5 leading-normal print:text-[7.5px]'>{talentProfile.monthlySummary}</div>
        </div>

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
                      lvl === 1
                        ? 'bg-blue-200'
                        : lvl === 2
                          ? 'bg-blue-400'
                          : lvl === 3
                            ? 'bg-blue-600'
                            : lvl === 4
                              ? 'bg-blue-800'
                              : 'bg-slate-100';
                    return (
                      <div
                        key={sIdx}
                        className={`w-5 h-4 rounded-xs border border-slate-200/50 print:w-3 print:h-2.5 ${bgLvl}`}
                      />
                    );
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
