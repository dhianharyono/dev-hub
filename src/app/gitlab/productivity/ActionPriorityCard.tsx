import type { ScoreAction, Scorecard } from '@/lib/scoring';

interface ActionPriorityCardProps {
  card: Scorecard;
}

const PRIORITY_STYLE: Record<ScoreAction['priority'], string> = {
  P1: 'badge-rose',
  P2: 'badge-amber',
  P3: 'badge',
};

export function ActionPriorityCard({ card }: ActionPriorityCardProps) {
  return (
    <section className='card animate-fade-up' aria-labelledby='action-priority-title'>
      <div className='card-title' id='action-priority-title'>
        <span>Prioritas Aksi</span>
        <span className='badge badge-green'>Target {card.potential.target}</span>
      </div>

      {card.actions.length === 0 ? (
        <p className='text-[12.5px] text-slate-muted leading-relaxed'>
          Semua komponen sudah di skor maksimal. Pertahankan ritme kerja saat ini.
        </p>
      ) : (
        <div className='flex flex-col gap-2.5'>
          {card.actions.map((action) => (
            <div
              key={action.component}
              className='flex items-start gap-3 rounded-xl border border-border bg-surface-subtle p-3'
            >
              <div className='flex flex-col items-center gap-1 shrink-0 pt-0.5'>
                <span className={`badge ${PRIORITY_STYLE[action.priority]} px-2 py-0.5`}>
                  {action.priority}
                </span>
              </div>
              <div className='min-w-0 flex-1'>
                <div className='text-[12.5px] font-bold text-slate-text leading-snug'>
                  {action.title}
                </div>
                <p className='text-[11.5px] text-slate-muted mt-1 leading-relaxed'>
                  {action.detail}
                </p>
                {action.steps.length > 0 && (
                  <ul className='mt-2 space-y-1'>
                    {action.steps.map((step, index) => (
                      <li
                        key={index}
                        className='flex gap-1.5 text-[11px] text-slate-text-2 leading-relaxed'
                      >
                        <span className='text-cyan-600 shrink-0'>→</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {action.note && (
                  <p className='text-[10.5px] text-amber-700 mt-1.5 leading-relaxed'>
                    Catatan: {action.note}
                  </p>
                )}
              </div>
              <span className='text-[13px] font-extrabold text-emerald-600 shrink-0'>
                +{action.points.toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className='text-[10.5px] text-slate-400 mt-3 leading-relaxed'>
        Poin dihitung dari bobot talenta × selisih skor komponen ke 100, bukan
        angka tetap. P1 = dampak terbesar.
      </p>
    </section>
  );
}
