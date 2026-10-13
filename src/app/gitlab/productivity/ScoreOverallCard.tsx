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
      className='card flex flex-col overflow-hidden min-w-0 score-overview-container'
      aria-labelledby='score-title'
    >
      <div
        className='card-title flex items-center justify-between gap-2'
        id='score-title'
      >
        <span>Skor Keseluruhan</span>
        <span className={`badge ${gradeColor}`}>
          Nilai {s.grade} · {s.gradeLabel}
        </span>
      </div>

      <div className='score-overview-layout py-5'>
        <div className='shrink-0 flex items-center justify-center'>
          <ScoreRing value={s.overall} label='dari 100' size={144} />
        </div>

        <div className='flex-1 flex flex-col gap-2.5 min-w-0 w-full pr-0 lg:pr-3'>
          <ScoreBar label='Produktivitas' weight='35%' value={s.productivity} />
          <ScoreBar label='Kualitas' weight='25%' value={s.quality} />
          <ScoreBar label='Kolaborasi' weight='25%' value={s.collaboration} />
          <ScoreBar label='Konsistensi' weight='15%' value={s.consistency} />
        </div>
      </div>

      {/* Breakdown Faktor Penentu Skor */}
      <div className='pt-5 border-t border-border flex flex-col gap-3'>
        <div className='flex items-center justify-between text-[11px] font-bold text-slate-muted uppercase tracking-wider'>
          <span>FAKTOR PENILAIAN SKOR</span>
        </div>

        <div className='grid grid-cols-2 gap-2.5 sm:gap-3'>
          <div className='p-3 sm:p-3.5 bg-surface-subtle rounded-xl border border-border shadow-xs flex flex-col gap-0.5 min-w-0'>
            <div className='text-[11px] font-semibold flex items-center justify-between text-slate-500'>
              <span className='truncate'>Produktivitas</span>
              <span className='text-cyan-600 font-bold shrink-0'>35%</span>
            </div>
            <div className='font-extrabold text-[14px] sm:text-[15px] text-slate-text mt-1 truncate'>
              {data.kpis.commits} commit
            </div>
            <div className='text-[10.5px] sm:text-[11px] text-slate-400 mt-0.5 truncate'>
              {data.kpis.commitsPerWeek.toFixed(1)} / minggu
            </div>
          </div>

          <div className='p-3 sm:p-3.5 bg-surface-subtle rounded-xl border border-border shadow-xs flex flex-col gap-0.5 min-w-0'>
            <div className='text-[11px] font-semibold flex items-center justify-between text-slate-500'>
              <span className='truncate'>Kualitas Kode</span>
              <span className='text-amber-600 font-bold shrink-0'>25%</span>
            </div>
            <div className='font-extrabold text-[14px] sm:text-[15px] text-slate-text mt-1 truncate'>
              {Math.round(data.kpis.fixRatio * 100)}% fix commit
            </div>
            <div className='text-[10.5px] sm:text-[11px] text-slate-400 mt-0.5 truncate'>
              avg {Math.round(data.kpis.avgCommitSize)} baris/commit
            </div>
          </div>

          <div className='p-3 sm:p-3.5 bg-surface-subtle rounded-xl border border-border shadow-xs flex flex-col gap-0.5 min-w-0'>
            <div className='text-[11px] font-semibold flex items-center justify-between text-slate-500'>
              <span className='truncate'>Kolaborasi</span>
              <span className='text-sky-600 font-bold shrink-0'>25%</span>
            </div>
            <div className='font-extrabold text-[14px] sm:text-[15px] text-slate-text mt-1 truncate'>
              {data.kpis.reviews} review
            </div>
            <div className='text-[10.5px] sm:text-[11px] text-slate-400 mt-0.5 truncate'>
              {data.kpis.comments} komentar MR
            </div>
          </div>

          <div className='p-3 sm:p-3.5 bg-surface-subtle rounded-xl border border-border shadow-xs flex flex-col gap-0.5 min-w-0'>
            <div className='text-[11px] font-semibold flex items-center justify-between text-slate-500'>
              <span className='truncate'>Konsistensi</span>
              <span className='text-emerald-600 font-bold shrink-0'>15%</span>
            </div>
            <div className='font-extrabold text-[14px] sm:text-[15px] text-slate-text mt-1 truncate'>
              {data.kpis.activeWorkdays} / {data.period.workdays} hari
            </div>
            <div className='text-[10.5px] sm:text-[11px] text-slate-400 mt-0.5 truncate'>
              {Math.round(
                (data.kpis.activeWorkdays / Math.max(1, data.period.workdays)) *
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
