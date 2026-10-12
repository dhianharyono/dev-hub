import { FolderKanban } from 'lucide-react';
import { SiGitlab, SiGooglegemini } from 'react-icons/si';
import type { PublicSettings } from '../types';
import type { IntegrationStatus } from '@/components/hooks';

interface SettingsStatusGridProps {
  form: Partial<PublicSettings>;
  integrations?: IntegrationStatus | null;
}

export function SettingsStatusGrid({ form, integrations }: SettingsStatusGridProps) {
  const taigaConnected = Boolean(integrations?.taiga?.connected);
  const taigaConfigured = Boolean(form?.taigaTokenSet);
  const taigaBadgeClass = taigaConnected
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : taigaConfigured
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
  const taigaBadgeText = taigaConnected
    ? 'Terhubung'
    : taigaConfigured
      ? 'Token Tidak Valid'
      : 'Belum Terhubung';

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

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mb-7'>
      {/* Taiga Status */}
      <div className='card flex items-center justify-between gap-4 hover:border-emerald-300'>
        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-accent border border-emerald-200'>
            <FolderKanban size={22} />
          </div>
          <div className='flex flex-col'>
            <span className='text-[15px] font-bold text-slate-text'>Taiga</span>
            <span className='text-xs text-slate-muted mt-0.5'>
              Proyek: <strong className='text-slate-text font-bold'>Otomatis</strong> (Tersinkron)
            </span>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${taigaBadgeClass}`}>
          <span className='w-1.5 h-1.5 rounded-full bg-current' />
          {taigaBadgeText}
        </span>
      </div>

      {/* GitLab Status */}
      <div className='card flex items-center justify-between gap-4 hover:border-orange-300'>
        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-orange-50 text-[#FC6D26] border border-orange-200'>
            <SiGitlab size={22} />
          </div>
          <div className='flex flex-col'>
            <span className='text-[15px] font-bold text-slate-text'>GitLab</span>
            <span className='text-xs text-slate-muted mt-0.5'>
              Akun:{' '}
              <span className='text-slate-text font-medium'>
                @{form?.gitlabUsername || 'developer'}
              </span>
            </span>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${gitlabBadgeClass}`}>
          <span className='w-1.5 h-1.5 rounded-full bg-current' />
          {gitlabBadgeText}
        </span>
      </div>

      {/* AI & LLM Status */}
      <div className='card flex items-center justify-between gap-4 hover:border-purple-300'>
        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-purple-50 text-violet-accent border border-purple-200'>
            <SiGooglegemini size={22} />
          </div>
          <div className='flex flex-col'>
            <span className='text-sm font-bold text-slate-text'>
              {form?.aiProvider === 'openai'
                ? 'OpenAI'
                : form?.aiProvider === 'anthropic'
                  ? 'Anthropic Claude'
                  : form?.aiProvider === 'custom'
                    ? 'Custom LLM'
                    : 'Google Gemini'}
            </span>
            <span className='text-xs text-slate-muted mt-0.5'>
              Model:{' '}
              <span className='text-slate-text font-medium'>
                {form?.aiModel || form?.geminiModel || (form?.aiProvider === 'openai' ? 'gpt-4o-mini' : form?.aiProvider === 'anthropic' ? 'claude-3-5-sonnet-latest' : 'gemini-3.8-flash')}
              </span>
            </span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            form?.aiApiKeySet || form?.geminiApiKeySet || form?.aiProvider === 'custom'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          <span className='w-1.5 h-1.5 rounded-full bg-current' />
          {form?.aiApiKeySet || form?.geminiApiKeySet || form?.aiProvider === 'custom' ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>
    </div>
  );
}
