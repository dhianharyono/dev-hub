import { useState, useEffect } from 'react';
import type { GitLabProjectSummary } from '@/app/api/gitlab/projects/route';
import type { GitLabBranchSummary } from '@/app/api/gitlab/branches/route';
import type { GitLabMemberSummary } from '@/app/api/gitlab/members/route';

export function useGitlabRepoMeta() {
  const [projects, setProjects] = useState<GitLabProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectIdState] = useState<number | ''>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('devhub_mr_project');
      if (saved && !isNaN(Number(saved))) return Number(saved);
    }
    return '';
  });
  const [branches, setBranches] = useState<GitLabBranchSummary[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branch, setBranchState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('devhub_mr_branch');
      if (saved) return saved;
    }
    return 'feature/dev';
  });
  const [targetBranch, setTargetBranchState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('devhub_mr_target_branch');
      if (saved) return saved;
    }
    return 'main';
  });

  const [members, setMembers] = useState<GitLabMemberSummary[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeIdState] = useState<number | ''>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('devhub_mr_assignee');
      if (saved && !isNaN(Number(saved))) return Number(saved);
    }
    return '';
  });
  const [selectedReviewerId, setSelectedReviewerIdState] = useState<number | ''>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('devhub_mr_reviewer');
      if (saved && !isNaN(Number(saved))) return Number(saved);
    }
    return '';
  });

  const setSelectedProjectId = (newId: number | '') => {
    setSelectedProjectIdState(newId);
    if (typeof window !== 'undefined') {
      if (newId) sessionStorage.setItem('devhub_mr_project', String(newId));
      else sessionStorage.removeItem('devhub_mr_project');
    }
  };

  const setBranch = (newBranch: string | ((prev: string) => string)) => {
    setBranchState((prev) => {
      const resolved = typeof newBranch === 'function' ? newBranch(prev) : newBranch;
      if (typeof window !== 'undefined' && resolved) {
        sessionStorage.setItem('devhub_mr_branch', resolved);
      }
      return resolved;
    });
  };

  const setTargetBranch = (newTarget: string | ((prev: string) => string)) => {
    setTargetBranchState((prev) => {
      const resolved = typeof newTarget === 'function' ? newTarget(prev) : newTarget;
      if (typeof window !== 'undefined' && resolved) {
        sessionStorage.setItem('devhub_mr_target_branch', resolved);
      }
      return resolved;
    });
  };

  const setSelectedAssigneeId = (newId: number | '') => {
    setSelectedAssigneeIdState(newId);
    if (typeof window !== 'undefined') {
      if (newId) sessionStorage.setItem('devhub_mr_assignee', String(newId));
      else sessionStorage.removeItem('devhub_mr_assignee');
    }
  };

  const setSelectedReviewerId = (newId: number | '') => {
    setSelectedReviewerIdState(newId);
    if (typeof window !== 'undefined') {
      if (newId) sessionStorage.setItem('devhub_mr_reviewer', String(newId));
      else sessionStorage.removeItem('devhub_mr_reviewer');
    }
  };

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
              setSelectedProjectIdState((prevId) => {
                if (prevId && data.projects.some((p: GitLabProjectSummary) => p.id === prevId)) {
                  return prevId;
                }
                const first = data.projects[0];
                setTargetBranchState((prevTarget) => {
                  if (prevTarget && prevTarget !== 'main') return prevTarget;
                  return first.defaultBranch || 'main';
                });
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('devhub_mr_project', String(first.id));
                }
                return first.id;
              });
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
            setBranch((prevBranch) => {
              if (prevBranch && data.branches.some((b: GitLabBranchSummary) => b.name === prevBranch)) {
                return prevBranch;
              }
              const nonDefault = data.branches.find((b: GitLabBranchSummary) => !b.default);
              return nonDefault?.name || data.branches[0]?.name || prevBranch;
            });
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
              if (matching) {
                setSelectedAssigneeIdState((prev) => prev || matching.id);
              }
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
