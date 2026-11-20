import { describe, it, expect } from 'vitest';
import {
  ISSUE_KEYS,
  addBundles,
  collectIssueLocations,
  emptyBundle,
  languageOf,
  per100,
  readIssues,
  scanAddedLines,
  serializeIssues,
  severityOf,
  staticPenalty,
} from '../src/lib/code-issues';

describe('Pemindai statis: aturan per baris', () => {
  it('menemukan secret nyata dan melewati env serta placeholder', () => {
    const result = scanAddedLines('src/config.ts', [
      'const apiKey = "sk_live_abc12345";',
      'const apiKey = process.env.API_KEY ?? "";',
      'const token = "test-token-123456";',
      'const password = "hunter2hunter2";',
      'const awsKey = "AKIAIOSFODNN7EXAMPLE";',
    ]);
    expect(result.counts.secret).toBe(3);
  });

  it('menghitung SQL yang dirangkai, bukan SQL parameter biasa', () => {
    const result = scanAddedLines('src/lib/query.ts', [
      'const a = `SELECT * FROM users WHERE id = ${id}`;',
      'const b = "SELECT * FROM users WHERE id = ?";',
      'const c = "SELECT * FROM users WHERE id = " + id;',
      '// SELECT * FROM users',
    ]);
    expect(result.counts.sqlString).toBe(2);
  });

  it('menghitung catch kosong satu baris dan multi-baris', () => {
    const result = scanAddedLines('src/lib/safe.ts', [
      'try { run(); } catch (e) {}',
      '} catch (err) {',
      '',
      '}',
    ]);
    expect(result.counts.emptyCatch).toBe(2);
  });

  it('mendeteksi debug print, kode di komentar, TODO, dan baris panjang', () => {
    const result = scanAddedLines('src/lib/debug.ts', [
      'console.log("x");',
      'debugger;',
      'var_dump($value);',
      '// const total = computeTotal(items);',
      '// TODO: rapikan nanti',
      '// hasilnya sudah benar',
      `const veryLong = "${'a'.repeat(130)}";`,
    ]);
    expect(result.counts.debugPrint).toBe(3);
    expect(result.counts.commentedCode).toBe(1);
    expect(result.counts.todo).toBe(1);
    expect(result.counts.longLine).toBe(1);
  });

  it('hanya menghitung tipe any pada file TypeScript', () => {
    const lines = ['const rows: any[] = [];', 'const value = input as any;', 'function f(x: any) {}'];
    expect(scanAddedLines('src/lib/a.ts', lines).counts.anyType).toBe(3);
    expect(scanAddedLines('src/lib/a.js', lines).counts.anyType).toBe(0);
  });

  it('menghitung nesting dalam pada kedalaman 5 ke atas saja', () => {
    const result = scanAddedLines('src/lib/nest.ts', [
      '          if (deep) {',
      '        if (notDeep) {',
      '\t\t\t\t\tswitch (x) {',
    ]);
    expect(result.counts.deepNesting).toBe(2);
  });

  it('menghitung duplikasi di dalam file dan melewati baris pendek', () => {
    const result = scanAddedLines('src/lib/dup.ts', [
      'const value = computeSomething(alpha, beta);',
      'const value = computeSomething(alpha, beta);',
      'const value = computeSomething(alpha, beta);',
      'const other = 1;',
    ]);
    expect(result.counts.duplicate).toBe(2);
  });

  it('tidak memindai file non-kode', () => {
    const result = scanAddedLines('README.md', ['apiKey = "sk_live_abc12345"']);
    expect(result.lines).toBe(0);
    expect(result.counts.secret).toBe(0);
  });
});

