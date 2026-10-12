interface ReportFooterProps {
  currentPage: number;
  totalPages?: number;
}

export function ReportFooter({ currentPage, totalPages = 10 }: ReportFooterProps) {
  return (
    <footer className='flex justify-between items-center border-t border-slate-200 pt-3 mt-6 text-[10.5px] text-slate-400 print:border-slate-300 print:mt-1 print:pt-1 print:text-[8px] print:shrink-0'>
      <span className='tracking-wide'>
        GitLab Talent Tracer : Rahasia, untuk keperluan internal
      </span>
      <span className='font-medium print:text-[8.5px]'>
        Hal. {currentPage} / {totalPages}
      </span>
    </footer>
  );
}
