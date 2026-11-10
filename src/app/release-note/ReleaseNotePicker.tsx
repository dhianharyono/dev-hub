'use client';

import { Search } from 'lucide-react';
import { Notification } from '@/components/Notification';
import { Select } from '@/components/Select';
import { Tooltip } from '@/components/Tooltip';
import type { ReleaseNoteProjectOption } from './types';

interface ReleaseNotePickerProps {
  projects: ReleaseNoteProjectOption[];
  projectsLoading: boolean;
  projectId: number;
  onProjectChange: (id: number) => void;
  branches: string[];
  branchesLoading: boolean;
  targetBranch: string;
  onTargetBranchChange: (value: string) => void;
  releaseTitle: string;
  onReleaseTitleChange: (value: string) => void;
  since: string;
  until: string;
  onSinceChange: (value: string) => void;
  onUntilChange: (value: string) => void;
  databaseName: string;
  onDatabaseNameChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  onSearch: () => void;
}

export function ReleaseNotePicker({
  projects,
  projectsLoading,
  projectId,
  onProjectChange,
  branches,
  branchesLoading,
  targetBranch,
  onTargetBranchChange,
  releaseTitle,
  onReleaseTitleChange,
  since,
  until,
  onSinceChange,
  onUntilChange,
  databaseName,
  onDatabaseNameChange,
  loading,
  error,
  onSearch,
}: ReleaseNotePickerProps) {
  return (
    <section className='card'>
      <div className='card-title m-0 flex items-center gap-1.5'>
        <span>Judul Release</span>
        <Tooltip
          content='Satu judul menghasilkan satu release note. Pencarian MR memakai kata kunci judul, referensi story, dan source branch yang sama.'
          ariaLabel='Informasi Judul Release'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-3'>
        <div className='field md:col-span-2 xl:col-span-4'>
          <label htmlFor='release-note-title'>Judul Release</label>
          <input
            id='release-note-title'
            type='text'
            className='input'
            value={releaseTitle}
            onChange={(e) => onReleaseTitleChange(e.target.value)}
            placeholder='Contoh: Enhancement Dakocan'
            disabled={loading}
            autoFocus
          />
        </div>

        <div className='field'>
          <label htmlFor='release-note-project'>Project GitLab</label>
          <Select
            id='release-note-project'
            value={projectId}
            onChange={(e) => onProjectChange(Number(e.target.value))}
            disabled={projectsLoading || loading || projects.length === 0}
            placeholder='Pilih project...'
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.nameWithNamespace}
              </option>
            ))}
          </Select>
          {projectsLoading && (
            <span className='hint inline-flex items-center gap-1.5'>
              <span className='spinner w-3 h-3' /> Memuat daftar project...
            </span>
          )}
        </div>

        <div className='field'>
          <label htmlFor='release-note-branch'>Branch Tujuan</label>
          <Select
            id='release-note-branch'
            value={targetBranch}
            onChange={(e) => onTargetBranchChange(e.target.value)}
            disabled={branchesLoading || loading}
            placeholder='Semua branch'
          >
            <option value=''>Semua branch</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
                {branch === 'release'
                  ? ' (staging)'
                  : branch === 'master'
                    ? ' (production)'
                    : ''}
              </option>
            ))}
          </Select>
        </div>

        <div className='field'>
          <label htmlFor='release-note-since'>Merge sejak</label>
          <input
            id='release-note-since'
            type='date'
            className='input'
            value={since}
            onChange={(e) => onSinceChange(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className='field'>
          <label htmlFor='release-note-until'>Sampai</label>
          <input
            id='release-note-until'
            type='date'
            className='input'
            value={until}
            onChange={(e) => onUntilChange(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className='field md:col-span-2'>
          <label htmlFor='release-note-database'>Nama Database</label>
          <input
            id='release-note-database'
            type='text'
            className='input'
            value={databaseName}
            onChange={(e) => onDatabaseNameChange(e.target.value)}
            placeholder='padi_transactions'
            disabled={loading}
          />
        </div>

        <div className='flex items-end md:col-span-2'>
          <button
            type='button'
            className='btn btn-primary gap-2 w-full md:w-fit'
            onClick={onSearch}
            disabled={
              loading || projectsLoading || !projectId || !releaseTitle.trim()
            }
            id='btn-search-release-note'
          >
            {loading ? (
              <span className='spinner w-4 h-4' />
            ) : (
              <Search size={15} />
            )}
            <span>{loading ? 'Menyusun...' : 'Generate Release Note'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className='mt-4'>
          <Notification type='error' title='Gagal mencari MR' message={error} />
        </div>
      )}
    </section>
  );
}
