'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { DiffContext } from './types';

interface GitlabDiffSnippetProps {
  diffContext: DiffContext;
}

export function GitlabDiffSnippet({ diffContext }: GitlabDiffSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(diffContext.filePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='my-2.5 mb-3.5 border border-border rounded-md overflow-hidden bg-surface'>
      {/* File Header matching GitLab */}
      <div className='flex items-center justify-between px-3 py-1.5 bg-surface-subtle border-b border-border text-xs text-slate-text font-mono font-semibold'>
        <span className='break-all'>{diffContext.filePath}</span>
        <button
          type='button'
          onClick={handleCopyPath}
          className='bg-transparent border-none cursor-pointer px-1.5 py-0.5 text-slate-text-3 flex items-center gap-1 rounded'
          title='Salin path berkas'
        >
          {copied ? <Check size={12} className='text-emerald-600' /> : <Copy size={12} />}
          <span className='text-[11px]'>{copied ? 'Tersalin' : ''}</span>
        </button>
      </div>

      {/* Diff Table */}
      {diffContext.lines && diffContext.lines.length > 0 && (
        <div className='overflow-x-auto font-mono text-xs leading-normal'>
          <table className='w-full border-collapse whitespace-pre'>
            <tbody>
              {diffContext.lines.map((line, idx) => {
                const isAddition = line.type === 'addition';
                const isDeletion = line.type === 'deletion';

                return (
                  <tr
                    key={idx}
                    className={
                      isAddition
                        ? 'bg-emerald-50 dark:bg-emerald-950/30'
                        : isDeletion
                          ? 'bg-rose-50 dark:bg-rose-950/30'
                          : 'bg-transparent'
                    }
                  >
                    {/* Old line number */}
                    <td
                      className={`w-[42px] min-w-[42px] text-right py-px px-2 select-none text-[11px] border-r border-border ${
                        isAddition
                          ? 'bg-emerald-100 text-slate-400 dark:bg-emerald-900/50'
                          : isDeletion
                            ? 'bg-rose-100 text-slate-400 dark:bg-rose-900/50'
                            : 'bg-surface-subtle text-slate-400'
                      }`}
                    >
                      {line.oldLineNumber || ''}
                    </td>

                    {/* New line number */}
                    <td
                      className={`w-[42px] min-w-[42px] text-right py-px px-2 select-none text-[11px] border-r border-border ${
                        isAddition
                          ? 'bg-emerald-100 text-slate-400 dark:bg-emerald-900/50'
                          : isDeletion
                            ? 'bg-rose-100 text-slate-400 dark:bg-rose-900/50'
                            : 'bg-surface-subtle text-slate-400'
                      }`}
                    >
                      {line.newLineNumber || ''}
                    </td>

                    {/* Diff prefix (+ / - / space) */}
                    <td
                      className={`w-[18px] min-w-[18px] text-center py-px px-1 font-semibold select-none ${
                        isAddition
                          ? 'text-emerald-600'
                          : isDeletion
                            ? 'text-rose-600'
                            : 'text-slate-400'
                      }`}
                    >
                      {isAddition ? '+' : isDeletion ? '-' : ' '}
                    </td>

                    {/* Code Content */}
                    <td className='py-px px-2 text-slate-text w-full'>
                      {line.content}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
