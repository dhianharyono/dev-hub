import { useState, useEffect } from 'react';
import type { GitLabProjectSummary } from '@/app/api/gitlab/projects/route';
import type { GitLabBranchSummary } from '@/app/api/gitlab/branches/route';
import type { PreReviewOutput, AuditStats } from './types';
import { useNotification } from '@/components/Notification';
import { useAiTask } from '@/components/ai-task/AiTaskContext';

export function usePreReview() {
  const { notify } = useNotification();
  const { runAiTask, getTask, minimizeTask, dismissTask, tasks, restoreTarget, clearRestoreTarget } = useAiTask();
  const [projects, setProjects] = useState<GitLabProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');

  const [branches, setBranches] = useState<GitLabBranchSummary[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [branch, setBranch] = useState('feature/dev');
  const [targetBranch, setTargetBranch] = useState('main');
  const [context, setContext] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreReviewOutput | null>(null);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);

  const [copiedFullReview, setCopiedFullReview] = useState(false);

  // Cari task pre_review yang aktif atau yang terakhir selesai
  const preReviewTask =
    Object.values(tasks)
      .filter((t) => t.type === 'pre_review')
      .sort((a, b) => b.startedAt - a.startedAt)[0] || null;

  const taskId =
    preReviewTask?.id ||
    `pre-review-${selectedProjectId || 'default'}-${branch || 'default'}`;
  const currentTask = preReviewTask || getTask(taskId);
  const isGenerating = loading || currentTask?.status === 'running';

  // Sync background result
  useEffect(() => {
    if (currentTask?.status === 'completed' && currentTask.result && !result) {
      const resData = currentTask.result as { preReview: PreReviewOutput; auditStats?: AuditStats };
      if (resData.preReview) {
        setResult(resData.preReview);
        if (resData.auditStats) setAuditStats(resData.auditStats);
      } else {
        setResult(resData as unknown as PreReviewOutput);
      }
    }
  }, [currentTask, result]);

  // Sync restore target branch & project jika dipulihkan dari dock
  useEffect(() => {
    if (restoreTarget?.type === 'pre_review') {
      if (restoreTarget.branch && branch !== restoreTarget.branch) {
        setBranch(restoreTarget.branch);
      }
      if (restoreTarget.projectId && selectedProjectId !== restoreTarget.projectId) {
        setSelectedProjectId(Number(restoreTarget.projectId) || '');
      }
      clearRestoreTarget();
    }
  }, [restoreTarget, branch, selectedProjectId, clearRestoreTarget]);

  const handleMinimize = () => {
    if (taskId) {
      minimizeTask(taskId);
    }
  };

  // Load GitLab Projects on mount
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

  // Load Branches when selectedProjectId changes
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
            if (nonDefault) {
              setBranch(nonDefault.name);
            }
          }
        }
      } catch {
        // Graceful error
      } finally {
        if (isMounted) setLoadingBranches(false);
      }
    }
    loadBranches();

    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

  const handleReview = async () => {
    if (!selectedProjectId || !branch || !targetBranch) {
      const msg = 'Pilih project, branch yang ingin di-review, dan target branch.';
      setError(msg);
      notify.warning(msg, 'Form Belum Lengkap');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setAuditStats(null);

    try {
      const auditResult = await runAiTask<{ preReview: PreReviewOutput; auditStats: AuditStats }>({
        id: taskId,
        type: 'pre_review',
        title: `Review Code: ${branch}`,
        subtitle: `Project ID: ${selectedProjectId} → ${targetBranch}`,
        initialStep: 'Mengambil data perbandingan branch & commit dari GitLab...',
        notifyOnComplete: false,
        params: {
          projectId: selectedProjectId,
          branch,
          targetBranch,
        },
        runner: async (updateStep, signal) => {
          // 1. Fetch compare diff from GitLab
          const compareRes = await fetch(
            `/api/gitlab/compare?projectId=${selectedProjectId}&from=${encodeURIComponent(targetBranch)}&to=${encodeURIComponent(branch)}`,
            { signal },
          );
          const compareData = await compareRes.json();
          if (!compareRes.ok || !compareData.ok) {
            throw new Error(compareData.error || 'Gagal mengambil data perbandingan branch dari GitLab');
          }

          if (!compareData.diff || compareData.diff.trim().length === 0) {
            throw new Error(
              `Tidak ada perbedaan kode antara branch "${branch}" dan "${targetBranch}". Pastikan ada commit baru pada branch ini.`,
            );
          }

          const stats: AuditStats = {
            commitsCount: compareData.commitsCount,
            filesCount: compareData.filesCount,
          };

          updateStep('Menganalisis checklist senior review & celah keamanan...', 65);

          // 2. Run Pre-Review audit via AI
          const res = await fetch('/api/gitlab/pre-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              codeOrDiff: compareData.diff,
              language: 'Auto-detect',
              context: context || `Review branch ${branch} ke ${targetBranch}`,
            }),
            signal,
          });

          const json = await res.json();
          if (!res.ok || !json.ok) {
            throw new Error(json.error || 'Gagal menjalankan pre-review');
          }

          updateStep('Hasil audit selesai disintesis.', 100);

          return {
            preReview: json,
            auditStats: stats,
          };
        },
      });

      setResult(auditResult.preReview);
      setAuditStats(auditResult.auditStats);
      notify.success(
        `Audit kode branch ${branch} selesai (${auditResult.preReview.score}/100)!`,
        'Pre-Review Selesai',
      );
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        const msg = (e as Error).message;
        setError(msg);
        notify.error(msg, 'Pre-Review Gagal');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFullReviewForIde = () => {
    if (!result) return '';
    const selectedProj = projects.find((p) => p.id === selectedProjectId);
    const projectName = selectedProj?.pathWithNamespace || selectedProj?.name || 'Project';

    let md = `# Hasil Pre-Review Code & Security Health Check\n\n`;
    md += `**Proyek:** ${projectName}\n`;
    md += `**Branch:** \`${branch}\` → \`${targetBranch}\`\n`;
    md += `**Skor Kesehatan:** ${result.score}/100 (${result.verdict})\n\n`;
    md += `## Ringkasan Eksekutif\n${result.summary}\n\n`;

    if (result.checklist && result.checklist.length > 0) {
      md += `## Evaluasi Kategori Checklist\n`;
      result.checklist.forEach((c) => {
        const badge = c.status === 'pass' ? '✅ PASS' : c.status === 'warn' ? '⚠️ WARN' : '🛑 BLOCK';
        md += `- **${c.label} (${c.category}):** [${badge}] ${c.notes}\n`;
      });
      md += `\n`;
    }

    if (result.findings && result.findings.length > 0) {
      md += `## Daftar Temuan Masalah & Rekomendasi (${result.findings.length} temuan)\n\n`;
      result.findings.forEach((f, idx) => {
        const sevEmoji =
          f.severity === 'blocking'
            ? '🔴 BLOCKING'
            : f.severity === 'important'
              ? '🟡 IMPORTANT'
              : f.severity === 'nit'
                ? '🟢 NIT'
                : '💡 SUGGESTION';
        md += `### ${idx + 1}. [${sevEmoji}] ${f.title}\n`;
        md += `- **Kategori:** ${f.category}\n`;
        if (f.file) md += `- **File:** \`${f.file}${f.line ? `:${f.line}` : ''}\`\n`;
        md += `- **Deskripsi:** ${f.description}\n`;
        if (f.suggestionSnippet) {
          md += `- **Rekomendasi Perbaikan:**\n\`\`\`\n${f.suggestionSnippet}\n\`\`\`\n`;
        }
        md += `\n`;
      });
    } else {
      md += `*Tidak ada temuan blocking atau perbaikan kritis yang terdeteksi.*\n\n`;
    }

    md += `## Instruksi Perbaikan untuk AI Assistant / IDE:\n`;
    md += `Mohon analisis daftar temuan di atas dan lakukan perbaikan pada file-file kode terkait secara terstruktur dan aman.\n`;

    return md;
  };

  const handleCopyFullReview = () => {
    const text = formatFullReviewForIde();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedFullReview(true);
    notify.info('Laporan audit berhasil disalin ke clipboard', 'Tersalin');
    setTimeout(() => setCopiedFullReview(false), 2500);
  };

  const handleClearResult = () => {
    setResult(null);
    setAuditStats(null);
    setError(null);
    if (taskId) {
      dismissTask(taskId);
    }
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
    context,
    setContext,
    loading: isGenerating,
    isGenerating,
    handleMinimize,
    error,
    result,
    auditStats,
    copiedFullReview,
    handleReview,
    handleCopyFullReview,
    handleClearResult,
  };
}
