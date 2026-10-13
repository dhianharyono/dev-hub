'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export interface TooltipProps {
  /** The content displayed inside the tooltip popover */
  content: React.ReactNode;
  /** Optional title header displayed inside the tooltip */
  title?: React.ReactNode;
  /** Optional trigger element. If not provided, a default Info icon button is rendered */
  children?: React.ReactNode;
  /** Alignment of the tooltip relative to the trigger. Default is 'top' */
  position?: 'top' | 'bottom';
  /** Width class for the tooltip popover. Default is 'w-72' */
  widthClass?: string;
  /** Optional custom class for the outer wrapper */
  className?: string;
  /** Accessible label for the default trigger button */
  ariaLabel?: string;
}

export function Tooltip({
  content,
  title,
  children,
  position = 'top',
  widthClass = 'w-72',
  className = '',
  ariaLabel = 'Informasi bantuan',
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children ? (
        <div
          role='button'
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle();
            }
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={(e) => {
            if (!containerRef.current?.contains(e.relatedTarget as Node)) {
              setIsOpen(false);
            }
          }}
          aria-expanded={isOpen}
          className='cursor-pointer inline-flex items-center'
        >
          {children}
        </div>
      ) : (
        <button
          type='button'
          onClick={toggle}
          onFocus={() => setIsOpen(true)}
          onBlur={(e) => {
            if (!containerRef.current?.contains(e.relatedTarget as Node)) {
              setIsOpen(false);
            }
          }}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          className='text-slate-400 hover:text-brand focus:text-brand transition-colors p-0.5 rounded cursor-pointer inline-flex items-center justify-center'
        >
          <Info size={14} />
        </button>
      )}

      {isOpen && (
        <div
          className={`absolute z-50 pointer-events-auto ${
            position === 'top'
              ? 'bottom-full right-0 pb-2'
              : 'top-full right-0 pt-2'
          }`}
        >
          <div
            role='tooltip'
            className={`relative ${widthClass} p-3.5 bg-white text-slate-700 text-xs rounded-xl shadow-xl shadow-slate-900/10 border border-slate-200/90`}
          >
            {title && (
              <div className='font-semibold text-slate-900 mb-2 flex items-center gap-1.5'>
                {title}
              </div>
            )}
            <div className='text-[11.5px] text-slate-600 leading-relaxed'>
              {content}
            </div>

            {/* Pointer arrow with matching white background & subtle shadow */}
            {position === 'top' ? (
              <div className='absolute top-full right-2 sm:right-3 w-2.5 h-2.5 bg-white border-r border-b border-slate-200 -mt-[5px] rotate-45' />
            ) : (
              <div className='absolute bottom-full right-2 sm:right-3 w-2.5 h-2.5 bg-white border-l border-t border-slate-200 -mb-[5px] rotate-45' />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Tooltip;
