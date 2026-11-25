import { referenceReportData, type FullReportData } from './reportData';
import { ReportFooter } from './ReportFooter';

interface ReportSkillPageProps {
  data?: FullReportData;
  currentPage?: number;
  totalPages?: number;
}

const statusClass = (status: 'critical' | 'warn' | 'good') =>
  status === 'critical'
    ? 'bg-rose-100 text-rose-800'
    : status === 'warn'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-emerald-100 text-emerald-800';

export function ReportSkillPage({
  data = referenceReportData,
  currentPage = 4,
  totalPages = 7,
}: ReportSkillPageProps) {
  const skill = data.talentProfile.skill;
  const review = data.talentProfile.review;
  const fmt = (n: number) => n.toLocaleString('id-ID');
  const testPct = (skill?.testPct ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 1 });

  const stats = [
    { title: 'SKOR SKILL KODE', value: skill?.score ?? '-', detail: 'dari 100' },
    { title: 'BARIS KODE DINILAI', value: fmt(skill?.scannedLines ?? 0), detail: `${fmt(skill?.scannedFiles ?? 0)} file` },
    { title: 'KODE TES', value: `${testPct}%`, detail: 'dari baris yang dinilai' },
    { title: 'SKOR REVIEW KODE', value: review?.score ?? '-', detail: `${review?.count ?? 0} commit dinilai` },
  ];

  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[36px_42px_26px] mb-8 shadow-sm flex flex-col justify-between min-h-[1350px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        <h2 className='text-xl font-extrabold text-slate-900 tracking-tight mb-1 print:text-base print:mb-1'>SKILL PROGRAMMING — KUALITAS KODE YANG DI-PUSH</h2>
        <p className='text-[13.0px] text-slate-500 mb-3 print:text-[9.4px] print:mb-1.5'>
          Analisis statis atas baris yang ditambahkan. Belum ada skor relatif tim.
        </p>

        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 print:gap-1 print:mb-2'>
          {stats.map((s) => (
            <div key={s.title} className='border border-slate-200 rounded-lg p-2 bg-slate-50 print:p-1'>
              <div className='text-[11.1px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[8.8px]'>{s.title}</div>
              <div className='text-lg font-extrabold text-slate-900 leading-tight print:text-[16.2px]'>{s.value}</div>
              <div className='text-[11.7px] text-slate-500 print:text-[8.8px]'>{s.detail}</div>
            </div>
          ))}
        </div>

        <section className='my-3 print:my-1.5'>
          <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[10.6px]'>
            TEMUAN PADA KODE YANG DITAMBAHKAN
          </h3>
          <table className='w-full border-collapse text-[13.7px] print:text-[9.2px] [&_th]:text-left [&_th]:text-[8.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th>TEMUAN</th>
                <th className='num text-right'>JUMLAH</th>
                <th className='num text-right'>/100 BARIS</th>
                <th className='text-right'>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {(skill?.issues ?? []).map((i) => (
                <tr key={i.key}>
                  <td className='text-slate-700'>{i.label}</td>
                  <td className='num mono text-right'>{fmt(i.count)}</td>
                  <td className='num mono text-right'>{i.per100}</td>
                  <td className='text-right'>
                    <span className={`inline-block text-[12.3px] font-bold px-1.5 py-0.5 rounded print:text-[8.5px] ${statusClass(i.status)}`}>
                      {i.statusText}
                    </span>
                  </td>
                </tr>
              ))}
              {!skill?.issues.length ? (
                <tr><td colSpan={4} className='text-slate-400 text-center py-3'>Belum ada file yang dipindai pada periode ini.</td></tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className='my-3 print:my-1.5'>
          <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[10.6px]'>
            PROFIL SKILL PER BAHASA
          </h3>
          <table className='w-full border-collapse text-[13.7px] print:text-[9.2px] [&_th]:text-left [&_th]:text-[8.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th>BAHASA</th>
                <th className='num text-right'>BARIS</th>
                <th className='num text-right'>COMMIT</th>
                <th className='text-right'>INTENSITAS</th>
                <th className='num text-right'>SKOR</th>
              </tr>
            </thead>
            <tbody>
              {(skill?.languages ?? []).map((l) => (
                <tr key={l.language}>
                  <td className='text-slate-700'>{l.language}</td>
                  <td className='num mono text-right'>{fmt(l.lines)}</td>
                  <td className='num mono text-right'>{fmt(l.commits)}</td>
                  <td className='text-right text-slate-600'>{l.intensity}</td>
                  <td className='num mono text-right font-bold'>{l.score ?? '-'}</td>
                </tr>
              ))}
              {!skill?.languages.length ? (
                <tr><td colSpan={5} className='text-slate-400 text-center py-3'>Belum ada profil bahasa.</td></tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className='my-3 print:my-1.5'>
          <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[10.6px]'>
            COMMIT YANG PERLU DICEK ULANG
          </h3>
          <table className='w-full border-collapse text-[13.7px] print:text-[9.2px] [&_th]:text-left [&_th]:text-[8.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <thead>
              <tr>
                <th>COMMIT</th>
                <th>FILE</th>
                <th className='text-right'>TEMUAN</th>
              </tr>
            </thead>
            <tbody>
              {(data.talentProfile.commitsToCheck ?? []).map((c, idx) => (
                <tr key={`${c.sha}-${idx}`}>
                  <td className='text-slate-700'>
                    <div className='truncate max-w-[260px]' title={c.title}>
                      <span className='font-mono text-slate-500 mr-1'>{c.sha.slice(0, 8)}</span>
                      {c.title}
                    </div>
                  </td>
                  <td className='font-mono text-[13.0px] text-slate-600 break-all' title={c.file}>{c.file}</td>
                  <td className='text-right text-slate-700'>
                    {c.finding}
                    {c.count > 1 ? <span className='font-mono text-slate-500'> ×{c.count}</span> : null}
                  </td>
                </tr>
              ))}
              {!data.talentProfile.commitsToCheck?.length ? (
                <tr><td colSpan={3} className='text-slate-400 text-center py-3'>Belum ada lokasi temuan tersimpan.</td></tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>

      <ReportFooter currentPage={currentPage} totalPages={totalPages} />
    </article>
  );
}
