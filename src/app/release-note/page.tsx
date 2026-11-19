import type { Metadata } from 'next';
import { ReleaseNoteHub } from './ReleaseNoteHub';

export const metadata: Metadata = {
  title: 'Release Note',
  description:
    'Daftar release note dari Taiga dan pembuatan user story beserta task deployment checklist.',
};

export default function Page() {
  return <ReleaseNoteHub />;
}
