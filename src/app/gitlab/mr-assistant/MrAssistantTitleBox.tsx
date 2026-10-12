import { useState } from 'react';
import { Check, Copy, Pencil, X } from 'lucide-react';

interface MrAssistantTitleBoxProps {
  title: string;
  onSaveTitle: (title: string) => void;
}

export function MrAssistantTitleBox({
  title,
  onSaveTitle,
}: MrAssistantTitleBoxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [copied, setCopied] = useState(false);

  const handleStart = () => {
    setEditedTitle(title);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedTitle.trim()) {
      onSaveTitle(editedTitle.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(title);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='bg-surface-subtle border border-border rounded-xl p-3 sm:px-4'>
      <div className='row-between mb-1 items-center'>
        <span className='xs dim font-semibold'>
          REKOMENDASI JUDUL MR (CONVENTIONAL COMMITS)
        </span>
        <div className='flex items-center gap-1.5'>
          {!isEditing ? (
            <>
              <button
                type='button'
                onClick={handleStart}
                className='btn btn-ghost text-[11px] px-2 py-0.5 h-auto gap-1'
                title='Edit judul Merge Request'
              >
                <Pencil size={11} />
                <span>Edit Judul</span>
              </button>
              <button
                type='button'
                onClick={handleCopy}
                className='btn btn-ghost text-[11px] px-2 py-0.5 h-auto gap-1'
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Tersalin' : 'Salin Judul'}</span>
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
        <div className='mono font-bold text-sm text-primary break-words'>
          {title}
        </div>
      ) : (
        <div className='mt-1.5'>
          <input
            type='text'
            className='input mono w-full text-[13px] font-semibold px-2.5 py-1.5 bg-surface'
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
            placeholder='Masukkan format judul MR...'
          />
          <span className='xs dim block mt-1'>
            Tekan Enter untuk menyimpan, Esc untuk membatalkan
          </span>
        </div>
      )}
    </div>
  );
}
