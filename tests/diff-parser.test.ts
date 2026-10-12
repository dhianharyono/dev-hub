import { describe, it, expect } from 'vitest';
import { extractDiffSnippet } from '../src/lib/diff-parser';

describe('extractDiffSnippet', () => {
  const sampleDiff = `@@ -144,3 +159,8 @@
 const topBumn = unwrap(m2.top_bumn) || '-';

 // M4 (Target GMV & Rev)
+const targetMetrics = extractTargetMetrics(m4Rows, gmvPeriod, revenue);
+const heroTarget = extractHeroTarget(
+  isHarian ? m4HeroRows : m4Rows,
+  gmvPeriod,
+  targetMetrics,`;

  it('correctly maps addition and context lines around new line number', () => {
    const res = extractDiffSnippet(
      sampleDiff,
      'src/lib/insight-v2/insight-v2-service.ts',
      166,
      null,
      3,
    );

    expect(res.filePath).toBe('src/lib/insight-v2/insight-v2-service.ts');
    expect(res.lines.length).toBeGreaterThan(0);

    const additions = res.lines.filter((l) => l.type === 'addition');
    expect(additions.length).toBeGreaterThan(0);
    expect(additions[0].content).toContain('const targetMetrics');
  });

  it('handles empty diff gracefully', () => {
    const res = extractDiffSnippet('', 'foo.ts', 10, null);
    expect(res.filePath).toBe('foo.ts');
    expect(res.lines).toEqual([]);
  });
});
