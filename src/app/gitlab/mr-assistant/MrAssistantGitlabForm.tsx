import { ExternalLink, FolderGit2, GitBranch } from 'lucide-react';
import type { GitLabProjectSummary } from '@/app/api/gitlab/projects/route';
import type { GitLabBranchSummary } from '@/app/api/gitlab/branches/route';
import { Select } from '@/components/Select';

interface MrAssistantGitlabFormProps {
  projects: GitLabProjectSummary[];
  loadingProjects: boolean;
  selectedProjectId: number | '';
  onSelectProject: (id: number | '') => void;
  branches: GitLabBranchSummary[];
  loadingBranches: boolean;
  branch: string;
  onBranchChange: (b: string) => void;
  targetBranch: string;
  onTargetBranchChange: (b: string) => void;
  selectedProject?: GitLabProjectSummary;
}

export function MrAssistantGitlabForm({
  projects,
  loadingProjects,
  selectedProjectId,
  onSelectProject,
  branches,
  loadingBranches,
  branch,
  onBranchChange,
  targetBranch,
  onTargetBranchChange,
  selectedProject,
}: MrAssistantGitlabFormProps) {
  return (
    <>
      <div className='card-title mb-4'>
        <span>Parameter Merge Request</span>
        {selectedProject && (
          <a
            href={selectedProject.webUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='row xs text-primary no-underline gap-1'
          >
            <span>Buka di GitLab</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* 1. Project Selector from GitLab */}
      <div>
        <div className='row-between mb-1.5'>
          <label className='xs dim flex items-center gap-1.5 font-semibold'>
            <FolderGit2 size={13} className='text-primary' />
            <span>PILIH PROJECT GITLAB</span>
          </label>
          {loadingProjects && <span className='xs dim'>Memuat project...</span>}
        </div>

        <Select
          value={selectedProjectId}
          onChange={(e) => {
            const pid = e.target.value ? Number(e.target.value) : '';
            if (pid === selectedProjectId) return;
            onSelectProject(pid);
          }}
          className='w-full h-[38px] text-[13px] font-medium'
        >
          {projects.length === 0 ? (
            <option value=''>
              {loadingProjects
                ? 'Memuat daftar project...'
                : 'Tidak ada project ditemukan (cek token di Pengaturan)'}
            </option>
          ) : (
            projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.pathWithNamespace} (default: {p.defaultBranch})
              </option>
            ))
          )}
        </Select>
      </div>

      {/* 2. Source Branch & Target Branch Selectors */}
      <div className='grid grid-cols-[1.2fr_1fr] gap-2.5'>
        {/* Source Branch */}
        <div>
          <div className='row-between mb-1.5'>
            <label className='xs dim flex items-center gap-1 font-semibold'>
              <GitBranch size={13} className='text-sky-500' />
              <span>SOURCE BRANCH</span>
            </label>
            {loadingBranches && <span className='xs dim'>Memuat...</span>}
          </div>

          {branches.length > 0 ? (
            <Select
              value={branch}
              onChange={(e) => onBranchChange(e.target.value)}
              className='w-full h-[38px] text-[13px]'
            >
              {branches.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} {b.default ? '(default)' : ''}
                </option>
              ))}
            </Select>
          ) : (
            <input
              type='text'
              className='input w-full h-[38px] text-[13px]'
              value={branch}
              onChange={(e) => onBranchChange(e.target.value)}
              placeholder='feature/nama-fitur'
            />
          )}
        </div>

        {/* Target Branch Dropdown */}
        <div>
          <label className='xs dim block mb-1.5 font-semibold'>
            TARGET BRANCH
          </label>

          {branches.length > 0 ? (
            <Select
              value={targetBranch}
              onChange={(e) => onTargetBranchChange(e.target.value)}
              className='w-full h-[38px] text-[13px]'
            >
              {branches.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} {b.default ? '(default)' : ''}
                </option>
              ))}
            </Select>
          ) : (
            <input
              type='text'
              className='input w-full h-[38px] text-[13px]'
              value={targetBranch}
              onChange={(e) => onTargetBranchChange(e.target.value)}
              placeholder='main atau develop'
            />
          )}
        </div>
      </div>
    </>
  );
}
