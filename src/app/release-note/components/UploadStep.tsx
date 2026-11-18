'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, Send } from 'lucide-react';
import {
  RELEASE_TARGETS,
  type DeploymentTask,
  type ReleaseCreation,
  type ReleaseMember,
  type ReleaseStoryForm,
} from '@/lib/release-deployment/model';

interface UploadStepProps {
  form: ReleaseStoryForm;
  tasks: DeploymentTask[];
  projectName: string;
  members: ReleaseMember[];
  creating: boolean;
  error: string | null;
  created: ReleaseCreation | null;
  onCreate: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function UploadStep({
  form,
  tasks,
  projectName,
  members,
  creating,
  error,
  created,
  onCreate,
  onBack,
  onNext,
}: UploadStepProps) {
  const target = RELEASE_TARGETS[form.target];
  const assignee =
    members.find((member) => member.id === form.assigneeId)?.name ?? 'Tanpa assignee';
  const filledTasks = tasks.filter((task) => task.subject.trim());

  return (
    <div className='space-y-4'>
      <section className='card'>
        <h2 className='card-title'>Ringkasan</h2>

        <div className='rounded-xl border border-border bg-surface-subtle/60 p-4'>
          <div className='flex flex-wrap items-center gap-1.5 mb-2'>
            <span className='rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700'>
              EPIC
            </span>
            <span className='rounded bg-brand-light px-1.5 py-0.5 text-[10px] font-bold text-brand'>
              USER STORY
            </span>
          </div>
          <p className='text-sm font-semibold text-slate-800 break-words'>
            {form.subject}
          </p>
          <p className='mt-1 text-xs text-slate-500'>
            Project {projectName || 'SPA'} &middot; epic Release {target.label} (ref{' '}
            {target.epicRef}) &middot; assignee {assignee}
          </p>

          {form.description.trim() && (
            <p className='mt-3 whitespace-pre-line text-xs text-slate-600'>
              {form.description}
            </p>
          )}

          <p className='mt-4 text-xs font-bold text-slate-600'>
            {filledTasks.length} task akan dibuat:
          </p>
          {filledTasks.length === 0 ? (
            <p className='mt-1 text-xs text-slate-400'>
              Belum ada task deployment.
            </p>
          ) : (
            <ol className='mt-2 space-y-1.5'>
              {filledTasks.map((task, index) => (
                <li
                  key={task.id}
                  className='flex items-center gap-2.5 text-[13px] text-slate-700'
                >
                  <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-500 ring-1 ring-border'>
                    {index + 1}
                  </span>
                  <span className='break-words'>{task.subject}</span>
                  {task.template && (
                    <span className='shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700'>
                      TEMPLATE
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        {error && (
          <p className='mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700'>
            {error}
          </p>
        )}

        <div className='mt-4 flex flex-wrap justify-between gap-2'>
          <button
            type='button'
            className='btn btn-ghost'
            onClick={onBack}
            disabled={creating}
          >
            <ChevronLeft size={16} />
            Kembali
          </button>
          <button
            type='button'
            className='btn btn-primary'
            onClick={onCreate}
            disabled={creating || Boolean(created)}
          >
            {creating ? (
              <Loader2 size={16} className='animate-spin' />
            ) : (
              <Send size={16} />
            )}
            {creating
              ? 'Membuat di Taiga...'
              : `Buat User Story & ${filledTasks.length} Task di Taiga`}
          </button>
        </div>
      </section>

      {created && (
        <section className='card !border-emerald-200 !bg-emerald-50/40'>
          <p className='mb-2 text-xs font-bold text-emerald-700'>
            BERHASIL DIBUAT
          </p>
          <Link
            href={created.story.url}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline'
          >
            us/{created.story.ref} — {form.subject}
            <ExternalLink size={13} />
          </Link>

          <ol className='mt-3 space-y-1.5'>
            {created.tasks.map((task, index) => (
              <li key={`${task.subject}-${index}`} className='flex items-start gap-2.5 text-[13px]'>
                <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-500 ring-1 ring-border'>
                  {index + 1}
                </span>
                {task.ok && task.url ? (
                  <span>
                    <Link
                      href={task.url}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-1 font-semibold text-brand hover:underline'
                    >
                      task/{task.ref}
                      <ExternalLink size={12} />
                    </Link>{' '}
                    <span className='text-slate-600'>{task.subject}</span>
                  </span>
                ) : (
                  <span className='text-rose-600'>
                    {task.subject} — {task.error ?? 'gagal dibuat'}
                  </span>
                )}
              </li>
            ))}
          </ol>

          {created.tasks.some((task) => !task.ok) && (
            <p className='mt-3 text-xs text-amber-700'>
              Sebagian task gagal dibuat. Hapus baris yang gagal lalu buat
              ulang, atau tambahkan manual di Taiga.
            </p>
          )}

          <div className='mt-4 flex justify-end'>
            <button type='button' className='btn btn-primary' onClick={onNext}>
              Lanjut ke Form Deployment
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
