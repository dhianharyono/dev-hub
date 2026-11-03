'use client';

import { Select } from '@/components/Select';
import {
  AI_FEATURES,
  MODEL_OPTIONS,
  resolveGlobalModel,
  type AiProvider,
} from '@/lib/ai/models';
import type { PublicSettings } from '../types';

interface AiMenuModelsPanelProps {
  form: Partial<PublicSettings>;
  onChange: (key: keyof PublicSettings, value: unknown) => void;
}

export function AiMenuModelsPanel({ form, onChange }: AiMenuModelsPanelProps) {
  const provider: AiProvider = form.aiProvider || 'gemini';
  const globalModel = resolveGlobalModel(form);
  const followLabel = `Ikuti model global (${globalModel})`;

  return (
    <div className='flex flex-col gap-4 pt-5 border-t border-border'>
      <div>
        <div className='text-sm font-bold text-slate-text'>Model per Menu</div>
        <div className='xs dim mt-0.5'>
          Provider dan API key tetap sama. Biarkan di pilihan &quot;Ikuti model
          global&quot; untuk memakai {globalModel}.
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {AI_FEATURES.map(({ settingKey, label, usage }) => {
          const value = (form[settingKey] as string | undefined) || '';
          return (
            <div className='field' key={settingKey}>
              <label htmlFor={`model-${settingKey}`}>{label}</label>
              {provider === 'custom' ? (
                <input
                  id={`model-${settingKey}`}
                  className='input'
                  value={value}
                  placeholder={followLabel}
                  onChange={(e) => onChange(settingKey, e.target.value)}
                />
              ) : (
                <Select
                  id={`model-${settingKey}`}
                  aria-label={`Model untuk ${label}`}
                  value={value}
                  onChange={(e) => onChange(settingKey, e.target.value)}
                  options={[
                    { value: '', label: followLabel },
                    ...MODEL_OPTIONS[provider],
                  ]}
                />
              )}
              <span className='hint'>{usage}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

