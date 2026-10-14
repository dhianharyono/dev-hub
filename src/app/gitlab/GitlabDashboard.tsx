'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitBranch,
  GitPullRequest,
  ShieldCheck,
  MessageSquareCode,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { useSync, useMetrics, useIntegrations } from '@/components/hooks';
import { EmptyState } from '@/components/EmptyState';
import { useNotification } from '@/components/Notification';
import { useAiTask } from '@/components/ai-task/AiTaskContext';
import { MrAssistantCard } from './MrAssistantCard';
import { PreReviewCard } from './PreReviewCard';
import { IncomingReviewsCard } from './IncomingReviewsCard';
import {
  GitlabHeaderTabs,
  type GitlabActiveView,
} from './productivity/GitlabHeaderTabs';
import { GitlabSyncPanel } from './productivity/GitlabSyncPanel';
import { GitlabSkeletonGrid } from './productivity/GitlabSkeletonGrid';
import { ProductivityDashboard } from './productivity/ProductivityDashboard';

export default function GitlabDashboard() {
  const [days, setDays] = useState(90);
  const [activeView, setActiveView] =
    useState<GitlabActiveView>('productivity');
  const { data, loading, error, reload } = useMetrics(days);
  const { status, start } = useSync(reload);
  const { integrations, loading: loadingIntegrations, refresh: refreshIntegrations } = useIntegrations();
  const { restoreTarget, clearRestoreTarget, minimizeAllRunning } = useAiTask();

  const isGitlabConnected = Boolean(integrations?.gitlab?.connected);
  const gitlabError = integrations?.gitlab?.error;
  const { notify } = useNotification();

  // Switch tab view if restoreTarget is requested from dock
  useEffect(() => {
    if (restoreTarget?.view === 'mr_assistant' || restoreTarget?.type === 'mr_assistant') {
      setActiveView('mr_assistant');
      clearRestoreTarget();
    } else if (restoreTarget?.view === 'pre_review' || restoreTarget?.type === 'pre_review') {
      setActiveView('pre_review');
      clearRestoreTarget();
    } else if (restoreTarget?.mr || restoreTarget?.type === 'mr_review') {
      setActiveView('incoming_reviews');
      // note: don't clear immediately because IncomingReviewsCard needs to open the modal
    }
  }, [restoreTarget, clearRestoreTarget]);

  useEffect(() => {
    if (error && isGitlabConnected) {
      notify.error(error, 'GitLab Productivity');
    }
  }, [error, isGitlabConnected, notify]);

  const empty =
    data &&
    data.kpis.commits === 0 &&
    data.kpis.mrsCreated === 0 &&
    !data.lastSync;

  return (
    <>
      <GitlabHeaderTabs
        activeView={activeView}
        onViewChange={(newView) => {
          if (newView !== activeView) {
            minimizeAllRunning();
            setActiveView(newView);
          }
        }}
        days={days}
        onDaysChange={setDays}
        data={data}
        isSyncing={status?.running}
        onSync={() => start(days > 180 ? days : 180)}
        connected={isGitlabConnected}
      />

      <GitlabSyncPanel key={status?.startedAt || 'idle'} status={status} />

      {activeView === 'mr_assistant' &&
        (!loadingIntegrations && !isGitlabConnected ? (
          <EmptyState
            tone='rose'
            icon={<GitPullRequest size={26} strokeWidth={2.2} />}
            title='Layanan GitLab Tidak Terhubung'
            description='Fitur AI MR Assistant memerlukan koneksi GitLab aktif untuk memilih repository, membaca riwayat commit, dan membuat Merge Request secara otomatis.'
            action={
              <Link
                href='/settings'
                className='btn btn-primary no-underline'
              >
                <Settings size={15} />
                <span>Konfigurasi GitLab di Pengaturan</span>
              </Link>
            }
          />
        ) : (
          <MrAssistantCard />
        ))}

      {activeView === 'pre_review' &&
        (!loadingIntegrations && !isGitlabConnected ? (
          <EmptyState
            tone='rose'
            icon={<ShieldCheck size={26} strokeWidth={2.2} />}
            title='Layanan GitLab Tidak Terhubung'
            description='Fitur AI Review Code & Audit Keamanan memerlukan koneksi GitLab aktif untuk menginspeksi diff kode branch repository.'
            action={
              <Link
                href='/settings'
                className='btn btn-primary no-underline'
              >
                <Settings size={15} />
                <span>Konfigurasi GitLab di Pengaturan</span>
              </Link>
            }
          />
        ) : (
          <PreReviewCard />
        ))}

      {activeView === 'incoming_reviews' &&
        (!loadingIntegrations && !isGitlabConnected ? (
          <EmptyState
            tone='rose'
            icon={<MessageSquareCode size={26} strokeWidth={2.2} />}
            title='Layanan GitLab Tidak Terhubung'
            description='Fitur AI Review MR memerlukan koneksi GitLab aktif untuk memuat daftar Merge Request tim dan mengirim ulasan otomatis.'
            action={
              <Link
                href='/settings'
                className='btn btn-primary no-underline'
              >
                <Settings size={15} />
                <span>Konfigurasi GitLab di Pengaturan</span>
              </Link>
            }
          />
        ) : (
          <IncomingReviewsCard />
        ))}

      {activeView === 'productivity' && (
        <>
          {(loadingIntegrations || (loading && !data)) && (
            <GitlabSkeletonGrid />
          )}

          {!loadingIntegrations && !isGitlabConnected && (
            <EmptyState
              tone='rose'
              icon={<GitBranch size={26} strokeWidth={2.2} />}
              title='Layanan GitLab Tidak Terhubung'
              description={
                gitlabError
                  ? `${gitlabError}. Hubungkan Personal Access Token (PAT) GitLab di menu Pengaturan untuk melacak produktivitas, sinkronisasi commit, merge request, dan evaluasi kualitas rekayasa kode.`
                  : 'Hubungkan Personal Access Token (PAT) GitLab di menu Pengaturan untuk melacak produktivitas, sinkronisasi commit, merge request, dan evaluasi kualitas rekayasa kode.'
              }
              action={
                <div className='flex items-center gap-2.5 flex-wrap'>
                  <Link
                    href='/settings'
                    className='btn btn-primary no-underline'
                    id='btn-gl-settings'
                  >
                    <Settings size={15} />
                    <span>Konfigurasi GitLab di Pengaturan</span>
                  </Link>
                  <button
                    type='button'
                    className='btn btn-ghost border border-border gap-1.5'
                    onClick={() => refreshIntegrations(true)}
                  >
                    <RefreshCw size={14} />
                    <span>Periksa Ulang Status</span>
                  </button>
                </div>
              }
            />
          )}

          {!loadingIntegrations && isGitlabConnected && empty && (
            <EmptyState
              tone='blue'
              icon={<GitBranch size={26} strokeWidth={2.2} />}
              title='Belum Ada Data Sinkronisasi GitLab'
              description='Layanan GitLab telah terhubung, namun data commit dan merge request untuk rentang waktu ini belum pernah disinkronkan ke database lokal.'
              action={
                <button
                  type='button'
                  className='btn btn-primary'
                  onClick={() => start(days > 180 ? days : 180)}
                  disabled={status?.running}
                >
                  {status?.running
                    ? 'Sedang Sinkron...'
                    : 'Mulai Sinkronkan Sekarang'}
                </button>
              }
            />
          )}

          {!loadingIntegrations && isGitlabConnected && data && !empty && (
            <ProductivityDashboard data={data} />
          )}
        </>
      )}
    </>
  );
}

export { ProductivityDashboard as Dashboard };
