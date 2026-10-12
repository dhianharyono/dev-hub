import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MrAssistantDescriptionBoxProps {
  description: string;
  activeTab: 'preview' | 'raw';
}

export function MrAssistantDescriptionBox({
  description,
  activeTab,
}: MrAssistantDescriptionBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='flex-1 border border-border rounded-xl overflow-hidden flex flex-col'>
      <div className='row-between px-3.5 py-2 bg-surface-subtle border-b border-border items-center'>
        <span className='xs dim font-semibold'>
          DESKRIPSI LENGKAP MERGE REQUEST
        </span>
        <button
          type='button'
          onClick={handleCopy}
          className='btn btn-primary btn-sm text-[11px] px-2.5 py-1 h-auto gap-1'
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Tersalin' : 'Salin Markdown'}</span>
        </button>
      </div>

      <div className='p-4 overflow-y-auto max-h-[340px] bg-surface'>
        {activeTab === 'raw' ? (
          <pre className='mono text-xs m-0 whitespace-pre-wrap text-slate-text'>
            {description}
          </pre>
        ) : (
          <div className='text-[13px] leading-relaxed text-slate-text whitespace-pre-wrap'>
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
