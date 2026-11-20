import type { Scorecard } from '@/lib/scoring';

interface ScoreHeaderCardProps {
  card: Scorecard;
  userName?: string | null;
}

const GRADE_BADGE: Record<Scorecard['grade'], string> = {
  A: 'badge-green',
  B: 'badge-cyan',
  C: 'badge-amber',
  D: 'badge-rose',
  E: 'badge-rose',
};

const GRADE_TONE: Record<
  Scorecard['grade'],
  { box: string; text: string; bar: string }
> = {
  A: {
    box: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50',
    text: 'text-emerald-700',
    bar: 'bg-gradient-to-r from-emerald-500 to-green-500',
  },
  B: {
    box: 'border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50',
    text: 'text-cyan-700',
    bar: 'bg-gradient-to-r from-cyan-500 to-sky-500',
  },
  C: {
    box: 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50',
    text: 'text-amber-700',
    bar: 'bg-gradient-to-r from-amber-500 to-yellow-500',
  },
  D: {
    box: 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50',
    text: 'text-orange-700',
    bar: 'bg-gradient-to-r from-orange-500 to-amber-500',
  },
  E: {
    box: 'border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50',
    text: 'text-rose-700',
    bar: 'bg-gradient-to-r from-rose-500 to-orange-500',
  },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export function ScoreHeaderCard({ card, userName }: ScoreHeaderCardProps) {
  const target = card.potential.target;
  const gap = Math.max(0, target - card.overall);
  const reached = gap === 0;
  const tone = GRADE_TONE[card.grade];

  return (
    <section
      className='card animate-fade-up'
      aria-labelledby='score-header-title'
    >
      <div className='flex flex-col lg:flex-row gap-5 items-stretch lg:items-center'>
        <div
          className={`shrink-0 self-center lg:self-auto text-center px-6 py-4 rounded-2xl border min-w-[150px] ${tone.box}`}
        >
          <div className={`text-[44px] font-extrabold leading-none ${tone.text}`}>
            {card.overall}
          </div>
          <div className={`badge ${GRADE_BADGE[card.grade]} mt-2`}>
            {card.grade} · {card.gradeLabel}
          </div>
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2.5 flex-wrap'>
            <h2
              id='score-header-title'
              className='text-[17px] font-extrabold text-slate-text'
            >
              Performa Talent
              {userName ? ` — ${userName}` : ''}
            </h2>
            <span className='badge'>
              {card.period.ytd ? 'YTD' : `${card.period.days} hari`}
            </span>
          </div>

          <p className='text-[12.5px] text-slate-muted mt-1.5 leading-relaxed'>
            Periode {fmtDate(card.period.start)} – {fmtDate(card.period.end)} (
            {card.period.months.toLocaleString('id-ID')} bulan). Skor dihitung
            dari 6 komponen berbobot (metodologi Ranking Talent).
          </p>

          <div className='mt-3.5'>
            <div className='flex justify-between text-[11px] font-semibold text-slate-muted mb-1.5'>
              <span>Sekarang: {card.overall}</span>
              <span>Target: {target} (B)</span>
            </div>
            <div className='relative h-2.5 rounded-full bg-slate-200 overflow-hidden'>
              <div
                className={`h-full rounded-full transition-all ${tone.bar}`}
                style={{
                  width: `${Math.min(100, Math.max(0, card.overall))}%`,
                }}
              />
              <div
                className='absolute top-0 bottom-0 w-0.5 bg-amber-600'
                style={{ left: `${Math.min(99, Math.max(0, target))}%` }}
                aria-hidden
              />
            </div>
            <p className='text-[10.5px] text-slate-400 mt-1.5 leading-relaxed'>
              {reached
                ? `Target tercapai. Potensi maksimal +${card.potential.toMax.toLocaleString('id-ID')} poin.`
                : `Butuh +${gap} poin. Potensi dari komponen di bawah +${card.potential.toTarget.toLocaleString('id-ID')} poin.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
