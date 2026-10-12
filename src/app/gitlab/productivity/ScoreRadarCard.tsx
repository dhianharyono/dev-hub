import { Radar } from '@/components/charts';
import type { MetricsData } from '@/components/hooks';

interface ScoreRadarCardProps {
  scores: MetricsData['scores'];
}

export function ScoreRadarCard({ scores }: ScoreRadarCardProps) {
  return (
    <section
      className='card flex flex-col gap-5'
      aria-labelledby='radar-title'
    >
      <div className='card-title' id='radar-title'>
        <span>Profil Performa</span>
        <span className='badge badge-cyan xs'>Radar 4 Pilar</span>
      </div>
      <div className='flex-1 flex items-center justify-center w-full mx-auto my-2 min-h-[260px]'>
        <Radar
          size={270}
          axes={[
            { label: 'Produktivitas', value: scores.productivity },
            { label: 'Kualitas', value: scores.quality },
            { label: 'Kolaborasi', value: scores.collaboration },
            { label: 'Konsistensi', value: scores.consistency },
          ]}
        />
      </div>

      {/* 4 Pillars Mini Legend Badges */}
      <div className='grid grid-cols-2 gap-3 mt-2 mb-2'>
        <div className='flex items-center justify-between p-2.5 sm:p-3 bg-surface-subtle rounded-xl border border-border text-xs'>
          <span className='text-slate-500 font-medium'>Produktivitas</span>
          <strong className='text-cyan-600 font-bold'>{scores.productivity}%</strong>
        </div>

        <div className='flex items-center justify-between p-2.5 sm:p-3 bg-surface-subtle rounded-xl border border-border text-xs'>
          <span className='text-slate-500 font-medium'>Kualitas</span>
          <strong className='text-amber-600 font-bold'>{scores.quality}%</strong>
        </div>

        <div className='flex items-center justify-between p-2.5 sm:p-3 bg-surface-subtle rounded-xl border border-border text-xs'>
          <span className='text-slate-500 font-medium'>Kolaborasi</span>
          <strong className='text-violet-600 font-bold'>{scores.collaboration}%</strong>
        </div>

        <div className='flex items-center justify-between p-2.5 sm:p-3 bg-surface-subtle rounded-xl border border-border text-xs'>
          <span className='text-slate-500 font-medium'>Konsistensi</span>
          <strong className='text-emerald-600 font-bold'>{scores.consistency}%</strong>
        </div>
      </div>

      <div className='mt-auto pt-4 border-t border-border flex items-center justify-between gap-3 flex-wrap text-xs'>
        <span className='text-slate-500 font-medium'>Status Profil:</span>
        <span className='badge badge-cyan whitespace-nowrap text-xs px-3 py-1'>
          {scores.overall >= 80
            ? 'Performa Prima'
            : scores.overall >= 65
              ? 'Kompeten & Stabil'
              : 'Perlu Peningkatan'}
        </span>
      </div>
    </section>
  );
}
