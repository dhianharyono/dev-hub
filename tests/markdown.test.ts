import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Markdown } from '../src/components/Markdown';

describe('Markdown Component', () => {
  it('renders review tags as styled badges', () => {
    const html = renderToStaticMarkup(
      Markdown({ text: '**non-blocking**: silakan perbaiki nanti.' })
    );
    expect(html).toContain('badge badge-cyan');
    expect(html).toContain('non-blocking');
  });

  it('renders inline code with monospace styling', () => {
    const html = renderToStaticMarkup(
      Markdown({ text: 'Periksa variabel `data.target.expectedPace` di baris 246.' })
    );
    expect(html).toContain('<code');
    expect(html).toContain('data.target.expectedPace');
  });

  it('renders code fences with syntax block container', () => {
    const sample = '```ts\nconst x = 1;\n```';
    const html = renderToStaticMarkup(Markdown({ text: sample }));
    expect(html).toContain('<pre');
    expect(html).toContain('const x = 1;');
    expect(html).toContain('TS');
  });

  it('renders blockquotes and bold tags', () => {
    const sample = '> Ini adalah **kutipan penting**.';
    const html = renderToStaticMarkup(Markdown({ text: sample }));
    expect(html).toContain('<blockquote');
    expect(html).toContain('<strong');
    expect(html).toContain('kutipan penting');
  });
});
