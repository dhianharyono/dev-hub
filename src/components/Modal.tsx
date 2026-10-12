'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  header?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  allowFullscreen?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  closeOnBackdropClick?: boolean;
  className?: string;
  bodyClassName?: string;
}

const emptySubscribe = () => () => {};

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[96vw] h-[92vh]',
};

export function Modal({
  isOpen,
  onClose,
  header,
  title,
  subtitle,
  badge,
  children,
  footer,
  size = 'lg',
  allowFullscreen = false,
  isFullscreen = false,
  onToggleFullscreen,
  closeOnBackdropClick = true,
  className = '',
  bodyClassName,
}: ModalProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isMounted || !isOpen) return null;

  const currentSizeClass = isFullscreen ? 'max-w-[98vw] h-[96vh]' : sizeClasses[size];

  return createPortal(
    <div
      role='dialog'
      aria-modal='true'
      className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm transition-opacity'
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 border bg-(--surface) border-(--border) ${isFullscreen ? 'max-h-[96vh]' : 'max-h-[90vh]'} ${currentSizeClass} ${className}`}
      >
        {/* Header */}
        {header ? (
          header
        ) : (title || subtitle) ? (
          <div className='flex items-center justify-between px-5 sm:px-6 py-4 border-b select-none border-(--border) bg-(--surface)'>
            <div className='flex items-center gap-2.5 min-w-0'>
              <div className='flex flex-col min-w-0'>
                <div className='flex items-center gap-2'>
                  {typeof title === 'string' ? (
                    <h3 className='text-sm sm:text-base font-bold truncate text-(--text)'>
                      {title}
                    </h3>
                  ) : (
                    title
                  )}
                  {badge}
                </div>
                {subtitle && (
                  <p className='text-xs truncate mt-0.5 text-(--text-3)'>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className='flex items-center gap-1.5 ml-3'>
              {allowFullscreen && onToggleFullscreen && (
                <button
                  type='button'
                  onClick={onToggleFullscreen}
                  className='p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                  title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
                  aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              )}
              <button
                type='button'
                onClick={onClose}
                className='p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                title='Tutup modal (Esc)'
                aria-label='Tutup modal'
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : null}

        {/* Scrollable Body */}
        <div className={`flex-1 overflow-y-auto ${bodyClassName || 'p-4 sm:p-6'}`}>{children}</div>

        {/* Footer */}
        {footer && (
          <div className='flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-(--border) bg-(--surface-subtle)'>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
