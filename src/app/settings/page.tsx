import type { Metadata } from 'next';
import SettingsView from './SettingsView';

export const metadata: Metadata = {
  title: 'Pengaturan',
  description:
    'Konfigurasi token Taiga SSO, GitLab PAT, Gemini API Key, dan filter identitas commit.',
};

export default function Page() {
  return <SettingsView />;
}
