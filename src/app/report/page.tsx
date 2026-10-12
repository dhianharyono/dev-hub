import type { Metadata } from 'next';
import { getLiveReportData } from '@/lib/report-live';
import ReportView from './ReportView';

export const metadata: Metadata = {
  title: 'Laporan Performa',
  description:
    'Laporan Performa Talenta GitLab & Ringkasan Kontribusi Kerja (Format Cetak / PDF).',
};

export const dynamic = 'force-dynamic';

export default function Page() {
  const initialData = getLiveReportData();
  return <ReportView initialData={initialData} />;
}
