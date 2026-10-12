export interface PreReviewInput {
  codeOrDiff: string;
  language?: string;
  context?: string;
}

export interface SecurityIssue {
  severity: 'critical' | 'warn' | 'info';
  title: string;
  description: string;
  recommendation: string;
}

export interface QualityIssue {
  type: 'bug' | 'perf' | 'style' | 'hygiene';
  title: string;
  description: string;
  suggestion: string;
}

export interface ReviewCategoryStatus {
  category: 'Functionality' | 'Security' | 'Performance' | 'Maintainability' | 'Compliance';
  label: string;
  status: 'pass' | 'warn' | 'block';
  notes: string;
}

export interface ReviewFinding {
  file?: string;
  line?: number;
  severity: 'blocking' | 'non-blocking' | 'important' | 'nit' | 'suggestion';
  category: 'Functionality' | 'Security' | 'Performance' | 'Maintainability' | 'Git Hygiene' | 'AGENTS.md Compliance';
  title: string;
  description: string;
  suggestionSnippet?: string;
}

export interface PreReviewOutput {
  verdict: 'READY_TO_MERGE' | 'NEEDS_MINOR_FIX' | 'CRITICAL_SECURITY_ISSUE';
  score: number;
  summary: string;
  checklist: ReviewCategoryStatus[];
  findings: ReviewFinding[];
  securityIssues: SecurityIssue[];
  qualityIssues: QualityIssue[];
  suggestedTestCases: string[];
  source: 'gemini' | 'fallback';
}
