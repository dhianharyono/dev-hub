import { useState } from 'react';
import { Check, Copy, Pencil, X } from 'lucide-react';

interface MrAssistantReleaseBoxProps {
  releaseNotes: string;
  onSaveReleaseNotes: (notes: string) => void;
}

export function MrAssistantReleaseBox({
  releaseNotes,
  onSaveReleaseNotes,
}: MrAssistantReleaseBoxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRelease, setEditedRelease] = useState(releaseNotes);
  const [copied, setCopied] = useState(false);

  const handleStart = () => {
    setEditedRelease(releaseNotes);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSaveReleaseNotes(editedRelease.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(releaseNotes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='bg-surface-subtle border border-border rounded-xl p-3 sm:px-4'>
      <div className='row-between mb-1 items-center'>
        <span className='xs dim font-semibold'>
          CATATAN RILIS / RINGKASAN QA
        </span>
        <div className='flex items-center gap-1.5'>
          {!isEditing ? (
            <>
              <button
                type='button'
                onClick={handleStart}
                className='btn btn-ghost text-[11px] px-2 py-0.5 h-auto gap-1'
                title='Edit ringkasan catatan rilis'
              >
                <Pencil size={11} />
                <span>Edit Ringkasan</span>
              </button>
              <button
                type='button'
                onClick={handleCopy}
                className='btn btn-ghost text-[11px] px-2 py-0.5 h-auto gap-1'
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type='button'
                onClick={handleSave}
                className='btn btn-primary text-[11px] px-2.5 py-1 h-auto gap-1 rounded-md'
              >
                <Check size={12} />
                <span>Simpan</span>
              </button>
              <button
                type='button'
                onClick={handleCancel}
                className='btn btn-ghost text-[11px] px-2 py-1 h-auto gap-1'
              >
                <X size={12} />
                <span>Batal</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!isEditing ? (
        <p className='text-[12.5px] text-slate-text-2 m-0 leading-snug'>
          {releaseNotes}
        </p>
      ) : (
        <div className='mt-1.5'>
          <textarea
            className='input w-full text-[12.5px] p-2 sm:px-2.5 bg-surface leading-snug resize-y'
            value={editedRelease}
            onChange={(e) => setEditedRelease(e.target.value)}
            rows={3}
            autoFocus
            placeholder='Tulis ringkasan catatan rilis...'
          />
        </div>
      )}
    </div>
  );
}
