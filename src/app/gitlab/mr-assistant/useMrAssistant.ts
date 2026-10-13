import { useState } from 'react';
import type { MrResult, CreatedMr } from './types';
import { useGitlabRepoMeta } from './useGitlabRepoMeta';
import { useTaigaMeta } from './useTaigaMeta';
import { useNotification } from '@/components/Notification';

export function useMrAssistant() {
  const { notify } = useNotification();
  const gitlabMeta = useGitlabRepoMeta();
  const taigaMeta = useTaigaMeta();

  // Generation & Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MrResult | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');

  // Edit States for MR Draft (Judul & Ringkasan)
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingRelease, setIsEditingRelease] = useState(false);
  const [editedRelease, setEditedRelease] = useState('');

  // Direct GitLab MR Creation States
  const [creatingMr, setCreatingMr] = useState(false);
  const [createMrError, setCreateMrError] = useState<string | null>(null);
  const [createdMr, setCreatedMr] = useState<CreatedMr | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setCreatedMr(null);
    setCreateMrError(null);
    setIsEditingTitle(false);
    setIsEditingRelease(false);
    setEditedTitle('');
    setEditedRelease('');

    const foundStory = taigaMeta.selectedStoryRef
      ? taigaMeta.userStories.find((s) => s.ref === taigaMeta.selectedStoryRef)
      : null;
    const foundTask = taigaMeta.selectedTaskRef
      ? taigaMeta.tasks.find((t) => t.ref === taigaMeta.selectedTaskRef)
      : null;
    const assigneeMember = gitlabMeta.selectedAssigneeId
      ? gitlabMeta.members.find((m) => m.id === gitlabMeta.selectedAssigneeId)
      : null;
    const reviewerMember = gitlabMeta.selectedReviewerId
      ? gitlabMeta.members.find((m) => m.id === gitlabMeta.selectedReviewerId)
      : null;

    let ticketType: 'task' | 'story' | 'both' | null = null;
    if (foundTask && foundStory) ticketType = 'both';
    else if (foundTask) ticketType = 'task';
    else if (foundStory) ticketType = 'story';

    let diff = '';
    let commits: string[] = [];
    if (gitlabMeta.selectedProjectId && gitlabMeta.branch && gitlabMeta.targetBranch) {
      try {
        const compareRes = await fetch(
          `/api/gitlab/compare?projectId=${gitlabMeta.selectedProjectId}&from=${encodeURIComponent(gitlabMeta.targetBranch)}&to=${encodeURIComponent(gitlabMeta.branch)}`,
        );
        const compareData = await compareRes.json();
        if (compareRes.ok && compareData.ok) {
          diff = compareData.diff || '';
          commits = compareData.commits || [];
        }
      } catch (err) {
        console.warn('Gagal memuat diff otomatis:', err);
      }
    }

    const effectiveTitle =
      foundTask?.subject ||
      foundStory?.subject ||
      gitlabMeta.branch.replace(/^(feature|feat|fix|bugfix|chore|refactor)\//i, '').replace(/[-_]/g, ' ') ||
      'Pembaruan implementasi kode';

    try {
      const res = await fetch('/api/gitlab/mr-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: effectiveTitle,
          branch: gitlabMeta.branch,
          targetBranch: gitlabMeta.targetBranch,
          diff,
          commits,
          targetStoryRef: foundStory?.ref ?? null,
          targetStorySubject: foundStory?.subject ?? null,
          targetTaskRef: foundTask?.ref ?? null,
          targetTaskSubject: foundTask?.subject ?? null,
          ticketType,
          assignee: assigneeMember ? `${assigneeMember.name} (@${assigneeMember.username})` : null,
          reviewer: reviewerMember ? `${reviewerMember.name} (@${reviewerMember.username})` : null,
          projectSlug: taigaMeta.selectedTaigaProject || 'SPC',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal membuat draf Merge Request');

      setResult({
        mrTitle: json.mrTitle,
        description: json.description,
        releaseNotes: json.releaseNotes,
        source: json.source,
      });
      notify.success('Draf deskripsi Merge Request berhasil digenerate.', 'Draf Siap');
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      notify.error(msg, 'Gagal Membuat Draf MR');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMr = async () => {
    if (!gitlabMeta.selectedProjectId || !result) return;
    setCreatingMr(true);
    setCreateMrError(null);
    try {
      const res = await fetch('/api/gitlab/mr-assistant/create-mr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: gitlabMeta.selectedProjectId,
          sourceBranch: gitlabMeta.branch,
          targetBranch: gitlabMeta.targetBranch,
          title: result.mrTitle,
          description: result.description,
          removeSourceBranch: true,
          assigneeId: gitlabMeta.selectedAssigneeId ? Number(gitlabMeta.selectedAssigneeId) : null,
          reviewerId: gitlabMeta.selectedReviewerId ? Number(gitlabMeta.selectedReviewerId) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Gagal membuat Merge Request di GitLab');
      setCreatedMr(data.mr);
      notify.success(`Merge Request !${data.mr.iid} berhasil dibuat di GitLab!`, 'MR Terbuat');
    } catch (e) {
      const msg = (e as Error).message;
      setCreateMrError(msg);
      notify.error(msg, 'Gagal Membuat MR');
    } finally {
      setCreatingMr(false);
    }
  };

  return {
    ...gitlabMeta,
    ...taigaMeta,
    loading,
    error,
    result,
    setResult,
    activeTab,
    setActiveTab,
    isEditingTitle,
    setIsEditingTitle,
    editedTitle,
    setEditedTitle,
    isEditingRelease,
    setIsEditingRelease,
    editedRelease,
    setEditedRelease,
    creatingMr,
    createMrError,
    createdMr,
    handleGenerate,
    handleCreateMr,
  };
}
