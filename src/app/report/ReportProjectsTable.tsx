import type { MetricsData } from '@/components/hooks';

interface ReportProjectsTableProps {
  projects: MetricsData['topProjects'];
}

const fmt = (n: number) => n.toLocaleString('id-ID');

export function ReportProjectsTable({ projects }: ReportProjectsTableProps) {
  return (
    <>
      <div className='text-[10.5px] font-extrabold tracking-widest uppercase text-slate-600 mb-2 print:text-[8.5px] print:mb-1'>CAKUPAN PROYEK AKTIF</div>
      <table className='w-full border-collapse text-[11px] print:text-[8px] [&_th]:text-left [&_th]:text-[9.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:py-3 [&_th]:px-3.5 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-1 print:[&_th]:text-[8px] [&_td]:py-3.5 [&_td]:px-3.5 [&_td]:border-b [&_td]:border-slate-200 [&_td]:text-slate-900 print:[&_td]:p-1 print:[&_td]:text-[8px]'>
        <thead>
          <tr>
            <th>PROYEK</th>
            <th className='num'>COMMIT</th>
            <th className='num'>MR</th>
            <th className='num'>BARIS KODE</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const parts = p.name.split('/');
            const repoName = parts.pop() || p.name;
            const groupPath = parts.join('/');
            return (
              <tr key={p.id}>
                <td>
                  <div className='font-bold'>{repoName}</div>
                  {groupPath && (
                    <div className='xs dim text-[10px] mt-px'>
                      {groupPath}
                    </div>
                  )}
                </td>
                <td className='num mono'>{fmt(p.commits)}</td>
                <td className='num mono'>{p.mrs}</td>
                <td className='num mono dim'>+{fmt(p.lines)}</td>
                <td>
                  <span className='badge badge-green text-[11px]'>
                    ✓ Teranalisis (Tanpa Error 403)
                  </span>
                </td>
              </tr>
            );
          })}
          {projects.length === 0 && (
            <tr>
              <td colSpan={5} className='dim text-center p-5'>
                Belum ada data proyek dalam periode ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
