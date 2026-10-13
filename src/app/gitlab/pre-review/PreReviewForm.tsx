import {
  AlertCircle,
  ExternalLink,
  FolderGit2,
  GitBranch,
  GitCompare,
  Sparkles,
} from 'lucide-react';
import type { GitLabProjectSummary } from '@/app/api/gitlab/projects/route';
import type { GitLabBranchSummary } from '@/app/api/gitlab/branches/route';
import { Select } from '@/components/Select';

interface PreReviewFormProps {
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
  context: string;
  onContextChange: (c: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: () => void;
  selectedProject?: GitLabProjectSummary;
}

export function PreReviewForm({
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
  context,
  onContextChange,
  error,
  loading,
  onSubmit,
  selectedProject,
}: PreReviewFormProps) {
  return (
    <section className='card'>
      <div className='card-title mb-4'>
        <span>Pilih Branch untuk Di-Audit</span>
        {selectedProject && (
          <a
            href={selectedProject.webUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1.5 text-xs text-brand hover:underline font-semibold'
          >
            <span>Buka di GitLab</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div className='flex flex-col gap-5'>
        {/* 1. Project Selector from GitLab */}
        <div>
          <div className='row-between mb-1.5'>
            <label className='xs dim flex items-center gap-1.5 font-semibold'>
              <FolderGit2 size={13} className='text-primary' />
              <span>PILIH PROJECT GITLAB</span>
            </label>
            {loadingProjects && (
              <span className='xs dim'>Memuat project...</span>
            )}
          </div>

          <Select
            value={selectedProjectId}
            onChange={(e) => {
              const pid = e.target.value ? Number(e.target.value) : '';
              onSelectProject(pid);
            }}
            className='w-full h-[38px] text-[13px] font-medium'
          >
            {projects.length === 0 ? (
              <option value=''>
                {loadingProjects ? 'Memuat daftar project...' : 'Tidak ada project ditemukan'}
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

        {/* 2. Source Branch & Target Branch */}
        <div className='grid grid-cols-[1.2fr_1fr] gap-2.5'>
          {/* Source Branch */}
          <div>
            <div className='row-between mb-1.5'>
              <label className='xs dim flex items-center gap-1 font-semibold'>
                <GitBranch size={13} className='text-emerald-500' />
                <span>BRANCH YANG DI-AUDIT</span>
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

          {/* Target Branch */}
          <div>
            <label className='xs dim block mb-1.5 font-semibold'>
              TARGET BRANCH (PEMBANDING)
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

        {/* 3. Optional Context */}
        <div>
          <label className='xs dim block mb-1.5 font-semibold'>
            CATATAN KONTEKS (OPSIONAL)
          </label>
          <input
            type='text'
            className='input w-full h-[38px] text-[13px]'
            value={context}
            onChange={(e) => onContextChange(e.target.value)}
            placeholder='Misal: Refactoring modul auth, integrasi endpoint baru'
          />
        </div>

        {/* Information Banner */}
        <div className='p-3.5 sm:p-4 bg-surface-subtle border border-border rounded-xl flex items-start gap-3'>
          <GitCompare size={18} className='text-emerald-500 shrink-0 mt-0.5' />
          <div className='text-xs text-slate-700 leading-relaxed font-medium'>
            Sistem akan membandingkan branch <strong>{branch}</strong> terhadap <strong>{targetBranch}</strong> langsung dari GitLab, lalu memindai potensi kebocoran secret, keamanan, dan kebersihan kodenya.
          </div>
        </div>

        <button
          type='button'
          className='btn btn-primary w-full h-11 text-sm font-semibold inline-flex items-center justify-center gap-2 mt-1 rounded-xl'
          disabled={loading}
          onClick={onSubmit}
        >
          {loading ? (
            <>
              <span className='spinner' />
              <span>Membandingkan &amp; Memindai Kode...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Jalankan Pre-Review &amp; Audit Keamanan</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
