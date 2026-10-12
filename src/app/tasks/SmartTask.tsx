'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FolderGit2, Settings, RefreshCw } from 'lucide-react';
import { useIntegrations } from '@/components/hooks';
import { EmptyState } from '@/components/EmptyState';
import AssignedTasksBoard from './AssignedTasksBoard';
import { SmartTaskDraftsSection } from './smart-task/SmartTaskDraftsSection';
import { SmartTaskInputArea } from './smart-task/SmartTaskInputArea';
import { SmartTaskSkeleton } from './smart-task/SmartTaskSkeleton';
import { SmartTaskWorkspaceBar } from './smart-task/SmartTaskWorkspaceBar';
import { useSmartTask } from './smart-task/useSmartTask';

export default function SmartTask() {
  const [mainTab, setMainTab] = useState<'my_tasks' | 'input_draft'>(
    'my_tasks',
  );
  const taskState = useSmartTask();
  const {
    integrations,
    loading: loadingIntegrations,
    refresh: refreshIntegrations,
  } = useIntegrations();

  const isTaigaConnected = Boolean(integrations?.taiga?.connected);
  const taigaError = integrations?.taiga?.error;

  return (
    <>
      <header className='flex items-start justify-between gap-4 flex-wrap mb-7'>
        <div className='flex-1 max-w-3xl'>
          <div className='text-xs font-bold uppercase tracking-wider text-brand mb-1.5'>
            Taiga · AI Developer Assistant
          </div>
          <h1 className='text-3xl font-extrabold tracking-tight text-slate-text'>
            Smart <span className='text-brand'>Task Studio</span>
          </h1>
          <p className='text-slate-muted mt-2 text-sm leading-relaxed'>
            {!isTaigaConnected && !loadingIntegrations
              ? 'Koneksi Taiga tidak aktif. Konfigurasikan di Pengaturan.'
              : mainTab === 'my_tasks'
                ? 'Pantau dan perbarui status task Taiga yang ditugaskan ke Anda secara langsung tanpa perlu membuka Taiga.'
                : 'Otomatisasi input catatan kerja menjadi User Story & Task Taiga lengkap dengan estimasi dan log waktu.'}
          </p>
        </div>
        <div className='flex items-center gap-2 flex-wrap ml-auto self-center'>
          {isTaigaConnected &&
            mainTab === 'input_draft' &&
            taskState.source === 'fallback' && (
              <span className='badge badge-amber'>Mode tanpa AI</span>
            )}
          {isTaigaConnected &&
            mainTab === 'input_draft' &&
            taskState.source === 'gemini' && (
              <span className='badge badge-violet'>Gemini AI</span>
            )}
          {isTaigaConnected &&
            mainTab === 'my_tasks' &&
            taskState.assignedTasks.length > 0 && (
              <span className='badge badge-cyan'>
                {taskState.assignedTasks.length} Task Ditugaskan
              </span>
            )}
        </div>
      </header>

      {/* View Switcher Tabs */}
      <div
        className='print:hidden inline-flex p-1.5 gap-2 rounded-2xl bg-white border border-border shadow-xs mb-5'
        role='tablist'
        aria-label='Pilihan Tab Smart Task Studio'
      >
        <button
          type='button'
          role='tab'
          id='tab-my-tasks'
          aria-selected={mainTab === 'my_tasks'}
          onClick={() => setMainTab('my_tasks')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
            mainTab === 'my_tasks'
              ? 'bg-brand text-white shadow-sm border border-brand'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
          }`}
        >
          <span>Daftar Task &amp; Status</span>
          {isTaigaConnected && taskState.assignedTasks.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                mainTab === 'my_tasks'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {taskState.assignedTasks.length}
            </span>
          )}
        </button>

        <button
          type='button'
          role='tab'
          id='tab-input-draft'
          aria-selected={mainTab === 'input_draft'}
          onClick={() => setMainTab('input_draft')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
            mainTab === 'input_draft'
              ? 'bg-brand text-white shadow-sm border border-brand'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
          }`}
        >
          <span>Input &amp; Review Draft</span>
          {isTaigaConnected && taskState.drafts.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                mainTab === 'input_draft'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {taskState.drafts.length}
            </span>
          )}
        </button>
      </div>

      {/* ---------- TAB 1: DAFTAR TASK & STATUS ---------- */}
      {mainTab === 'my_tasks' &&
        (!loadingIntegrations && !isTaigaConnected ? (
          <EmptyState
            tone='rose'
            icon={<FolderGit2 size={26} strokeWidth={2.2} />}
            title='Layanan Taiga Tidak Terhubung'
            description={
              taigaError
                ? `${taigaError}. Hubungkan kembali kredensial atau token sesi Taiga di menu Pengaturan untuk memantau dan memperbarui task Anda.`
                : 'Koneksi ke server Taiga tidak terhubung atau sesi telah kedaluwarsa. Silakan konfigurasi ulang kredensial di menu Pengaturan.'
            }
            action={
              <div className='flex items-center gap-2.5 flex-wrap'>
                <Link
                  href='/settings'
                  className='btn btn-primary no-underline'
                  id='btn-taiga-settings'
                >
                  <Settings size={15} />
                  <span>Konfigurasi Taiga di Pengaturan</span>
                </Link>
                <button
                  type='button'
                  className='btn btn-ghost border border-(--border) gap-1.5'
                  onClick={() => {
                    refreshIntegrations(true);
                    taskState.fetchAssignedTasks(taskState.assignedActiveOnly);
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Periksa Ulang Status</span>
                </button>
              </div>
            }
          />
        ) : (
          <AssignedTasksBoard
            assignedTasks={taskState.assignedTasks}
            setAssignedTasks={taskState.setAssignedTasks}
            projectStatuses={taskState.projectStatuses}
            assignedProjects={taskState.assignedProjects}
            loadingAssigned={loadingIntegrations || taskState.loadingAssigned}
            assignedError={taskState.assignedError}
            assignedActiveOnly={taskState.assignedActiveOnly}
            setAssignedActiveOnly={taskState.setAssignedActiveOnly}
            onRefresh={(activeOnly) =>
              taskState.fetchAssignedTasks(
                activeOnly ?? taskState.assignedActiveOnly,
              )
            }
            baseUrl={taskState.meta?.baseUrl}
            onNavigateToStudio={() => setMainTab('input_draft')}
          />
        ))}

      {/* ---------- TAB 2: INPUT & REVIEW DRAFT ---------- */}
      {mainTab === 'input_draft' &&
        (!loadingIntegrations && !isTaigaConnected ? (
          <EmptyState
            tone='rose'
            icon={<FolderGit2 size={26} strokeWidth={2.2} />}
            title='Layanan Taiga Tidak Terhubung'
            description={
              taigaError
                ? `${taigaError}. Fitur Smart Task Studio memerlukan koneksi Taiga aktif untuk memilih project, sprint/taskboard, dan submit User Story atau Task.`
                : 'Fitur Smart Task Studio memerlukan koneksi Taiga aktif untuk memilih project, sprint/taskboard, dan submit User Story atau Task ke Taiga.'
            }
            action={
              <div className='flex items-center gap-2.5 flex-wrap'>
                <Link href='/settings' className='btn btn-primary no-underline'>
                  <Settings size={15} />
                  <span>Konfigurasi Taiga di Pengaturan</span>
                </Link>
                <button
                  type='button'
                  className='btn btn-ghost border border-(--border) gap-1.5'
                  onClick={() => {
                    refreshIntegrations(true);
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Periksa Ulang Status</span>
                </button>
              </div>
            }
          />
        ) : taskState.loadingMeta && !taskState.meta ? (
          <SmartTaskSkeleton />
        ) : (
          <>
            <SmartTaskWorkspaceBar
              meta={taskState.meta}
              loadingMeta={taskState.loadingMeta}
              projectSlug={taskState.projectSlug}
              sprintSlug={taskState.sprintSlug}
              onProjectChange={(slug) =>
                taskState.handleProjectChange(slug, () =>
                  taskState.setParentId(null),
                )
              }
              onSprintChange={(slug) =>
                taskState.handleSprintChange(slug, () =>
                  taskState.setParentId(null),
                )
              }
            />

            <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6.2fr)] gap-7 items-start'>
              <SmartTaskInputArea
                activeTab={taskState.activeTab}
                setActiveTab={taskState.setActiveTab}
                mode={taskState.mode}
                setMode={taskState.setMode}
                parentId={taskState.parentId}
                setParentId={taskState.setParentId}
                meta={taskState.meta}
                input={taskState.input}
                setInput={taskState.setInput}
                parsing={taskState.parsing}
                parseError={taskState.parseError}
                onParse={taskState.parse}
                bulkPasteInput={taskState.bulkPasteInput}
                setBulkPasteInput={taskState.setBulkPasteInput}
                onBulkPasteAdd={taskState.handleBulkPasteAdd}
              />

              <SmartTaskDraftsSection
                drafts={taskState.drafts}
                selectedDrafts={taskState.selectedDrafts}
                allSelected={taskState.allSelected}
                totalHours={taskState.totalHours}
                invalid={taskState.invalid}
                submitting={taskState.submitting}
                submitProgress={taskState.submitProgress}
                results={taskState.results}
                parsing={taskState.parsing}
                meta={taskState.meta}
                parentId={taskState.parentId}
                statusesFor={taskState.statusesFor}
                onAddBlank={taskState.addBlank}
                onSubmit={taskState.submit}
                onToggleSelectAll={taskState.toggleSelectAll}
                onBulkSetUserStory={taskState.bulkSetUserStory}
                onBulkSetStatus={taskState.bulkSetStatus}
                onBulkSetDate={taskState.bulkSetDate}
                onBulkSetStartTime={taskState.bulkSetStartTime}
                onBulkDeleteSelected={taskState.bulkDeleteSelected}
                onUpdateDraft={taskState.updateDraft}
                onRemoveDraft={taskState.removeDraft}
                onUseExample={(text) => {
                  taskState.setInput(text);
                  taskState.setActiveTab('smart');
                }}
              />
            </div>
          </>
        ))}
    </>
  );
}
