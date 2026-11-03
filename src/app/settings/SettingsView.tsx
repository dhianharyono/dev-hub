'use client';

import { useState } from 'react';
import { ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { useSettings } from './components/useSettings';
import { usePm2 } from './components/usePm2';
import { SettingsSkeleton } from './components/SettingsSkeleton';
import { SettingsStatusGrid } from './components/SettingsStatusGrid';
import { AppSettingsModeSection } from './components/AppSettingsModeSection';
import { TaigaSettingsSection } from './components/TaigaSettingsSection';
import { GitlabSettingsSection } from './components/GitlabSettingsSection';
import { GeminiSettingsSection } from './components/GeminiSettingsSection';
import { Pm2SettingsSection } from './components/Pm2SettingsSection';
import { SettingsSaveBar } from './components/SettingsSaveBar';

const DEFAULT_MINIMIZED: Record<string, boolean> = {
  taiga: true,
  gitlab: true,
  gemini: true,
  pm2: true,
};

export default function SettingsView() {
  const {
    form,
    integrations,
    loading,
    saving,
    saveMsg,
    taigaSessionInput,
    setTaigaSessionInput,
    testResult,
    testing,
    handleChange,
    handleSave,
    runTest,
  } = useSettings();

  const {
    status: pm2Status,
    loading: pm2Loading,
    actionLoading: pm2ActionLoading,
    lastOutput: pm2LastOutput,
    fetchStatus: refreshPm2Status,
    executeAction: executePm2Action,
  } = usePm2();

  // Inisialisasi lazy state dari localStorage langsung tanpa useEffect untuk mencegah cascading render
  const [minimizedCards, setMinimizedCards] = useState<Record<string, boolean>>(
    () => {
      if (typeof window === 'undefined') return DEFAULT_MINIMIZED;
      try {
        const saved = localStorage.getItem('devhub_settings_minimized_cards_v3');
        if (saved) {
          return { ...DEFAULT_MINIMIZED, ...JSON.parse(saved) };
        }
      } catch {
        // ignore
      }
      return DEFAULT_MINIMIZED;
    },
  );

  const toggleCard = (cardKey: string) => {
    setMinimizedCards((prev) => {
      const next = { ...prev, [cardKey]: !prev[cardKey] };
      try {
        localStorage.setItem(
          'devhub_settings_minimized_cards_v3',
          JSON.stringify(next),
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  const allMinimized = Object.values(minimizedCards).every(Boolean);

  const toggleAllCards = () => {
    const nextState = !allMinimized;
    const next = {
      taiga: nextState,
      gitlab: nextState,
      gemini: nextState,
      pm2: nextState,
    };
    setMinimizedCards(next);
    try {
      localStorage.setItem(
        'devhub_settings_minimized_cards_v3',
        JSON.stringify(next),
      );
    } catch {
      // ignore
    }
  };

  const isMonitoring = form.appMode === 'monitoring';

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className='flex flex-col'>
      {/* Header Page */}
      <header className='page-header !items-start relative z-40 mb-3'>
        <div className='max-w-2xl'>
          <div className='eyebrow'>Integrasi &amp; Kredensial</div>
          <h1 className='flex items-center gap-2.5'>
            <span>Pengaturan</span>
            <span className='gradient-text'>Sistem</span>
          </h1>
          <p>
            Konfigurasi koneksi SSO Taiga, GitLab PAT, LLM Manajemen, dan layanan
            background PM2
          </p>
        </div>
      </header>

      {/* Section Mode Tampilan Sistem (Panjang di bawah sub judul) */}
      <AppSettingsModeSection form={form} onChange={handleChange} />

      {/* Status Integrasi Cards (Overview) */}
      <SettingsStatusGrid
        form={form}
        integrations={integrations}
        pm2Status={pm2Status}
      />

      {/* Quick Action Toggle All Cards - Spacing lega dan proporsional */}
      <div className='flex items-center justify-between px-1 pt-6 pb-4'>
        <span className='text-[11px] font-extrabold text-slate-400 uppercase tracking-wider'>
          Daftar Modul Konfigurasi
        </span>
        <button
          type='button'
          onClick={toggleAllCards}
          className='btn btn-sm btn-secondary text-slate-700 hover:text-slate-900 font-semibold inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl shadow-2xs transition-all'
          title={allMinimized ? 'Perluas semua kartu modul' : 'Minimalkan semua kartu modul'}
        >
          {allMinimized ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
          <span>{allMinimized ? 'Perluas Semua Modul' : 'Minimalkan Semua Modul'}</span>
        </button>
      </div>

      <form
        id='settings-form'
        onSubmit={handleSave}
        className='flex flex-col gap-6'
      >
        <TaigaSettingsSection
          form={form}
          onChange={handleChange}
          testResult={testResult.taiga}
          testing={testing.taiga}
          onTest={() => runTest('taiga')}
          sessionInput={taigaSessionInput}
          onSessionInputChange={setTaigaSessionInput}
          minimized={minimizedCards.taiga}
          onToggleMinimize={() => toggleCard('taiga')}
        />

        {!isMonitoring && (
          <GitlabSettingsSection
            form={form}
            onChange={handleChange}
            testResult={testResult.gitlab}
            testing={testing.gitlab}
            onTest={() => runTest('gitlab')}
            minimized={minimizedCards.gitlab}
            onToggleMinimize={() => toggleCard('gitlab')}
          />
        )}

        <GeminiSettingsSection
          form={form}
          onChange={handleChange}
          testResult={testResult.ai || testResult.gemini}
          testing={testing.ai || testing.gemini}
          onTest={() => runTest('ai')}
          minimized={minimizedCards.gemini}
          onToggleMinimize={() => toggleCard('gemini')}
        />

        <Pm2SettingsSection
          status={pm2Status}
          loading={pm2Loading}
          actionLoading={pm2ActionLoading}
          lastOutput={pm2LastOutput}
          onRefresh={refreshPm2Status}
          onAction={executePm2Action}
          minimized={minimizedCards.pm2}
          onToggleMinimize={() => toggleCard('pm2')}
        />

        <SettingsSaveBar saving={saving} saveMsg={saveMsg} />
      </form>
    </div>
  );
}
