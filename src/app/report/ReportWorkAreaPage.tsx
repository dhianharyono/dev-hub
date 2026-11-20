import { referenceReportData, type FullReportData } from './reportData';
import { ReportFooter } from './ReportFooter';

interface ReportWorkAreaPageProps {
  data?: FullReportData;
  currentPage?: number;
  totalPages?: number;
}

export function ReportWorkAreaPage({
  data = referenceReportData,
  currentPage = 6,
  totalPages = 8,
}: ReportWorkAreaPageProps) {
  const { workAreas, fileExtensions, commitHeatmap } = data.talentProfile;
  const fmt = (n: number) => n.toLocaleString('id-ID');
  // Nama pendek untuk tabel: buang prefiks grup yang sama di semua repo
  const shortRepo = (name: string) =>
    name
      .replace(/^telkom-digital\/smb\/padiumkm-marketplace\//, '')
      .replace(/^telkom-digital\/smb\//, '')
      .replace(/^telkom-digital\//, '');

  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[36px_42px_26px] mb-8 shadow-sm flex flex-col justify-between min-h-[1350px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        <h2 className='text-xl font-extrabold text-slate-900 tracking-tight mb-1 print:text-base print:mb-1'>AREA KERJA (PROYEK)</h2>
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
