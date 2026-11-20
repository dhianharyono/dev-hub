import type { ScoreComponent, Scorecard } from '@/lib/scoring';

interface ComponentScoreGridProps {
  card: Scorecard;
}

type Tone = 'ok' | 'mid' | 'bad' | 'empty';

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-emerald-600',
  mid: 'text-amber-600',
  bad: 'text-rose-600',
  empty: 'text-slate-400',
};

const TONE_BAR: Record<Tone, string> = {
  ok: 'bg-emerald-500',
  mid: 'bg-amber-500',
  bad: 'bg-rose-500',
  empty: 'bg-slate-300',
};

function toneOf(component: ScoreComponent): Tone {
  if (component.score === null) return 'empty';
  if (component.score >= 70) return 'ok';
  if (component.score >= 40) return 'mid';
  return 'bad';
}

export function ComponentScoreGrid({ card }: ComponentScoreGridProps) {
  const components = [...card.components].sort((a, b) => {
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });

  return (
    <section className='card animate-fade-up' aria-labelledby='component-score-title'>
      <div className='card-title' id='component-score-title'>
        <span>Skor Komponen &amp; Potensi Kenaikan</span>
        <span className='badge badge-cyan'>6 Komponen</span>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3'>
        {components.map((component) => {
          const tone = toneOf(component);
          const gainPositive = component.available && component.potentialToTarget > 0;
          return (
            <div
              key={component.key}
              className='rounded-xl border border-border bg-surface-subtle p-3 min-w-0'
            >
              <div className='flex items-baseline justify-between gap-2'>
                <span className='text-[11.5px] font-bold text-slate-text-2 truncate'>
                  {component.label}
                </span>
                <span className='text-[10px] font-bold text-slate-400 shrink-0'>
                  {component.weight}%
                </span>
              </div>

              <div className={`text-[22px] font-extrabold mt-1 ${TONE_TEXT[tone]}`}>
                {component.score ?? '—'}
              </div>

              <div className='h-1.5 rounded-full bg-slate-200 mt-2 overflow-hidden'>
                <div
                  className={`h-full rounded-full transition-all ${TONE_BAR[tone]}`}
                  style={{ width: `${Math.min(100, Math.max(0, component.score ?? 0))}%` }}
                />
              </div>

              <div
                className={`text-[10.5px] font-bold mt-1.5 truncate ${
                  gainPositive ? 'text-emerald-700' : 'text-slate-400'
                }`}
                title={
                  component.available
                    ? `Bobot efektif ${component.effectiveWeight}% · potensi ke target +${component.potentialToTarget} · maksimal +${component.potentialToMax}`
                    : 'Komponen belum punya data pada periode ini'
                }
              >
                {!component.available
                  ? 'Data belum tersedia'
                  : gainPositive
                    ? `potensi +${component.potentialToTarget.toLocaleString('id-ID')} → ${card.potential.target}`
                    : `maks +${component.potentialToMax.toLocaleString('id-ID')} — pertahankan`}
              </div>
            </div>
          );
        })}
      </div>

      <p className='text-[10.5px] text-slate-400 mt-3 leading-relaxed'>
        Bobot efektif dinormalisasi bila ada komponen tanpa data. Skor absolut
        (Fase 0–2); perbandingan relatif tim menyusul di Fase 4. Skill Kode
        memakai pemindai statis baris tambahan saat sinkron.
      </p>
    </section>
  );
}
