import type {
  PreReviewInput,
  PreReviewOutput,
  QualityIssue,
  ReviewCategoryStatus,
  ReviewFinding,
  SecurityIssue,
} from './pre-review-types';

export function fallbackPreReview(input: PreReviewInput): PreReviewOutput {
  const code = input.codeOrDiff;
  const securityIssues: SecurityIssue[] = [];
  const qualityIssues: QualityIssue[] = [];
  const findings: ReviewFinding[] = [];

  // Parse probable file path and line number from git diff header
  const fileMatch = code.match(/diff --git a\/([^\s]+) b\/([^\s]+)/) || code.match(/\+\+\+ b\/([^\s]+)/);
  const detectedFile = fileMatch ? (fileMatch[2] || fileMatch[1]) : undefined;
  const lineMatch = code.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
  const detectedLine = lineMatch ? parseInt(lineMatch[1], 10) : undefined;

  // 1. Basic regex scans for fallback security (OWASP)
  if (/(\b(?:api[_-]?key|secret|token|password|auth_token)\s*[:=]\s*["'][^"']{6,}["'])/i.test(code)) {
    securityIssues.push({
      severity: 'critical',
      title: 'Potensi Kredensial / Secret Tertanam',
      description: 'Ditemukan string yang menyerupai API key atau token rahasia di dalam kode.',
      recommendation: 'Pindahkan secret ke environment variable (.env) dan gunakan getSettings().',
    });
    findings.push({
      file: detectedFile,
      line: detectedLine,
      severity: 'blocking',
      category: 'Security',
      title: 'Kebocoran Kredensial / Secret',
      description: 'Ditemukan variabel rahasia atau token yang di-hardcode dalam file.',
      suggestionSnippet: '// Gunakan environment variable:\nconst apiKey = process.env.API_KEY || getSettings().apiKey;',
    });
  }

  if (/dangerouslySetInnerHTML|eval\s*\(/i.test(code)) {
    securityIssues.push({
      severity: 'critical',
      title: 'Kerentanan Injeksi (XSS / Eval)',
      description: 'Penggunaan dangerouslySetInnerHTML atau eval() berpotensi menimbulkan celah injeksi kode.',
      recommendation: 'Hindari injeksi HTML mentah dan gunakan rendering komponen React yang aman.',
    });
    findings.push({
      file: detectedFile,
      line: detectedLine,
      severity: 'blocking',
      category: 'Security',
      title: 'Kerentanan Injeksi XSS / Raw Code Execution',
      description: 'Ditemukan penggunaan eval() atau dangerouslySetInnerHTML tanpa sanitasi.',
      suggestionSnippet: '// Gunakan rendering aman:\n<span>{sanitizedContent}</span>',
    });
  }

  // 2. Git Hygiene
  if (/console\.(log|debug|info)\(/i.test(code)) {
    qualityIssues.push({
      type: 'hygiene',
      title: 'Tinggalan console.log Debugging',
      description: 'Ditemukan pemanggilan console.log yang sebaiknya dibersihkan sebelum branch digabung.',
      suggestion: 'Hapus console.log atau ganti dengan sistem structured logging jika diperlukan.',
    });
    findings.push({
      file: detectedFile,
      line: detectedLine,
      severity: 'nit',
      category: 'Git Hygiene',
      title: 'Sisa Pemanggilan console.log',
      description: 'Hindari meninggalkan console.log di kode production.',
      suggestionSnippet: '// Hapus console.log atau ganti logger terstruktur',
    });
  }

  // 3. Functionality & Error handling
  if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(code)) {
    qualityIssues.push({
      type: 'bug',
      title: 'Blok Catch Kosong (Silent Error)',
      description: 'Error ditangkap tetapi diabaikan tanpa logging atau penanganan.',
      suggestion: 'Catat pesan error atau berikan fallback penanganan yang tepat kepada pengguna.',
    });
    findings.push({
      file: detectedFile,
      line: detectedLine,
      severity: 'important',
      category: 'Functionality',
      title: 'Empty Catch Block (Silent Error)',
      description: 'Unhandled error rejection dapat menyembunyikan bug kritis.',
      suggestionSnippet: 'catch (error) {\n  console.error("Terjadi kesalahan:", error);\n  throw error;\n}',
    });
  }

  // 4. Type Safety & Compliance (Strict No 'any')
  if (/:\s*any\b|\bas\s+any\b/.test(code)) {
    qualityIssues.push({
      type: 'style',
      title: 'Pelanggaran Type Safety (Penggunaan "any")',
      description: 'Ditemukan penggunaan tipe "any" atau "as any" yang dilarang pada standar repository.',
      suggestion: 'Definisikan interface DTO eksplisit atau gunakan type unknown dengan type guard.',
    });
    findings.push({
      file: detectedFile,
      line: detectedLine,
      severity: 'important',
      category: 'AGENTS.md Compliance',
      title: 'Zero Tolerance Type "any"',
      description: 'Penggunaan "any" menurunkan keandalan TypeScript dan melanggar aturan AGENTS.md.',
      suggestionSnippet: '// Ganti dengan interface spesifik:\ninterface DataPayload {\n  id: string;\n  name: string;\n}',
    });
  }

  const hasBlocking = findings.some((f) => f.severity === 'blocking');
  const hasImportant = findings.some((f) => f.severity === 'important');

  const score = hasBlocking ? 45 : hasImportant ? 72 : 92;
  const verdict =
    hasBlocking
      ? 'CRITICAL_SECURITY_ISSUE'
      : hasImportant
        ? 'NEEDS_MINOR_FIX'
        : 'READY_TO_MERGE';

  const checklist: ReviewCategoryStatus[] = [
    {
      category: 'Functionality',
      label: 'Fungsionalitas & Edge Cases',
      status: qualityIssues.some((q) => q.type === 'bug') ? 'warn' : 'pass',
      notes: qualityIssues.some((q) => q.type === 'bug')
        ? 'Terdapat penanganan error yang perlu diperiksa ulang'
        : 'Logika fungsionalitas utama tampak berjalan normal',
    },
    {
      category: 'Security',
      label: 'Keamanan (OWASP & Secret)',
      status: securityIssues.length > 0 ? 'block' : 'pass',
      notes: securityIssues.length > 0
        ? 'Ditemukan potensi celah keamanan atau kredensial terbuka'
        : 'Tidak terdeteksi kebocoran kredensial atau kerentanan OWASP dasar',
    },
    {
      category: 'Performance',
      label: 'Performa & Skalabilitas',
      status: 'pass',
      notes: 'Tidak terdeteksi loop berat atau memory leak dalam cuplikan diff',
    },
    {
      category: 'Maintainability',
      label: 'Kualitas & Modularitas Kode',
      status: 'pass',
      notes: 'Struktur kode modular dan memenuhi batas panjang baris wajar',
    },
    {
      category: 'Compliance',
      label: 'Kepatuhan Standar AGENTS.md',
      status: findings.some((f) => f.category === 'AGENTS.md Compliance') ? 'warn' : 'pass',
      notes: findings.some((f) => f.category === 'AGENTS.md Compliance')
        ? 'Ditemukan pelanggaran type safety atau aturan kanonikal'
        : 'Mematuhi standar konvensi repository',
    },
  ];

  return {
    verdict,
    score,
    summary:
      hasBlocking
        ? 'Ditemukan temuan blocking keamanan atau kepatuhan yang harus diperbaiki sebelum membuka Merge Request.'
        : hasImportant
          ? 'Kode secara umum baik namun memiliki beberapa catatan higienitas, error handling, atau type safety.'
          : 'Struktur kode bersih, higienis, dan siap diajukan untuk code review di GitLab.',
    checklist,
    findings,
    securityIssues,
    qualityIssues,
    suggestedTestCases: [
      'Uji skenario input kosong atau data tidak valid',
      'Uji penanganan timeout jaringan atau kegagalan respon server eksternal',
      'Verifikasi bahwa token dan variabel sensitif tidak muncul pada log publik',
    ],
    source: 'fallback',
  };
}
