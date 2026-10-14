'use client';

import { Trash2 } from 'lucide-react';
import { useMrAssistant } from './mr-assistant/useMrAssistant';
import { MrAssistantGitlabForm } from './mr-assistant/MrAssistantGitlabForm';
import { MrAssistantTaigaForm } from './mr-assistant/MrAssistantTaigaForm';
import { MrAssistantMembersForm } from './mr-assistant/MrAssistantMembersForm';
import { MrAssistantLoadingState } from './mr-assistant/MrAssistantLoadingState';
import { MrAssistantEmptyState } from './mr-assistant/MrAssistantEmptyState';
import { MrAssistantResultBanner } from './mr-assistant/MrAssistantResultBanner';
import { MrAssistantTitleBox } from './mr-assistant/MrAssistantTitleBox';
import { MrAssistantReleaseBox } from './mr-assistant/MrAssistantReleaseBox';
import { MrAssistantDescriptionBox } from './mr-assistant/MrAssistantDescriptionBox';

export function MrAssistantCard() {
  const {
    projects,
    loadingProjects,
    selectedProjectId,
    setSelectedProjectId,
    branches,
    loadingBranches,
    branch,
    targetBranch,
    setTargetBranch,
    taigaProjects,
    selectedTaigaProject,
    taigaMilestones,
    selectedTaigaSprint,
    taigaBaseUrl,
    loadingTaiga,
    userStories,
    tasks,
    selectedStoryRef,
    selectedTaskRef,
    members,
    loadingMembers,
    selectedAssigneeId,
    setSelectedAssigneeId,
    selectedReviewerId,
    setSelectedReviewerId,
    loading,
    error,
    result,
    setResult,
    activeTab,
    setActiveTab,
    creatingMr,
    createMrError,
    createdMr,
    handleTaigaProjectChange,
    handleTaigaSprintChange,
    handleStoryChange,
    handleTaskChange,
    handleBranchChange,
    handleReloadMembers,
    handleGenerate,
    handleCreateMr,
    handleClearResult,
    handleMinimize,
  } = useMrAssistant();

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className='flex flex-col gap-6 animate-fade-up'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Left Column: Input Form */}
        <section className='card'>
          <div className='flex flex-col gap-5'>
            <MrAssistantGitlabForm
              projects={projects}
              loadingProjects={loadingProjects}
              selectedProjectId={selectedProjectId}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setSelectedAssigneeId('');
                setSelectedReviewerId('');
                if (id) {
                  const p = projects.find((item) => item.id === id);
                  if (p) setTargetBranch(p.defaultBranch || 'main');
                }
              }}
              branches={branches}
              loadingBranches={loadingBranches}
              branch={branch}
              onBranchChange={handleBranchChange}
              targetBranch={targetBranch}
              onTargetBranchChange={setTargetBranch}
              selectedProject={selectedProject}
            />

            <MrAssistantTaigaForm
              taigaProjects={taigaProjects}
              selectedTaigaProject={selectedTaigaProject}
              onSelectTaigaProject={handleTaigaProjectChange}
              taigaMilestones={taigaMilestones}
              selectedTaigaSprint={selectedTaigaSprint}
              onSelectTaigaSprint={handleTaigaSprintChange}
              taigaBaseUrl={taigaBaseUrl}
              loadingTaiga={loadingTaiga}
              userStories={userStories}
              selectedStoryRef={selectedStoryRef}
              onSelectStory={handleStoryChange}
              tasks={tasks}
              selectedTaskRef={selectedTaskRef}
              onSelectTask={handleTaskChange}
            />

            <MrAssistantMembersForm
              members={members}
              loadingMembers={loadingMembers}
              selectedAssigneeId={selectedAssigneeId}
              onSelectAssignee={setSelectedAssigneeId}
              selectedReviewerId={selectedReviewerId}
              onSelectReviewer={setSelectedReviewerId}
              selectedProjectId={selectedProjectId}
              onReloadMembers={handleReloadMembers}
              error={error}
              loading={loading}
              onGenerate={handleGenerate}
            />
          </div>
        </section>

        {/* Right Column: Output Result Preview */}
        <section className='card flex flex-col'>
          <div className='flex items-center justify-between gap-4 mb-4'>
            <div className='card-title m-0'>
              <span>Hasil Draf GitLab</span>
              {result && (
                <span className='badge badge-cyan xs'>
                  {result.source === 'gemini' ? 'Gemini AI' : 'Fallback Engine'}
                </span>
              )}
            </div>

            {result && (
              <div className='flex items-center gap-2'>
                <div className='segmented p-0.5'>
                  <button
                    type='button'
                    aria-pressed={activeTab === 'preview'}
                    onClick={() => setActiveTab('preview')}
                    className='text-xs px-3 py-1'
                  >
                    Pratinjau
                  </button>
                  <button
                    type='button'
                    aria-pressed={activeTab === 'raw'}
                    onClick={() => setActiveTab('raw')}
                    className='text-xs px-3 py-1'
                  >
                    Raw Markdown
                  </button>
                </div>
                <button
                  type='button'
                  onClick={handleClearResult}
                  className='btn btn-ghost btn-sm text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-2.5 py-1 h-auto min-h-0 rounded-lg flex items-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-900/40'
                  title='Hapus Hasil Draf'
                >
                  <Trash2 size={13} />
                  <span>Hapus</span>
                </button>
              </div>
            )}
          </div>

          {loading && (
            <MrAssistantLoadingState
              branch={branch}
              targetBranch={targetBranch}
            />
          )}

          {!loading && !result && <MrAssistantEmptyState />}

          {!loading && result && (
            <div className='flex flex-col gap-4 flex-1'>
              <MrAssistantResultBanner
                branch={branch}
                targetBranch={targetBranch}
                selectedProjectName={
                  selectedProject?.pathWithNamespace || selectedProject?.name
                }
                createdMr={createdMr}
                creatingMr={creatingMr}
                createMrError={createMrError}
                onCreateMr={handleCreateMr}
              />

              <MrAssistantTitleBox
                title={result.mrTitle}
                onSaveTitle={(newTitle) =>
                  setResult({ ...result, mrTitle: newTitle })
                }
              />

              <MrAssistantReleaseBox
                releaseNotes={result.releaseNotes}
                onSaveReleaseNotes={(notes) =>
                  setResult({ ...result, releaseNotes: notes })
                }
              />

              <MrAssistantDescriptionBox
                description={result.description}
                activeTab={activeTab}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
