'use client';

import { Calendar, ExternalLink, FolderGit2 } from 'lucide-react';
import { Select } from '@/components/Select';
import type { Meta } from './types';

interface SmartTaskWorkspaceBarProps {
  meta: Meta | null;
  loadingMeta: boolean;
  projectSlug: string;
  sprintSlug: string;
  onProjectChange: (slug: string) => void;
  onSprintChange: (slug: string) => void;
}

export function SmartTaskWorkspaceBar({
  meta,
  loadingMeta,
  projectSlug,
  sprintSlug,
  onProjectChange,
  onSprintChange,
}: SmartTaskWorkspaceBarProps) {
  return (
    <section className='workspaceBar' aria-label='Pengaturan project Taiga'>
      <div className='flex items-center gap-3.5 flex-wrap flex-1'>
        <div className='flex items-center gap-2'>
          <label
            htmlFor='project-select'
            className='text-[11px] font-bold tracking-wider uppercase text-slate-muted flex items-center gap-1.5 whitespace-nowrap'
          >
            <FolderGit2 size={14} className='text-violet-accent' />
            Project Taiga
          </label>
          <Select
            id='project-select'
            className='h-[38px] text-[13px] font-semibold rounded-lg min-w-[180px]'
            value={projectSlug}
            disabled={!meta || loadingMeta}
            onChange={(e) => onProjectChange(e.target.value)}
          >
            {!meta && (
              <option value=''>
                {loadingMeta ? 'Memuat project...' : '-'}
              </option>
            )}
            {meta?.projects?.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className='flex items-center gap-2'>
          <label
            htmlFor='sprint'
            className='text-[11px] font-bold tracking-wider uppercase text-slate-muted flex items-center gap-1.5 whitespace-nowrap'
          >
            <Calendar size={14} className='text-cyan-accent' />
            Sprint / Taskboard
          </label>
          <Select
            id='sprint'
            className='h-[38px] text-[13px] font-semibold rounded-lg min-w-[180px]'
            value={sprintSlug}
            disabled={!meta || loadingMeta}
            onChange={(e) => onSprintChange(e.target.value)}
          >
            {!meta && (
              <option value=''>{loadingMeta ? 'Memuat sprint...' : '-'}</option>
            )}
            {meta && !meta.sprint && <option value=''>(Backlog)</option>}
            {meta?.milestones.map((m) => (
              <option key={m.id} value={m.slug}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className='flex items-center gap-2 flex-wrap'>
        {meta?.baseUrl && meta?.project && (
          <a
            href={`${meta.baseUrl}/project/${meta.project.slug}/taskboard${meta.sprint ? `/${meta.sprint.slug}` : ''}`}
            target='_blank'
            rel='noreferrer'
            className='btn btn-ghost btn-sm text-xs inline-flex items-center gap-1'
          >
            <span>Buka Taiga</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </section>
  );
}
