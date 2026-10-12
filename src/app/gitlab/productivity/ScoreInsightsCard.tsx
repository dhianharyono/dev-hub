import type { MetricsData } from '@/components/hooks';

interface ScoreInsightsCardProps {
  insights: MetricsData['insights'];
}

export function ScoreInsightsCard({ insights }: ScoreInsightsCardProps) {
  return (
    <section
      className='card flex flex-col gap-5'
      aria-labelledby='insight-title'
    >
      <div className='card-title' id='insight-title'>
        Insight &amp; saran
        {insights.length > 0 && (
          <span className='badge badge-violet xs'>
            {insights.length} insight
          </span>
        )}
      </div>
      <div className='flex-1 flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1'>
        {insights.length === 0 && (
          <div className='text-xs text-slate-400 p-4 text-center'>
            Belum ada insight untuk periode ini.
          </div>
        )}
        {insights.map((ins, i) => (
          <div key={i} className='flex items-start gap-3'>
            <span
              className={`badge ${ins.tone === 'good' ? 'badge-green' : ins.tone === 'warn' ? 'badge-amber' : 'badge-cyan'} shrink-0 text-xs px-2 py-0.5 rounded-md`}
            >
              {ins.tone === 'good' ? '▲' : ins.tone === 'warn' ? '!' : 'ℹ'}
            </span>
            <span className='text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal'>
              {ins.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
