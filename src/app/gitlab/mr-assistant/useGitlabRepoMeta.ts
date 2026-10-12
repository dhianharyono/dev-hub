import { useState, useEffect } from 'react';
import type { GitLabProjectSummary } from '@/app/api/gitlab/projects/route';
import type { GitLabBranchSummary } from '@/app/api/gitlab/branches/route';
import type { GitLabMemberSummary } from '@/app/api/gitlab/members/route';

export function useGitlabRepoMeta() {
  const [projects, setProjects] = useState<GitLabProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [branches, setBranches] = useState<GitLabBranchSummary[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branch, setBranch] = useState('feature/dev');
  const [targetBranch, setTargetBranch] = useState('main');

  const [members, setMembers] = useState<GitLabMemberSummary[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | ''>('');
  const [selectedReviewerId, setSelectedReviewerId] = useState<number | ''>('');

  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      setLoadingProjects(true);
      try {
        const res = await fetch('/api/gitlab/projects');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data?.projects)) {
            setProjects(data.projects);
            if (data.projects.length > 0) {
              const first = data.projects[0];
              setSelectedProjectId(first.id);
              setTargetBranch(first.defaultBranch || 'main');
            }
          }
        }
      } catch {
        // Silently preserve manual fallback
      } finally {
        if (isMounted) setLoadingProjects(false);
      }
    }
    loadProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    let isMounted = true;

    async function loadBranches() {
      setLoadingBranches(true);
      try {
        const res = await fetch(`/api/gitlab/branches?projectId=${selectedProjectId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data?.branches)) {
            setBranches(data.branches);
            const nonDefault = data.branches.find((b: GitLabBranchSummary) => !b.default);
            if (nonDefault) setBranch(nonDefault.name);
          }
        }
      } catch {
        // Graceful error
      } finally {
        if (isMounted) setLoadingBranches(false);
      }
    }

    async function loadMembers() {
      setLoadingMembers(true);
      try {
        const res = await fetch(`/api/gitlab/members?projectId=${selectedProjectId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data?.members)) {
            setMembers(data.members);
            if (data?.currentUser?.id) {
              const matching = data.members.find((m: GitLabMemberSummary) => m.id === data.currentUser.id);
              if (matching) setSelectedAssigneeId(matching.id);
            }
          }
        }
      } catch {
        // Silently preserve manual fallback
      } finally {
        if (isMounted) setLoadingMembers(false);
      }
    }

    loadBranches();
    loadMembers();
    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

  const handleReloadMembers = async () => {
    if (!selectedProjectId) return;
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/gitlab/members?projectId=${selectedProjectId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.members)) setMembers(data.members);
      }
    } catch {
      // Silently preserve manual fallback
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleBranchChange = (newBranch: string) => {
    setBranch(newBranch);
  };

  return {
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
    members,
    loadingMembers,
    selectedAssigneeId,
    setSelectedAssigneeId,
    selectedReviewerId,
    setSelectedReviewerId,
    handleReloadMembers,
    handleBranchChange,
  };
}
