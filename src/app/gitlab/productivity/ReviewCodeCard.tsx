import type { Scorecard } from '@/lib/scoring';
import { ScorePending } from './ScorePending';

interface ReviewCodeCardProps {
  card: Scorecard;
}

function toneOf(score: number): 'green' | 'amber' | 'rose' {
  if (score >= 70) return 'green';
  if (score >= 40) return 'amber';
  return 'rose';
}

const SCORE_TEXT: Record<'green' | 'amber' | 'rose', string> = {
  green: 'text-emerald-700',
  amber: 'text-amber-700',
  rose: 'text-rose-700',
};

const SCORE_BOX: Record<'green' | 'amber' | 'rose', string> = {
  green: 'border-emerald-200 from-emerald-50 to-green-50',
  amber: 'border-amber-200 from-amber-50 to-yellow-50',
  rose: 'border-rose-200 from-rose-50 to-orange-50',
};

const BADGE: Record<'green' | 'amber' | 'rose', string> = {
  green: 'badge-green',
  amber: 'badge-amber',
  rose: 'badge-rose',
};

export function ReviewCodeCard({ card }: ReviewCodeCardProps) {
  const { score, count, highlights } = card.review;

  return (
    <section className='card animate-fade-up h-full flex flex-col' aria-labelledby='review-code-title'>
      <div className='card-title' id='review-code-title'>
        <span>Review Kode AI</span>
      </div>

      {score === null ? (
        <ScorePending description='Belum ada commit yang dinilai Gemini. Review berjalan otomatis saat sinkronisasi GitLab, maksimal 20 commit per siklus.' />
      ) : (
        <>
          <div className='flex items-center gap-4 mb-3.5'>
            <div
              className={`shrink-0 text-center px-4 py-2.5 rounded-2xl border bg-gradient-to-br ${SCORE_BOX[toneOf(score)]}`}
            >
              <div className={`text-[32px] font-extrabold leading-none ${SCORE_TEXT[toneOf(score)]}`}>
                {score}
              </div>
              <div className='text-[10px] text-slate-muted mt-1'>dari 100</div>
            </div>
            <p className='text-[12px] text-slate-muted leading-relaxed'>
              Rata-rata penilaian Gemini atas isi commit yang di-push. Diperbarui
              saat sinkronisasi GitLab.
            </p>
          </div>

          <div className='space-y-3'>
            {highlights.map((commit) => (
              <div
                key={commit.sha}
                className='rounded-xl border border-border bg-surface-subtle px-3 py-2.5'
              >
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className={`badge ${BADGE[toneOf(commit.score)]} text-[10px]`}>
                    {commit.score}
                  </span>
                  <code className='text-[10.5px] text-slate-muted'>{commit.shortSha}</code>
                  <span className='text-[11.5px] font-bold text-slate-text-2 truncate min-w-0 flex-1'>
                    {commit.title}
                  </span>
                </div>
                <ul className='mt-1.5 space-y-1'>
                  {commit.notes.slice(0, 3).map((note, index) => (
                    <li
                      key={index}
                      className='text-[11px] text-slate-muted leading-relaxed flex gap-1.5'
                    >
                      <span className='text-slate-300 shrink-0'>•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className='text-[10.5px] text-slate-400 mt-3 leading-relaxed'>
            {count.toLocaleString('id-ID')} commit dinilai AI (hanya baris tambahan).
            Sorotan di atas adalah commit dengan skor terendah.
          </p>
        </>
      )}
    </section>
  );
}
