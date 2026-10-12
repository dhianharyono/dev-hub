'use client';

import { useState } from 'react';
import {
  Send,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCode,
  Layers,
  FileText,
} from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import type { ReviewFinding, ReviewToneMode } from './types';

interface AiReviewEditorProps {
  commentText: string;
  setCommentText: (val: string) => void;
  onPost: () => void;
  posting: boolean;
  successMsg: string | null;
  postError: string | null;
  mrWebUrl?: string;
  onOpenDiscussions?: () => void;
  findings?: ReviewFinding[];
  summaryText?: string;
  toneMode?: ReviewToneMode;
}

export function AiReviewEditor({
  commentText,
  setCommentText,
  onPost,
  posting,
  successMsg,
  postError,
  mrWebUrl,
  onOpenDiscussions,
  findings,
  summaryText,
  toneMode = 'audit',
}: AiReviewEditorProps) {
  const findingsList = findings ?? [];
  const hasFindings = findingsList.length > 0;
  // Default to 'full' (Teks Lengkap) initially as requested
  const [activeView, setActiveView] = useState<'threads' | 'full'>('full');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className='flex flex-col gap-3 flex-1'>
      {/* Draft Comment Container */}
      <div className='border border-border rounded-lg overflow-hidden bg-surface flex flex-col flex-1'>
        {/* Header with View Tabs */}
        <div className='row-between px-4 py-2.5 bg-surface-subtle border-b border-border items-center flex-wrap gap-2.5'>
          <div className='flex items-center gap-2'>
            <span className='text-[13px] font-bold text-slate-text'>
              Pratinjau Review GitLab
            </span>
            {hasFindings && (
              <span className='badge badge-violet xs text-[10px] font-semibold'>
                {findingsList.length} Thread Diff
              </span>
            )}
          </div>

          <div className='flex items-center gap-2'>
            {hasFindings && (
              <div className='segmented p-0.5' role='group' aria-label='Pilih Tampilan Review'>
                <button
                  type='button'
                  aria-pressed={activeView === 'full'}
                  onClick={() => setActiveView('full')}
                  className='text-[11.5px] px-2.5 py-1 gap-1.5'
                >
                  <FileText size={12} />
                  <span>Teks Lengkap</span>
                </button>
                <button
                  type='button'
                  aria-pressed={activeView === 'threads'}
                  onClick={() => setActiveView('threads')}
                  className='text-[11.5px] px-2.5 py-1 gap-1.5'
                >
                  <Layers size={12} />
                  <span>Thread Diff ({findingsList.length})</span>
                </button>
              </div>
            )}

            <button
              type='button'
              className='btn btn-ghost xs text-[11.5px] px-2.5 py-[3px] gap-1'
              onClick={() => {
                navigator.clipboard.writeText(commentText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check size={11} className='text-emerald-600' /> : <Copy size={11} />}
              <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
            </button>

            {activeView === 'full' && (
              <button
                type='button'
                className='btn btn-ghost xs text-[11.5px] px-2.5 py-[3px] gap-1'
                onClick={() => setIsEditing(!isEditing)}
              >
                <span>{isEditing ? 'Pratinjau' : 'Edit Teks'}</span>
                {isEditing ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {activeView === 'threads' && hasFindings ? (
          /* Structured Diff Threads Preview */
          <div className='p-4 sm:p-5 flex flex-col gap-4 flex-1 min-h-[460px] overflow-y-auto bg-surface-subtle'>
            {summaryText && (
              <div className='bg-surface border border-border rounded-lg p-3.5 sm:px-4 text-[13px] leading-relaxed text-slate-text shadow-xs'>
                <div className='flex items-center gap-2 mb-1.5 flex-wrap'>
                  <span className='badge badge-cyan xs font-semibold'>Catatan Ringkasan MR</span>
                  <span className='text-xs text-slate-600 font-medium'>
                    Akan diposting sebagai catatan overview di MR
                  </span>
                </div>
                <div className='m-0 text-slate-800 leading-normal'>
                  <Markdown text={summaryText} />
                </div>
              </div>
            )}

            {findingsList.map((f, idx) => {
              const sevBadgeClass =
                f.severity === 'blocking'
                  ? 'badge-rose'
                  : f.severity === 'non-blocking'
                    ? 'badge-amber'
                    : f.severity === 'important'
                      ? 'badge-violet'
                      : 'badge-slate';

              return (
                <div
                  key={idx}
                  className='bg-surface border border-border rounded-lg overflow-hidden shadow-xs'
                >
                  {/* Thread Diff Header */}
                  <div className='px-3.5 py-2.5 bg-slate-50 border-b border-border flex items-center justify-between flex-wrap gap-2'>
                    <div className='flex items-center gap-2 min-w-0'>
                      <FileCode size={14} className='text-slate-500 shrink-0' />
                      <span className='text-xs font-mono font-bold text-slate-800 break-all'>
                        {f.file || 'File Umum'}
                        {f.line ? ` : ${f.line}` : ''}
                      </span>
                    </div>

                    <div className='flex items-center gap-1.5'>
                      <span className={`badge ${sevBadgeClass} xs font-semibold`}>
                        {f.severity}
                      </span>
                      {f.line && (
                        <span className='badge badge-cyan xs font-semibold'>
                          Diff Line {f.line}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thread Comment Body with Full Markdown Support */}
                  <div className='p-4'>
                    <div className='text-[13.5px] font-bold text-slate-text mb-2.5'>
                      {f.title}
                    </div>

                    <div className='text-[13px] leading-relaxed text-slate-700 m-0'>
                      <Markdown text={f.description} />
                    </div>

                    {f.suggestionSnippet && (
                      <div className='mt-3.5 pt-2 border-t border-border-subtle'>
                        <div className='text-xs text-slate-700 mb-1.5 font-semibold'>
                          Rekomendasi Kode (Suggestion):
                        </div>
                        <pre className='bg-slate-900 text-slate-50 p-3 sm:px-4 rounded-md text-xs leading-normal overflow-x-auto m-0 font-mono border border-slate-800'>
                          <code>{f.suggestionSnippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Full Markdown Text Preview or Edit Mode */
          <>
            {isEditing ? (
              <textarea
                className='input min-h-[460px] font-mono text-[12.5px] leading-relaxed p-4 sm:p-[18px] border-none rounded-none w-full resize-y'
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={18}
              />
            ) : (
              <div className='flex-1 min-h-[460px] overflow-y-auto p-5 sm:p-[22px] bg-surface leading-relaxed text-slate-text'>
                <Markdown text={commentText} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Feedback Alerts */}
      {successMsg && (
        <div className='bg-emerald-50/90 border-2 border-emerald-500/25 rounded-2xl p-4 sm:px-5 shadow-xs flex items-center justify-between flex-wrap gap-4'>
          <div className='flex items-center gap-3.5 min-w-0 flex-1'>
            <div className='w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0'>
              <CheckCircle2 size={20} />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='text-[11px] font-extrabold uppercase tracking-wider text-emerald-800'>
                Publikasi Review Berhasil
              </div>
              <p className='text-[13.5px] font-bold text-slate-900 m-0 leading-snug'>
                {successMsg}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap'>
            {onOpenDiscussions && (
              <button
                type='button'
                className='btn text-xs px-4 py-2 font-bold bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white border-transparent transition-all shadow-xs rounded-xl inline-flex items-center gap-1.5'
                onClick={onOpenDiscussions}
              >
                <span>Lihat Komentar Review</span>
              </button>
            )}
            {mrWebUrl && (
              <a
                href={mrWebUrl}
                target='_blank'
                rel='noreferrer'
                className='btn text-xs px-3.5 py-2 font-semibold bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-950 border border-slate-300 shadow-2xs rounded-xl inline-flex items-center gap-1.5 transition-all'
              >
                <ExternalLink size={14} className='text-slate-600' />
                <span>Buka di GitLab</span>
              </a>
            )}
          </div>
        </div>
      )}

      {postError && (
        <div className='bg-rose-50/90 border-2 border-rose-500/25 rounded-2xl p-4 sm:px-5 text-xs flex items-start gap-3.5 shadow-xs'>
          <div className='w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold'>
            ✕
          </div>
          <div className='flex-1 leading-relaxed text-slate-900'>
            <div className='font-bold text-[13.5px] text-rose-800 mb-1'>
              {postError}
            </div>
            {postError.toLowerCase().includes('insufficient_scope') && (
              <div className='mt-2 p-3 bg-white rounded-xl border border-rose-200 text-slate-800 text-[12px]'>
                <strong className='font-semibold text-rose-800 block mb-1'>
                  Panduan Solusi Token GitLab:
                </strong>
                <ol className='list-decimal list-inside space-y-1 m-0 p-0 text-slate-700'>
                  <li>Buka GitLab Anda lalu pilih <strong>User Preferences &gt; Access Tokens</strong>.</li>
                  <li>Buat Personal Access Token baru dan pastikan mencentang scope <strong><code>api</code></strong> (bukan hanya <code>read_api</code>).</li>
                  <li>Perbarui token tersebut di menu <strong>Settings DevHub</strong>.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className='flex items-center justify-between flex-wrap gap-3 px-4 py-3 rounded-lg bg-surface-subtle border border-border'>
        <div className='text-xs text-slate-700 font-medium'>
          {hasFindings && toneMode === 'audit'
            ? `Setiap temuan akan diposting sebagai inline thread pada diff MR (${findingsList.length} komentar).`
            : 'Review akan diposting sebagai catatan pada Merge Request.'}
        </div>

        <button
          type='button'
          className='btn btn-primary xs text-[12.5px] px-5 py-2 gap-1.5 font-semibold'
          onClick={onPost}
          disabled={posting || (!commentText.trim() && !hasFindings)}
        >
          {posting ? <span className='spinner' /> : <Send size={13} />}
          <span>
            {posting
              ? 'Memposting ke GitLab...'
              : hasFindings && toneMode === 'audit'
                ? `Kirim Review (${findingsList.length} Thread Inline Diff)`
                : 'Kirim Komentar ke GitLab'}
          </span>
        </button>
      </div>
    </div>
  );
}
