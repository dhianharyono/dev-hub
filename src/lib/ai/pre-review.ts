import 'server-only';
import { runAiCompletion, extractJsonFromAiResponse } from './client';
import { getSettings } from '../settings';
import { fallbackPreReview } from './pre-review-fallback';
import type { PreReviewInput, PreReviewOutput } from './pre-review-types';

export async function preReviewCodeSecurity(
  input: PreReviewInput,
): Promise<PreReviewOutput> {
  const s = getSettings();
  const hasAi = Boolean(s.aiApiKey || s.geminiApiKey || s.aiProvider === 'custom');
  if (!hasAi) {
    return fallbackPreReview(input);
  }

  const system = `Kamu adalah Senior AppSec Engineer dan Principal Code Reviewer di institusi teknologi enterprise, yang menerapkan standar baku checklist senior review dari skill code-review.
Tugasmu adalah menganalisis Git Diff atau kode sebelum dibuatkan Merge Request (Pre-review Audit).

Checklist Evaluasi Wajib (Berdasarkan code-review SKILL.md):
1. Functionality & Logic:
   - Apakah perubahan memecahkan masalah dengan tepat?
   - Penanganan edge cases (null, undefined, koleksi kosong, boundary limits).
   - Penanganan error yang elegan (tidak ada silent error / empty catch).
2. Security (OWASP Standard):
   - Injeksi: tidak boleh ada konkatenasi raw SQL, dangerouslySetInnerHTML, atau eval().
   - Secrets: dilarang keras hardcoded API key, token, kredensial, JWT secret (harus di .env).
   - Otorisasi dan validasi input.
3. Performance & Scalability:
   - Tidak ada operasi berat / query database di dalam looping (N+1 queries).
   - Cleanup memory leak, unclosed stream/database connection, event listeners.
4. Code Quality & Modularity (Maintainability):
   - Naming yang intentional dan deskriptif.
   - Prinsip DRY & SOLID.
   - Universal Line Limit: batasan file < 250-300 baris. File melebihi 300 baris wajib ditandai [blocking].
5. Git & Hygiene:
   - Pembersihan debug: hapus console.log, debugger, dead code yang dikomentari, dan unaddressed TODO.
6. Repository Standards & AGENTS.md Compliance:
   - Universal Anti-Monolith Ceiling (< 250-300 baris).
   - Feature Locality & Safe Sub-Path Imports.
   - Type Safety: Zero tolerance untuk tipe "any" atau unsafe casting "as any".
   - Tailwind CSS v4: gunakan token kanonikal, linear gradients v4 (bg-linear-to-*), hindari arbitrary brackets bg-[var(...)].
   - Shared UI Components (Modal portal, Toast, DropdownFilter).
   - Database Transaction Safety (BEGIN, COMMIT, ROLLBACK).

Sistem Label Severity:
- "blocking": Isu kritis yang harus diperbaiki sebelum merge (kerentanan keamanan, kebocoran secret, fatal bug, build-breaking).
- "non-blocking": Masalah fungsional, timeout, degradasi aman, atau edge-case error handling yang penting diperbaiki namun tidak langsung mematikan aplikasi.
- "important": Disarankan untuk diperbaiki (arsitektur modular, potensi race-condition, query optimization).
- "nit": Polish minor (penamaan, typo komentar, sisa debug, styling).
- "suggestion": Alternatif desain atau ide optimasi lebih lanjut.

Aturan Evaluasi:
- Berikan skor 0 - 100 berdasarkan kebersihan, keamanan, dan kepatuhan standar.
- Tentukan status untuk 5 kategori: Functionality, Security, Performance, Maintainability, Compliance (pass / warn / block).
- Tentukan verdict:
  * "READY_TO_MERGE" jika skor >= 85 dan tidak ada isu blocking.
  * "NEEDS_MINOR_FIX" jika ada warning menengah atau isu non-blocking (skor 60-84).
  * "CRITICAL_SECURITY_ISSUE" jika ditemukan secret bocor atau blocking security (skor < 60).
- Ekstraksi Baris Diff Wajib: Identifikasi persis nama file (misal: "src/lib/telegram/client.ts") dan nomor baris baru (line number dari tanda "+" pada hunk diff) agar komentar dapat diposting tepat sebagai inline thread pada diff Merge Request di GitLab.
- Format Uraian Temuan: Jelaskan akar masalah secara mendalam (dampak runtime, skenario kegagalan), berikan solusi cuplikan kode yang konkret di suggestionSnippet, dan bila relevan sertakan penjelasan verifikasi.
- Bahasa Indonesia profesional, edukatif, tegas, konstruktif, tanpa tanda hubung em dash.`;

  const prompt = `Bahasa Pemrograman: ${input.language || 'TypeScript/JavaScript'}
Konteks Tambahan: ${input.context || 'Perubahan kode branch sebelum MR'}

Kode atau Git Diff untuk di-review:
"""
${input.codeOrDiff.slice(0, 8000)}
"""`;

  const jsonSchema = {
    type: 'object',
    properties: {
      verdict: {
        type: 'string',
        enum: ['READY_TO_MERGE', 'NEEDS_MINOR_FIX', 'CRITICAL_SECURITY_ISSUE'],
      },
      score: { type: 'integer', description: 'Nilai kesehatan kode 0-100' },
      summary: {
        type: 'string',
        description: 'Ringkasan singkat evaluasi pre-review senior (2-3 kalimat)',
      },
      checklist: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['Functionality', 'Security', 'Performance', 'Maintainability', 'Compliance'],
            },
            label: { type: 'string' },
            status: { type: 'string', enum: ['pass', 'warn', 'block'] },
            notes: { type: 'string' },
          },
          required: ['category', 'label', 'status', 'notes'],
        },
      },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            file: { type: 'string', description: 'Path file terkait jika teridentifikasi dari diff' },
            line: { type: 'integer', description: 'Nomor baris perkiraan jika teridentifikasi dari diff' },
            severity: {
              type: 'string',
              enum: ['blocking', 'non-blocking', 'important', 'nit', 'suggestion'],
            },
            category: {
              type: 'string',
              enum: ['Functionality', 'Security', 'Performance', 'Maintainability', 'Git Hygiene', 'AGENTS.md Compliance'],
            },
            title: { type: 'string' },
            description: { type: 'string' },
            suggestionSnippet: { type: 'string', description: 'Cuplikan kode perbaikan rekomendasi' },
          },
          required: ['severity', 'category', 'title', 'description'],
        },
      },
      securityIssues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            severity: { type: 'string', enum: ['critical', 'warn', 'info'] },
            title: { type: 'string' },
            description: { type: 'string' },
            recommendation: { type: 'string' },
          },
          required: ['severity', 'title', 'description', 'recommendation'],
        },
      },
      qualityIssues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['bug', 'perf', 'style', 'hygiene'],
            },
            title: { type: 'string' },
            description: { type: 'string' },
            suggestion: { type: 'string' },
          },
          required: ['type', 'title', 'description', 'suggestion'],
        },
      },
      suggestedTestCases: {
        type: 'array',
        items: { type: 'string' },
        description: 'Daftar skenario edge case yang disarankan untuk diuji',
      },
    },
    required: [
      'verdict',
      'score',
      'summary',
      'checklist',
      'findings',
      'securityIssues',
      'qualityIssues',
      'suggestedTestCases',
    ],
  };

  try {
    const raw = await runAiCompletion({
      systemInstruction: system,
      prompt,
      temperature: 0.2,
      responseFormat: 'json',
      jsonSchema,
    });

    const parsed = JSON.parse(extractJsonFromAiResponse(raw));
    return {
      verdict: parsed.verdict || 'NEEDS_MINOR_FIX',
      score: typeof parsed.score === 'number' ? parsed.score : 80,
      summary: parsed.summary,
      checklist: Array.isArray(parsed.checklist) ? parsed.checklist : [],
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      securityIssues: Array.isArray(parsed.securityIssues) ? parsed.securityIssues : [],
      qualityIssues: Array.isArray(parsed.qualityIssues) ? parsed.qualityIssues : [],
      suggestedTestCases: Array.isArray(parsed.suggestedTestCases) ? parsed.suggestedTestCases : [],
      source: 'gemini',
    };
  } catch (err) {
    console.warn('[AI Pre-Review] AI audit failed, falling back to static rules:', err);
    return fallbackPreReview(input);
  }
}
