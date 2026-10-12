import type { Metadata } from 'next';
import SmartTask from './SmartTask';

export const metadata: Metadata = {
  title: 'Smart Task',
  description:
    'Ubah catatan kerja informal menjadi user story & task Taiga yang rapi dengan AI.',
};

export default function Page() {
  return <SmartTask />;
}
