'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Save,
  Tag,
  X,
} from 'lucide-react';
import { Select } from '@/components/Select';
import { TIME_SLOTS } from '../smart-task/types';
import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';
import type { Status } from './types';

const emptySubscribe = () => () => {};

interface EditTaskModalProps {
  task: AssignedTaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  availableStatuses: Status[];
  baseUrl: string;
  onSave: (
    taskId: number,
    payload: {
      subject: string;
      description: string;
      statusId: number;
      hours: number | null;
      totalTimeSpentMinutes: number | null;
      activityDate?: string;
      startTime?: string;
    },
  ) => Promise<void>;
}

export function EditTaskModal({
  task,
  isOpen,
  onClose,
  availableStatuses,
  baseUrl,
  onSave,
}: EditTaskModalProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [subject, setSubject] = useState(task?.subject || '');
  const [statusId, setStatusId] = useState<number>(task?.status || 0);
  const [hours, setHours] = useState<number | null>(task?.hours ?? null);
  const [activityDate, setActivityDate] = useState(
    task?.activityDate || new Date().toISOString().split('T')[0],
  );
  const [startTime, setStartTime] = useState(task?.startTime || '09:00');
  const [description, setDescription] = useState(task?.description || '');
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch full task details (including description and custom attributes from Taiga)
  const taskId = task?.id;
  useEffect(() => {
    let ignore = false;

    fetch(`/api/taiga/assigned?taskId=${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.ok && data.task) {
          const t = data.task;
          if (t.description !== undefined) setDescription(t.description || '');
          if (t.hours != null) setHours(t.hours);
          if (t.activityDate) setActivityDate(t.activityDate);
          if (t.startTime) setStartTime(t.startTime);
          if (t.status) setStatusId(t.status);
          if (t.subject) setSubject(t.subject);
        }
      })
      .catch((err) => {
        console.error('Failed to load task detail:', err);
      })
      .finally(() => {
        if (!ignore) setLoadingDetail(false);
      });

    return () => {
      ignore = true;
    };
  }, [taskId]);


  const handleAddHoursPreset = (amount: number) => {
    const current = hours ?? 0;
    const nextVal = Math.round((current + amount) * 100) / 100;
    setHours(nextVal);
  };

  const handleSetHoursPreset = (amount: number) => {
    setHours(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Judul task tidak boleh kosong.');
      return;
    }

    if (!task) return;

    setSaving(true);
    setError(null);
    try {
      const mins = hours != null ? Math.round(hours * 60) : null;
      await onSave(task.id, {
        subject: subject.trim(),
        description: description,
        statusId,
        hours: hours != null ? Number(hours) : null,
        totalTimeSpentMinutes: mins,
        activityDate: activityDate || undefined,
        startTime: startTime || undefined,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !task || !mounted) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200'
      role='dialog'
      aria-modal='true'
      aria-labelledby='edit-task-title'
      onClick={onClose}
    >
      <div
        className='relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-border bg-surface-subtle/50'>
          <div className='flex items-center gap-2.5 flex-wrap'>
            <span className='px-2.5 py-1 text-xs font-bold font-mono rounded-lg bg-brand/10 text-brand border border-brand/20'>
              #{task.ref}
            </span>
            <span className='text-xs font-semibold text-slate-muted'>
              {task.projectName}
            </span>
            {task.userStory && (
              <span className='text-xs text-violet-600 font-medium truncate max-w-[250px]'>
                · US #{task.userStory.ref} {task.userStory.subject}
              </span>
            )}
          </div>

          <button
            type='button'
            className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors'
            onClick={onClose}
            aria-label='Tutup dialog'
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form
          onSubmit={handleSubmit}
          className='flex-1 overflow-y-auto p-6 flex flex-col gap-5'
        >
          <div>
            <h2
              id='edit-task-title'
              className='text-lg font-bold text-slate-text m-0 tracking-tight'
            >
              Edit Tiket Taiga #{task.ref}
            </h2>
            <p className='text-xs text-slate-muted mt-1'>
              Perbarui judul, jam pengerjaan, status, dan deskripsi task langsung
              ke Taiga.
            </p>
          </div>

          {error && (
            <div className='p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl'>
              {error}
            </div>
          )}

          {/* 1. Judul Task */}
          <div className='flex flex-col gap-1.5'>
            <label
              htmlFor='edit-task-subject'
              className='text-xs font-bold text-slate-700 flex items-center gap-1.5'
            >
              <span>Judul Task</span>
              <span className='text-rose-500'>*</span>
            </label>
            <input
              id='edit-task-subject'
              type='text'
              className='input h-10 px-3 text-sm font-semibold rounded-xl'
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder='Contoh: Melakukan pendampingan rilis fitur production'
              required
            />
          </div>

          {/* 2. Status & Jam (Hours) Row */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* Status */}
            <div className='flex flex-col gap-1.5'>
              <label
                htmlFor='edit-task-status'
                className='text-xs font-bold text-slate-700 flex items-center gap-1.5'
              >
                <Tag size={13} className='text-brand' />
                <span>Status Task</span>
              </label>
              <Select
                id='edit-task-status'
                value={statusId}
                onChange={(e) => setStatusId(Number(e.target.value))}
                className='!h-10 text-xs sm:text-sm font-semibold rounded-xl'
              >
                {availableStatuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.is_closed ? '(Closed)' : ''}
                  </option>
                ))}
              </Select>
            </div>

            {/* Jam Pengerjaan (Hours) */}
            <div className='flex flex-col gap-1.5'>
              <label
                htmlFor='edit-task-hours'
                className='text-xs font-bold text-slate-700 flex items-center justify-between'
              >
                <span className='flex items-center gap-1.5'>
                  <Clock size={13} className='text-sky-600' />
                  <span>Total Jam (Hours)</span>
                </span>
                <span className='text-[11px] font-mono text-slate-400 font-normal'>
                  {hours != null ? `${Math.round(hours * 60)} menit` : '-'}
                </span>
              </label>
              <div className='relative flex items-center'>
                <input
                  id='edit-task-hours'
                  type='number'
                  step='0.25'
                  min='0'
                  max='100'
                  className='input h-10 px-3 pr-12 text-sm font-semibold rounded-xl font-mono'
                  value={hours ?? ''}
                  placeholder='0'
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setHours(val);
                  }}
                />
                <span className='absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none'>
                  jam
                </span>
              </div>

              {/* Quick Hours Presets */}
              <div className='flex items-center gap-1.5 mt-1 flex-wrap'>
                <span className='text-[10.5px] text-slate-400'>Cepat:</span>
                {[0.5, 1, 2, 4].map((h) => (
                  <button
                    key={h}
                    type='button'
                    className='px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer'
                    onClick={() => handleSetHoursPreset(h)}
                  >
                    {h}j
                  </button>
                ))}
                <button
                  type='button'
                  className='px-2 py-0.5 text-[11px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-md transition-colors cursor-pointer'
                  onClick={() => handleAddHoursPreset(0.5)}
                  title='Tambah 30 menit ke nilai saat ini'
                >
                  +0.5j
                </button>
                <button
                  type='button'
                  className='px-2 py-0.5 text-[11px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-md transition-colors cursor-pointer'
                  onClick={() => handleAddHoursPreset(1)}
                  title='Tambah 1 jam ke nilai saat ini'
                >
                  +1j
                </button>
              </div>
            </div>
          </div>

          {/* 3. Log Aktivitas (Tanggal & Jam Mulai) */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-surface-subtle/70 rounded-xl border border-border'>
            <div className='flex flex-col gap-1.5'>
              <label
                htmlFor='edit-task-date'
                className='text-xs font-medium text-slate-600 flex items-center gap-1.5'
              >
                <Calendar size={12} className='text-slate-400' />
                <span>Tanggal Aktivitas</span>
              </label>
              <input
                id='edit-task-date'
                type='date'
                className='input h-9 px-3 text-xs sm:text-sm rounded-lg'
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <label
                htmlFor='edit-task-time'
                className='text-xs font-medium text-slate-600 flex items-center gap-1.5'
              >
                <Clock size={12} className='text-slate-400' />
                <span>Jam Mulai</span>
              </label>
              <Select
                id='edit-task-time'
                size='sm'
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className='h-9 text-xs sm:text-sm rounded-lg'
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* 4. Deskripsi Task (Markdown) */}
          <div className='flex flex-col gap-1.5'>
            <div className='flex items-center justify-between'>
              <label
                htmlFor='edit-task-desc'
                className='text-xs font-bold text-slate-700 flex items-center gap-1.5'
              >
                <FileText size={13} className='text-violet-600' />
                <span>Deskripsi Task</span>
              </label>
              {loadingDetail && (
                <span className='text-[11px] text-slate-400 flex items-center gap-1'>
                  <span className='spinner w-2.5 h-2.5' /> Memuat dari Taiga...
                </span>
              )}
            </div>
            <textarea
              id='edit-task-desc'
              className='textarea min-h-[120px] text-xs sm:text-sm leading-relaxed rounded-xl p-3'
              placeholder='Deskripsi rincian pekerjaan atau acceptance criteria...'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <span className='text-[11px] text-slate-400'>
              Mendukung format Markdown. Gunakan baris baru atau bullet (- )
              untuk daftar pekerjaan.
            </span>
          </div>

          {/* Modal Actions Footer */}
          <div className='flex items-center justify-between gap-3 pt-4 border-t border-border mt-2 flex-wrap'>
            <a
              href={`${baseUrl}/project/${task.projectSlug}/task/${task.ref}`}
              target='_blank'
              rel='noreferrer'
              className='btn btn-ghost btn-sm text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5'
              title='Buka task langsung di portal Taiga'
            >
              <span>Buka di Taiga</span>
              <ExternalLink size={12} />
            </a>

            <div className='flex items-center gap-2 ml-auto'>
              <button
                type='button'
                className='btn btn-ghost btn-sm px-4 text-xs'
                onClick={onClose}
                disabled={saving}
              >
                Batal
              </button>

              <button
                type='submit'
                className='btn btn-primary btn-sm px-5 text-xs font-semibold'
                disabled={saving || !subject.trim()}
              >
                {saving ? (
                  <span className='spinner' />
                ) : (
                  <Save size={14} className='mr-1.5' />
                )}
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
