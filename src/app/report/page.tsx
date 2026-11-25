import type { Metadata } from 'next';
import { getLiveReportData } from '@/lib/report-live';
import ReportView from './ReportView';

export const metadata: Metadata = {
  title: 'Rapor Talent',
  description:
    'Rapor Talent: peringkat, alur rilis, isu berulang, dan ringkasan kontribusi kerja (format cetak / PDF).',
};

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const params = await searchParams;
  const days = Number.isFinite(Number(params.days)) ? Number(params.days) : 0;
  const initialData = getLiveReportData(days);
  return <ReportView initialData={initialData} />;
}
