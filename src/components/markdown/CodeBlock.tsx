import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { SuggestedChangeBlock } from './SuggestedChangeBlock';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  if (language && language.toLowerCase().startsWith('suggestion')) {
    return <SuggestedChangeBlock code={code} />;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='my-2.5 rounded-md border border-(--border,#e2e8f0) overflow-hidden bg-(--surface-subtle,#f8fafc)'>
      <div className='flex items-center justify-between py-[5px] px-3 bg-black/[0.03] border-b border-(--border,#e2e8f0) text-[11px] font-(family-name:--font-mono,monospace) text-(--text-3,#64748b)'>
        <span className='font-semibold tracking-[0.04em]'>
          {language ? language.toUpperCase() : 'CODE'}
        </span>
        <button
          type='button'
          onClick={handleCopy}
          className='bg-transparent border-0 cursor-pointer text-[11px] text-(--text-2,#475569) flex items-center gap-1 py-0.5 px-1.5 rounded'
          title='Salin potongan kode'
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          <span>{copied ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>
      <pre className='m-0 py-3 px-3.5 font-(family-name:--font-mono,monospace) text-xs leading-[1.55] overflow-x-auto text-(--text,#1e293b)'>
        <code>{code}</code>
      </pre>
    </div>
  );
}
