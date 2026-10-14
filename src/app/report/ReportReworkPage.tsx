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
          <h2 className='text-xl font-extrabold text-slate-900 tracking-tight mb-2 print:text-base print:mb-1'>
            CONTOH REWORK ATAS KODE SENDIRI
          </h2>
        </div>

        <div className='overflow-x-auto my-3 print:my-1'>
          <table className='w-full table-fixed border-collapse text-xs print:text-[7.8px] [&_th]:text-left [&_th]:text-[9.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-2 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-1 [&_td]:p-2 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th className='w-[38%]'>FILE</th>
                <th className='w-[24%]'>COMMIT AWAL</th>
                <th className='w-[20%]'>DIUBAH LAGI OLEH</th>
                <th className='w-[8%] text-right font-mono tabular-nums whitespace-nowrap'>
                  BARIS
                </th>
                <th className='w-[10%] text-right font-mono tabular-nums whitespace-nowrap'>
                  JEDA
                </th>
              </tr>
            </thead>
            <tbody>
              {reworkExamples.map((rw, idx) => (
                <tr
                  key={idx}
                  className='hover:bg-slate-50/50 transition-colors'
                >
                  <td className='py-2.5 px-2'>
                    <div className='flex flex-col gap-0.5 min-w-0'>
                      <div
                        className='font-mono text-[11px] font-semibold text-slate-800 break-words print:text-[8px] leading-snug'
                        title={rw.file}
                      >
                        {rw.file}
                      </div>
                    </div>
                  </td>
                  <td className='py-2 px-2'>
                    <div
                      className='text-xs text-slate-600 truncate print:text-[7.2px]'
                      title={rw.initialCommit}
                    >
                      {rw.initialCommit}
                    </div>
                  </td>
                  <td className='py-2 px-2'>
                    <div
                      className='text-xs text-slate-600 truncate print:text-[7.2px]'
                      title={rw.modifyingCommit}
                    >
                      {rw.modifyingCommit}
                    </div>
                  </td>
                  <td className='py-2 px-2 text-right font-mono tabular-nums whitespace-nowrap font-bold text-slate-800'>
                    {rw.lines}
                  </td>
                  <td className='py-2 px-2 text-right font-mono tabular-nums whitespace-nowrap font-medium text-slate-700'>
                    {rw.gap}
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
