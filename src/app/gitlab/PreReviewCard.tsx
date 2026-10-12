'use client';

import { usePreReview } from './pre-review/usePreReview';
import { PreReviewForm } from './pre-review/PreReviewForm';
import { PreReviewScoreBanner } from './pre-review/PreReviewScoreBanner';
import { PreReviewChecklist } from './pre-review/PreReviewChecklist';
import { PreReviewFindingsList } from './pre-review/PreReviewFindingsList';
import { PreReviewFallbackIssues } from './pre-review/PreReviewFallbackIssues';
import { PreReviewLoadingState } from './pre-review/PreReviewLoadingState';
import { PreReviewEmptyState } from './pre-review/PreReviewEmptyState';

export function PreReviewCard() {
  const {
    projects,
    loadingProjects,
    selectedProjectId,
    setSelectedProjectId,
    branches,
    loadingBranches,
    branch,
    setBranch,
    targetBranch,
    setTargetBranch,
    context,
    setContext,
    loading,
    error,
    result,
    auditStats,
    copiedFullReview,
    handleReview,
    handleCopyFullReview,
  } = usePreReview();

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className='flex flex-col gap-6 animate-fade-up'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <PreReviewForm
          projects={projects}
          loadingProjects={loadingProjects}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => {
            setSelectedProjectId(id);
            if (id) {
              const p = projects.find((item) => item.id === id);
              if (p) setTargetBranch(p.defaultBranch || 'main');
            }
          }}
          branches={branches}
          loadingBranches={loadingBranches}
          branch={branch}
          onBranchChange={setBranch}
          targetBranch={targetBranch}
          onTargetBranchChange={setTargetBranch}
          context={context}
          onContextChange={setContext}
          error={error}
          loading={loading}
          onSubmit={handleReview}
          selectedProject={selectedProject}
        />

        {/* Right: Review Results */}
        <section className='card flex flex-col'>
          <div className='flex items-center justify-between gap-4 mb-4'>
            <div className='card-title m-0'>
              <span>Laporan Hasil Audit</span>
            </div>
            <div className='flex items-center gap-2'>
              {auditStats && (
                <span className='badge badge-cyan xs'>
                  {auditStats.commitsCount} Commit · {auditStats.filesCount}{' '}
                  File
                </span>
              )}
              {result && (
                <span className='badge badge-green xs'>
                  {result.source === 'gemini' ? 'Gemini AI' : 'Fallback Engine'}
                </span>
              )}
            </div>
          </div>

          {loading && <PreReviewLoadingState branch={branch} />}

          {!loading && !result && <PreReviewEmptyState />}

          {!loading && result && (
            <div className='flex flex-col gap-4 flex-1 overflow-y-auto max-h-[75vh] pr-1'>
              <PreReviewScoreBanner
                result={result}
                copiedFullReview={copiedFullReview}
                onCopyFullReview={handleCopyFullReview}
              />

              {/* Summary Description */}
              <div className='p-3.5 sm:p-4 bg-surface-subtle border border-border rounded-xl text-[13px] leading-relaxed text-slate-text'>
                {result.summary}
              </div>

              <PreReviewChecklist checklist={result.checklist} />

              <PreReviewFindingsList findings={result.findings} />

              <PreReviewFallbackIssues result={result} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
