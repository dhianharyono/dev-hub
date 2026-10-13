import { FolderKanban } from 'lucide-react';
import { SiGitlab, SiGooglegemini } from 'react-icons/si';
import type { PublicSettings } from '../types';
import type { IntegrationStatus } from '@/components/hooks';

interface SettingsStatusGridProps {
  form: Partial<PublicSettings>;
  integrations?: IntegrationStatus | null;
}

export function SettingsStatusGrid({
  form,
  integrations,
}: SettingsStatusGridProps) {
  const taigaConnected = Boolean(integrations?.taiga?.connected);
  const taigaHasToken = Boolean(form?.taigaTokenSet);
  const taigaHasUrl = Boolean(form?.taigaBaseUrl?.trim());

  let taigaBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
  let taigaBadgeText = 'Belum Terhubung';

  if (taigaConnected) {
    taigaBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    taigaBadgeText = 'Terhubung';
  } else if (taigaHasToken && !taigaHasUrl) {
    taigaBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    taigaBadgeText = 'URL Belum Diisi';
  } else if (taigaHasToken) {
    taigaBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    taigaBadgeText = 'Token Tidak Valid';
  }

  const gitlabConnected = Boolean(integrations?.gitlab?.connected);
  const gitlabConfigured = Boolean(form?.gitlabTokenSet);
  const gitlabBadgeClass = gitlabConnected
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : gitlabConfigured
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
  const gitlabBadgeText = gitlabConnected
    ? 'Terhubung'
    : gitlabConfigured
      ? 'Token Tidak Valid'
      : 'Belum Terhubung';

  const aiActive = Boolean(
    form?.aiApiKeySet || form?.geminiApiKeySet || form?.aiProvider === 'custom',
  );
  const aiBadgeClass = aiActive
    ? 'bg-purple-50 text-purple-700 border-purple-200'
    : 'bg-amber-50 text-amber-700 border-amber-200';
  const aiBadgeText = aiActive ? 'Aktif' : 'Nonaktif';

  const aiTitle =
    form?.aiProvider === 'openai'
      ? 'OpenAI'
      : form?.aiProvider === 'anthropic'
        ? 'Anthropic Claude'
        : form?.aiProvider === 'custom'
          ? 'Custom LLM'
          : 'Google Gemini';

  const aiModel =
    form?.aiModel ||
    form?.geminiModel ||
    (form?.aiProvider === 'openai'
      ? 'gpt-4o-mini'
      : form?.aiProvider === 'anthropic'
        ? 'claude-3-5-sonnet-latest'
        : 'gemini-3.8-flash');

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-3.5 mb-6'>
      {/* Taiga Status */}
      <div className='card h-20 flex items-center justify-between gap-3 p-3 sm:py-3 sm:px-5 hover:border-emerald-300 transition-all'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-accent border border-emerald-200'>
            <FolderKanban size={18} />
          </div>
          <div className='flex flex-col min-w-0'>
            <span className='text-[13px] font-bold text-slate-text leading-tight truncate'>
              Taiga
            </span>
            <span
              className='text-[11px] text-slate-muted mt-0.5 leading-tight truncate'
              title='Proyek: Otomatis (Tersinkron)'
            >
              Proyek:{' '}
              <strong className='text-slate-text font-semibold'>
                Otomatis
              </strong>
            </span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 border ${taigaBadgeClass}`}
        >
          <span className='w-1.5 h-1.5 rounded-full bg-current shrink-0' />
          {taigaBadgeText}
        </span>
      </div>

      {/* GitLab Status */}
      <div className='card flex items-center justify-between gap-3 p-3 sm:py-3 sm:px-5 hover:border-orange-300 transition-all'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-orange-50 text-[#FC6D26] border border-orange-200'>
            <SiGitlab size={18} />
          </div>
          <div className='flex flex-col min-w-0'>
            <span className='text-[13px] font-bold text-slate-text leading-tight truncate'>
              GitLab
            </span>
            <span
              className='text-[11px] text-slate-muted mt-0.5 leading-tight truncate'
              title={`Akun: @${form?.gitlabUsername || 'developer'}`}
            >
              Akun:{' '}
              <span className='text-slate-text font-medium'>
                @{form?.gitlabUsername || 'developer'}
              </span>
            </span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 border ${gitlabBadgeClass}`}
        >
          <span className='w-1.5 h-1.5 rounded-full bg-current shrink-0' />
          {gitlabBadgeText}
        </span>
      </div>

      {/* AI & LLM Status */}
      <div className='card flex items-center justify-between gap-3 p-3 sm:py-3 sm:px-5 sm:col-span-2 xl:col-span-1 hover:border-purple-300 transition-all'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-purple-50 text-violet-accent border border-purple-200'>
            <SiGooglegemini size={18} />
          </div>
          <div className='flex flex-col min-w-0'>
            <span className='text-[13px] font-bold text-slate-text leading-tight truncate'>
              {aiTitle}
            </span>
            <span
              className='text-[11px] text-slate-muted mt-0.5 leading-tight truncate'
              title={`Model: ${aiModel}`}
            >
              Model:{' '}
              <span className='text-slate-text font-medium'>{aiModel}</span>
            </span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 border ${aiBadgeClass}`}
        >
          <span className='w-1.5 h-1.5 rounded-full bg-current shrink-0' />
          {aiBadgeText}
        </span>
      </div>
    </div>
  );
}
