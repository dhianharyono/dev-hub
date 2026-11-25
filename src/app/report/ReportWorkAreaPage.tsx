import { referenceReportData, type FullReportData } from './reportData';
import { ReportFooter } from './ReportFooter';

interface ReportWorkAreaPageProps {
  data?: FullReportData;
  currentPage?: number;
  totalPages?: number;
}

export function ReportWorkAreaPage({
  data = referenceReportData,
  currentPage = 5,
  totalPages = 7,
}: ReportWorkAreaPageProps) {
  const { workAreas, fileExtensions, commitHeatmap, weeklyCommits } = data.talentProfile;
  const fmt = (n: number) => n.toLocaleString('id-ID');
  const maxCount = Math.max(10, ...weeklyCommits.map((w) => w.count));
  const maxY = Math.ceil(maxCount / 20) * 20 || 100;
  // Nama pendek untuk tabel: buang prefiks grup yang sama di semua repo
  const shortRepo = (name: string) =>
    name
      .replace(/^telkom-digital\/smb\/padiumkm-marketplace\//, '')
      .replace(/^telkom-digital\/smb\//, '')
      .replace(/^telkom-digital\//, '');

  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[36px_42px_26px] mb-8 shadow-sm flex flex-col justify-between min-h-[1350px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        {/* Commit per minggu: paling atas */}
        <section className='mb-4 print:mb-2'>
          <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[10.6px] print:mb-1'>
            COMMIT PER MINGGU
          </h3>
          {weeklyCommits.length ? (
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
                  {weeklyCommits.map((w, idx) => {
                    const heightPct = maxY > 0 ? Math.min(100, Math.round((w.count / maxY) * 100)) : 0;
                    const parts = w.week.split('-');
                    const shortLabel = parts.length >= 3 ? `${parts[2]}/${parts[1]}` : w.week;
                    const labelEvery = Math.max(1, Math.ceil(weeklyCommits.length / 12));
                    const showWeek = idx % labelEvery === 0 || idx === weeklyCommits.length - 1;
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
          ) : (
            <div className='text-[11.7px] text-slate-400'>Belum ada commit pada periode ini.</div>
          )}
        </section>

        <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[10.6px] print:mb-1'>
          AREA KERJA (PROYEK)
        </h3>
        <p className='text-[13.0px] text-slate-500 mb-2 print:text-[9.4px] print:mb-1'>
          Repository tempat kontribusi tercatat. Poin alur kerja berasal dari branch baru dan MR yang merged.
        </p>

        {/* Area kerja: melebar penuh */}
        <section className='mb-4 print:mb-2'>
          <table className='w-full border-collapse text-[13.0px] print:text-[9.0px] [&_th]:text-left [&_th]:text-[8.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th>REPOSITORY</th>
                <th className='num text-right w-[68px] print:w-[46px]'>COMMIT</th>
                <th className='num text-right w-[172px] print:w-[118px]'>+/−</th>
                <th className='num text-right w-[44px] print:w-[32px]'>MR</th>
                <th className='num text-right w-[56px] print:w-[40px]'>POIN</th>
              </tr>
            </thead>
            <tbody>
              {(workAreas ?? []).map((p) => (
                <tr key={p.name}>
                  <td className='font-semibold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis' title={p.name}>{shortRepo(p.name)}</td>
                  <td className='num mono text-right'>{fmt(p.commits)}</td>
                  <td className='num mono text-right text-[11.7px] whitespace-nowrap'>
                    +{fmt(p.added)} / -{fmt(p.deleted)}
                  </td>
                  <td className='num mono text-right'>{fmt(p.mrs)}</td>
                  <td className='num mono text-right font-bold'>{fmt(p.points)}</td>
                </tr>
              ))}
              {!workAreas?.length ? (
                <tr><td colSpan={5} className='text-slate-400 text-center py-3'>Belum ada proyek pada periode ini.</td></tr>
              ) : null}
            </tbody>
          </table>
          <div className='text-[11.7px] text-slate-500 mt-1 print:text-[8.8px]'>
            Kolom review per repository belum tersedia karena tabel reviewer belum terisi.
          </div>
        </section>

        {/* Pola waktu kerja: di bawah area kerja, melebar penuh */}
        <section className='mb-4 print:mb-2'>
          <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[10.6px] print:mb-1'>
            POLA WAKTU KERJA
          </h3>
          {commitHeatmap.days.length ? (
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-1'>
                <span className='w-9 print:w-7' />
                {commitHeatmap.slots.map((s) => (
                  <span key={s} className='text-[9.8px] text-slate-400 font-mono text-center w-6 print:text-[8.1px] print:w-5'>
                    {s}
                  </span>
                ))}
              </div>
              {commitHeatmap.days.map((day, dIdx) => (
                <div key={day} className='flex items-center gap-1'>
                  <span className='text-[11.1px] font-bold text-slate-500 w-9 print:text-[8.8px] print:w-7'>{day}</span>
                  {commitHeatmap.matrix[dIdx]?.map((lvl, sIdx) => {
                    const bgLvl =
                      lvl === 1 ? 'bg-blue-200' : lvl === 2 ? 'bg-blue-400' : lvl === 3 ? 'bg-blue-600' : lvl === 4 ? 'bg-blue-800' : 'bg-slate-100';
                    return <div key={sIdx} className={`w-6 h-4 rounded-xs border border-slate-200/50 print:w-5 print:h-3 ${bgLvl}`} />;
                  })}
                </div>
              ))}
              <div className='flex items-center gap-1 text-[10.4px] text-slate-400 mt-0.5'>
                <span>Sedikit</span>
                <span className='w-3 h-3 rounded-xs bg-slate-100 border border-slate-200/50' />
                <span className='w-3 h-3 rounded-xs bg-blue-200 border border-slate-200/50' />
                <span className='w-3 h-3 rounded-xs bg-blue-400 border border-slate-200/50' />
                <span className='w-3 h-3 rounded-xs bg-blue-600 border border-slate-200/50' />
                <span className='w-3 h-3 rounded-xs bg-blue-800 border border-slate-200/50' />
                <span>Banyak</span>
              </div>
            </div>
          ) : (
            <div className='text-[11.7px] text-slate-400'>-</div>
          )}
        </section>

        {/* Bahasa / tipe file: paling bawah, melebar penuh */}
        <section>
          <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[10.6px] print:mb-1'>
            BAHASA / TIPE FILE
          </h3>
          <table className='w-full border-collapse text-[13.0px] print:text-[9.0px] [&_th]:text-left [&_th]:text-[8.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th>EKSTENSI</th>
                <th className='num text-right'>BARIS DITAMBAH</th>
              </tr>
            </thead>
            <tbody>
              {(fileExtensions ?? []).map((f) => (
                <tr key={f.ext}>
                  <td className='font-mono font-bold text-slate-800'>{f.ext}</td>
                  <td className='num mono text-right'>{fmt(f.lines)}</td>
                </tr>
              ))}
              {!fileExtensions?.length ? (
                <tr><td colSpan={2} className='text-slate-400 text-center py-3'>-</td></tr>
              ) : null}
            </tbody>
          </table>
        </section>

        {data.aiAnalysis.summary && data.aiAnalysis.summary !== '-' ? (
          <section className='mt-3 print:mt-1.5'>
            <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1 print:text-[10.6px]'>
              CATATAN PENGEMBANGAN
            </h3>
            <div className='border border-indigo-100 bg-indigo-50/40 rounded-xl p-2.5 text-[13.0px] text-slate-700 leading-snug print:p-1.5 print:text-[9.5px] print:leading-tight'>
              <div className='text-[11.1px] text-slate-400 mb-0.5 print:text-[8.5px]'>Model: {data.aiAnalysis.model}</div>
              <p>{data.aiAnalysis.summary}</p>
            </div>
          </section>
        ) : null}
      </div>

      <ReportFooter currentPage={currentPage} totalPages={totalPages} />
    </article>
  );
}
