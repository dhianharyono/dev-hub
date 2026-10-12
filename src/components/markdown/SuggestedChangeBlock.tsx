import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface SuggestedChangeBlockProps {
  code: string;
}

export function SuggestedChangeBlock({ code }: SuggestedChangeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className='my-3 rounded-md border border-slate-300 overflow-hidden bg-(--surface,#ffffff)'>
      {/* Header matching GitLab */}
      <div className='flex items-center justify-between py-1.5 px-3 bg-(--surface-subtle,#f8fafc) border-b border-slate-300 text-xs text-(--text-2,#334155) font-semibold'>
        <div className='flex items-center gap-1.5'>
          <span>Suggested change</span>
          <HelpCircle size={13} className='text-slate-500' />
        </div>

        <button
          type='button'
          onClick={handleCopy}
          className='text-[11.5px] py-[3px] px-2 bg-(--surface,#ffffff) border border-slate-300 rounded text-(--text,#334155) cursor-pointer flex items-center gap-1'
          title='Salin saran perubahan'
        >
          <span>{copied ? 'Tersalin' : 'Apply suggestion ▾'}</span>
        </button>
      </div>

      {/* Code diff lines */}
      <div className='font-(family-name:--font-mono,monospace) text-xs leading-[1.55]'>
        {lines.map((l, i) => (
          <div
            key={i}
            className='flex items-stretch bg-green-50 text-green-700 border-l-[3px] border-green-500'
          >
            <span className='w-[38px] py-[3px] px-2 text-center select-none text-green-600 text-[11px] border-r border-green-200 bg-green-100'>
              +
            </span>
            <span className='py-[3px] px-2.5 whitespace-pre overflow-x-auto flex-1'>
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
