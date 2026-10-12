import { ScoreBar, ScoreRing } from '@/components/charts';
import type { MetricsData } from '@/components/hooks';

interface ScoreOverallCardProps {
  data: MetricsData;
}

export function ScoreOverallCard({ data }: ScoreOverallCardProps) {
  const s = data.scores;
  const gradeColor = {
    A: 'badge-green',
    B: 'badge-cyan',
    C: 'badge-amber',
    D: 'badge-rose',
    E: 'badge-rose',
  }[s.grade];

  return (
    <section
      className='card flex flex-col gap-6'
      aria-labelledby='score-title'
    >
      <div className='card-title' id='score-title'>
        Skor keseluruhan{' '}
        <span className={`badge ${gradeColor}`}>
          Nilai {s.grade} · {s.gradeLabel}
        </span>
      </div>
      <div className='flex items-center gap-6 flex-wrap sm:flex-nowrap'>
        <ScoreRing value={s.overall} label='dari 100' size={164} />
        <div className='flex-1 flex flex-col gap-3 min-w-[180px]'>
          <ScoreBar
            label='Produktivitas'
            weight='35%'
            value={s.productivity}
          />
          <ScoreBar label='Kualitas' weight='25%' value={s.quality} />
          <ScoreBar
            label='Kolaborasi'
            weight='25%'
            value={s.collaboration}
          />
          <ScoreBar
            label='Konsistensi'
            weight='15%'
            value={s.consistency}
          />
        </div>
      </div>

      {/* Breakdown Faktor Penentu Skor */}
      <div className='mt-auto pt-5 border-t border-border flex flex-col gap-3'>
        <div className='flex items-center justify-between text-[11px] font-bold text-slate-muted uppercase tracking-wider'>
          <span>FAKTOR PENILAIAN SKOR</span>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div className='p-3.5 sm:p-4 bg-surface-subtle rounded-xl border border-border shadow-xs flex flex-col gap-0.5'>
            <div className='text-[11px] font-semibold flex items-center justify-between text-slate-500'>
              <span>Produktivitas</span>
              <span className='text-cyan-600 font-bold'>35%</span>
            </div>
            <div className='font-extrabold text-[15px] sm:text-base text-slate-text mt-1'>
              {data.kpis.commits} commit
            </div>
            <div className='text-[11px] text-slate-400 mt-0.5'>
              {data.kpis.commitsPerWeek.toFixed(1)} / minggu
            </div>
          </div>

          <div className='p-3.5 sm:p-4 bg-surface-subtle rounded-xl border border-border shadow-xs flex flex-col gap-0.5'>
            <div className='text-[11px] font-semibold flex items-center justify-between text-slate-500'>
              <span>Kualitas Kode</span>
              <span className='text-amber-600 font-bold'>25%</span>
            </div>
            <div className='font-extrabold text-[15px] sm:text-base text-slate-text mt-1'>
              {Math.round(data.kpis.fixRatio * 100)}% fix commit
            </div>
            <div className='text-[11px] text-slate-400 mt-0.5'>
              avg {Math.round(data.kpis.avgCommitSize)} baris/commit
            </div>
          </div>

          <div className='p-3.5 sm:p-4 bg-surface-subtle rounded-xl border border-border shadow-xs flex flex-col gap-0.5'>
            <div className='text-[11px] font-semibold flex items-center justify-between text-slate-500'>
              <span>Kolaborasi</span>
              <span className='text-sky-600 font-bold'>25%</span>
            </div>
            <div className='font-extrabold text-[15px] sm:text-base text-slate-text mt-1'>
              {data.kpis.reviews} review
            </div>
            <div className='text-[11px] text-slate-400 mt-0.5'>
              {data.kpis.comments} komentar MR
            </div>
          </div>

          <div className='p-3.5 sm:p-4 bg-surface-subtle rounded-xl border border-border shadow-xs flex flex-col gap-0.5'>
            <div className='text-[11px] font-semibold flex items-center justify-between text-slate-500'>
              <span>Konsistensi</span>
              <span className='text-emerald-600 font-bold'>15%</span>
            </div>
            <div className='font-extrabold text-[15px] sm:text-base text-slate-text mt-1'>
              {data.kpis.activeWorkdays} / {data.period.workdays} hari
            </div>
            <div className='text-[11px] text-slate-400 mt-0.5'>
              {Math.round(
                (data.kpis.activeWorkdays /
                  Math.max(1, data.period.workdays)) *
                  100,
              )}
              % hari kerja aktif
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
