'use client';

import { Cpu, Languages, Sparkles } from 'lucide-react';
import { Select } from '@/components/Select';
import { Tooltip } from '@/components/Tooltip';
import {
  AI_FEATURE_MODEL_KEYS,
  DEFAULT_MODEL_BY_PROVIDER,
  MODEL_OPTIONS,
  type AiProvider,
} from '@/lib/ai/models';
import type { PublicSettings } from '../types';

interface AiProviderConfigRowProps {
  provider: AiProvider;
  form: Partial<PublicSettings>;
  onChange: (key: keyof PublicSettings, value: unknown) => void;
}

export function AiProviderConfigRow({
  provider,
  form,
  onChange,
}: AiProviderConfigRowProps) {
  const handleProviderChange = (newProvider: AiProvider) => {
    onChange('aiProvider', newProvider);
    const apiKeysMap = form.aiApiKeys || {};
    const existingKey =
      apiKeysMap[newProvider] ??
      (newProvider === 'gemini' ? form.geminiApiKey || '' : '');
    onChange('aiApiKey', existingKey);
    if (newProvider === 'gemini') {
      onChange('geminiApiKey', existingKey);
    }
    const defaultModel = DEFAULT_MODEL_BY_PROVIDER[newProvider];
    onChange('aiModel', defaultModel);
    if (newProvider === 'gemini') {
      onChange('geminiModel', defaultModel);
    }
    for (const key of AI_FEATURE_MODEL_KEYS) onChange(key, '');
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      {/* Provider Selector */}
      <div className='field'>
        <label className='flex items-center gap-1.5 min-h-[20px]'>
          <Cpu size={14} className='gradient-text shrink-0' />
          <span>Penyedia AI (LLM Provider)</span>
        </label>
        <Select
          value={provider}
          onChange={(e) =>
            handleProviderChange(
              e.target.value as
                | 'gemini'
                | 'openai'
                | 'anthropic'
                | 'custom',
            )
          }
        >
          <option value='gemini'>Google Gemini</option>
          <option value='openai'>OpenAI (ChatGPT / GPT-4o)</option>
          <option value='anthropic'>Anthropic (Claude 3.5)</option>
          <option value='custom'>Custom/OpenAI-Compatible</option>
        </Select>
        <span className='hint'>
          Pilih provider AI yang ingin Anda gunakan di DEV HUB.
        </span>
      </div>

      {/* Model Selector / Input */}
      <div className='field'>
        <div className='flex items-center gap-1.5 min-h-[20px]'>
          <label
            htmlFor='ai-model-global'
            className='label-sm flex items-center gap-1.5 cursor-pointer !mb-0'
          >
            <Sparkles size={14} className='gradient-text shrink-0' />
            <span>Model LLM Global</span>
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
                  Berfungsi sebagai model default. Semua menu yang
                  pengaturan modelnya dikosongkan (&quot;Ikuti model
                  global&quot;) akan otomatis menggunakan model ini.
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
            className='input !h-[38px] !min-h-[38px] !py-0 !px-3 !text-[13.5px] !rounded-[10px]'
            value={form.aiModel || DEFAULT_MODEL_BY_PROVIDER.custom}
            placeholder='dpe/alias/glm-flash, llama3.2, mistral, dll'
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
              if (provider === 'gemini')
                onChange('geminiModel', e.target.value);
            }}
            options={MODEL_OPTIONS[provider]}
          />
        )}

        <span className='hint'>
          Model acuan default dan fallback otomatis jika model per menu
          dikosongkan.
        </span>
      </div>

      {/* Bahasa Penulisan */}
      <div className='field'>
        <label className='flex items-center gap-1.5 min-h-[20px]'>
          <Languages size={14} className='gradient-text shrink-0' />
          <span>Bahasa Penulisan AI</span>
        </label>
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
  );
}
