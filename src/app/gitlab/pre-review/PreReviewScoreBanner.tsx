import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import type { PreReviewOutput } from './types';

interface PreReviewScoreBannerProps {
  result: PreReviewOutput;
  copiedFullReview: boolean;
  onCopyFullReview: () => void;
}

export function PreReviewScoreBanner({
  result,
  copiedFullReview,
  onCopyFullReview,
}: PreReviewScoreBannerProps) {
  const getVerdictBadge = (verdict: PreReviewOutput['verdict']) => {
    switch (verdict) {
      case 'READY_TO_MERGE':
        return (
          <span className='badge badge-green text-[13px] px-3 py-1.5 inline-flex items-center gap-1.5'>
            <CheckCircle2 size={16} />
            <span>Ready to Merge (Bersih)</span>
          </span>
        );
      case 'NEEDS_MINOR_FIX':
        return (
          <span className='badge badge-amber text-[13px] px-3 py-1.5 inline-flex items-center gap-1.5'>
            <AlertTriangle size={16} />
            <span>Perlu Penyesuaian Minor</span>
          </span>
        );
      case 'CRITICAL_SECURITY_ISSUE':
        return (
          <span className='badge badge-red text-[13px] px-3 py-1.5 inline-flex items-center gap-1.5'>
            <ShieldAlert size={16} />
            <span>Temuan Kritis Terdeteksi</span>
          </span>
        );
    }
  };

  const bannerBg =
    result.score >= 85
      ? 'bg-emerald-50/80 border-emerald-200'
      : result.score >= 60
        ? 'bg-amber-50/80 border-amber-200'
        : 'bg-rose-50/80 border-rose-200';

  const scoreColor =
    result.score >= 85
      ? 'text-emerald-700'
      : result.score >= 60
        ? 'text-amber-700'
        : 'text-rose-700';

  return (
    <>
      {/* Verdict & Score Banner */}
      <div className={`flex items-center justify-between p-4 sm:px-[18px] rounded-xl border ${bannerBg}`}>
        <div>
          <div className='xs dim mb-1'>
            STATUS AUDIT KELAYAKAN MR
          </div>
          <div>{getVerdictBadge(result.verdict)}</div>
        </div>

        <div className='text-right'>
          <div className='xs dim'>SKOR KESEHATAN</div>
          <div className={`text-2xl sm:text-[26px] font-extrabold ${scoreColor}`}>
            {result.score}
            <span className='text-sm font-medium'>/100</span>
          </div>
        </div>
      </div>

      {/* Action Bar: Export / Copy Review for AI Coding Assistant / IDE */}
      <div className='p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all'>
        <div className='flex items-start sm:items-center gap-3 min-w-0 flex-1'>
          <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 sm:mt-0'>
            <Terminal size={19} />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='text-[14px] font-bold text-slate-900 tracking-tight'>
                Perbaikan dengan AI Coding Assistant / IDE
              </span>
              <span className='text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60'>
                Prompt Generator
              </span>
            </div>
            <p className='text-[12px] text-slate-600 font-medium leading-relaxed mt-0.5 m-0'>
              Salin seluruh rangkuman audit ini lalu tempelkan ke prompt AI coding assistant (Cursor, Copilot, Antigravity, Claude, ChatGPT, dll.) untuk instruksi perbaikan otomatis.
            </p>
          </div>
        </div>

        <div className='flex items-center shrink-0 self-stretch sm:self-center'>
          <button
            type='button'
            className={`btn text-xs px-4 py-2.5 font-bold rounded-xl inline-flex items-center justify-center gap-2 shadow-xs transition-all w-full sm:w-auto active:scale-95 ${
              copiedFullReview
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                : 'bg-brand hover:bg-brand-hover text-white border-transparent shadow-brand/20'
            }`}
            onClick={onCopyFullReview}
            id='btn-copy-full-review'
          >
            {copiedFullReview ? <Check size={14} /> : <Copy size={14} />}
            <span>
              {copiedFullReview
                ? 'Tersalin! Siap Dipaste ke AI / IDE'
                : 'Salin Seluruh Hasil Review'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
