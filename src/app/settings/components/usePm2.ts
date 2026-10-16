import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '@/components/Notification';

export interface Pm2Status {
  installed: boolean;
  exists: boolean;
  running: boolean;
  status: 'online' | 'stopped' | 'errored' | 'not_started' | 'not_installed' | 'error';
  pid?: number;
  uptime?: number;
  restarts?: number;
  memory?: number;
  cpu?: number;
  port?: number;
  message?: string;
  error?: string;
}

export function usePm2() {
  const { notify } = useNotification();
  const [status, setStatus] = useState<Pm2Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastOutput, setLastOutput] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/pm2');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal menghubungi server';
      setStatus({
        installed: false,
        exists: false,
        running: false,
        status: 'error',
        error: msg,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch('/api/settings/pm2')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data) {
          setStatus(data);
        }
      })
      .catch((e: unknown) => {
        if (!ignore) {
          const msg = e instanceof Error ? e.message : 'Gagal menghubungi server';
          setStatus({
            installed: false,
            exists: false,
            running: false,
            status: 'error',
            error: msg,
          });
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const executeAction = async (action: 'start' | 'restart' | 'stop') => {
    setActionLoading(action);
    setLastOutput(null);

    try {
      const res = await fetch('/api/settings/pm2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.status) {
          setStatus(data.status);
        } else {
          await fetchStatus();
        }

        const actionSuccessNames: Record<string, string> = {
          start: 'PM2 berhasil diaktifkan di layar belakang!',
          restart: 'Layanan PM2 berhasil dimulai ulang!',
          stop: 'Layanan PM2 berhasil dihentikan.',
        };

        notify.success(actionSuccessNames[action] || data.message, 'PM2 Process Manager');
        if (data.stdout) {
          setLastOutput(data.stdout);
        }
      } else {
        const errMsg = data.error || 'Gagal menjalankan aksi PM2.';
        notify.error(errMsg, 'Gagal Eksekusi PM2');
        if (data.stderr || data.error) {
          setLastOutput(data.stderr || data.error);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      notify.error(message, 'Kesalahan Koneksi');
      setLastOutput(message);
    } finally {
      setActionLoading(null);
    }
  };

  return {
    status,
    loading,
    actionLoading,
    lastOutput,
    fetchStatus,
    executeAction,
  };
}
