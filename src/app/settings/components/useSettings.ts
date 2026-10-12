import { useEffect, useState } from 'react';
import type { PublicSettings, TestResult, TestingState } from '../types';
import type { IntegrationStatus } from '@/components/hooks';

export function useSettings() {
  const [form, setForm] = useState<Partial<PublicSettings>>({});
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [taigaSessionInput, setTaigaSessionInput] = useState('');
  const [testResult, setTestResult] = useState<TestResult>({});
  const [testing, setTesting] = useState<TestingState>({});

  const fetchIntegrations = async (force = false) => {
    try {
      const res = await fetch(`/api/integrations/status${force ? '?force=1' : ''}`);
      if (res.ok) {
        setIntegrations(await res.json());
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/settings').then((r) => r.json()),
      fetch('/api/integrations/status').then((r) => r.json()),
    ]).then(async ([settingsRes, integrationsRes]) => {
      let initialForm: Partial<PublicSettings> = {};
      if (settingsRes.status === 'fulfilled') {
        initialForm = settingsRes.value;
        setForm(initialForm);
        // Retain and populate taigaSessionInput so user can view and edit directly
        if (initialForm.taigaToken) {
          setTaigaSessionInput(initialForm.taigaToken);
        }
      }
      if (integrationsRes.status === 'fulfilled') {
        setIntegrations(integrationsRes.value);
      }
      setLoading(false);

      // 1-Click Taiga Import via URL query parameters (?taiga_token=...&taiga_refresh=...)
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const urlToken = searchParams.get('taiga_token');
        const urlRefresh = searchParams.get('taiga_refresh');
        if (urlToken) {
          const cleanToken = urlToken.replace(/^["']+|["']+$/g, '').trim();
          const cleanRefresh = (urlRefresh || '').replace(/^["']+|["']+$/g, '').trim();
          const sessionPayload = JSON.stringify({
            token: cleanToken,
            refresh: cleanRefresh,
          });
          setTaigaSessionInput(cleanToken);
          setSaving(true);
          try {
            const res = await fetch('/api/settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...initialForm,
                taigaSession: sessionPayload,
                taigaToken: cleanToken,
                taigaRefresh: cleanRefresh,
              }),
            });
            const savedData = await res.json();
            if (res.ok) {
              setForm(savedData);
              setTaigaSessionInput(cleanToken);
              setSaveMsg('✓ Token Taiga berhasil disinkronkan otomatis!');
              setTimeout(() => setSaveMsg(null), 5000);
              await fetchIntegrations(true);
              window.history.replaceState({}, '', window.location.pathname);
              // Trigger test immediately
              fetch('/api/settings/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target: 'taiga', taigaToken: cleanToken }),
              }).then((r) => r.json()).then((d) => {
                setTestResult((prev) => ({
                  ...prev,
                  taiga: { ok: d.ok, message: d.ok ? d.message : d.error },
                }));
              });
            }
          } catch {
            // Error will be visible in status
          } finally {
            setSaving(false);
          }
        }
      }
    }).catch((e: Error) => {
      setSaveMsg('Gagal memuat pengaturan: ' + e.message);
      setLoading(false);
    });
  }, []);

  const handleChange = (key: keyof PublicSettings, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (taigaSessionInput.trim()) {
        payload.taigaSession = taigaSessionInput.trim();
      }
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(data);
      // Keep taigaSessionInput populated so user can continue to view and edit directly
      if (payload.taigaSession) {
        setTaigaSessionInput(String(payload.taigaSession));
      } else if (data.taigaToken) {
        setTaigaSessionInput(data.taigaToken);
      }
      setSaveMsg('✓ Pengaturan berhasil disimpan!');
      setTimeout(() => setSaveMsg(null), 4000);
      await fetchIntegrations(true);
    } catch (err) {
      setSaveMsg('✕ Gagal menyimpan: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const runTest = async (target: 'taiga' | 'gitlab' | 'gemini' | 'ai') => {
    const key = target === 'ai' ? 'ai' : target;
    setTesting((prev) => ({ ...prev, [key]: true, ...(target === 'ai' ? { gemini: true } : {}) }));
    try {
      const payload = {
        target,
        taigaBaseUrl: form.taigaBaseUrl,
        taigaSession: taigaSessionInput,
        taigaToken: form.taigaToken,
        gitlabBaseUrl: form.gitlabBaseUrl,
        gitlabToken: form.gitlabToken,
        geminiApiKey: form.aiApiKey || form.geminiApiKey,
        geminiModel: form.aiModel || form.geminiModel,
        aiProvider: form.aiProvider || 'gemini',
        aiApiKey: form.aiApiKey || form.geminiApiKey,
        aiModel: form.aiModel || form.geminiModel,
        aiBaseUrl: form.aiBaseUrl,
      };
      const res = await fetch('/api/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTestResult((prev) => ({
        ...prev,
        [key]: { ok: res.ok, message: res.ok ? data.message : data.error },
        ...(target === 'ai' ? { gemini: { ok: res.ok, message: res.ok ? data.message : data.error } } : {}),
      }));
      await fetchIntegrations(true);
    } catch (err) {
      setTestResult((prev) => ({
        ...prev,
        [key]: { ok: false, message: (err as Error).message },
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [key]: false, ...(target === 'ai' ? { gemini: false } : {}) }));
    }
  };

  return {
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
  };
}
