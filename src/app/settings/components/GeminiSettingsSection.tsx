'use client';

import { useState } from 'react';
import { Eye, EyeOff, RefreshCw, Cpu } from 'lucide-react';
import { Select } from '@/components/Select';
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

  const handleProviderChange = (
    newProvider: 'gemini' | 'openai' | 'anthropic' | 'custom',
  ) => {
    onChange('aiProvider', newProvider);
    // Set default model for the selected provider if not set
    if (newProvider === 'gemini') {
      onChange('aiModel', 'gemini-3.8-flash');
      onChange('geminiModel', 'gemini-3.8-flash');
    } else if (newProvider === 'openai') {
      onChange('aiModel', 'gpt-4o-mini');
    } else if (newProvider === 'anthropic') {
      onChange('aiModel', 'claude-3-5-sonnet-latest');
    } else if (newProvider === 'custom') {
      onChange('aiModel', 'deepseek-chat');
    }
  };

  const handleApiKeyChange = (val: string) => {
    onChange('aiApiKey', val);
    if (provider === 'gemini') {
      onChange('geminiApiKey', val);
    }
  };

  return (
    <section className='card flex flex-col gap-6'>
      <div className='flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border'>
        <div className='flex items-start gap-2.5 flex-1 min-w-0'>
          <span className='w-[26px] h-[26px] rounded-lg bg-surface-subtle border border-border flex items-center justify-center text-xs font-extrabold text-slate-muted shrink-0 mt-0.5'>3</span>
          <div className='flex-1 min-w-0'>
            <span className='text-[15px] font-bold text-slate-text tracking-tight'>
              Kecerdasan Buatan (AI &amp; LLM Engine)
            </span>
            <div className='xs dim mt-0.5'>
              Engine AI untuk ekstraksi User Story &amp; Task, auto-heal WAD,
              analisis produktivitas, dan review MR
            </div>
            {testResult && (
              <div className='mt-2'>
                <span
                  className={`badge ${testResult.ok ? 'badge-violet' : 'badge-rose'} whitespace-normal break-words inline-block max-w-full text-left leading-[1.45] px-3 py-1.5`}
                >
                  {testResult.ok ? '✓ ' + testResult.message : testResult.message}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className='shrink-0'>
          <button
            type='button'
            className='btn btn-sm'
            onClick={onTest}
            disabled={testing}
          >
            {testing ? <span className='spinner' /> : <RefreshCw size={13} />}
            <span>Uji Koneksi AI</span>
          </button>
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
          <label>Model LLM</label>
          {provider === 'gemini' && (
            <Select
              value={form.aiModel || form.geminiModel || 'gemini-3.8-flash'}
              onChange={(e) => {
                onChange('aiModel', e.target.value);
                onChange('geminiModel', e.target.value);
              }}
            >
              <option value='gemini-3.8-flash'>
                gemini-3.8-flash (Rekomendasi Google - Generasi Terbaru)
              </option>
              <option value='gemini-3.7-flash'>
                gemini-3.7-flash (Stabil &amp; Canggih)
              </option>
              <option value='gemini-3.6-flash'>
                gemini-3.6-flash (Cepat &amp; Responsif)
              </option>
              <option value='gemini-3.5-flash'>
                gemini-3.5-flash (Stabil &amp; Handal)
              </option>
              <option value='gemini-3.1-flash-lite'>
                gemini-3.1-flash-lite (Ultra Cepat &amp; Hemat Kuota)
              </option>
              <option value='gemini-flash-lite-latest'>
                gemini-flash-lite-latest (Versi Lite Otomatis)
              </option>
            </Select>
          )}

          {provider === 'openai' && (
            <Select
              value={form.aiModel || 'gpt-4o-mini'}
              onChange={(e) => onChange('aiModel', e.target.value)}
            >
              <option value='gpt-4o-mini'>
                gpt-4o-mini (Rekomendasi - Cepat &amp; Hemat)
              </option>
              <option value='gpt-4o'>gpt-4o (Kapasitas Analisis Penuh)</option>
              <option value='o3-mini'>o3-mini (Reasoning Cepat)</option>
            </Select>
          )}

          {provider === 'anthropic' && (
            <Select
              value={form.aiModel || 'claude-3-5-sonnet-latest'}
              onChange={(e) => onChange('aiModel', e.target.value)}
            >
              <option value='claude-3-5-sonnet-latest'>
                claude-3-5-sonnet (Rekomendasi - Kode &amp; Analisis)
              </option>
              <option value='claude-3-5-haiku-latest'>
                claude-3-5-haiku (Super Cepat &amp; Ringkas)
              </option>
            </Select>
          )}

          {provider === 'custom' && (
            <input
              className='input'
              value={form.aiModel || 'deepseek-chat'}
              placeholder='deepseek-chat, llama3.2, mistral, dll'
              onChange={(e) => onChange('aiModel', e.target.value)}
            />
          )}

          <span className='hint'>
            Arsitektur model pemrosesan kecerdasan buatan.
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
    </section>
  );
}
