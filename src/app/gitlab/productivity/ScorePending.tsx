interface ScorePendingProps {
  description: string;
}

/** Empty state ringan untuk data yang belum tersedia (bukan angka palsu). */
export function ScorePending({ description }: ScorePendingProps) {
  return (
    <div className='rounded-xl border border-dashed border-border bg-surface-subtle px-4 py-6 text-center'>
      <p className='text-[12.5px] font-bold text-slate-text-2'>Menunggu sinkron</p>
      <p className='text-[11.5px] text-slate-muted mt-1 leading-relaxed'>{description}</p>
    </div>
  );
}
