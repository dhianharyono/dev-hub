'use client';

import { Bot, Copy, RefreshCw, Save, Sparkles } from 'lucide-react';
import type { ReleaseNoteResultDraft } from './types';

interface ReleaseNoteResultsProps {
  result: ReleaseNoteResultDraft | null;
  regenerating: boolean;
  saving: boolean;
  onChangeContent: (value: string) => void;
  onCopy: (content: string) => void;
  onRegenerate: () => void;
  onSave: () => void;
}

export function ReleaseNoteResults({
  result,
  regenerating,
  saving,
  onChangeContent,
  onCopy,
  onRegenerate,
  onSave,
}: ReleaseNoteResultsProps) {
  if (!result) return null;

  return (
    <section className='card'>
      <div className='flex items-start justify-between gap-3 flex-wrap mb-3'>
        <div>
          <div className='flex items-center gap-2 flex-wrap'>
            <h2 className='text-base font-extrabold tracking-tight m-0'>
              {result.title}
            </h2>
            <span className='badge'>{result.mrIids.length} MR</span>
            {result.usedAi ? (
              <span className='badge badge-cyan inline-flex items-center gap-1'>
                <Bot size={11} />
                AI
              </span>
            ) : (
              <span className='badge inline-flex items-center gap-1'>
                <Sparkles size={11} />
                Template
              </span>
            )}
          </div>
          <p className='xs dim mt-1 mb-0'>{result.projectPath}</p>
          {result.mrIids.length > 0 && (
            <p className='xs dim mt-1 mb-0'>
              {result.mrIids.length} MR dipakai:{' '}
              {result.mrIids.map((iid) => `!${iid}`).join(', ')}
            </p>
          )}
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          <button
            type='button'
            className='btn btn-sm btn-ghost border border-border gap-1.5'
            onClick={() => onCopy(result.content)}
          >
            <Copy size={13} />
            <span>Copy</span>
          </button>
          <button
            type='button'
            className='btn btn-sm btn-ghost border border-border gap-1.5'
            onClick={onRegenerate}
            disabled={regenerating || saving}
          >
            {regenerating ? (
              <span className='spinner w-3 h-3' />
            ) : (
              <RefreshCw size={13} />
            )}
            <span>Regenerate</span>
          </button>
          <button
            type='button'
            className='btn btn-sm btn-primary gap-1.5'
            onClick={onSave}
            disabled={saving || regenerating}
          >
            {saving ? <span className='spinner w-3 h-3' /> : <Save size={13} />}
            <span>Simpan</span>
          </button>
        </div>
      </div>

      <label htmlFor='release-note-content' className='field-label'>
        Hasil Release Note (bisa diedit)
      </label>
      <textarea
        id='release-note-content'
        className='textarea w-full font-mono text-[12.5px] leading-relaxed'
        rows={20}
        value={result.content}
        onChange={(e) => onChangeContent(e.target.value)}
        spellCheck={false}
      />
    </section>
  );
}
