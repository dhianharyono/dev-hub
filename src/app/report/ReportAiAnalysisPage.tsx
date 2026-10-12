import { referenceReportData, type FullReportData } from './reportData';
import { ReportFooter } from './ReportFooter';

interface ReportAiAnalysisPageProps {
  data?: FullReportData;
  currentPage?: number;
  totalPages?: number;
}

export function ReportAiAnalysisPage({
  data = referenceReportData,
  currentPage = 9,
  totalPages = 10,
}: ReportAiAnalysisPageProps) {
  const { aiAnalysis } = data;

  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[34px_38px_24px] mb-8 shadow-sm flex flex-col justify-between min-h-[1100px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        {/* Main AI Header with dynamic active LLM name */}
        <div className='mb-3'>
          <h2 className='text-xl font-extrabold text-slate-900 tracking-tight mb-2 print:text-base print:mb-1'>ANALISIS AI (LLM {aiAnalysis.model})</h2>
        </div>

        {/* AI Narrative Section */}
        <div className='border border-indigo-100 bg-indigo-50/40 rounded-xl p-3.5 mb-4 text-xs text-slate-700 leading-relaxed print:p-1.5 print:mb-1.5 print:text-[8px] print:leading-snug'>
          <div className='mb-3 last:mb-0 print:mb-1.5'>
            <h4 className='text-xs font-bold text-indigo-900 mb-1 print:text-[8.5px] print:mb-0.5'>Ringkasan</h4>
            <p className='text-xs text-slate-700 leading-relaxed print:text-[8px] print:leading-tight'>{aiAnalysis.summary}</p>
          </div>

          <div className='mb-3 last:mb-0 print:mb-1.5'>
            <h4 className='text-xs font-bold text-indigo-900 mb-1 print:text-[8.5px] print:mb-0.5'>Kekuatan</h4>
            <ul className='list-disc pl-5 space-y-1 text-xs text-slate-700 print:space-y-0.5 print:pl-4 print:text-[7.8px]'>
              {aiAnalysis.strengths.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>

          <div className='mb-3 last:mb-0 print:mb-1.5'>
            <h4 className='text-xs font-bold text-indigo-900 mb-1 print:text-[8.5px] print:mb-0.5'>Area Perbaikan</h4>
            <ul className='list-disc pl-5 space-y-1 text-xs text-slate-700 print:space-y-0.5 print:pl-4 print:text-[7.8px]'>
              {aiAnalysis.improvements.map((imp, idx) => (
                <li key={idx}>{imp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Split Grid: KONTRIBUSI PER PROYEK & BAHASA / TIPE FILE */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 my-3 print:gap-2 print:my-1'>
          {/* Left Table: Kontribusi Per Proyek */}
          <div className='flex flex-col gap-1.5'>
            <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-1 print:text-[8.5px]'>KONTRIBUSI PER PROYEK</h3>
            <table className='w-full table-fixed border-collapse text-xs print:text-[7.8px]'>
              <thead>
                <tr className='bg-slate-50 border-b-[1.5px] border-slate-300 text-slate-500 font-extrabold text-[9.5px] tracking-wider uppercase'>
                  <th className='py-2 px-2.5 text-left w-[56%]'>PROYEK</th>
                  <th className='py-2 px-2 text-right font-mono tabular-nums w-[20%]'>COMMIT</th>
                  <th className='py-2 px-2 text-right font-mono tabular-nums w-[24%]'>+/−</th>
                </tr>
              </thead>
              <tbody>
                {aiAnalysis.projectContributions.map((p) => {
                  return (
                    <tr key={p.project} className='border-b border-slate-200 hover:bg-slate-50/60 transition-colors'>
                      <td className='py-1.5 px-2.5'>
                        <div className='truncate font-semibold text-slate-800' title={p.project}>
                          {p.project}
                        </div>
                      </td>
                      <td className='py-1.5 px-2 text-right font-mono tabular-nums text-slate-800'>{p.commits}</td>
                      <td className='py-1.5 px-2 text-right font-mono tabular-nums text-slate-700 text-[11px]'>
                        {p.lines}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right Table: Bahasa / Tipe File */}
          <div className='flex flex-col gap-1.5'>
            <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-1 print:text-[8.5px]'>BAHASA / TIPE FILE</h3>
            <table className='w-full table-fixed border-collapse text-xs print:text-[7.8px]'>
              <thead>
                <tr className='bg-slate-50 border-b-[1.5px] border-slate-300 text-slate-500 font-extrabold text-[9.5px] tracking-wider uppercase'>
                  <th className='py-2 px-2.5 text-left w-[50%]'>EKSTENSI</th>
                  <th className='py-2 px-2.5 text-right font-mono tabular-nums w-[50%]'>BARIS DITAMBAH</th>
                </tr>
              </thead>
              <tbody>
                {aiAnalysis.fileTypes.map((ft) => (
                  <tr key={ft.ext} className='border-b border-slate-200 hover:bg-slate-50/60 transition-colors'>
                    <td className='py-1.5 px-2.5 font-mono font-bold text-slate-800'>{ft.ext}</td>
                    <td className='py-1.5 px-2.5 text-right font-mono tabular-nums text-slate-800'>{ft.linesAdded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hotspots Section: File dengan Perubahan Berulang */}
        <div className='flex flex-col gap-1.5 mt-3.5 print:mt-1'>
          <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-1 print:text-[8.5px]'>
            HOTSPOTS (FILE DENGAN PERUBAHAN BERULANG)
          </h3>
          <table className='w-full table-fixed border-collapse text-xs print:text-[7.8px]'>
            <thead>
              <tr className='bg-slate-50 border-b-[1.5px] border-slate-300 text-slate-500 font-extrabold text-[9.5px] tracking-wider uppercase'>
                <th className='py-2 px-2.5 text-left w-[46%]'>FILE</th>
                <th className='py-2 px-2 text-left w-[26%]'>PROYEK</th>
                <th className='py-2 px-2 text-right font-mono tabular-nums w-[12%]'>COMMIT</th>
                <th className='py-2 px-2.5 text-right font-mono tabular-nums w-[16%]'>BARIS REWORK</th>
              </tr>
            </thead>
            <tbody>
              {aiAnalysis.hotspots.map((h) => (
                <tr key={h.file} className='border-b border-slate-200 hover:bg-slate-50/60 transition-colors'>
                  <td className='py-1.5 px-2.5'>
                    <div className='truncate font-mono text-slate-800 text-[11px]' title={h.file}>
                      {h.file}
                    </div>
                  </td>
                  <td className='py-1.5 px-2'>
                    <div className='truncate text-slate-500 text-[11px]' title={h.project}>
                      {h.project}
                    </div>
                  </td>
                  <td className='py-1.5 px-2 text-right font-mono tabular-nums text-slate-800'>{h.commits}</td>
                  <td className='py-1.5 px-2.5 text-right font-mono tabular-nums text-amber-600 font-bold'>
                    {h.reworkLines}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReportFooter currentPage={currentPage} totalPages={totalPages} />
    </article>
  );
}