describe('Pemindai statis: agregasi dan penilaian', () => {
  it('bolak-balik serialisasi issues_json aman dan null tetap netral', () => {
    const bundle = scanAddedLines('src/a.ts', ['console.log("x");', 'const v = 1;']);
    const parsed = readIssues(serializeIssues(bundle));
    expect(parsed).toEqual(bundle);
    expect(readIssues(null)).toBeNull();
    expect(readIssues('bukan json')).toBeNull();
    expect(readIssues('{"lines":3}')).toBeNull();
  });

  it('menjumlahkan bundle per file', () => {
    const a = scanAddedLines('src/a.ts', ['console.log(1);', 'console.log(2);']);
    const b = scanAddedLines('src/b.ts', ['const x: any = 1;']);
    const total = addBundles(a, b);
    expect(total.lines).toBe(3);
    expect(total.counts.debugPrint).toBe(2);
    expect(total.counts.anyType).toBe(1);
    expect(ISSUE_KEYS.every((key) => typeof total.counts[key] === 'number')).toBe(true);
  });

  it('memberi status dari ambang per 100 baris dan aturan secret absolut', () => {
    expect(severityOf('deepNesting', 22, 100)).toBe('critical');
    expect(severityOf('deepNesting', 8, 100)).toBe('warn');
    expect(severityOf('duplicate', 3, 100)).toBe('warn');
    expect(severityOf('debugPrint', 0, 100)).toBe('good');
    expect(severityOf('secret', 1, 100000)).toBe('critical');
    expect(severityOf('secret', 0, 100000)).toBe('good');
    expect(per100(2, 50)).toBe(4);
    expect(per100(1, 0)).toBe(0);
  });

  it('membatasi penalti statis dan menaikkan skor lewat porsi tes', () => {
    const total = emptyBundle();
    total.lines = 1000;
    total.counts.deepNesting = 300;
    total.counts.duplicate = 80;
    total.counts.secret = 40;
    const penalty = staticPenalty(total.counts, total.lines);
    // nesting 30 + duplikat 10 + secret 15 (plafon)
    expect(penalty).toBeCloseTo(55, 0);
    expect(penalty).toBeLessThanOrEqual(100);

    expect(staticPenalty(emptyBundle().counts, 0)).toBe(0);
  });

  it('memetakan ekstensi ke bahasa profil', () => {
    expect(languageOf('src/app/page.tsx')).toBe('TypeScript (React)');
    expect(languageOf('src/app/page.test.tsx')).toBe('TypeScript (React)');
    expect(languageOf('src/lib/a.ts')).toBe('TypeScript');
    expect(languageOf('api/index.php')).toBe('PHP');
    expect(languageOf('db/schema.sql')).toBe('SQL');
    expect(languageOf('styles/a.scss')).toBe('CSS');
    expect(languageOf('README.md')).toBeNull();
  });
});

describe('Pemindai statis: lokasi temuan', () => {
  it('menyimpan nomor baris 1-based dan snippet yang dipangkas', () => {
    const longLine = `const veryLong = "${'a'.repeat(200)}";`;
    const result = scanAddedLines('src/lib/config.ts', [
      'const a = 1;',
      'const apiKey = "sk_live_abc12345";',
      longLine,
    ]);
    expect(result.counts.secret).toBe(1);
    expect(result.loc?.secret).toHaveLength(1);
    expect(result.loc?.secret?.[0].line).toBe(2);
    expect(result.loc?.secret?.[0].snippet).toContain('sk_live_abc12345');
    expect(result.loc?.longLine?.[0].line).toBe(3);
    expect(result.loc?.longLine?.[0].snippet.length).toBeLessThanOrEqual(161);
  });

  it('membatasi 20 lokasi per kategori per file tanpa mengurangi counts', () => {
    const lines = Array.from({ length: 30 }, (_, index) => `console.log(${index});`);
    const result = scanAddedLines('src/lib/debug.ts', lines);
    expect(result.counts.debugPrint).toBe(30);
    expect(result.loc?.debugPrint).toHaveLength(20);
    expect(result.loc?.debugPrint?.[0].line).toBe(1);
    expect(result.loc?.debugPrint?.[19].line).toBe(20);
  });

  it('membaca JSON lama tanpa loc dan menulis versi baru', () => {
    const legacy = JSON.stringify({ lines: 10, counts: { ...emptyBundle().counts, secret: 1 } });
    const parsed = readIssues(legacy);
    expect(parsed?.counts.secret).toBe(1);
    expect(parsed?.loc).toBeUndefined();

    const fresh = serializeIssues({
      lines: 2,
      counts: { ...emptyBundle().counts, todo: 1 },
      loc: { todo: [{ line: 1, snippet: '// TODO: rapikan' }] },
    });
    expect(JSON.parse(fresh).v).toBe(2);
    const roundTrip = readIssues(fresh);
    expect(roundTrip?.loc?.todo?.[0].line).toBe(1);
  });

  it('mengagregasi lokasi lintas file, terbaru dulu, dan melewati file lama', () => {
    const old = JSON.stringify({ lines: 5, counts: { ...emptyBundle().counts, secret: 1 } });
    const rows = [
      {
        sha: 'aaa',
        projectId: 1,
        path: 'src/old.ts',
        authoredAt: '2026-01-01T00:00:00Z',
        issuesJson: old,
      },
      {
        sha: 'bbb',
        projectId: 1,
        path: 'src/new.ts',
        authoredAt: '2026-06-01T00:00:00Z',
        issuesJson: JSON.stringify({
          v: 2,
          lines: 5,
          counts: { ...emptyBundle().counts, secret: 2 },
          loc: {
            secret: [
              { line: 3, snippet: 'const apiKey = "sk_live_abc12345";' },
              { line: 8, snippet: 'const token = "glpat-abcdefghijklmnopqrst";' },
            ],
          },
        }),
      },
    ];

    const details = collectIssueLocations('secret', rows);
    expect(details).toHaveLength(2);
    expect(details[0].sha).toBe('bbb');
    expect(details[0].line).toBe(3);
    expect(details[0].path).toBe('src/new.ts');
    expect(collectIssueLocations('secret', rows, 1)).toHaveLength(1);
  });
});
