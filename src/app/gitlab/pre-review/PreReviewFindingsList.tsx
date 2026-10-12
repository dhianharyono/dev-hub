import { useState } from 'react';
import { Check, Copy, FileCode2 } from 'lucide-react';
import type { PreReviewOutput } from './types';

interface PreReviewFindingsListProps {
  findings: PreReviewOutput['findings'];
}

export function PreReviewFindingsList({
  findings,
}: PreReviewFindingsListProps) {
  const [copiedSnippetIdx, setCopiedSnippetIdx] = useState<number | null>(null);

  const handleCopySnippet = (snippet: string, idx: number) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetIdx(idx);
    setTimeout(() => setCopiedSnippetIdx(null), 2000);
  };

  if (!findings || findings.length === 0) return null;

  return (
    <div>
      <div className='row xs dim font-semibold mb-2 gap-1.5'>
        <FileCode2 size={14} className='text-primary' />
        <span>TEMUAN AUDIT &amp; SOLUSI PERBAIKAN ({findings.length})</span>
      </div>
      <div className='flex flex-col gap-2.5'>
        {findings.map((f, idx) => {
          const cardStyles =
            f.severity === 'blocking'
              ? 'border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30'
              : f.severity === 'important'
                ? 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30'
                : 'border-border bg-surface';

          return (
            <div
              key={idx}
              className={`p-3 sm:px-3.5 rounded-lg border flex flex-col gap-1.5 ${cardStyles}`}
            >
              <div className='row-between flex-wrap gap-1.5'>
                <div className='flex items-center gap-1.5'>
                  <span
                    className={`badge ${
                      f.severity === 'blocking'
                        ? 'badge-red'
                        : f.severity === 'important'
                          ? 'badge-amber'
                          : f.severity === 'nit'
                            ? 'badge-cyan'
                            : 'badge-purple'
                    } xs`}
                  >
                    {f.severity === 'blocking'
                      ? '🔴 BLOCKING'
                      : f.severity === 'important'
                        ? '🟡 IMPORTANT'
                        : f.severity === 'nit'
                          ? '🟢 NIT'
                          : '💡 SUGGESTION'}
                  </span>
                  <span className='badge badge-neutral xs'>{f.category}</span>
                  {f.file && (
                    <span className='badge badge-cyan xs font-mono'>
                      {f.file}
                      {f.line ? `:${f.line}` : ''}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <strong className='text-[13px] text-slate-text'>
                  {f.title}
                </strong>
                <p className='text-xs text-slate-text-2 mt-0.5 mb-0 leading-normal'>
                  {f.description}
                </p>
              </div>

              {f.suggestionSnippet && (
                <div className='relative bg-slate-900 text-slate-50 p-2.5 sm:px-3 rounded-md text-[11.5px] font-mono overflow-x-auto mt-0.5'>
                  <button
                    type='button'
                    onClick={() => handleCopySnippet(f.suggestionSnippet!, idx)}
                    className='absolute top-1.5 right-1.5 bg-white/15 border-none text-white rounded px-1.5 py-0.5 cursor-pointer text-[11px] flex items-center gap-1'
                  >
                    {copiedSnippetIdx === idx ? (
                      <Check size={11} />
                    ) : (
                      <Copy size={11} />
                    )}
                    <span>
                      {copiedSnippetIdx === idx ? 'Disalin' : 'Salin Snippet'}
                    </span>
                  </button>
                  <pre className='m-0 whitespace-pre-wrap'>
                    {f.suggestionSnippet}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
