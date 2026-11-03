'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { AppMode } from '@/lib/settings';

export const APP_MODE_STORAGE_KEY = 'devhub_app_mode';
export const APP_MODE_CHANGE_EVENT = 'devhub:app-mode-changed';

interface AppModeContextValue {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  isDeveloper: boolean;
  isMonitoring: boolean;
}

const AppModeContext = createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [appMode, setAppModeState] = useState<AppMode>(() => {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(APP_MODE_STORAGE_KEY);
      if (local === 'developer' || local === 'monitoring') {
        return local;
      }
    }
    return 'developer';
  });

  useEffect(() => {
    // Fetch authoritative setting from server
    let ignore = false;
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.appMode) {
          const serverMode: AppMode =
            data.appMode === 'monitoring' ? 'monitoring' : 'developer';
          setAppModeState(serverMode);
          localStorage.setItem(APP_MODE_STORAGE_KEY, serverMode);
        }
      })
      .catch(() => {});

    // Listen to custom event for immediate sync across components
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ appMode: AppMode }>;
      if (customEvent.detail?.appMode) {
        setAppModeState(customEvent.detail.appMode);
      }
    };

    window.addEventListener(APP_MODE_CHANGE_EVENT, handleEvent);
    return () => {
      ignore = true;
      window.removeEventListener(APP_MODE_CHANGE_EVENT, handleEvent);
    };
  }, []);

  const setAppMode = useCallback((mode: AppMode) => {
    setAppModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(APP_MODE_STORAGE_KEY, mode);
      window.dispatchEvent(
        new CustomEvent(APP_MODE_CHANGE_EVENT, { detail: { appMode: mode } }),
      );
    }
  }, []);

  const value: AppModeContextValue = {
    appMode,
    setAppMode,
    isDeveloper: appMode === 'developer',
    isMonitoring: appMode === 'monitoring',
  };

  return (
    <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
  );
}

export function useAppMode(): AppModeContextValue {
  const ctx = useContext(AppModeContext);
  if (!ctx) {
    // Fallback if rendered outside provider (e.g. tests)
    return {
      appMode: 'developer',
      setAppMode: () => {},
      isDeveloper: true,
      isMonitoring: false,
    };
  }
  return ctx;
}
