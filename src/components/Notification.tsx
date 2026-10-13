'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title?: string;
  message: React.ReactNode;
  duration?: number;
}

export interface NotificationProps {
  type?: NotificationType;
  title?: string;
  message?: React.ReactNode;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

const typeConfig: Record<
  NotificationType,
  {
    icon: typeof CheckCircle2;
    containerClass: string;
    iconWrapperClass: string;
    titleClass: string;
    textClass: string;
    closeClass: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    containerClass:
      'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-[0_2px_12px_rgba(16,185,129,0.08)]',
    iconWrapperClass: 'bg-emerald-600 text-white shadow-2xs',
    titleClass: 'text-emerald-950',
    textClass: 'text-emerald-800',
    closeClass: 'text-emerald-700 hover:bg-emerald-100/80',
  },
  error: {
    icon: AlertCircle,
    containerClass:
      'bg-rose-50/95 border-rose-200 text-rose-900 shadow-[0_2px_12px_rgba(239,68,68,0.08)]',
    iconWrapperClass: 'bg-rose-600 text-white shadow-2xs',
    titleClass: 'text-rose-950',
    textClass: 'text-rose-800',
    closeClass: 'text-rose-700 hover:bg-rose-100/80',
  },
  warning: {
    icon: AlertTriangle,
    containerClass:
      'bg-amber-50/95 border-amber-200 text-amber-900 shadow-[0_2px_12px_rgba(245,158,11,0.08)]',
    iconWrapperClass: 'bg-amber-500 text-white shadow-2xs',
    titleClass: 'text-amber-950',
    textClass: 'text-amber-800',
    closeClass: 'text-amber-700 hover:bg-amber-100/80',
  },
  info: {
    icon: Info,
    containerClass:
      'bg-blue-50/95 border-blue-200 text-blue-900 shadow-[0_2px_12px_rgba(37,99,235,0.08)]',
    iconWrapperClass: 'bg-blue-600 text-white shadow-2xs',
    titleClass: 'text-blue-950',
    textClass: 'text-blue-800',
    closeClass: 'text-blue-700 hover:bg-blue-100/80',
  },
};

/**
 * Komponen Notifikasi / Alert visual serbaguna
 */
export function Notification({
  type = 'info',
  title,
  message,
  children,
  onClose,
  className = '',
  size = 'md',
}: NotificationProps) {
  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = config.icon;

  const isSmall = size === 'sm';

  return (
    <div
      role='alert'
      className={`relative flex items-start gap-3 rounded-xl border transition-all duration-200 animate-in fade-in slide-in-from-top-1 ${
        isSmall ? 'p-2.5 px-3 text-xs' : 'p-3.5 sm:px-4 text-[13px]'
      } ${config.containerClass} ${className}`}
    >
      <div
        className={`shrink-0 rounded-lg flex items-center justify-center ${
          isSmall ? 'w-5 h-5 mt-0.5' : 'w-6 h-6 mt-0.5'
        } ${config.iconWrapperClass}`}
        aria-hidden='true'
      >
        <IconComponent size={isSmall ? 13 : 15} strokeWidth={2.4} />
      </div>

      <div className='flex-1 min-w-0 pt-0.5 leading-snug'>
        {title && (
          <div
            className={`font-bold tracking-tight mb-0.5 ${
              isSmall ? 'text-[11.5px]' : 'text-[13px]'
            } ${config.titleClass}`}
          >
            {title}
          </div>
        )}
        {(message || children) && (
          <div className={`font-medium break-words ${config.textClass}`}>
            {message}
            {children}
          </div>
        )}
      </div>

      {onClose && (
        <button
          type='button'
          onClick={onClose}
          className={`shrink-0 rounded-lg p-1 transition-colors cursor-pointer -mr-1 -mt-0.5 ${config.closeClass}`}
          aria-label='Tutup notifikasi'
        >
          <X size={15} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}

// ==========================================
// TOAST CONTEXT & GLOBAL NOTIFICATION HOOK
// ==========================================

interface NotificationContextValue {
  notifications: NotificationItem[];
  notify: {
    (item: Omit<NotificationItem, 'id'>): string;
    success: (message: React.ReactNode, title?: string, duration?: number) => string;
    error: (message: React.ReactNode, title?: string, duration?: number) => string;
    warning: (message: React.ReactNode, title?: string, duration?: number) => string;
    info: (message: React.ReactNode, title?: string, duration?: number) => string;
  };
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const pushNotification = useCallback(
    (item: Omit<NotificationItem, 'id'>) => {
      const id =
        Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const newItem: NotificationItem = { ...item, id };

      setNotifications((prev) => [...prev, newItem]);

      const duration = item.duration ?? 4500;
      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    [removeNotification],
  );

  const notify = Object.assign(pushNotification, {
    success: (
      message: React.ReactNode,
      title?: string,
      duration?: number,
    ) =>
      pushNotification({
        type: 'success',
        message,
        title,
        duration,
      }),
    error: (
      message: React.ReactNode,
      title?: string,
      duration?: number,
    ) =>
      pushNotification({
        type: 'error',
        message,
        title,
        duration,
      }),
    warning: (
      message: React.ReactNode,
      title?: string,
      duration?: number,
    ) =>
      pushNotification({
        type: 'warning',
        message,
        title,
        duration,
      }),
    info: (
      message: React.ReactNode,
      title?: string,
      duration?: number,
    ) =>
      pushNotification({
        type: 'info',
        message,
        title,
        duration,
      }),
  });

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        notify,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}

      {/* Floating Global Toast Container */}
      <aside
        aria-live='polite'
        aria-atomic='true'
        className='fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100%-2.5rem)] pointer-events-none'
      >
        {notifications.map((item) => (
          <div
            key={item.id}
            className='pointer-events-auto shadow-lg backdrop-blur-md'
          >
            <Notification
              type={item.type}
              title={item.title}
              message={item.message}
              onClose={() => removeNotification(item.id)}
            />
          </div>
        ))}
      </aside>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider',
    );
  }
  return context;
}

export const useToast = useNotification;
