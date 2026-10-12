interface ReportHeaderBarProps {
  days: number;
  onDaysChange: (days: number) => void;
  onPrint: () => void;
}

export function ReportHeaderBar({
  days,
  onDaysChange,
  onPrint,
}: ReportHeaderBarProps) {
  return (
    <div className='row-between no-print wrap mb-5 gap-3'>
      <div className='row wrap gap-2.5'>
        <div className='segmented' role='group' aria-label='Rentang waktu'>
          {[30, 90, 180].map((d) => (
            <button
              key={d}
              type='button'
              aria-pressed={days === d}
              onClick={() => onDaysChange(d)}
            >
              {d} Hari
            </button>
          ))}
        </div>
      </div>

      <button
        type='button'
        onClick={onPrint}
        className='btn btn-primary'
        id='btn-print'
      >
        Cetak PDF
      </button>
    </div>
  );
}
