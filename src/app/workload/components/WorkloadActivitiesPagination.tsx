'use client';

interface WorkloadActivitiesPaginationProps {
  totalTasks: number;
  startIndex: number;
  endIndex: number;
  currentPage: number;
  totalPages: number;
  setPage: (updater: number | ((p: number) => number)) => void;
}

export function WorkloadActivitiesPagination({
  totalTasks,
  startIndex,
  endIndex,
  currentPage,
  totalPages,
  setPage,
}: WorkloadActivitiesPaginationProps) {
  if (totalTasks === 0) return null;

  return (
    <div className='row-between mt-4 pt-1 flex-wrap gap-3'>
      <div className='dim xs'>
        Menampilkan <strong>{startIndex + 1}</strong> -{' '}
        <strong>{endIndex}</strong> dari <strong>{totalTasks}</strong> aktivitas
        (Halaman <strong>{currentPage}</strong> dari{' '}
        <strong>{totalPages}</strong>)
      </div>

      {totalPages > 1 && (
        <div className='flex items-center gap-1.5'>
          <button
            type='button'
            className='btn btn-ghost xs px-2.5 py-1 text-xs'
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label='Halaman Sebelumnya'
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((pNum) => {
              return (
                pNum === 1 ||
                pNum === totalPages ||
                Math.abs(pNum - currentPage) <= 1
              );
            })
            .reduce<Array<number | string>>((acc, pNum, idx, arr) => {
              if (idx > 0 && pNum - (arr[idx - 1] as number) > 1) {
                acc.push('...');
              }
              acc.push(pNum);
              return acc;
            }, [])
            .map((item, idx) =>
              typeof item === 'string' ? (
                <span key={`dots-${idx}`} className='dim xs px-1'>
                  ...
                </span>
              ) : (
                <button
                  key={`page-${item}`}
                  type='button'
                  className={`btn ${item === currentPage ? 'btn-primary font-bold' : 'btn-ghost font-medium'} xs px-2.5 py-1 min-w-7 h-7 text-xs`}
                  onClick={() => setPage(item)}
                  aria-current={item === currentPage ? 'page' : undefined}
                >
                  {item}
                </button>
              ),
            )}

          <button
            type='button'
            className='btn btn-ghost xs px-2.5 py-1 text-xs'
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label='Halaman Selanjutnya'
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
