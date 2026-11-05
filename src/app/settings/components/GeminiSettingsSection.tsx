'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { AiApiKeyInput } from './AiApiKeyInput';
import { AiProviderConfigRow } from './AiProviderConfigRow';
import { AiMenuModelsPanel } from './AiMenuModelsPanel';
import type { PublicSettings, TestResult, TestingState } from '../types';

interface GeminiSettingsSectionProps {
  form: Partial<PublicSettings>;
  onChange: (key: keyof PublicSettings, value: unknown) => void;
  testResult?: TestResult['ai'] | TestResult['gemini'];
  testing?: TestingState['ai'] | TestingState['gemini'];
  onTest: () => void;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export function GeminiSettingsSection({
  form,
  onChange,
  testResult,
  testing,
  onTest,
  minimized,
  onToggleMinimize,
}: GeminiSettingsSectionProps) {
  const [localMinimized, setLocalMinimized] = useState(true);
  const isMinimized = minimized !== undefined ? minimized : localMinimized;
  const handleToggleMinimize =
    onToggleMinimize || (() => setLocalMinimized((prev) => !prev));

  const provider = form.aiProvider || 'gemini';

  return (
    <section
      className={`card flex flex-col ${isMinimized ? 'p-5 sm:p-6' : 'p-6 gap-5'}`}
    >
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div
          className='flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer select-none group'
          onClick={handleToggleMinimize}
          title={
            isMinimized ? 'Klik untuk memperluas' : 'Klik untuk meminimalkan'
          }
        >
          <span className='w-[26px] h-[26px] rounded-lg bg-surface-subtle border border-border flex items-center justify-center text-xs font-extrabold text-slate-muted group-hover:border-brand/40 group-hover:text-brand shrink-0 mt-0.5 transition-colors'>
            3
          </span>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='text-[15px] font-bold text-slate-text tracking-tight group-hover:text-brand transition-colors'>
                Kecerdasan Buatan (AI &amp; LLM Engine)
              </span>
              {isMinimized && (
                <span className='inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200'>
                  Diminimalkan
                </span>
              )}
            </div>
            <div className='xs dim mt-0.5'>
              Engine AI untuk ekstraksi User Story &amp; Task, auto-heal WAD,
              analisis produktivitas, dan review MR
            </div>
          </div>
        </div>

        <div className='shrink-0 flex flex-col items-start sm:items-end gap-2 max-w-full sm:max-w-md'>
          <div className='flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end'>
            <button
              type='button'
              className='btn btn-sm'
              onClick={onTest}
              disabled={testing}
            >
              {testing ? <span className='spinner' /> : <RefreshCw size={13} />}
              <span>Uji Koneksi AI</span>
            </button>

            <button
              type='button'
              className='btn btn-sm btn-ghost p-1.5 text-slate-500 hover:text-slate-800 hover:bg-surface-subtle border border-transparent hover:border-border rounded-lg transition-all'
              onClick={(e) => {
                e.stopPropagation();
                handleToggleMinimize();
              }}
              title={isMinimized ? 'Perluas kartu' : 'Minimalkan kartu'}
              aria-label={isMinimized ? 'Perluas kartu' : 'Minimalkan kartu'}
            >
              <ChevronDown
                size={15}
                className={`transition-transform duration-200 ${isMinimized ? '' : 'rotate-180'}`}
              />
            </button>
          </div>

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

      <div
        className={
          isMinimized
            ? 'hidden'
            : 'flex flex-col gap-6 pt-5 border-t border-border'
        }
      >
        <AiProviderConfigRow
          provider={provider}
          form={form}
          onChange={onChange}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-2'>
          {/* API Key with Direct Edit & Eye Toggle (Per-Provider) */}
          <AiApiKeyInput
            provider={provider}
            form={form}
            onChange={onChange}
          />

          {/* Base URL (Optional / Custom) */}
          <div className='field'>
            <label>
              Base URL API{' '}
              {provider === 'custom' ? (
                <span className='text-xs text-slate-400'>
                  (Wajib diisi untuk custom endpoint)
                </span>
              ) : (
                <span className='text-xs text-slate-400'>
                  (Opsional / Proxy)
                </span>
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
      </div>
    </section>
  );
}
