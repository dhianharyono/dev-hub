'use client';

import { useState } from 'react';
import { Sparkles, ShieldCheck, ThumbsUp } from 'lucide-react';
import type { IncomingMRItem, PreReviewOutput, ReviewToneMode } from './types';
import { AiReviewScoreBanner } from './AiReviewScoreBanner';
import { AiReviewEditor } from './AiReviewEditor';
import { useNotification } from '@/components/Notification';

interface AiReviewGeneratorProps {
  mr: IncomingMRItem | null;
  onCommentPosted: (msg: string) => void;
  onOpenDiscussions?: () => void;
}

function formatOrganicComment(
  targetMr: IncomingMRItem,
  res: PreReviewOutput,
  mode: ReviewToneMode,
): string {
  if (mode === 'lgtm') {
    return [
      'Perubahan kode sudah rapi dan siap untuk proses merge.',
      '',
      res.summary,
      '',
      `Siap untuk di-merge ke branch \`${targetMr.targetBranch}\`.`,
    ].join('\n');
  }

  // mode === 'audit' (Temuan mendalam)
  const parts = [res.summary];
  if (res.findings && res.findings.length > 0) {
    parts.push('');
    res.findings.forEach((f) => {
      let item = `**${f.severity}**: ${f.title}`;
      if (f.file) item += ` di \`${f.file}${f.line ? `:${f.line}` : ''}\``;
      item += `\n${f.description}`;
      if (f.suggestionSnippet) {
        const snippet = f.suggestionSnippet.trim();
        if (snippet.startsWith('```')) {
          item += `\n\n${snippet}`;
        } else {
          item += `\n\n\`\`\`suggestion\n${snippet}\n\`\`\``;
        }
      }
      parts.push(item);
    });
  } else {
    parts.push(
      'Secara keseluruhan kode sudah terstruktur rapi dan tidak ditemukan isu blocking. Siap untuk merge.',
    );
  }
  return parts.join('\n\n');
}

