'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { AiProvider } from '@/lib/ai/models';
import type { PublicSettings } from '../types';

interface AiApiKeyInputProps {
  provider: AiProvider;
  form: Partial<PublicSettings>;
  onChange: (key: keyof PublicSettings, value: unknown) => void;
}

const PROVIDER_NAMES: Record<AiProvider, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  custom: 'Kredensial Provider',
};

const PROVIDER_PLACEHOLDERS: Record<AiProvider, string> = {
  gemini: 'AIzaSy...',
  openai: 'sk-proj-...',
  anthropic: 'sk-ant-...',
  custom: 'sk-... (kosongkan jika tanpa auth)',
};

export function AiApiKeyInput({ provider, form, onChange }: AiApiKeyInputProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const apiKeysMap = form.aiApiKeys || {};
  const currentKey =
    apiKeysMap[provider] !== undefined
      ? apiKeysMap[provider]
      : provider === 'gemini'
        ? (form.geminiApiKey ?? form.aiApiKey ?? '')
        : (form.aiApiKey ?? '');

  const handleApiKeyChange = (val: string) => {
    onChange('aiApiKey', val);
    const updatedMap = { ...(form.aiApiKeys || {}), [provider]: val };
    onChange('aiApiKeys', updatedMap);
    if (provider === 'gemini') {
      onChange('geminiApiKey', val);
    }
  };

  return (
    <div className='field'>
      <label>API Key ({PROVIDER_NAMES[provider]})</label>
      <div className='relative flex items-center'>
        <input
          type={showApiKey ? 'text' : 'password'}
          className='input pr-10'
          value={currentKey}
          placeholder={PROVIDER_PLACEHOLDERS[provider]}
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
            Dapat diedit langsung. Kosongkan bila server lokal (misal: Ollama)
            tidak butuh token.
          </span>
        )}
      </span>
    </div>
  );
}
