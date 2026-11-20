import type { Metadata } from 'next';
import { getLiveReportData } from '@/lib/report-live';
import ReportView from './ReportView';

export const metadata: Metadata = {
  title: 'Rapor Talent',
  description:
    'Rapor Talent: peringkat, alur rilis, isu berulang, dan ringkasan kontribusi kerja (format cetak / PDF).',
};

export const dynamic = 'force-dynamic';

export default function Page() {
  const initialData = getLiveReportData();
  return <ReportView initialData={initialData} />;
}
