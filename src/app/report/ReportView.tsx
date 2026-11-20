'use client';

import { referenceReportData, type FullReportData } from './reportData';
import { ReportMethodologyPage } from './ReportMethodologyPage';
import { ReportTalentProfilePage } from './ReportTalentProfilePage';
import { ReportReleaseFlowPage } from './ReportReleaseFlowPage';
import { ReportReworkPage } from './ReportReworkPage';
import { ReportSkillPage } from './ReportSkillPage';
import { ReportCodeReviewPage } from './ReportCodeReviewPage';
import { ReportWorkAreaPage } from './ReportWorkAreaPage';
import { ReportHotspotPage } from './ReportHotspotPage';

interface ReportViewProps {
  initialData?: FullReportData;
}

export default function ReportView({ initialData }: ReportViewProps) {
  // Active dataset: Realtime GitLab performance data
  const activeData: FullReportData = initialData || referenceReportData;
  const totalPages = 8;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className='report-root max-w-[1150px] mx-auto py-4 pb-15 print:max-w-full print:p-0 print:m-0'>
      {/* 1. Profil, KPI, skor komponen, indikator kualitas */}
      <ReportTalentProfilePage
        data={activeData}
        currentPage={1}
        totalPages={totalPages}
        onPrint={handlePrint}
      />

      {/* 2. Alur kerja: branch -> develop -> release -> master */}
      <ReportReleaseFlowPage data={activeData} currentPage={2} totalPages={totalPages} />

      {/* 3. Isu berulang atas kode sendiri */}
      <ReportReworkPage data={activeData} currentPage={3} totalPages={totalPages} />

      {/* 4. Skill kode: temuan statis, bahasa, commit yang perlu dicek */}
      <ReportSkillPage data={activeData} currentPage={4} totalPages={totalPages} />

      {/* 5. Review kode AI + commit per minggu */}
      <ReportCodeReviewPage data={activeData} currentPage={5} totalPages={totalPages} />

      {/* 6. Area kerja, pola waktu, tipe file, catatan pengembangan */}
      <ReportWorkAreaPage data={activeData} currentPage={6} totalPages={totalPages} />

      {/* 7. Hotspot dan contoh self-rework */}
      <ReportHotspotPage data={activeData} currentPage={7} totalPages={totalPages} />

      {/* 8. Metodologi penilaian */}
      <ReportMethodologyPage
        methodology={activeData.methodology}
        currentPage={8}
        totalPages={totalPages}
      />
    </div>
  );
}
