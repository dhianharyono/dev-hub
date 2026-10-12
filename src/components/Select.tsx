'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { extractNodeText, parseChildrenToOptions } from './select/utils';
import { SelectDropdownPortal } from './select/SelectDropdownPortal';
import { useSelectPositionAndEvents } from './select/useSelectPositionAndEvents';
import type { SelectOptionItem, SelectProps } from './select/types';

export type { SelectOptionItem, SelectProps };

export function Select({
  id,
  name,
  value,
  defaultValue,
  placeholder = 'Pilih...',
  disabled = false,
  className = '',
  style,
  options: propOptions,
  children,
  onChange,
  onValueChange,
  error = false,
  size,
  'aria-label': ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState<string | number>(
    defaultValue ?? '',
  );
  const activeValue = value !== undefined ? value : uncontrolledValue;
  const [searchQuery, setSearchQuery] = useState('');

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Derive options list
  const allOptions: SelectOptionItem[] = useMemo(() => {
    if (propOptions && propOptions.length > 0) return propOptions;
    if (children) return parseChildrenToOptions(children);
    return [];
  }, [propOptions, children]);

  const { menuCoords, updatePosition } = useSelectPositionAndEvents(
    isOpen,
    setIsOpen,
    allOptions.length,
    setSearchQuery,
    triggerRef,
    menuRef,
    searchInputRef,
  );

  // Find currently selected option
  const selectedOption = useMemo(() => {
    const strVal = String(activeValue);
    return allOptions.find((opt) => String(opt.value) === strVal);
  }, [allOptions, activeValue]);

  // Filtered options if search is active
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return allOptions;
    const q = searchQuery.toLowerCase().trim();
    return allOptions.filter((opt) => {
      const text = typeof opt.label === 'string' ? opt.label : extractNodeText(opt.label);
      return text.toLowerCase().includes(q) || String(opt.value).toLowerCase().includes(q);
    });
  }, [allOptions, searchQuery]);

  // Selectable options for keyboard navigation
  const selectableOptions = useMemo(
    () => filteredOptions.filter((opt) => !opt.disabled),
    [filteredOptions],
  );

  const isKeyboardNavRef = useRef<boolean>(false);
  const keyboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const markKeyboardNav = () => {
    isKeyboardNavRef.current = true;
    if (keyboardTimerRef.current) clearTimeout(keyboardTimerRef.current);
    keyboardTimerRef.current = setTimeout(() => {
      isKeyboardNavRef.current = false;
    }, 200);
  };

  const scrollToOption = useCallback((index: number) => {
    if (!menuRef.current) return;
    const el = menuRef.current.querySelector<HTMLElement>(
      `[data-selectable-index="${index}"]`,
    );
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, []);

  // Initialize highlightedIndex when opened
  useEffect(() => {
    if (isOpen) {
      const activeIdx = selectableOptions.findIndex(
        (o) => String(o.value) === String(activeValue),
      );
      const nextIdx =
        activeIdx >= 0 ? activeIdx : selectableOptions.length > 0 ? 0 : -1;
      const timer = setTimeout(() => {
        setHighlightedIndex(nextIdx);
        if (nextIdx >= 0) {
          scrollToOption(nextIdx);
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setHighlightedIndex(-1), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeValue, selectableOptions, scrollToOption]);

  // Reset highlight to first match when search query changes
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (selectableOptions.length > 0) {
        setHighlightedIndex(0);
        scrollToOption(0);
      } else {
        setHighlightedIndex(-1);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, selectableOptions, scrollToOption]);

  // Group options
  const groupedOptions = useMemo(() => {
    const groups: { name: string; items: SelectOptionItem[] }[] = [];
    const nonGrouped: SelectOptionItem[] = [];

    filteredOptions.forEach((opt) => {
      if (opt.group) {
        let existing = groups.find((g) => g.name === opt.group);
        if (!existing) {
          existing = { name: opt.group, items: [] };
          groups.push(existing);
        }
        existing.items.push(opt);
      } else {
        nonGrouped.push(opt);
      }
    });

    return { nonGrouped, groups };
  }, [filteredOptions]);

  const handleSelect = (option: SelectOptionItem) => {
    if (option.disabled) return;
    const nextVal = String(option.value);

    setUncontrolledValue(nextVal);
    setIsOpen(false);
    setSearchQuery('');

    if (onValueChange) onValueChange(nextVal);
    if (onChange) onChange({ target: { value: nextVal, name: name || id || '' } });
    triggerRef.current?.focus();
  };

  const isSmall = size === 'sm' || className.includes('small');

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectableOptions.length === 0) return;
      markKeyboardNav();
      setHighlightedIndex((prev) => {
        const next = prev < selectableOptions.length - 1 ? prev + 1 : 0;
        scrollToOption(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectableOptions.length === 0) return;
      markKeyboardNav();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : selectableOptions.length - 1;
        scrollToOption(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < selectableOptions.length) {
        handleSelect(selectableOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
      triggerRef.current?.focus();
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        markKeyboardNav();
        setHighlightedIndex((prev) => {
          if (selectableOptions.length === 0) return -1;
          const next =
            e.key === 'ArrowDown'
              ? prev < selectableOptions.length - 1 ? prev + 1 : 0
              : prev > 0 ? prev - 1 : selectableOptions.length - 1;
          scrollToOption(next);
          return next;
        });
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      } else if (highlightedIndex >= 0 && highlightedIndex < selectableOptions.length) {
        e.preventDefault();
        handleSelect(selectableOptions[highlightedIndex]);
      }
    }
  };

  const hasWidthClass = /(^|\s)w-/.test(className);

  return (
    <div
      className={`relative inline-block font-sans box-border ${hasWidthClass ? '' : 'w-full'} ${className}`}
      style={style?.width !== undefined ? { width: style.width } : undefined}
    >
      <button
        ref={triggerRef}
        id={id}
        name={name}
        type='button'
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        onKeyDown={handleTriggerKeyDown}
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updatePosition();
            setIsOpen((prev) => {
              const next = !prev;
              if (!next) setSearchQuery('');
              return next;
            });
          }
        }}
        className={`
          w-full bg-surface text-slate-text border rounded-[10px] font-sans font-medium flex items-center justify-between gap-2 cursor-pointer outline-none box-border text-left leading-normal transition-all select-none
          ${isSmall ? 'min-h-[32px] h-[32px] px-2.5 text-[12.5px] rounded-lg' : 'min-h-[38px] px-3 text-[13.5px]'}
          ${error ? 'border-rose-accent focus-visible:ring-3 focus-visible:ring-rose-accent/18' : 'border-border-strong hover:not-disabled:border-slate-400 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15'}
          ${isOpen ? 'border-brand ring-3 ring-brand/15' : ''}
          ${disabled ? 'bg-surface-subtle text-slate-dim cursor-not-allowed opacity-70' : ''}
        `}
        style={style}
      >
        <span
          className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-[1.3] ${
            !selectedOption && !activeValue ? 'text-slate-dim font-normal' : ''
          }`}
        >
          {selectedOption ? selectedOption.label : (activeValue ? String(activeValue) : placeholder)}
        </span>
        <ChevronDown
          size={isSmall ? 13 : 15}
          className={`shrink-0 text-slate-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand' : ''}`}
        />
      </button>

      {isOpen && (
        <SelectDropdownPortal
          menuRef={menuRef}
          searchInputRef={searchInputRef}
          menuCoords={menuCoords}
          allOptionsCount={allOptions.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchKeyDown={handleSearchKeyDown}
          filteredOptions={filteredOptions}
          groupedOptions={groupedOptions}
          selectableOptions={selectableOptions}
          activeValue={activeValue}
          highlightedIndex={highlightedIndex}
          onHoverOption={setHighlightedIndex}
          onSelectOption={handleSelect}
          isKeyboardNavRef={isKeyboardNavRef}
        />
      )}
    </div>
  );
}

export default Select;
