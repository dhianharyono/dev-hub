'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  GitPullRequest,
  ShieldCheck,
  MessageSquareCode,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { useSync, useMetrics, useIntegrations } from '@/components/hooks';
import { triggerTelemetryRefresh } from '@/components/SidebarTelemetry';
import { useAppMode } from '@/components/AppModeContext';
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
import { ProductivityDashboard } from './productivity/ProductivityDashboard';

export default function GitlabDashboard() {
  const { isMonitoring } = useAppMode();
  const [days, setDays] = useState(0);
  const [activeView, setActiveView] = useState<GitlabActiveView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as GitlabActiveView;
      if (tab && ['productivity', 'mr_assistant', 'pre_review', 'incoming_reviews'].includes(tab)) {
        return tab;
      }
    }
    return 'productivity';
  });
  const { data, error, reload } = useMetrics(days);
  const {
    integrations,
    loading: loadingIntegrations,
    refresh: refreshIntegrations,
  } = useIntegrations();
  const handleSyncDone = useCallback(() => {
    reload();
    refreshIntegrations(true);
    triggerTelemetryRefresh();
  }, [reload, refreshIntegrations]);
  const { status, start } = useSync(handleSyncDone);
  const { restoreTarget, minimizeAllRunning } = useAiTask();

  const isGitlabConnected = Boolean(integrations?.gitlab?.connected);
  const { notify } = useNotification();

  // Reset to initial tab ('productivity') when navigating to Productivity Monitor menu
  useEffect(() => {
    const handleReset = () => {
      setActiveView('productivity');
    };
    window.addEventListener('devhub:gitlab-reset-tab', handleReset);
    return () => window.removeEventListener('devhub:gitlab-reset-tab', handleReset);
  }, []);

  // Switch tab view if restoreTarget is requested from dock
  useEffect(() => {
    if (restoreTarget?.view === 'mr_assistant' || restoreTarget?.type === 'mr_assistant') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveView('mr_assistant');
    } else if (restoreTarget?.view === 'pre_review' || restoreTarget?.type === 'pre_review') {
      setActiveView('pre_review');
    } else if (restoreTarget?.mr || restoreTarget?.type === 'mr_review') {
      setActiveView('incoming_reviews');
    }
  }, [restoreTarget]);

  const handleViewChange = (newView: GitlabActiveView) => {
    if (newView !== activeView) {
      minimizeAllRunning();
      setActiveView(newView);
    }
  };

  useEffect(() => {
    if (error && isGitlabConnected) {
      notify.error(error, 'GitLab Productivity');
    }
  }, [error, isGitlabConnected, notify]);

  return (
    <>
      {isMonitoring && (
        <div className='flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs mb-4'>
          <div className='flex items-center gap-2 min-w-0'>
            <AlertCircle size={16} className='text-purple-600 shrink-0' />
            <span className='truncate sm:whitespace-normal'>
              <strong>Mode Monitoring Aktif:</strong> Menu Productivity Monitor disembunyikan untuk tim non-developer. Anda dapat beralih ke Mode Developer di Pengaturan.
            </span>
          </div>
          <Link
            href='/settings'
            className='btn btn-secondary btn-xs shrink-0 no-underline whitespace-nowrap'
          >
            Pengaturan Mode
          </Link>
        </div>
      )}

      <GitlabHeaderTabs
        activeView={activeView}
        onViewChange={handleViewChange}
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

      {activeView === 'productivity' && <ProductivityDashboard days={days} />}
    </>
  );
}

export { ProductivityDashboard as Dashboard };
