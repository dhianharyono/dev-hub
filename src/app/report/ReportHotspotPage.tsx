import { referenceReportData, type FullReportData } from './reportData';
import { ReportFooter } from './ReportFooter';

interface ReportHotspotPageProps {
  data?: FullReportData;
  currentPage?: number;
  totalPages?: number;
}

export function ReportHotspotPage({
  data = referenceReportData,
  currentPage = 6,
  totalPages = 7,
}: ReportHotspotPageProps) {
  const { hotspots, reworkExamples } = data.talentProfile;
  const fmt = (n: number) => n.toLocaleString('id-ID');

  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[36px_42px_26px] mb-8 shadow-sm flex flex-col justify-between min-h-[1350px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        <h2 className='text-xl font-extrabold text-slate-900 tracking-tight mb-1 print:text-base print:mb-1'>
          HOTSPOT — FILE YANG BERULANG KALI DIUBAH
        </h2>
        <p className='text-[13.0px] text-slate-500 mb-3 print:text-[9.4px] print:mb-1.5'>
          File dengan volume perubahan terbesar. Self-rework adalah baris sendiri yang diubah lagi dalam 21 hari.
        </p>

        <section className='my-3 print:my-1.5'>
          <table className='w-full border-collapse text-[13.7px] print:text-[9.2px] [&_th]:text-left [&_th]:text-[8.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th>FILE</th>
                <th className='num text-right'>COMMIT</th>
                <th className='num text-right'>BARIS</th>
                <th className='num text-right'>SELF-REWORK</th>
                <th className='num text-right'>FIX</th>
              </tr>
            </thead>
            <tbody>
              {(hotspots ?? []).map((h) => (
                <tr key={h.file}>
                  <td className='font-mono text-[13.0px] text-slate-800 break-all' title={h.file}>{h.file}</td>
                  <td className='num mono text-right'>{fmt(h.commits)}</td>
                  <td className='num mono text-right'>{fmt(h.lines)}</td>
                  <td className='num mono text-right'>
                    {fmt(h.selfReworkLines)}
                    <span className='text-slate-400'> ({h.selfReworkPct.toLocaleString('id-ID')}%)</span>
                  </td>
                  <td className='num mono text-right'>{fmt(h.fixCommits)}</td>
                </tr>
              ))}
              {!hotspots?.length ? (
                <tr><td colSpan={5} className='text-slate-400 text-center py-3'>Belum ada hotspot pada periode ini.</td></tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className='my-3 print:my-1.5'>
          <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[10.6px]'>
            CONTOH KODE SENDIRI YANG SEGERA DIUBAH LAGI
          </h3>
          <table className='w-full border-collapse text-[13.7px] print:text-[9.2px] [&_th]:text-left [&_th]:text-[8.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th>FILE</th>
                <th>PEKERJAAN AWAL</th>
                <th>DIUBAH LAGI</th>
                <th className='num text-right'>BARIS</th>
                <th className='num text-right'>JEDA</th>
              </tr>
            </thead>
            <tbody>
              {(reworkExamples ?? []).map((e, idx) => (
                <tr key={`${e.file}-${idx}`}>
                  <td className='font-mono text-[13.0px] text-slate-800 break-all' title={e.file}>{e.file}</td>
                  <td className='font-mono text-[13.0px] text-slate-600'>{e.initialCommit}</td>
                  <td className='font-mono text-[13.0px] text-slate-600'>{e.modifyingCommit}</td>
                  <td className='num mono text-right'>{fmt(e.lines)}</td>
                  <td className='num mono text-right'>{e.gap}</td>
                </tr>
              ))}
              {!reworkExamples?.length ? (
                <tr><td colSpan={5} className='text-slate-400 text-center py-3'>Tidak ada contoh pada periode ini.</td></tr>
              ) : null}
            </tbody>
          </table>
          <div className='text-[11.7px] text-slate-500 mt-1 print:text-[8.8px]'>
            Contoh diambil dari pasangan commit perbaikan pada file yang sama dengan jeda ≤45 hari.
          </div>
        </section>
      </div>

      <ReportFooter currentPage={currentPage} totalPages={totalPages} />
    </article>
  );
}
