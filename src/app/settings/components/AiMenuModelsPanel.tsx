'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Select } from '@/components/Select';
import {
  AI_FEATURES,
  MODEL_OPTIONS,
  resolveGlobalModel,
  type AiFeatureModelKey,
  type AiProvider,
} from '@/lib/ai/models';
import type { PublicSettings } from '../types';

interface AiMenuModelsPanelProps {
  form: Partial<PublicSettings>;
  onChange: (key: keyof PublicSettings, value: unknown) => void;
}

interface MenuTestResult {
  ok: boolean;
  message: string;
}

export function AiMenuModelsPanel({ form, onChange }: AiMenuModelsPanelProps) {
  const provider: AiProvider = form.aiProvider || 'gemini';
  const globalModel = resolveGlobalModel(form);
  const followLabel = `Ikuti model global (${globalModel})`;
  const isMonitoring = form.appMode === 'monitoring';

  const visibleFeatures = AI_FEATURES.filter(
    (item) =>
      !isMonitoring ||
      (item.feature !== 'productivity' &&
        item.feature !== 'workload' &&
        item.feature !== 'report'),
  );

  const [testingMenu, setTestingMenu] = useState<Record<string, boolean>>({});
  const [menuResults, setMenuResults] = useState<
    Record<string, MenuTestResult | null>
  >({});

  const handleTestMenu = async (settingKey: AiFeatureModelKey) => {
    const rawVal = (form[settingKey] as string | undefined)?.trim();
    const isUsingGlobal = !rawVal;
    const effectiveModel = rawVal || globalModel;

    setTestingMenu((prev) => ({ ...prev, [settingKey]: true }));
    setMenuResults((prev) => ({ ...prev, [settingKey]: null }));

    try {
      const activeProvider = form.aiProvider || 'gemini';
      const activeApiKey =
        form.aiApiKeys?.[activeProvider] ??
        form.aiApiKey ??
        (activeProvider === 'gemini' ? form.geminiApiKey : '') ??
        '';

      const payload = {
        target: 'ai',
        aiProvider: activeProvider,
        aiApiKey: activeApiKey,
        geminiApiKey: activeApiKey,
        aiBaseUrl: form.aiBaseUrl || '',
        aiModel: effectiveModel,
        geminiModel: effectiveModel,
      };

      const res = await fetch('/api/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const isOk = Boolean(res.ok && data.ok !== false);
      let message = isOk
        ? data.message || `Model ${effectiveModel} aktif`
        : data.error || 'Uji koneksi gagal.';

      if (isOk && isUsingGlobal) {
        message = `${message} (mengikuti model global)`;
      }

      setMenuResults((prev) => ({
        ...prev,
        [settingKey]: { ok: isOk, message },
      }));
    } catch (err) {
      setMenuResults((prev) => ({
        ...prev,
        [settingKey]: {
          ok: false,
          message: (err as Error).message || 'Gagal menghubungi server.',
        },
      }));
    } finally {
      setTestingMenu((prev) => ({ ...prev, [settingKey]: false }));
    }
  };

  return (
    <div className='flex flex-col gap-4 pt-5 border-t border-border'>
      <div>
        <div className='text-sm font-bold text-slate-text'>Model per Menu</div>
        <div className='xs dim mt-0.5'>
          Provider dan API key tetap sama. Biarkan di pilihan &quot;Ikuti model
          global&quot; untuk otomatis menggunakan model acuan ({globalModel}).
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
        {visibleFeatures.map(({ settingKey, label, usage }) => {
          const value = (form[settingKey] as string | undefined) || '';
          const isTesting = Boolean(testingMenu[settingKey]);
          const result = menuResults[settingKey];

          return (
            <div className='field flex flex-col justify-start' key={settingKey}>
              <div className='flex items-center justify-between gap-2 mb-1.5 min-h-[26px]'>
                <label
                  htmlFor={`model-${settingKey}`}
                  className='!mb-0 cursor-pointer font-semibold text-slate-text'
                >
                  {label}
                </label>
                <button
                  type='button'
                  onClick={() => handleTestMenu(settingKey)}
                  disabled={isTesting}
                  title={`Uji koneksi model untuk ${label}`}
                  className='px-2.5 py-1 text-[11px] font-semibold rounded-md border border-border bg-surface-subtle hover:bg-surface text-slate-text hover:text-brand transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs shrink-0'
                >
                  {isTesting ? (
                    <span className='spinner !w-2.5 !h-2.5 !border-[1.5px]' />
                  ) : (
                    <RefreshCw size={11} className='text-slate-muted' />
                  )}
                  <span>{isTesting ? 'Menguji...' : 'Uji Model'}</span>
                </button>
              </div>

              {provider === 'custom' ? (
                <input
                  id={`model-${settingKey}`}
                  className='input !h-[38px] !min-h-[38px] !py-0 !px-3 !text-[13.5px] !rounded-[10px]'
                  value={value}
                  placeholder={followLabel}
                  onChange={(e) => {
                    onChange(settingKey, e.target.value);
                    if (menuResults[settingKey]) {
                      setMenuResults((prev) => ({
                        ...prev,
                        [settingKey]: null,
                      }));
                    }
                  }}
                />
              ) : (
                <Select
                  id={`model-${settingKey}`}
                  aria-label={`Model untuk ${label}`}
                  value={value}
                  onChange={(e) => {
                    onChange(settingKey, e.target.value);
                    if (menuResults[settingKey]) {
                      setMenuResults((prev) => ({
                        ...prev,
                        [settingKey]: null,
                      }));
                    }
                  }}
                  options={[
                    { value: '', label: followLabel },
                    ...MODEL_OPTIONS[provider],
                  ]}
                />
              )}

              <span className='hint min-h-[18px]'>{usage}</span>

              {result && (
                <div
                  className={`flex items-start gap-2 mt-1 px-2.5 py-1.5 rounded-lg text-xs border animate-in fade-in ${
                    result.ok
                      ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800'
                      : 'bg-rose-50/70 border-rose-200/80 text-rose-800'
                  }`}
                >
                  {result.ok ? (
                    <CheckCircle2
                      size={13}
                      className='text-emerald-600 shrink-0 mt-0.5'
                    />
                  ) : (
                    <AlertCircle
                      size={13}
                      className='text-rose-600 shrink-0 mt-0.5'
                    />
                  )}
                  <span className='break-words leading-relaxed font-medium'>
                    {result.message}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
