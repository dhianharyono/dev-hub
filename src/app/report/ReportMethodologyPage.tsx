import { referenceReportData, type FullReportData } from './reportData';
import { ReportFooter } from './ReportFooter';

interface ReportMethodologyPageProps {
  methodology?: FullReportData['methodology'];
  currentPage?: number;
  totalPages?: number;
}

export function ReportMethodologyPage({
  methodology = referenceReportData.methodology,
  currentPage = 8,
  totalPages = 8,
}: ReportMethodologyPageProps) {
  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[36px_42px_26px] mb-8 shadow-sm flex flex-col justify-between min-h-[1350px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        <h2 className='text-xl font-extrabold text-slate-900 tracking-tight mb-2 print:text-base print:mb-1'>Metodologi Penilaian</h2>
        <p className='text-xs text-slate-600 leading-relaxed mb-4 print:text-[10.6px] print:leading-snug print:mb-2'>{methodology.intro}</p>

        <div className='overflow-x-auto my-3 print:my-1'>
          <table className='w-full border-collapse text-xs print:text-[10.0px] [&_th]:text-left [&_th]:text-[9.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-2 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-1 [&_td]:p-2 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-1'>
            <thead>
              <tr>
                <th className='w-[18%]'>KOMPONEN</th>
                <th className='w-[10%]'>BOBOT</th>
                <th>CARA HITUNG</th>
              </tr>
            </thead>
            <tbody>
              {methodology.components.map((comp) => (
                <tr key={comp.name}>
                  <td className='font-bold text-slate-900'>{comp.name}</td>
                  <td className='font-mono font-semibold text-slate-700'>{comp.weight}</td>
                  <td className='text-slate-600 text-[14.3px] print:text-[10.0px]'>{comp.calculation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className='my-4 print:my-1.5'>
          <h3 className='text-xs font-extrabold tracking-wider uppercase text-slate-700 mb-1 print:text-[10.6px]'>ALUR RILIS</h3>
          <p className='text-xs text-slate-600 leading-relaxed print:text-[10.0px] print:leading-tight'>
            Poin dihitung dari MR yang sudah merged: branch baru 1 poin, MR ke develop 2, MR ke release 3, dan MR ke master/production 5. MR ke branch lain tidak menambah poin. Pekerjaan yang ikut terbawa lewat MR milik rekan dihitung setengah poin. Jangkauan commit dihitung dari commit yang dapat dijangkau branch develop, release, dan master/production pada repository.
          </p>
        </section>

        <section className='my-4 print:my-1.5'>
          <h3 className='text-xs font-extrabold tracking-wider uppercase text-slate-700 mb-1 print:text-[10.6px]'>ISU BERULANG</h3>
          <p className='text-xs text-slate-600 leading-relaxed print:text-[10.0px] print:leading-tight'>
            File dianggap diperbaiki berulang bila memiliki minimal 3 commit fix. Fix atas fix dihitung bila file yang sama diperbaiki lagi dalam 45 hari sejak perbaikan sebelumnya. Kode bolak-balik dihitung dari baris yang dihapus lalu ditambahkan kembali pada commit berikutnya; baris trivial dan file lock/hasil build tidak dihitung.
          </p>
        </section>

        <section className='my-4 print:my-1.5'>
          <h3 className='text-xs font-extrabold tracking-wider uppercase text-slate-700 mb-1 print:text-[10.6px]'>MASA PENUGASAN</h3>
          <p className='text-xs text-slate-600 leading-relaxed print:text-[10.0px] print:leading-tight'>{methodology.assignmentTenure}</p>
        </section>

        <section className='my-4 print:my-1.5'>
          <h3 className='text-xs font-extrabold tracking-wider uppercase text-slate-700 mb-1 print:text-[10.6px]'>
            DETEKSI COMMIT BERULANG PADA KODE YANG SAMA (REWORK)
          </h3>
          <p className='text-xs text-slate-600 leading-relaxed print:text-[10.0px] print:leading-tight'>{methodology.reworkDetection}</p>
        </section>

        <section className='my-4 print:my-1.5'>
          <h3 className='text-xs font-extrabold tracking-wider uppercase text-slate-700 mb-1 print:text-[10.6px]'>SKALA NILAI</h3>
          <div className='flex gap-3 flex-wrap mt-2 print:gap-1.5'>
            {methodology.gradeScale.map((scale) => {
              const bgClass =
                scale.grade === 'A'
                  ? 'bg-emerald-600'
                  : scale.grade === 'B'
                    ? 'bg-cyan-600'
                    : scale.grade === 'C'
                      ? 'bg-amber-500'
                      : scale.grade === 'D'
                        ? 'bg-orange-500'
                        : 'bg-rose-500';
              return (
                <div key={scale.grade} className='flex flex-col items-center gap-0.5 p-2 rounded-lg bg-slate-50 border border-slate-200 min-w-[70px] print:p-1'>
                  <span className={`w-7 h-7 rounded-md grid place-items-center font-black text-sm text-white print:w-5 print:h-5 print:text-xs ${bgClass}`}>
                    {scale.grade}
                  </span>
                  <span className='text-[13.0px] font-mono font-bold text-slate-700'>{scale.range}</span>
                  <span className='text-[12.3px] text-slate-500'>{scale.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className='my-4 print:my-1.5'>
          <h3 className='text-xs font-extrabold tracking-wider uppercase text-slate-700 mb-1 print:text-[10.6px]'>CATATAN DAN BATASAN</h3>
          <ul className='list-disc pl-5 text-xs text-slate-600 leading-relaxed print:text-[10.0px] print:leading-tight print:pl-4'>
            {methodology.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <ReportFooter currentPage={currentPage} totalPages={totalPages} />
    </article>
  );
}
