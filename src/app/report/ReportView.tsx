'use client';

import Link from 'next/link';
import { referenceReportData, type FullReportData } from './reportData';
import { ReportProjectScopePages } from './ReportProjectScopePages';
import { ReportMethodologyPage } from './ReportMethodologyPage';
import { ReportTalentProfilePage } from './ReportTalentProfilePage';
import { ReportAiAnalysisPage } from './ReportAiAnalysisPage';
import { ReportReworkPage } from './ReportReworkPage';

interface ReportViewProps {
  initialData?: FullReportData;
}

export default function ReportView({ initialData }: ReportViewProps) {
  // Active dataset: Realtime GitLab performance data
  const activeData: FullReportData = initialData || referenceReportData;

  const projectPagesCount =
    activeData.projects.length > 0
      ? Math.max(...activeData.projects.map((p) => p.page))
      : 1;

  const totalPages = projectPagesCount + 4;
  const methodologyPageNum = projectPagesCount + 1;
  const talentProfilePageNum = projectPagesCount + 2;
  const aiAnalysisPageNum = projectPagesCount + 3;
  const reworkPageNum = projectPagesCount + 4;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className='max-w-[900px] mx-auto py-4 pb-15 print:max-w-full print:p-0 print:m-0'>
      {/* Top Toolbar (Hidden on Print) */}
      <div className='flex justify-between items-center mb-6 bg-surface border border-border py-3 px-5 rounded-xl box-border print:hidden'>
        <Link
          href='/gitlab'
          className='btn btn-ghost text-[13px] inline-flex items-center'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-1.5'
          >
            <line x1='19' y1='12' x2='5' y2='12' />
            <polyline points='12 19 5 12 12 5' />
          </svg>
          Kembali ke GitLab Dashboard
        </Link>

        <button
          type='button'
          className='btn btn-primary font-bold whitespace-nowrap'
          onClick={handlePrint}
        >
          Cetak PDF
        </button>
      </div>

      {/* Pages: Ringkasan Eksekutif & Cakupan Proyek (Hanya proyek sedang / pernah dikerjakan) */}
      <ReportProjectScopePages data={activeData} totalPages={totalPages} />

      {/* Metodologi Penilaian */}
      <ReportMethodologyPage
        methodology={activeData.methodology}
        currentPage={methodologyPageNum}
        totalPages={totalPages}
      />

      {/* Profil Detail Talent */}
      <ReportTalentProfilePage
        data={activeData}
        currentPage={talentProfilePageNum}
        totalPages={totalPages}
      />

      {/* Analisis AI (Menampilkan nama model LLM aktif di website) */}
      <ReportAiAnalysisPage
        data={activeData}
        currentPage={aiAnalysisPageNum}
        totalPages={totalPages}
      />

      {/* Contoh Rework Atas Kode Sendiri */}
      <ReportReworkPage
        data={activeData}
        currentPage={reworkPageNum}
        totalPages={totalPages}
      />
    </div>
  );
}
