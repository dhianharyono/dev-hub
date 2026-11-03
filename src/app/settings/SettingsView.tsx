'use client';

import { useSettings } from './components/useSettings';
import { usePm2 } from './components/usePm2';
import { SettingsSkeleton } from './components/SettingsSkeleton';
import { SettingsStatusGrid } from './components/SettingsStatusGrid';
import { AppSettingsModeDropdown } from './components/AppSettingsModeDropdown';
import { TaigaSettingsSection } from './components/TaigaSettingsSection';
import { GitlabSettingsSection } from './components/GitlabSettingsSection';
import { GeminiSettingsSection } from './components/GeminiSettingsSection';
import { Pm2SettingsSection } from './components/Pm2SettingsSection';
import { SettingsSaveBar } from './components/SettingsSaveBar';

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

  const isMonitoring = form.appMode === 'monitoring';

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className='flex flex-col'>
      {/* Header Page */}
      <header className='page-header !items-start relative z-40 mb-4'>
        <div className='max-w-2xl'>
          <div className='eyebrow'>Integrasi &amp; Kredensial</div>
          <h1 className='flex items-center gap-2.5'>
            <span>Pengaturan</span>
            <span className='gradient-text'>Sistem</span>
          </h1>
          <p>
            Konfigurasi koneksi SSO Taiga, GitLab PAT, LLM Manajemen, layanan
            background PM2
          </p>
        </div>

        {/* Dropdown Filter Mode di Kanan Atas */}
        <div className='shrink-0 self-start mt-0 sm:mt-1'>
          <AppSettingsModeDropdown form={form} onChange={handleChange} />
        </div>
      </header>

      {/* Status Integrasi Cards (Overview) */}
      <SettingsStatusGrid
        form={form}
        integrations={integrations}
        pm2Status={pm2Status}
      />

      <form
        id='settings-form'
        onSubmit={handleSave}
        className='flex flex-col gap-7'
      >
        <TaigaSettingsSection
          form={form}
          onChange={handleChange}
          testResult={testResult.taiga}
          testing={testing.taiga}
          onTest={() => runTest('taiga')}
          sessionInput={taigaSessionInput}
          onSessionInputChange={setTaigaSessionInput}
        />

        {!isMonitoring && (
          <GitlabSettingsSection
            form={form}
            onChange={handleChange}
            testResult={testResult.gitlab}
            testing={testing.gitlab}
            onTest={() => runTest('gitlab')}
          />
        )}

        <GeminiSettingsSection
          form={form}
          onChange={handleChange}
          testResult={testResult.ai || testResult.gemini}
          testing={testing.ai || testing.gemini}
          onTest={() => runTest('ai')}
        />

        <Pm2SettingsSection
          status={pm2Status}
          loading={pm2Loading}
          actionLoading={pm2ActionLoading}
          lastOutput={pm2LastOutput}
          onRefresh={refreshPm2Status}
          onAction={executePm2Action}
        />

        <SettingsSaveBar saving={saving} saveMsg={saveMsg} />
      </form>
    </div>
  );
}
