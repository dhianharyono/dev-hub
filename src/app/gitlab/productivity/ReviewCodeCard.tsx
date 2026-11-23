import type { ReviewInsight } from '@/lib/commit-review';
import { buildPerformanceInsights } from '@/lib/performance-insights';
import type { Scorecard } from '@/lib/scoring';
import type { WorklifeBalance } from '@/lib/stats';
import { ScorePending } from './ScorePending';

interface ReviewCodeCardProps {
  card: Scorecard;
  worklife?: WorklifeBalance;
}

const TONE_BADGE: Record<ReviewInsight['tone'], string> = {
  good: 'badge-green',
  warn: 'badge-amber',
  info: 'badge-cyan',
};

const TONE_ICON: Record<ReviewInsight['tone'], string> = {
  good: '▲',
  warn: '!',
  info: 'ℹ',
};

function WorklifeRow({
  tone,
  icon,
  children,
}: {
  tone: ReviewInsight['tone'];
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex items-start gap-2.5'>
      <span
        className={`badge ${TONE_BADGE[tone]} shrink-0 text-xs px-2 py-0.5 rounded-md`}
      >
        {icon}
      </span>
      <span className='text-xs sm:text-[12.5px] text-slate-600 leading-relaxed font-normal'>
        {children}
      </span>
    </div>
  );
}

function WorklifeSection({ worklife }: { worklife: WorklifeBalance }) {
  const {
    officePct,
    officeCommits,
    lateNightPct,
    lateNightCommits,
    weekendDays,
    weekendCommits,
    peakHour,
  } = worklife;

  let balanceLabel = 'Ritme Teratur & Sehat';
  let balanceTone: ReviewInsight['tone'] = 'good';
  if (lateNightPct > 20) {
    balanceTone = 'warn';
    balanceLabel = 'Kelelahan Tinggi (Fatigue)';
  } else if (lateNightPct > 10 || weekendDays > 4) {
    balanceTone = 'warn';
    balanceLabel = 'Perlu Rehat Ekstra';
  }

  return (
    <div className='pt-4 mt-3 border-t border-border flex flex-col'>
      <div className='card-title flex items-center justify-between gap-2 mb-2.5'>
        <span>Work-Life Balance</span>
        <span
          className={`badge ${TONE_BADGE[balanceTone]} text-[11px] font-bold`}
        >
          {balanceLabel}
        </span>
      </div>

      <div className='flex flex-col gap-2.5'>
        <WorklifeRow tone='info' icon='ℹ'>
          <strong>
            Jam normal ({officePct}% · {officeCommits} commit)
          </strong>
          : Puncak aktivitas di sekitar pk {peakHour}:00. Manfaatkan rentang ini
          sebagai <em>deep work window</em> untuk pekerjaan yang butuh fokus.
        </WorklifeRow>

        {lateNightCommits > 0 ? (
          <WorklifeRow tone='warn' icon='!'>
            <strong>
              Larut malam ({lateNightPct}% · {lateNightCommits} commit)
            </strong>
            : Ada commit di jam istirahat malam (pk 22:00–06:00). Coding larut
            malam berulang menurunkan energi. Tetapkan batas push sebelum pk
            21:00.
          </WorklifeRow>
        ) : (
          <WorklifeRow tone='good' icon='▲'>
            <strong>Larut malam (0%)</strong>: Tidak ada commit di atas pk
            22:00. Ritme tidur terjaga, pertahankan.
          </WorklifeRow>
        )}

        {weekendDays > 0 ? (
          <WorklifeRow tone='info' icon='ℹ'>
            <strong>
              Akhir pekan ({weekendDays} hari · {weekendCommits} commit)
            </strong>
            : Dedikasi tinggi, tapi sisihkan akhir pekan untuk <em>recharge</em>{' '}
            agar performa sprint berikutnya tetap prima.
          </WorklifeRow>
        ) : (
          <WorklifeRow tone='good' icon='▲'>
            <strong>Akhir pekan (0 hari)</strong>: Hari kerja rapi tanpa commit
            di akhir pekan.
          </WorklifeRow>
        )}
      </div>
    </div>
  );
}

function PerformanceSection({ card }: { card: Scorecard }) {
  const insights = buildPerformanceInsights(card);
  if (insights.length === 0) return null;

  return (
    <div className='pt-4 mt-3 border-t border-border flex flex-col'>
      <div className='card-title mb-2.5'>
        <span>Peluang Naik Skor</span>
      </div>
      <div className='flex flex-col gap-2.5'>
        {insights.map((insight, index) => (
          <div key={index} className='flex items-start gap-2.5'>
            <span
              className={`badge ${TONE_BADGE[insight.tone]} shrink-0 text-xs px-2 py-0.5 rounded-md`}
            >
              {TONE_ICON[insight.tone]}
            </span>
            <span className='text-xs sm:text-[12.5px] text-slate-600 leading-relaxed font-normal'>
              {insight.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewCodeCard({ card, worklife }: ReviewCodeCardProps) {
  const { score, count, insights } = card.review;

  return (
    <section
      className='card animate-fade-up h-full flex flex-col'
      aria-labelledby='review-code-title'
    >
      <div
        className='card-title flex items-center justify-between'
        id='review-code-title'
      >
        <span>Insight</span>
        {score !== null && count > 0 && (
          <span className='badge badge-violet xs'>{count} commit dinilai</span>
        )}
      </div>

      {score === null ? (
        <ScorePending description='Belum ada commit yang dinilai Gemini. Review berjalan otomatis saat sinkronisasi GitLab, maksimal 20 commit per siklus.' />
      ) : (
        <div className='flex flex-col gap-2.5'>
          {insights.map((insight, index) => (
            <div key={index} className='flex items-start gap-2.5'>
              <span
                className={`badge ${TONE_BADGE[insight.tone]} shrink-0 text-xs px-2 py-0.5 rounded-md`}
              >
                {TONE_ICON[insight.tone]}
              </span>
              <span className='text-xs sm:text-[12.5px] text-slate-600 leading-relaxed font-normal'>
                {insight.text}
              </span>
            </div>
          ))}
        </div>
      )}

      <PerformanceSection card={card} />

      {worklife && <WorklifeSection worklife={worklife} />}
    </section>
  );
}
