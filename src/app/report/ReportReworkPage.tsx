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
  const issues = data.talentProfile.repeatedIssues;
  const fixCommitCount = issues?.fixCommitCount ?? 0;
  const commitCount = Number(String(data.talentProfile.metrics.commits.value).replace(/\D/g, '')) || 1;
  const fixPct = Math.round((fixCommitCount / commitCount) * 1000) / 10;

  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[34px_38px_24px] mb-8 shadow-sm flex flex-col justify-between min-h-[1100px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        <h2 className='text-xl font-extrabold text-slate-900 tracking-tight mb-2 print:text-base print:mb-1'>ISU BERULANG</h2>

        {/* Summary cards */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3.5 print:gap-1.5 print:mb-2'>
          <div className='border border-slate-200 rounded-xl p-3 bg-slate-50 print:p-1.5'>
            <div className='text-[9px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[7px]'>FILE DIPERBAIKI BERULANG</div>
            <div className='text-2xl font-black text-slate-900 leading-tight print:text-lg'>{issues?.repeatedFiles.length ?? 0}</div>
            <div className='text-[10px] text-slate-500 print:text-[7.5px]'>{fixCommitCount} commit fix ({fixPct}%)</div>
          </div>
          <div className='border border-slate-200 rounded-xl p-3 bg-slate-50 print:p-1.5'>
            <div className='text-[9px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[7px]'>FIX ATAS FIX</div>
            <div className='text-2xl font-black text-amber-700 leading-tight print:text-lg'>{issues?.fixOnFix.count ?? 0}</div>
            <div className='text-[10px] text-slate-500 print:text-[7.5px]'>{issues?.fixOnFix.lines ?? 0} baris perbaikan diperbaiki lagi</div>
          </div>
          <div className='border border-slate-200 rounded-xl p-3 bg-slate-50 print:p-1.5'>
            <div className='text-[9px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[7px]'>KODE BOLAK-BALIK</div>
            <div className='text-2xl font-black text-rose-700 leading-tight print:text-lg'>{issues?.backAndForth.lines ?? 0}</div>
            <div className='text-[10px] text-slate-500 print:text-[7.5px]'>baris di {issues?.backAndForth.commits ?? 0} commit</div>
          </div>
        </div>

        {/* Repeated files */}
        <section className='my-3 print:my-1.5'>
          <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[8.5px]'>
            FILE DIPERBAIKI BERULANG (≥3 FIX PER FILE)
          </h3>
          <table className='w-full border-collapse text-[10.5px] print:text-[7.4px] [&_th]:text-left [&_th]:text-[8.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th>FILE</th>
                <th className='num text-right'>FIX</th>
                <th className='num text-right'>RATA BARIS/FIX</th>
                <th className='num text-right'>RENTANG JEDA</th>
                <th className='num text-right'>MEDIAN JEDA</th>
                <th>KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              {(issues?.repeatedFiles ?? []).slice(0, 8).map((f) => (
                <tr key={f.file}>
                  <td className='font-mono text-[10px] text-slate-800 break-all' title={f.file}>{f.file}</td>
                  <td className='num mono text-right'>{f.fixCount}</td>
                  <td className='num mono text-right'>{f.avgLines}</td>
                  <td className='num mono text-right'>{f.rangeDays} hr</td>
                  <td className='num mono text-right'>{f.medianGapDays} hr</td>
                  <td className='text-slate-600'>{f.kind}</td>
                </tr>
              ))}
              {!issues?.repeatedFiles.length ? (
                <tr><td colSpan={6} className='text-slate-400 text-center py-3'>Belum ada file dengan ≥3 fix pada periode ini.</td></tr>
              ) : null}
            </tbody>
          </table>
          {(issues?.repeatedFiles.length ?? 0) > 8 ? (
            <div className='text-[9px] text-slate-500 mt-1 print:text-[7px]'>
              Menampilkan 8 file dengan fix terbanyak dari {issues?.repeatedFiles.length} file.
            </div>
          ) : null}
        </section>

        {/* Fix on fix */}
        <section className='my-3 print:my-1.5'>
          <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[8.5px]'>
            FIX ATAS FIX (≤45 HARI)
          </h3>
          <table className='w-full border-collapse text-[10.5px] print:text-[7.4px] [&_th]:text-left [&_th]:text-[8.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th>FILE</th>
                <th>PERBAIKAN PERTAMA</th>
                <th>DIPERBAIKI LAGI</th>
                <th className='num text-right'>BARIS</th>
                <th className='num text-right'>JEDA</th>
              </tr>
            </thead>
            <tbody>
              {(issues?.fixOnFix.examples ?? []).slice(0, 5).map((e, idx) => (
                <tr key={`${e.file}-${idx}`}>
                  <td className='font-mono text-[10px] text-slate-800 break-all' title={e.file}>{e.file}</td>
                  <td className='font-mono text-[10px] text-slate-600'>{e.first.slice(0, 8)}</td>
                  <td className='font-mono text-[10px] text-slate-600'>{e.second.slice(0, 8)}</td>
                  <td className='num mono text-right'>{e.lines}</td>
                  <td className='num mono text-right'>{e.gapDays} hr</td>
                </tr>
              ))}
              {!issues?.fixOnFix.examples.length ? (
                <tr><td colSpan={5} className='text-slate-400 text-center py-3'>Tidak ada fix atas fix pada periode ini.</td></tr>
              ) : null}
            </tbody>
          </table>
          {(issues?.fixOnFix.examples.length ?? 0) > 5 ? (
            <div className='text-[9px] text-slate-500 mt-1 print:text-[7px]'>
              Menampilkan 5 contoh terakhir dari {issues?.fixOnFix.examples.length} kejadian fix atas fix.
            </div>
          ) : null}
        </section>

        {/* Back and forth */}
        <section className='my-3 print:my-1.5'>
          <h3 className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[8.5px]'>
            KODE DIHAPUS LALU DIKEMBALIKAN (BOLAK-BALIK)
          </h3>
          <table className='w-full border-collapse text-[10.5px] print:text-[7.4px] [&_th]:text-left [&_th]:text-[8.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th>FILE</th>
                <th className='num text-right'>BARIS KEMBALI</th>
                <th className='num text-right'>COMMIT</th>
                <th>COMMIT TERAKHIR</th>
              </tr>
            </thead>
            <tbody>
              {(issues?.backAndForth.files ?? []).slice(0, 5).map((f) => (
                <tr key={f.file}>
                  <td className='font-mono text-[10px] text-slate-800 break-all' title={f.file}>{f.file}</td>
                  <td className='num mono text-right'>{f.lines}</td>
                  <td className='num mono text-right'>{f.commits}</td>
                  <td className='font-mono text-[10px] text-slate-600'>{f.lastCommit.slice(0, 8)}</td>
                </tr>
              ))}
              {!issues?.backAndForth.files.length ? (
                <tr><td colSpan={4} className='text-slate-400 text-center py-3'>Tidak ada baris yang dihapus lalu dikembalikan.</td></tr>
              ) : null}
            </tbody>
          </table>
          <div className='text-[9px] text-slate-500 mt-1 print:text-[7px]'>
            {(issues?.backAndForth.files.length ?? 0) > 5
              ? `Menampilkan 5 file terbanyak dari ${issues?.backAndForth.files.length} file. `
              : ''}
            Baris trivial (kosong, kurung tunggal) tidak dihitung. File lock dan hasil build dikecualikan.
          </div>
        </section>
      </div>

      <ReportFooter currentPage={currentPage} totalPages={totalPages} />
    </article>
  );
}
