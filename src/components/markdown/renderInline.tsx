import { Fragment, type ReactNode } from 'react';

export function renderInlineSingle(text: string): ReactNode[] {
  const pattern =
    /(\*\*(?:non-blocking|blocking|important|nit|suggestion|ready to merge|needs minor fix|critical)\*\*|\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/gi;

  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

    // 1. Tag or Bold
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2).trim();
      const lower = inner.toLowerCase();

      // GitLab style badges for review tags
      if (
        [
          'non-blocking',
          'blocking',
          'important',
          'nit',
          'suggestion',
          'ready to merge',
        ].includes(lower)
      ) {
        const badgeClass =
          lower === 'blocking'
            ? 'badge badge-rose'
            : lower === 'non-blocking'
              ? 'badge badge-cyan'
              : 'badge badge-neutral';
        return (
          <span
            key={idx}
            className={`${badgeClass} xs text-[11px] font-bold py-px px-1.5 uppercase`}
          >
            {inner}
          </span>
        );
      }

      return (
        <strong key={idx} className='font-[650] text-(--text)'>
          {inner}
        </strong>
      );
    }

    // 2. Inline Code matching GitLab style (Dark slate text, subtle border, gray background)
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className='bg-(--surface-subtle,#f1f5f9) text-(--text,#0f172a) py-0.5 px-[5px] rounded border border-(--border,#e2e8f0) font-(family-name:--font-mono,monospace) text-xs break-words'
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 3. Link
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        const rawHref = match[2].trim();
        const isSafe = /^(https?:|\/|mailto:)/i.test(rawHref);
        const safeHref = isSafe ? rawHref : '#';
        return (
          <a
            key={idx}
            href={safeHref}
            target='_blank'
            rel='noopener noreferrer'
            className='text-(--primary) underline'
          >
            {match[1]}
          </a>
        );
      }
    }

    // 4. Italic
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }

    return <Fragment key={idx}>{part}</Fragment>;
  });
}

export function renderInline(text: string): ReactNode {
  const lines = text.split('\n');
  if (lines.length > 1) {
    return lines.map((line, i) => (
      <Fragment key={i}>
        {renderInlineSingle(line)}
        {i < lines.length - 1 && <br />}
      </Fragment>
    ));
  }
  return renderInlineSingle(text);
}
