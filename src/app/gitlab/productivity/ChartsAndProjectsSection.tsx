import { Heatmap, HourlyBars, WeeklyBars } from '@/components/charts';
import type { MetricsData } from '@/components/hooks';

interface ChartsAndProjectsSectionProps {
  data: MetricsData;
}

const fmt = (n: number) => n.toLocaleString('id-ID');

export function ChartsAndProjectsSection({
  data,
}: ChartsAndProjectsSectionProps) {
  return (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-6 animate-fade-up'>
        <section className='card' aria-labelledby='trend-title'>
          <div className='card-title' id='trend-title'>
            Tren mingguan
          </div>
          <WeeklyBars data={data.weekly} />
        </section>
        <section className='card' aria-labelledby='hour-title'>
          <div className='card-title' id='hour-title'>
            Distribusi jam commit
          </div>
          <HourlyBars hourly={data.hourly} />
        </section>
      </div>

      <section className='card animate-fade-up' aria-labelledby='heat-title'>
        <div className='card-title' id='heat-title'>
          <span>Heatmap kontribusi</span>
          <span className='dim xs normal-case tracking-normal font-medium'>
            Rolling 12 bulan
          </span>
        </div>
        <Heatmap
          daily={data.heatmapDaily ?? data.daily}
          start={data.heatmapStart ?? data.period.start}
          end={data.heatmapEnd ?? data.period.end}
        />
      </section>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up'>
        <section className='card flex flex-col' aria-labelledby='proj-title'>
          <div className='card-title mb-4' id='proj-title'>
            <span>Proyek teratas</span>
            <span className='badge'>{data.topProjects.length}</span>
          </div>
          <div className='overflow-x-auto flex-1'>
            <table className='w-full border-collapse text-left text-xs sm:text-sm'>
              <thead>
                <tr className='border-b border-border text-slate-muted text-[11px] font-bold uppercase tracking-wider bg-surface-subtle/50'>
                  <th className='px-5 py-3.5'>Proyek</th>
                  <th className='px-5 py-3.5 text-right'>Commit</th>
                  <th className='px-5 py-3.5 text-right'>MR</th>
                  <th className='px-5 py-3.5 text-right'>Baris</th>
                </tr>
              </thead>
              <tbody>
                {data.topProjects.slice(0, 10).map((p) => {
                  const parts = p.name.split('/');
                  const repoName = parts.pop() || p.name;
                  const groupPath = parts.join('/');
                  return (
                    <tr
                      key={p.id}
                      className='border-b border-border-subtle hover:bg-surface-hover/60 transition-colors'
                    >
                      <td className='px-5 py-3.5 max-w-[280px]' title={p.name}>
                        <div className='truncate font-bold text-slate-text text-[13px]'>
                          {repoName}
                        </div>
                        {groupPath && (
                          <div className='truncate text-[11px] text-slate-muted mt-0.5'>
                            {groupPath}
                          </div>
                        )}
                      </td>
                      <td className='px-5 py-3.5 text-right font-mono font-bold text-slate-text'>
                        {fmt(p.commits)}
                      </td>
                      <td className='px-5 py-3.5 text-right font-mono text-cyan-600 font-bold'>
                        {p.mrs}
                      </td>
                      <td className='px-5 py-3.5 text-right font-mono text-slate-muted'>
                        {fmt(p.lines)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className='card flex flex-col' aria-labelledby='mr-title'>
          <div className='card-title mb-4' id='mr-title'>
            <span>Merge request terbaru</span>
          </div>
          <div className='flex-1 flex flex-col'>
            {(
              data.recentMrs as Array<{
                title: string;
                state: string;
                role: string;
                web_url: string;
                project: string;
                author: string;
              }>
            )
              .slice(0, 8)
              .map((m, i) => {
                const parts = m.project ? m.project.split('/') : [];
                const repo = parts.pop() || m.project;
                return (
                  <a
                    key={i}
                    href={m.web_url}
                    target='_blank'
                    rel='noreferrer'
                    className='p-3.5 sm:p-4 rounded-xl border border-border bg-surface-subtle/50 hover:bg-surface-hover hover:border-border-strong mb-2.5 flex items-start gap-3.5 transition-all text-slate-text no-underline shadow-2xs'
                  >
                    <span
                      className={`badge shrink-0 mt-0.5 ${m.state === 'merged' ? 'badge-violet' : m.state === 'opened' ? 'badge-green' : ''}`}
                    >
                      {m.state}
                    </span>
                    <div className='min-w-0 flex-1 flex flex-col gap-1'>
                      <div className='truncate text-[13px] font-semibold text-slate-text hover:text-brand transition-colors'>
                        {m.title}
                      </div>
                      <div className='text-xs text-slate-muted truncate flex items-center gap-1.5'>
                        <strong className='text-slate-text font-medium'>
                          {repo}
                        </strong>
                        <span>·</span>
                        <span>
                          {m.role === 'reviewer'
                            ? `review untuk @${m.author}`
                            : 'dibuat oleh saya'}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            {data.recentMrs.length === 0 && (
              <div className='text-xs text-slate-400 p-4 text-center'>
                Tidak ada MR di periode ini.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
