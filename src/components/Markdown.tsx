'use client';

import { type ReactNode } from 'react';
import { CodeBlock } from './markdown/CodeBlock';
import { renderInline } from './markdown/renderInline';

interface MarkdownProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Markdown({ text, className, style }: MarkdownProps) {
  if (!text) return null;

  const rawLines = text.split('\n');
  const blocks: ReactNode[] = [];

  let inCode = false;
  let codeLang = '';
  let codeBuffer: string[] = [];
  let listBuffer: ReactNode[] = [];
  let quoteBuffer: string[] = [];
  let paraBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push(
        <ul
          key={`ul-${blocks.length}`}
          className='pl-5 mt-1.5 mb-2.5 flex flex-col gap-1'
        >
          {listBuffer}
        </ul>,
      );
      listBuffer = [];
    }
  };

  const flushQuote = () => {
    if (quoteBuffer.length > 0) {
      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className='my-2 py-2 px-3.5 border-l-[3px] border-(--primary) bg-(--surface-subtle,rgba(25,119,243,0.04)) rounded-r-md text-[12.5px] text-(--text-2) not-italic'
        >
          {quoteBuffer.map((q, idx) => (
            <p key={idx} className='my-[3px]'>
              {renderInline(q)}
            </p>
          ))}
        </blockquote>,
      );
      quoteBuffer = [];
    }
  };

  const flushPara = () => {
    if (paraBuffer.length > 0) {
      const content = paraBuffer.join('\n');
      blocks.push(
        <p key={`p-${blocks.length}`} className='my-1.5 leading-[1.6]'>
          {renderInline(content)}
        </p>,
      );
      paraBuffer = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Fenced Code Block
    const codeMatch = line.match(/^```(\w*)/);
    if (codeMatch && !inCode) {
      flushList();
      flushQuote();
      flushPara();
      inCode = true;
      codeLang = codeMatch[1] || '';
      codeBuffer = [];
      continue;
    } else if (line.trim().startsWith('```') && inCode) {
      inCode = false;
      blocks.push(
        <CodeBlock
          key={`code-${blocks.length}`}
          code={codeBuffer.join('\n')}
          language={codeLang}
        />,
      );
      codeBuffer = [];
      codeLang = '';
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      flushList();
      flushQuote();
      flushPara();
      blocks.push(
        <hr
          key={`hr-${blocks.length}`}
          className='border-0 border-t border-(--border) my-3'
        />,
      );
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      flushQuote();
      flushPara();
      const level = headingMatch[1].length;
      const sizeClass =
        level === 1
          ? 'text-base'
          : level === 2
            ? 'text-[15px]'
            : level === 3
              ? 'text-sm'
              : 'text-[13px]';
      blocks.push(
        <h4
          key={`h-${blocks.length}`}
          className={`${sizeClass} font-bold mt-3 mb-1.5 text-(--text)`}
        >
          {renderInline(headingMatch[2])}
        </h4>,
      );
      continue;
    }

    // Blockquote
    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushList();
      flushPara();
      quoteBuffer.push(quoteMatch[1]);
      continue;
    } else {
      flushQuote();
    }

    // Bullet List
    const listMatch = line.match(/^\s*[-*•]\s+(.+)$/);
    if (listMatch) {
      flushPara();
      listBuffer.push(
        <li key={`li-${listBuffer.length}`} className='text-[12.5px] leading-normal'>
          {renderInline(listMatch[1])}
        </li>,
      );
      continue;
    } else {
      flushList();
    }

    if (!line.trim()) {
      flushPara();
      continue;
    }

    paraBuffer.push(line);
  }

  if (inCode && codeBuffer.length > 0) {
    blocks.push(
      <CodeBlock
        key={`code-${blocks.length}`}
        code={codeBuffer.join('\n')}
        language={codeLang}
      />,
    );
  }
  flushList();
  flushQuote();
  flushPara();

  return (
    <div
      className={`text-[12.5px] leading-[1.6] text-(--text) ${className ?? ''}`}
      style={style}
    >
      {blocks}
    </div>
  );
}

export default Markdown;
