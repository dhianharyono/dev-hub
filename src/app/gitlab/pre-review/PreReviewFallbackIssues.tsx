import { CheckSquare, Cpu, Lock } from 'lucide-react';
import type { PreReviewOutput } from './types';

interface PreReviewFallbackIssuesProps {
  result: PreReviewOutput;
}

export function PreReviewFallbackIssues({
  result,
}: PreReviewFallbackIssuesProps) {
  const hasFindings = result.findings && result.findings.length > 0;

  return (
    <>
      {/* Fallback Security Issues Section (if findings not present) */}
      {!hasFindings && result.securityIssues.length > 0 && (
        <div>
          <div className='row xs dim font-semibold mb-2 gap-1.5'>
            <Lock size={14} className='text-rose-500' />
            <span>
              TEMUAN KEAMANAN &amp; SECRET ({result.securityIssues.length})
            </span>
          </div>
          <div className='flex flex-col gap-2'>
            {result.securityIssues.map((sec, idx) => (
              <div
                key={idx}
                className='p-3 sm:px-3.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 flex flex-col gap-1'
              >
                <div className='row-between'>
                  <strong className='text-[13px] text-rose-600 dark:text-rose-400'>
                    {sec.title}
                  </strong>
                  <span
                    className={`badge ${
                      sec.severity === 'critical'
                        ? 'badge-red'
                        : 'badge-amber'
                    } xs`}
                  >
                    {sec.severity.toUpperCase()}
                  </span>
                </div>
                <p className='text-xs text-slate-text-2 m-0'>
                  {sec.description}
                </p>
                <div className='text-xs text-red-800 dark:text-red-300 bg-white/70 dark:bg-black/20 p-1.5 sm:px-2 rounded-md mt-1'>
                  <strong>Saran:</strong> {sec.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback Quality & Hygiene Issues Section (if findings not present) */}
      {!hasFindings && result.qualityIssues.length > 0 && (
        <div>
          <div className='row xs dim font-semibold mb-2 gap-1.5'>
            <Cpu size={14} className='text-primary' />
            <span>
              HIGIENITAS &amp; KUALITAS KODE ({result.qualityIssues.length})
            </span>
          </div>
          <div className='flex flex-col gap-2'>
            {result.qualityIssues.map((q, idx) => (
              <div
                key={idx}
                className='p-3 sm:px-3.5 rounded-lg border border-border bg-surface flex flex-col gap-1'
              >
                <div className='row-between'>
                  <strong className='text-[13px] text-slate-text'>
                    {q.title}
                  </strong>
                  <span className='badge badge-cyan xs'>
                    {q.type.toUpperCase()}
                  </span>
                </div>
                <p className='text-xs text-slate-text-2 m-0'>
                  {q.description}
                </p>
                <div className='text-xs text-slate-text-2 bg-surface-subtle p-1.5 sm:px-2 rounded-md mt-1'>
                  <strong>Solusi:</strong> {q.suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edge Case Test Suggestions */}
      {result.suggestedTestCases.length > 0 && (
        <div>
          <div className='row xs dim font-semibold mb-2 gap-1.5'>
            <CheckSquare size={14} className='text-emerald-500' />
            <span>REKOMENDASI SKENARIO UNIT TEST (EDGE CASES)</span>
          </div>
          <ul className='m-0 pl-5 flex flex-col gap-1 text-[12.5px] text-slate-text-2'>
            {result.suggestedTestCases.map((tc, idx) => (
              <li key={idx}>{tc}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
