'use client';

interface ScoreGaugeProps {
  score: number;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, score));
  const offset = c - (clamped / 100) * c;
  const strokeColor = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  const bgStroke = score >= 80 ? '#dcfce7' : score >= 60 ? '#fef3c7' : '#fee2e2';
  const colorClass = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className='relative w-11 h-11 shrink-0'>
      <svg width={44} height={44} viewBox='0 0 44 44' className='-rotate-90 block'>
        <circle cx='22' cy='22' r={r} fill='transparent' stroke={bgStroke} strokeWidth='4' />
        <circle
          cx='22'
          cy='22'
          r={r}
          fill='transparent'
          stroke={strokeColor}
          strokeWidth='4'
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap='round'
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-[12.5px] font-bold ${colorClass}`}>
        {score}
      </div>
    </div>
  );
}

interface AiReviewScoreBannerProps {
  score: number;
  verdict: 'READY_TO_MERGE' | 'NEEDS_MINOR_FIX' | 'CRITICAL_SECURITY_ISSUE';
  findingsCount?: number;
}

export function AiReviewScoreBanner({ score, verdict, findingsCount }: AiReviewScoreBannerProps) {
  return (
    <div className='p-3 sm:px-4 rounded-lg bg-surface-subtle border border-border flex items-center justify-between flex-wrap gap-3'>
      <div className='flex items-center gap-3'>
        <ScoreGauge score={score} />
        <div>
          <div className='text-[11px] font-bold text-slate-700 tracking-wider'>
            SKOR KUALITAS KODE
          </div>
          <strong className='text-[15px] text-slate-text font-bold'>{score} / 100</strong>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        {findingsCount !== undefined && (
          <span className='badge badge-neutral xs text-[11px]'>
            {findingsCount} Catatan Review
          </span>
        )}
        <span
          className={`badge text-[11px] font-bold ${
            verdict === 'READY_TO_MERGE'
              ? 'badge-green'
              : verdict === 'NEEDS_MINOR_FIX'
                ? 'badge-amber'
                : 'badge-red'
          }`}
        >
          {verdict === 'READY_TO_MERGE'
            ? '✓ SIAP MERGE'
            : verdict === 'NEEDS_MINOR_FIX'
              ? '⚠ BUTUH PERBAIKAN'
              : '🛑 ISU KRITIS'}
        </span>
      </div>
    </div>
  );
}
