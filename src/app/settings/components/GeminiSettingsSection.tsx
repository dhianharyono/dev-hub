'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { Select } from '@/components/Select';
import { Tooltip } from '@/components/Tooltip';
import {
  AI_FEATURE_MODEL_KEYS,
  DEFAULT_MODEL_BY_PROVIDER,
  MODEL_OPTIONS,
  type AiProvider,
} from '@/lib/ai/models';
import { AiMenuModelsPanel } from './AiMenuModelsPanel';
import type { PublicSettings, TestResult, TestingState } from '../types';

interface GeminiSettingsSectionProps {
  form: Partial<PublicSettings>;
  onChange: (key: keyof PublicSettings, value: unknown) => void;
  testResult?: TestResult['ai'] | TestResult['gemini'];
  testing?: TestingState['ai'] | TestingState['gemini'];
  onTest: () => void;
}

export function GeminiSettingsSection({
  form,
  onChange,
  testResult,
  testing,
  onTest,
}: GeminiSettingsSectionProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const provider = form.aiProvider || 'gemini';
  const currentKey = form.aiApiKey ?? form.geminiApiKey ?? '';

  const handleProviderChange = (newProvider: AiProvider) => {
    onChange('aiProvider', newProvider);
    // Set default model for the selected provider if not set
    const defaultModel = DEFAULT_MODEL_BY_PROVIDER[newProvider];
    onChange('aiModel', defaultModel);
    if (newProvider === 'gemini') {
      onChange('geminiModel', defaultModel);
    }
    // Per-menu models belong to the previous provider, so fall back to global
    for (const key of AI_FEATURE_MODEL_KEYS) onChange(key, '');
  };

  const handleApiKeyChange = (val: string) => {
    onChange('aiApiKey', val);
    if (provider === 'gemini') {
      onChange('geminiApiKey', val);
    }
  };

  return (
    <section className='card flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border'>
        <div className='flex items-start gap-2.5 flex-1 min-w-0'>
          <span className='w-[26px] h-[26px] rounded-lg bg-surface-subtle border border-border flex items-center justify-center text-xs font-extrabold text-slate-muted shrink-0 mt-0.5'>
            3
          </span>
          <div className='flex-1 min-w-0'>
            <span className='text-[15px] font-bold text-slate-text tracking-tight'>
              Kecerdasan Buatan (AI &amp; LLM Engine)
            </span>
            <div className='xs dim mt-0.5'>
              Engine AI untuk ekstraksi User Story &amp; Task, auto-heal WAD,
              analisis produktivitas, dan review MR
            </div>
          </div>
        </div>

        <div className='shrink-0 flex flex-col items-start sm:items-end gap-2 max-w-full sm:max-w-md'>
          <button
            type='button'
            className='btn btn-sm'
            onClick={onTest}
            disabled={testing}
          >
            {testing ? <span className='spinner' /> : <RefreshCw size={13} />}
            <span>Uji Koneksi AI</span>
          </button>

          {!testing && testResult && (
            <div
              className={`flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs border w-full sm:w-auto animate-in fade-in ${
                testResult.ok
                  ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800'
                  : 'bg-rose-50/70 border-rose-200/80 text-rose-800'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2
                  size={14}
                  className='text-emerald-600 shrink-0 mt-0.5'
                />
              ) : (
                <AlertCircle
                  size={14}
                  className='text-rose-600 shrink-0 mt-0.5'
                />
              )}
              <div className='flex flex-col gap-1 min-w-0 text-left'>
                <span className='font-medium leading-relaxed break-words'>
                  {testResult.message}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {/* Provider Selector */}
        <div className='field'>
          <label className='flex items-center gap-1.5'>
            <Cpu size={14} className='gradient-text' />
            <span>Penyedia AI (LLM Provider)</span>
          </label>
          <Select
            value={provider}
            onChange={(e) =>
              handleProviderChange(
                e.target.value as 'gemini' | 'openai' | 'anthropic' | 'custom',
              )
            }
          >
            <option value='gemini'>Google Gemini (Default)</option>
            <option value='openai'>OpenAI (ChatGPT / GPT-4o)</option>
            <option value='anthropic'>Anthropic (Claude 3.5)</option>
            <option value='custom'>
              Custom / OpenAI-Compatible (DeepSeek, Groq, Ollama)
            </option>
          </Select>
          <span className='hint'>
            Pilih provider AI yang ingin Anda gunakan di DEV HUB.
          </span>
        </div>

        {/* Model Selector / Input */}
        <div className='field'>
          <div className='flex items-center gap-1.5'>
            <label htmlFor='ai-model-global' className='cursor-pointer !mb-0'>
              Model LLM Global
            </label>
            <Tooltip
              title='Peran Model LLM Global'
              ariaLabel='Informasi Model LLM Global'
              content={
                <div className='flex flex-col gap-1.5 text-xs text-slate-600 leading-relaxed'>
                  <p>
                    <strong className='text-slate-800 font-semibold'>
                      Model Acuan Utama &amp; Fallback:
                    </strong>{' '}
                    Berfungsi sebagai model default. Semua menu yang pengaturan
                    modelnya dikosongkan (&quot;Ikuti model global&quot;) akan
                    otomatis menggunakan model ini.
                  </p>
                  <p>
                    Model ini juga digunakan untuk{' '}
                    <strong className='text-slate-800 font-semibold'>
                      Uji Koneksi AI
                    </strong>{' '}
                    utama dan fungsi ringkasan mingguan (Weekly Summary).
                  </p>
                </div>
              }
            />
          </div>
          {provider === 'custom' ? (
            <input
              id='ai-model-global'
              className='input'
              value={form.aiModel || DEFAULT_MODEL_BY_PROVIDER.custom}
              placeholder='deepseek-chat, llama3.2, mistral, dll'
              onChange={(e) => onChange('aiModel', e.target.value)}
            />
          ) : (
            <Select
              id='ai-model-global'
              value={
                form.aiModel ||
                (provider === 'gemini' ? form.geminiModel : '') ||
                DEFAULT_MODEL_BY_PROVIDER[provider]
              }
              onChange={(e) => {
                onChange('aiModel', e.target.value);
                if (provider === 'gemini') onChange('geminiModel', e.target.value);
              }}
              options={MODEL_OPTIONS[provider]}
            />
          )}

          <span className='hint'>
            Model acuan default dan fallback otomatis jika model per menu dikosongkan.
          </span>
        </div>

        {/* Bahasa Penulisan */}
        <div className='field'>
          <label>Bahasa Penulisan AI</label>
          <Select
            value={form.writingLanguage || 'id'}
            onChange={(e) =>
              onChange('writingLanguage', e.target.value as 'id' | 'en')
            }
          >
            <option value='id'>Bahasa Indonesia (Profesional)</option>
            <option value='en'>English (Professional)</option>
          </Select>
          <span className='hint'>
            Bahasa output untuk draf task WAD, deskripsi MR, dan rangkuman
            kerja.
          </span>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-2'>
        {/* API Key with Direct Edit & Eye Toggle */}
        <div className='field'>
          <label>
            API Key (
            {provider === 'gemini'
              ? 'Google Gemini'
              : provider === 'openai'
                ? 'OpenAI'
                : provider === 'anthropic'
                  ? 'Anthropic'
                  : 'Kredensial Provider'}
            )
          </label>
          <div className='relative flex items-center'>
            <input
              type={showApiKey ? 'text' : 'password'}
              className='input pr-10'
              value={currentKey}
              placeholder={
                provider === 'gemini'
                  ? 'AIzaSy...'
                  : provider === 'openai'
                    ? 'sk-proj-...'
                    : provider === 'anthropic'
                      ? 'sk-ant-...'
                      : 'sk-... (kosongkan jika tanpa auth)'
              }
              onChange={(e) => handleApiKeyChange(e.target.value)}
            />
            <button
              type='button'
              onClick={() => setShowApiKey(!showApiKey)}
              title={showApiKey ? 'Sembunyikan Key' : 'Tampilkan Key'}
              className='absolute right-2.5 text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center transition-colors'
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <span className='hint'>
            {provider === 'gemini' && (
              <>
                Dapatkan gratis di{' '}
                <a
                  href='https://aistudio.google.com/apikey'
                  target='_blank'
                  rel='noreferrer'
                  className='gradient-text font-semibold'
                >
                  aistudio.google.com ↗
                </a>
              </>
            )}
            {provider === 'openai' && (
              <>
                Dapatkan di{' '}
                <a
                  href='https://platform.openai.com/api-keys'
                  target='_blank'
                  rel='noreferrer'
                  className='gradient-text font-semibold'
                >
                  platform.openai.com ↗
                </a>
              </>
            )}
            {provider === 'anthropic' && (
              <>
                Dapatkan di{' '}
                <a
                  href='https://console.anthropic.com/settings/keys'
                  target='_blank'
                  rel='noreferrer'
                  className='gradient-text font-semibold'
                >
                  console.anthropic.com ↗
                </a>
              </>
            )}
            {provider === 'custom' && (
              <span>
                Dapat diedit langsung. Kosongkan bila server lokal (misal:
                Ollama) tidak butuh token.
              </span>
            )}
          </span>
        </div>

        {/* Base URL (Optional / Custom) */}
        <div className='field'>
          <label>
            Base URL API{' '}
            {provider === 'custom' ? (
              <span className='text-xs text-slate-400'>
                (Wajib diisi untuk custom endpoint)
              </span>
            ) : (
              <span className='text-xs text-slate-400'>(Opsional / Proxy)</span>
            )}
          </label>
          <input
            className='input'
            value={form.aiBaseUrl || ''}
            placeholder={
              provider === 'custom'
                ? 'http://localhost:11434/v1 atau https://api.deepseek.com/v1'
                : 'Kosong = endpoint default resmi'
            }
            onChange={(e) => onChange('aiBaseUrl', e.target.value)}
          />
          <span className='hint'>
            {provider === 'custom'
              ? 'Mendukung Ollama lokal (http://localhost:11434/v1), DeepSeek, Groq, OpenRouter, dll.'
              : 'Gunakan jika Anda memakai corporate proxy atau reverse proxy internal kantor.'}
          </span>
        </div>
      </div>

      <AiMenuModelsPanel form={form} onChange={onChange} />
    </section>
  );
}
