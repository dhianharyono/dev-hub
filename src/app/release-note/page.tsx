import type { Metadata } from 'next';
import { ReleaseNoteWorkspace } from './ReleaseNoteWorkspace';

export const metadata: Metadata = {
  title: 'Release Note',
  description:
    'Buat user story dan task deployment checklist di Taiga, lalu isi form Deployment lewat browser.',
};

export default function Page() {
  return <ReleaseNoteWorkspace />;
}
