import type { Metadata } from 'next';
import { ReleaseNoteView } from './ReleaseNoteView';

export const metadata: Metadata = {
  title: 'Release Note',
  description:
    'Buat release note dari MR merged GitLab: grup fitur, deteksi dampak database, dan teks siap copy.',
};

/** YYYY-MM-DD in WIB, offset from today. */
function wibDateString(offsetDays: number): string {
  const now = Date.now() + offsetDays * 86_400_000;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now));
}

export default function Page() {
  return (
    <ReleaseNoteView
      defaultSince={wibDateString(-30)}
      defaultUntil={wibDateString(0)}
    />
  );
}
