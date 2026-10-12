import type { MetricsData } from '@/components/hooks';

interface ReportScoreTableProps {
  data: MetricsData;
  userName: string;
}

export function ReportScoreTable({ data, userName }: ReportScoreTableProps) {
  return (
    <>
      <div className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[8.5px] print:mb-1'>PERINGKAT &amp; DETAIL SKOR</div>
      <table className='w-full border-collapse text-[11px] print:text-[8px] [&_th]:text-left [&_th]:text-[9.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:py-3 [&_th]:px-3.5 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-1 print:[&_th]:text-[8px] [&_td]:py-3.5 [&_td]:px-3.5 [&_td]:border-b [&_td]:border-slate-200 [&_td]:text-slate-900 print:[&_td]:p-1 print:[&_td]:text-[8px]'>
        <thead>
          <tr>
            <th className='w-[30px]'>#</th>
            <th>NAMA</th>
            <th>NILAI</th>
            <th className='num'>SKOR</th>
            <th className='num'>PROD.</th>
            <th className='num'>KUAL.</th>
            <th className='num'>KOLAB.</th>
            <th className='num'>KONSIST.</th>
            <th className='num'>COMMIT/BLN</th>
            <th className='num'>FIX RATIO</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>
              <strong>{userName}</strong>
            </td>
            <td>
              <span
                className={`badge ${data.scores.grade === 'A' ? 'badge-green' : data.scores.grade === 'B' ? 'badge-cyan' : 'badge-amber'}`}
              >
                {data.scores.grade} {data.scores.gradeLabel}
              </span>
            </td>
            <td className='num mono'>
              <strong>{data.scores.overall}</strong>
            </td>
            <td className='num mono'>{data.scores.productivity}</td>
            <td className='num mono'>{data.scores.quality}</td>
            <td className='num mono'>{data.scores.collaboration}</td>
            <td className='num mono'>{data.scores.consistency}</td>
            <td className='num mono'>
              {(data.kpis.commitsPerWeek * 4.3).toFixed(1)}
            </td>
            <td className='num mono'>
              {(data.kpis.fixRatio * 100).toFixed(1)}%
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
