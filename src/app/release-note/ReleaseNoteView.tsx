'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Notification, useNotification } from '@/components/Notification';
import { ReleaseNoteHistory } from './ReleaseNoteHistory';
import { ReleaseNotePicker } from './ReleaseNotePicker';
import { ReleaseNoteResults } from './ReleaseNoteResults';
import type {
  ReleaseNoteProjectOption,
  ReleaseNoteResultDraft,
} from './types';
import type {
  ReleaseNoteMr,
  ReleaseNoteResult,
  SavedReleaseNote,
} from '@/lib/release-note/types';

interface ReleaseNoteViewProps {
  defaultSince: string;
  defaultUntil: string;
}

interface ProjectPayload {
  id: number;
  name: string;
  pathWithNamespace: string;
}

interface SearchResponse {
  ok?: boolean;
  error?: string;
  project?: ProjectPayload;
  candidates?: ReleaseNoteMr[];
}

interface GenerateResponse {
  ok?: boolean;
  error?: string;
  project?: ProjectPayload;
  result?: ReleaseNoteResult;
}

const PROJECT_STORAGE_KEY = 'devhub:release-note:project-id';

function readField(content: string, label: string): string | null {
  const match = content.match(new RegExp(`^${label}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

export function ReleaseNoteView({
  defaultSince,
  defaultUntil,
}: ReleaseNoteViewProps) {
  const { notify } = useNotification();
  const [projects, setProjects] = useState<ReleaseNoteProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(0);
  const [branches, setBranches] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [targetBranch, setTargetBranch] = useState('');

  const [releaseTitle, setReleaseTitle] = useState('');
  const [since, setSince] = useState(defaultSince);
  const [until, setUntil] = useState(defaultUntil);
  const [databaseName, setDatabaseName] = useState('padi_transactions');

  const [loading, setLoading] = useState(false);
  const [mrsError, setMrsError] = useState<string | null>(null);

  const [result, setResult] = useState<ReleaseNoteResultDraft | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<SavedReleaseNote[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<SavedReleaseNote | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch('/api/gitlab/projects')
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        if (!data.ok) {
          throw new Error(data.error || 'Gagal memuat daftar project.');
        }
        const list: ReleaseNoteProjectOption[] = data.projects || [];
        setProjects(list);
        const stored = Number(
          window.localStorage.getItem(PROJECT_STORAGE_KEY) || 0,
        );
        const preferred =
          list.find((project) => project.id === stored) ??
          list.find((project) =>
            /dashboard-developer/i.test(project.pathWithNamespace),
          ) ??
          list[0];
        if (preferred) {
          setProjectId((prev) => prev || preferred.id);
          setBranchesLoading(true);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setProjectsError(
            (err as Error).message || 'Gagal memuat daftar project.',
          );
        }
      })
      .finally(() => {
        if (!ignore) setProjectsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let ignore = false;
    fetch(`/api/gitlab/branches?projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        if (!data.ok) throw new Error(data.error || 'Gagal memuat branch.');
        const names: string[] = (data.branches || [])
          .map((branch: { name?: unknown }) => branch.name)
          .filter((name: unknown): name is string => typeof name === 'string');
        setBranches(names);
        const preferred = names.includes('release')
          ? 'release'
          : names.includes('master')
            ? 'master'
            : '';
        setTargetBranch(preferred);
      })
      .catch(() => {
        if (!ignore) {
          setBranches([]);
          setTargetBranch('');
        }
      })
      .finally(() => {
        if (!ignore) setBranchesLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [projectId]);

  useEffect(() => {
    let ignore = false;
    fetch('/api/release-notes', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        if (!data.ok) throw new Error(data.error || 'Gagal memuat riwayat.');
        setHistory(data.notes || []);
        setHistoryError(null);
      })
      .catch((err) => {
        if (!ignore) {
          setHistoryError((err as Error).message || 'Gagal memuat riwayat.');
        }
      })
      .finally(() => {
        if (!ignore) setLoadingHistory(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/release-notes', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal memuat riwayat.');
      }
      setHistory(data.notes || []);
      setHistoryError(null);
    } catch (err) {
      setHistoryError((err as Error).message || 'Gagal memuat riwayat.');
    }
  };

  const persistProject = (id: number) => {
    try {
      window.localStorage.setItem(PROJECT_STORAGE_KEY, String(id));
    } catch {
      // localStorage can be unavailable in private mode; ignore.
    }
  };

  const resetResult = () => {
    setResult(null);
  };

  const handleProjectChange = (id: number) => {
    setProjectId(id);
    persistProject(id);
    setMrsError(null);
    setBranchesLoading(true);
    setTargetBranch('');
    setBranches([]);
    resetResult();
  };

  const handleSearch = async () => {
    if (!projectId) {
      notify.warning('Pilih project GitLab terlebih dahulu.');
      return;
    }
    if (!since || !until) {
      notify.warning('Isi rentang tanggal merge.');
      return;
    }
    if (!releaseTitle.trim()) {
      notify.warning('Isi Judul Release terlebih dahulu.');
      return;
    }

    const project = projects.find((item) => item.id === projectId);
    setLoading(true);
    setMrsError(null);
    setGenerateError(null);
    setResult(null);

    let list: ReleaseNoteMr[] = [];
    try {
      const res = await fetch('/api/gitlab/release-note/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: releaseTitle.trim(),
          since,
          until,
          targetBranch: targetBranch || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal mencari MR.');
      }
      list = (data as SearchResponse).candidates ?? [];
    } catch (err) {
      setMrsError((err as Error).message || 'Gagal mencari MR.');
      setLoading(false);
      return;
    }

    if (list.length === 0) {
      notify.warning('Tidak ada MR yang cocok. Coba perluas rentang tanggal.');
      setLoading(false);
      return;
    }

    persistProject(projectId);

    try {
      const res = await fetch('/api/gitlab/release-note/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          releaseTitle: releaseTitle.trim(),
          service: project?.name || '',
          databaseName: databaseName.trim() || 'padi_transactions',
          mrIids: list.map((mr) => mr.iid),
          targetBranch: targetBranch || undefined,
        }),
      });
      const data = (await res.json()) as GenerateResponse;
      if (!res.ok || !data.ok || !data.result) {
        throw new Error(data.error || 'Gagal membuat release note.');
      }

      setResult({
        title: data.result.title,
        mrIids: data.result.mrIids,
        deployAt: data.result.deployAt,
        service: project?.name || data.project?.name || '',
        content: data.result.content,
        projectId: data.project?.id ?? projectId,
        projectPath:
          data.project?.pathWithNamespace || project?.pathWithNamespace || '',
        targetBranch: data.result.targetBranch ?? targetBranch,
        usedAi: data.result.usedAi,
      });
      notify.success(`Release note dibuat dari ${list.length} MR.`);
    } catch (err) {
      setGenerateError((err as Error).message || 'Gagal membuat release note.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!result) return;

    const databaseMatch = result.content.match(/^Nama Database:\s*(.+)$/m);
    const targetDatabase =
      databaseMatch && databaseMatch[1].trim() !== '-'
        ? databaseMatch[1].trim()
        : databaseName.trim() || 'padi_transactions';

    setRegenerating(true);
    try {
      const res = await fetch('/api/gitlab/release-note/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: result.projectId,
          releaseTitle: result.title,
          service: result.service,
          databaseName: targetDatabase,
          mrIids: result.mrIids,
          targetBranch: (result.targetBranch ?? targetBranch) || undefined,
        }),
      });
      const data = (await res.json()) as GenerateResponse;
      if (!res.ok || !data.ok || !data.result) {
        throw new Error(data.error || 'Gagal membuat ulang release note.');
      }
      setResult((prev) =>
        prev
          ? {
              ...prev,
              deployAt: data.result!.deployAt,
              content: data.result!.content,
              usedAi: data.result!.usedAi,
              mrIids: data.result!.mrIids,
            }
          : prev,
      );
      notify.success('Release note diperbarui.');
    } catch (err) {
      notify.error(
        (err as Error).message || 'Gagal membuat ulang release note.',
      );
    } finally {
      setRegenerating(false);
    }
  };

  const handleChangeContent = (value: string) => {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            content: value,
            deployAt: readField(value, 'Waktu Deploy') ?? prev.deployAt,
            service: readField(value, 'Service') ?? prev.service,
          }
        : prev,
    );
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify.success('Release note tersalin ke clipboard.');
    } catch {
      notify.error('Gagal menyalin. Blok teks lalu copy manual.');
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch('/api/release-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: result.projectId,
          projectPath: result.projectPath || result.service,
          releaseTitle: result.title,
          service: result.service,
          deployAt: result.deployAt,
          mrIids: result.mrIids,
          content: result.content,
          targetBranch: result.targetBranch ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal menyimpan release note.');
      }
      notify.success('Release note disimpan ke riwayat.');
      await loadHistory();
    } catch (err) {
      notify.error((err as Error).message || 'Gagal menyimpan release note.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenHistory = (note: SavedReleaseNote) => {
    setReleaseTitle(note.releaseTitle);
    setResult({
      title: note.releaseTitle,
      mrIids: note.mrIids,
      deployAt: note.deployAt,
      service: note.service,
      content: note.content,
      projectId: note.projectId,
      projectPath: note.projectPath,
      targetBranch: note.targetBranch ?? undefined,
      usedAi: false,
    });
    if (note.targetBranch) setTargetBranch(note.targetBranch);
    notify.info(`Release note "${note.releaseTitle}" dibuka.`);
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/release-notes?id=${noteToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal menghapus release note.');
      }
      setNoteToDelete(null);
      notify.success('Release note dihapus.');
      await loadHistory();
    } catch (err) {
      notify.error((err as Error).message || 'Gagal menghapus release note.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className='flex flex-col gap-5'>
      <header className='page-header !items-start relative z-40 !mb-0'>
        <div className='max-w-2xl'>
          <div className='eyebrow'>Release &amp; Deploy</div>
          <h1 className='flex items-center gap-2.5'>
            <span>Release Note</span>
            <span className='gradient-text'>Generator</span>
          </h1>
          <p>
            Generate release note dari merge request (MR) GitLab secara otomatis
          </p>
        </div>
      </header>

      {projectsError && (
        <Notification
          type='error'
          title='Gagal memuat project'
          message={projectsError}
        />
      )}

      <ReleaseNotePicker
        projects={projects}
        projectsLoading={projectsLoading}
        projectId={projectId}
        onProjectChange={handleProjectChange}
        branches={branches}
        branchesLoading={branchesLoading}
        targetBranch={targetBranch}
        onTargetBranchChange={setTargetBranch}
        releaseTitle={releaseTitle}
        onReleaseTitleChange={setReleaseTitle}
        since={since}
        until={until}
        onSinceChange={setSince}
        onUntilChange={setUntil}
        databaseName={databaseName}
        onDatabaseNameChange={setDatabaseName}
        loading={loading}
        error={mrsError}
        onSearch={handleSearch}
      />

      {generateError && (
        <Notification
          type='error'
          title='Generate gagal'
          message={generateError}
        />
      )}

      <ReleaseNoteResults
        result={result}
        regenerating={regenerating}
        saving={saving}
        onChangeContent={handleChangeContent}
        onCopy={copyText}
        onRegenerate={handleRegenerate}
        onSave={handleSave}
      />

      <ReleaseNoteHistory
        notes={history}
        loading={loadingHistory}
        error={historyError}
        onOpen={handleOpenHistory}
        onCopy={copyText}
        onDelete={setNoteToDelete}
      />

      <Modal
        isOpen={Boolean(noteToDelete)}
        onClose={() => {
          if (!deleting) setNoteToDelete(null);
        }}
        title='Hapus Release Note'
        size='sm'
        footer={
          <>
            <button
              type='button'
              className='btn btn-ghost border border-border'
              onClick={() => setNoteToDelete(null)}
              disabled={deleting}
            >
              Batal
            </button>
            <button
              type='button'
              className='btn btn-primary bg-rose-600 border-rose-600 gap-1.5'
              onClick={handleDeleteNote}
              disabled={deleting}
            >
              {deleting ? (
                <span className='spinner w-3.5 h-3.5' />
              ) : (
                <Trash2 size={14} />
              )}
              <span>Hapus</span>
            </button>
          </>
        }
      >
        <p className='m-0 text-sm text-slate-700'>
          Hapus release note <strong>{noteToDelete?.releaseTitle}</strong> dari
          riwayat? Tindakan ini tidak bisa dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
