'use client';

import { useState } from 'react';
import { ClipboardList, FilePlus2, ListChecks } from 'lucide-react';
import { ReleaseDeploymentTab } from './components/ReleaseDeploymentTab';
import { ReleaseNoteList } from './components/ReleaseNoteList';
import { ReleaseNoteWorkspace } from './ReleaseNoteWorkspace';

type ReleaseNoteTab = 'list' | 'create' | 'deploy';

const TABS: { key: ReleaseNoteTab; label: string; icon: typeof ListChecks }[] = [
  { key: 'list', label: 'Daftar Release Note', icon: ListChecks },
  { key: 'create', label: 'Buat Release Note', icon: FilePlus2 },
  { key: 'deploy', label: 'Buat Form Deployment', icon: ClipboardList },
];

export function ReleaseNoteHub() {
  const [tab, setTab] = useState<ReleaseNoteTab>('list');
  const [deployOpened, setDeployOpened] = useState(false);

  function selectTab(next: ReleaseNoteTab) {
    if (next === 'deploy') setDeployOpened(true);
    setTab(next);
  }

  return (
    <>
      <header className='page-header'>
        <div>
          <div className='eyebrow'>Taiga · Deployment</div>
          <h1>Release Note</h1>
          <p>
            Lihat release note dari epic Staging dan Production di Taiga, susun
            user story dan task deployment baru, atau buat form deployment dari
            release note yang sudah ada.
          </p>
        </div>
      </header>

      <div
        className='print:hidden flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-border w-fit max-w-full overflow-x-auto mb-4 shadow-xs'
        role='tablist'
        aria-label='Pilihan Release Note'
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type='button'
            role='tab'
            id={`tab-release-note-${key}`}
            aria-selected={tab === key}
            onClick={() => selectTab(key)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[13px] transition-all whitespace-nowrap cursor-pointer ${
              tab === key
                ? 'bg-brand text-white shadow-sm border border-brand font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-medium'
            }`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div hidden={tab !== 'list'}>
        <ReleaseNoteList />
      </div>
      <div hidden={tab !== 'create'}>
        <ReleaseNoteWorkspace />
      </div>
      {deployOpened && (
        <div hidden={tab !== 'deploy'}>
          <ReleaseDeploymentTab />
        </div>
      )}
    </>
  );
}
