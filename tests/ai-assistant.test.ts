import { describe, it, expect } from 'vitest';
import {
  fallbackHealer,
  fallbackMrAssistant,
  fallbackPreReview,
} from '../src/lib/ai-assistant';

describe('AI Assistant Tools (Deterministic Engine)', () => {
  it('heals timesheet gaps proportionally', () => {
    const suggestions = fallbackHealer(
      {
        date: '2026-10-02',
        missingHours: 2.5,
        userStories: [
          { id: 101, ref: 55, subject: 'Integrasi Payment Gateway' },
        ],
      },
      2.5,
    );

    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    const totalMinutes = suggestions.reduce(
      (a, b) => a + b.totalTimeSpentMinutes,
      0,
    );
    expect(totalMinutes).toBe(150); // 2.5 hours * 60 min
    expect(suggestions[0].parentUserStoryId).toBe(101);
    expect(suggestions[0].activityDate).toBe('2026-10-02');
  });

  it('generates structured MR descriptions and release notes without checklist pengujian', () => {
    const res = fallbackMrAssistant({
      branch: 'feature/auth-guard',
      targetBranch: 'main',
      title: 'Tambahkan proteksi rate limiter',
      targetStoryRef: 42,
      targetStorySubject: 'User Story Proteksi Autentikasi',
      targetTaskRef: 108,
      targetTaskSubject: 'Setup Redis Token Bucket',
      assignee: 'Dhian Haryono (@dhian)',
      reviewer: 'Senior Lead (@reviewer)',
    });

    expect(res.mrTitle).toMatch(/\[(SPC-)?108\]|\[#108\]/);
    expect(res.mrTitle).toContain('feat:');
    expect(res.description).not.toContain('Checklist Pengujian');
    expect(res.description).toContain('Closes #42');
    expect(res.description).toContain('Closes #108');
    expect(res.description).not.toContain('Penugasan');
    expect(res.description).not.toContain('Assignee:');
    expect(res.releaseNotes).toBeTruthy();
  });

  it('detects embedded secrets and silent errors during pre-review', () => {
    const dangerousCode = `
      const API_KEY = "sk_live_9381048102840192841";
      try {
        doSomething();
      } catch (e) {}
    `;

    const audit = fallbackPreReview({
      codeOrDiff: dangerousCode,
      language: 'TypeScript',
    });

    expect(audit.verdict).toBe('CRITICAL_SECURITY_ISSUE');
    expect(audit.securityIssues.length).toBeGreaterThan(0);
    expect(audit.qualityIssues.some((q) => q.title.includes('Catch Kosong'))).toBe(true);
    expect(audit.score).toBeLessThan(60);

    // Assert code-review SKILL.md checklist & findings
    expect(audit.checklist).toBeDefined();
    expect(audit.checklist.length).toBe(5);
    const secCategory = audit.checklist.find((c) => c.category === 'Security');
    expect(secCategory?.status).toBe('block');

    expect(audit.findings.length).toBeGreaterThan(0);
    const blockingFinding = audit.findings.find((f) => f.severity === 'blocking');
    expect(blockingFinding).toBeDefined();
    expect(blockingFinding?.suggestionSnippet).toBeDefined();
  });

  it('detects type any violation and flags compliance issue', () => {
    const codeWithAny = `
      function processPayload(data: any): any {
        return (data as any).id;
      }
    `;

    const audit = fallbackPreReview({
      codeOrDiff: codeWithAny,
      language: 'TypeScript',
    });

    const complianceFinding = audit.findings.find(
      (f) => f.category === 'AGENTS.md Compliance',
    );
    expect(complianceFinding).toBeDefined();
    expect(complianceFinding?.severity).toBe('important');
    const compCategory = audit.checklist.find((c) => c.category === 'Compliance');
    expect(compCategory?.status).toBe('warn');
  });
});
