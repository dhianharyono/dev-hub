import type { Metadata } from 'next';
import WorkloadView from './WorkloadView';

export const metadata: Metadata = {
  title: 'Workload Analysis · DevHub',
  description:
    'Monitoring beban kerja, pemenuhan jam kerja wajib 08:00 - 17:00 weekday, dan integrasi portal timesheet/WAD.',
};

export default function WorkloadPage() {
  return <WorkloadView />;
}
