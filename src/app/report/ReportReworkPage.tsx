import { referenceReportData, type FullReportData } from './reportData';
import { ReportFooter } from './ReportFooter';

interface ReportReworkPageProps {
  data?: FullReportData;
  currentPage?: number;
  totalPages?: number;
}

export function ReportReworkPage({
  data = referenceReportData,
  currentPage = 10,
  totalPages = 10,
}: ReportReworkPageProps) {
  const { reworkExamples } = data;

  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[34px_38px_24px] mb-8 shadow-sm flex flex-col justify-between min-h-[1100px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        <div className='mb-3'>
          <h2 className='text-xl font-extrabold text-slate-900 tracking-tight mb-2 print:text-base print:mb-1'>CONTOH REWORK ATAS KODE SENDIRI</h2>
        </div>

        <div className='overflow-x-auto my-3 print:my-1'>
          <table className='w-full border-collapse text-xs print:text-[7.8px] [&_th]:text-left [&_th]:text-[9.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-2 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-1 [&_td]:p-2 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th className='w-[32%]'>FILE</th>
                <th className='w-[25%]'>COMMIT AWAL</th>
                <th className='w-[27%]'>DIUBAH LAGI OLEH</th>
                <th className='num w-[8%]'>
                  BARIS
                </th>
                <th className='num w-[8%]'>
                  JEDA
                </th>
              </tr>
            </thead>
            <tbody>
              {reworkExamples.map((rw, idx) => (
                <tr key={idx}>
                  <td className='mono'>
                    <div className='font-mono text-xs text-slate-800 truncate max-w-[280px]' title={rw.file}>
                      {rw.file}
                    </div>
                  </td>
                  <td className='xs'>
                    <div className='text-xs text-slate-600 truncate max-w-[220px] print:text-[7.2px]' title={rw.initialCommit}>
                      {rw.initialCommit}
                    </div>
                  </td>
                  <td className='xs'>
                    <div className='text-xs text-slate-600 truncate max-w-[220px] print:text-[7.2px]' title={rw.modifyingCommit}>
                      {rw.modifyingCommit}
                    </div>
                  </td>
                  <td className='num mono bold'>{rw.lines}</td>
                  <td className='num mono'>{rw.gap}</td>
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
