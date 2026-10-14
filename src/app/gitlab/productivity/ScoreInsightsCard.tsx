import type { MetricsData } from '@/components/hooks';

interface ScoreInsightsCardProps {
  data?: MetricsData;
  insights?: MetricsData['insights'];
}

export function ScoreInsightsCard({
  data,
  insights: propInsights,
}: ScoreInsightsCardProps) {
  const insights = propInsights || data?.insights || [];

  // Compute work-life balance & commit time metrics
  const totalCommits =
    data?.kpis?.commits || data?.hourly?.reduce((a, b) => a + b, 0) || 0;
  const hourly = data?.hourly || [];
  const daily = data?.daily || {};

  // Office: 08:00 - 17:59 (hours 8-17)
  const officeCommits = hourly.slice(8, 18).reduce((a, b) => a + b, 0);
  // Evening / Overtime: 18:00 - 21:59 (hours 18-21)
  const eveningCommits = hourly.slice(18, 22).reduce((a, b) => a + b, 0);
  // Late night / Sleep time: 22:00 - 05:59 (hours 22-23 and 0-5)
  const lateNightCommits =
    hourly.slice(22, 24).reduce((a, b) => a + b, 0) +
    hourly.slice(0, 6).reduce((a, b) => a + b, 0);

  // Weekend commits calculation
  let weekendCommits = 0;
  for (const [dateStr, count] of Object.entries(daily)) {
    const dow = new Date(`${dateStr}T00:00:00`).getDay();
    if (dow === 0 || dow === 6) {
      weekendCommits += count;
    }
  }
  const weekendDays = data?.kpis?.weekendDays ?? 0;

  const validTotal = totalCommits || 1;
  const officePct = Math.round((officeCommits / validTotal) * 100);
  const lateNightPct = Math.round((lateNightCommits / validTotal) * 100);
  const peakHour = data?.kpis?.peakHour ?? 14;

  // Work-life balance status calculation
  let balanceTone: 'good' | 'warn' | 'rose' = 'good';
  let balanceLabel = 'Ritme Teratur & Sehat';
  if (lateNightPct > 20) {
    balanceTone = 'rose';
    balanceLabel = 'Kelelahan Tinggi (Fatigue)';
  } else if (lateNightPct > 10 || weekendDays > 4) {
    balanceTone = 'warn';
    balanceLabel = 'Perlu Rehat Ekstra';
  }

  const badgeClass =
    balanceTone === 'good'
      ? 'badge-green'
      : balanceTone === 'warn'
        ? 'badge-amber'
        : 'badge-rose';

  // Catatan Layout: Tinggi kartu Insight & saran / Work-Life Balance minimal tingginya adalah sejajar dengan card Profil Performa dan Skor Keseluruhan (min-h-full di dalam CSS grid)
  return (
    <section
      className='card flex flex-col justify-between overflow-hidden min-w-0 min-h-full'
      aria-labelledby='insight-title'
    >
      <div className='flex flex-col'>
        {/* Top: Header & Technical Insights */}
        <div
          className='card-title flex items-center justify-between'
          id='insight-title'
        >
          <span>Insight &amp; saran</span>
          {insights.length > 0 && (
            <span className='badge badge-violet xs'>
              {insights.length} insight
            </span>
          )}
        </div>

        <div className='flex flex-col gap-2.5 overflow-y-auto pr-1'>
          {insights.length === 0 && (
            <div className='text-xs text-slate-400 p-3 text-center'>
              Belum ada insight untuk periode ini.
            </div>
          )}
          {insights.map((ins, i) => (
            <div key={i} className='flex items-start gap-2.5'>
              <span
                className={`badge ${
                  ins.tone === 'good'
                    ? 'badge-green'
                    : ins.tone === 'warn'
                      ? 'badge-amber'
                      : 'badge-cyan'
                } shrink-0 text-xs px-2 py-0.5 rounded-md`}
              >
                {ins.tone === 'good' ? '▲' : ins.tone === 'warn' ? '!' : 'ℹ'}
              </span>
              <span className='text-xs sm:text-[12.5px] text-slate-600 leading-relaxed font-normal'>
                {ins.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Work-Life Balance & Pola Kerja (Matching Insight & saran design) */}
      {data && (
        <div className='pt-4 mt-3 border-t border-border flex flex-col'>
          <div className='card-title flex items-center justify-between gap-2'>
            <span>Work-Life Balance</span>
            <span className={`badge ${badgeClass} text-[11px] font-bold`}>
              {balanceLabel}
            </span>
          </div>

          <div className='flex flex-col gap-2.5'>
            {/* Item 1: Jam Normal */}
            <div className='flex items-start gap-2.5'>
              <span className='badge badge-cyan shrink-0 text-xs px-2 py-0.5 rounded-md'>
                ℹ
              </span>
              <span className='text-xs sm:text-[12.5px] text-slate-600 leading-relaxed font-normal'>
                <strong>
                  Jam normal ({officePct}% · {officeCommits} commit)
                </strong>
                : Puncak produktivitas Anda berada di siang hari (sekitar pk{' '}
                {peakHour}:00). Manfaatkan rentang ini sebagai{' '}
                <em>deep work window</em> untuk logika arsitektur kompleks.
              </span>
            </div>

            {/* Item 2: Larut Malam */}
            <div className='flex items-start gap-2.5'>
              <span
                className={`badge ${
                  lateNightCommits > 0 ? 'badge-amber' : 'badge-green'
                } shrink-0 text-xs px-2 py-0.5 rounded-md`}
              >
                {lateNightCommits > 0 ? '!' : '▲'}
              </span>
              <span className='text-xs sm:text-[12.5px] text-slate-600 leading-relaxed font-normal'>
                {lateNightCommits > 0 ? (
                  <>
                    <strong>
                      Larut malam ({lateNightPct}% · {lateNightCommits} commit)
                    </strong>
                    : Tercatat aktivitas commit di jam istirahat malam (pk
                    22:00–06:00). Coding larut malam berulang dapat menurunkan
                    energi. Cobalah tetapkan batas akhir push sebelum pk 21:00.
                  </>
                ) : (
                  <>
                    <strong>Larut malam (0%)</strong>: Ritme tidur malam sangat
                    terjaga tanpa ada aktivitas commit di atas pk 22:00.
                    Pertahankan!
                  </>
                )}
              </span>
            </div>

            {/* Item 3: Akhir Pekan */}
            <div className='flex items-start gap-2.5'>
              <span
                className={`badge ${
                  weekendDays > 0 ? 'badge-violet' : 'badge-green'
                } shrink-0 text-xs px-2 py-0.5 rounded-md`}
              >
                {weekendDays > 0 ? '!' : '▲'}
              </span>
              <span className='text-xs sm:text-[12.5px] text-slate-600 leading-relaxed font-normal'>
                {weekendDays > 0 ? (
                  <>
                    <strong>
                      Akhir pekan ({weekendDays} hari · {weekendCommits} commit)
                    </strong>
                    : Dedikasi Anda sangat tinggi, namun sisihkan waktu akhir
                    pekan untuk <em>recharge</em> agar performa sprint
                    berikutnya tetap prima.
                  </>
                ) : (
                  <>
                    <strong>Akhir pekan (0 hari)</strong>: Batasan hari kerja
                    sangat rapi bebas dari aktivitas commit di akhir pekan.
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