export function AiReviewGenerator({
  mr,
  onCommentPosted,
  onOpenDiscussions,
}: AiReviewGeneratorProps) {
  const { notify } = useNotification();
  const [toneMode, setToneMode] = useState<ReviewToneMode>('audit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<PreReviewOutput | null>(
    null,
  );
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  const handleGenerate = async (selectedMode: ReviewToneMode = toneMode) => {
    if (!mr) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setPostError(null);
    try {
      const diffRes = await fetch(
        `/api/gitlab/incoming-reviews/diff?projectId=${mr.projectId}&mrIid=${mr.iid}`,
      );
      const diffData = await diffRes.json();
      if (!diffRes.ok || !diffData.ok)
        throw new Error(diffData.error || 'Gagal mengambil diff MR.');
      if (!diffData.diff?.trim())
        throw new Error('MR ini tidak memiliki baris perubahan kode.');

      const revRes = await fetch('/api/gitlab/pre-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeOrDiff: diffData.diff,
          context: `Review MR !${mr.iid}: ${mr.title} (${mr.sourceBranch} -> ${mr.targetBranch})`,
        }),
      });
      const revData = await revRes.json();
      if (!revRes.ok || !revData.ok)
        throw new Error(revData.error || 'Gagal generate review.');

      setReviewResult(revData);
      setCommentText(formatOrganicComment(mr, revData, selectedMode));
    } catch (e) {
      const errMsg = (e as Error).message;
      setError(errMsg);
      notify.error(errMsg, 'Gagal Analisis Kode');
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!mr) return;
    setPosting(true);
    setPostError(null);
    setSuccessMsg(null);
    try {
      const payload: Record<string, unknown> = {
        projectId: mr.projectId,
        mrIid: mr.iid,
        mode: toneMode,
        comment: commentText,
      };

      if (toneMode === 'audit' && reviewResult?.findings && reviewResult.findings.length > 0) {
        payload.findings = reviewResult.findings;
        payload.summary = reviewResult.summary;
      }

      const res = await fetch('/api/gitlab/incoming-reviews/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok)
        throw new Error(data.error || 'Gagal memposting review ke GitLab.');

      const diffCount = data.diffDiscussionsCreated || 0;
      const genCount = data.generalDiscussionsCreated || 0;
      const msg = diffCount > 0
        ? `Berhasil memposting ${diffCount} thread komentar inline ke diff MR !${mr.iid}${genCount > 0 ? ` dan ${genCount} komentar umum` : ''}!`
        : `Komentar review berhasil diposting ke MR !${mr.iid}!`;

      setSuccessMsg(msg);
      notify.success(msg, 'Review Berhasil Diposting');
      onCommentPosted(msg);
    } catch (e) {
      const errMsg = (e as Error).message;
      setPostError(errMsg);
      notify.error(errMsg, 'Gagal Memposting Review');
    } finally {
      setPosting(false);
    }
  };

  if (!mr) return null;

  return (
    <div className='flex flex-col gap-4 flex-1 min-h-full'>
      {/* Sub-Header Toolbar with clean padding and border */}
      <div className='row-between flex-wrap gap-3 items-center px-4 py-3 border-b border-border'>
        <div className='segmented' role='group' aria-label='Pilih Gaya Review'>
          <button
            type='button'
            aria-pressed={toneMode === 'audit'}
            onClick={() => {
              setToneMode('audit');
              if (reviewResult)
                setCommentText(formatOrganicComment(mr, reviewResult, 'audit'));
            }}
            className='text-[12.5px] px-3.5 py-1.5 gap-1.5'
          >
            <ShieldCheck size={14} />
            <span>Audit Lengkap</span>
          </button>
          <button
            type='button'
            aria-pressed={toneMode === 'lgtm'}
            onClick={() => {
              setToneMode('lgtm');
              if (reviewResult)
                setCommentText(formatOrganicComment(mr, reviewResult, 'lgtm'));
            }}
            className='text-[12.5px] px-3.5 py-1.5 gap-1.5'
          >
            <ThumbsUp size={14} />
            <span>Persetujuan LGTM</span>
          </button>
        </div>

        <button
          type='button'
          className='btn btn-primary text-[12.5px] px-4 py-3 gap-2 font-semibold'
          onClick={() => handleGenerate(toneMode)}
          disabled={loading}
        >
          {loading ? <span className='spinner' /> : <Sparkles size={14} />}
          <span>
            {loading
              ? 'Menganalisis Kode...'
              : reviewResult
                ? 'Generate Ulang'
                : 'Analisis Perubahan dengan AI'}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Prominent Centered Loading Card */
        <div className='flex-1 min-h-[340px] max-h-[520px] flex flex-col items-center justify-center text-center p-8 sm:px-6 border border-dashed border-border rounded-xl bg-surface-subtle gap-4 my-2'>
          <div className='w-14 h-14 rounded-full bg-blue-600/[0.08] text-primary flex items-center justify-center'>
            <Sparkles size={28} className='spin' />
          </div>
          <div>
            <strong className='text-[15px] text-slate-text block mb-1.5 font-bold'>
              Sedang Menganalisis Kode MR...
            </strong>
            <p className='text-[12.5px] text-slate-600 max-w-[440px] m-0 leading-normal'>
              Mengambil Git Diff, memeriksa kualitas & keamanan kode, serta
              menyusun draf rekomendasi review.
            </p>
          </div>
        </div>
      ) : !reviewResult ? (
        /* Initial State */
        <div className='flex-1 min-h-[340px] max-h-[520px] flex flex-col items-center justify-center text-center p-8 sm:px-6 border border-dashed border-border rounded-xl bg-surface-subtle gap-3.5 my-2'>
          <div className='w-[52px] h-[52px] rounded-full bg-blue-600/[0.08] text-primary flex items-center justify-center'>
            <Sparkles size={24} />
          </div>
          <div>
            <strong className='text-[14.5px] text-slate-text block mb-1.5 font-bold'>
              Mulai Analisis Kode dengan AI
            </strong>
            <p className='text-[12.5px] text-slate-600 max-w-[420px] m-0 leading-normal'>
              Pilih mode di atas lalu klik tombol &quot;Analisis Perubahan
              dengan AI&quot; untuk menghasilkan draf review.
            </p>
          </div>
        </div>
      ) : (
        /* Result State */
        <div className='flex flex-col gap-3 flex-1'>
          <AiReviewScoreBanner
            score={reviewResult.score}
            verdict={reviewResult.verdict}
            findingsCount={reviewResult.findings?.length}
          />
          <AiReviewEditor
            commentText={commentText}
            setCommentText={setCommentText}
            onPost={handlePost}
            posting={posting}
            successMsg={successMsg}
            postError={postError}
            mrWebUrl={mr.webUrl}
            onOpenDiscussions={onOpenDiscussions}
            findings={toneMode === 'audit' ? reviewResult.findings : undefined}
            summaryText={reviewResult.summary}
            toneMode={toneMode}
          />
        </div>
      )}
    </div>
  );
}
