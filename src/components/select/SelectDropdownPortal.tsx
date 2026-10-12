import React from 'react';
import { createPortal } from 'react-dom';
import { Check, Search } from 'lucide-react';
import type { MenuCoords, SelectOptionItem } from './types';

interface SelectDropdownPortalProps {
  menuRef: React.RefObject<HTMLDivElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  menuCoords: MenuCoords;
  allOptionsCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  filteredOptions: SelectOptionItem[];
  groupedOptions: {
    nonGrouped: SelectOptionItem[];
    groups: { name: string; items: SelectOptionItem[] }[];
  };
  selectableOptions: SelectOptionItem[];
  activeValue: string | number;
  highlightedIndex: number;
  onHoverOption: (idx: number) => void;
  onSelectOption: (opt: SelectOptionItem) => void;
  isKeyboardNavRef?: React.RefObject<boolean>;
}

export function SelectDropdownPortal({
  menuRef,
  searchInputRef,
  menuCoords,
  allOptionsCount,
  searchQuery,
  onSearchChange,
  onSearchKeyDown,
  filteredOptions,
  groupedOptions,
  selectableOptions,
  activeValue,
  highlightedIndex,
  onHoverOption,
  onSelectOption,
  isKeyboardNavRef,
}: SelectDropdownPortalProps) {
  if (typeof document === 'undefined') return null;

  const portalStyle: React.CSSProperties = {
    top: menuCoords.placeAbove ? 'auto' : `${menuCoords.top}px`,
    bottom: menuCoords.placeAbove
      ? `${Math.max(10, window.innerHeight - menuCoords.top)}px`
      : 'auto',
    left: `${menuCoords.left}px`,
    width: `${Math.max(menuCoords.width, 180)}px`,
  };

  const handleItemHover = (selectableIdx: number) => {
    if (isKeyboardNavRef?.current) {
      return;
    }
    if (selectableIdx !== -1) {
      onHoverOption(selectableIdx);
    }
  };

  return createPortal(
    <div
      ref={menuRef}
      className='fixed bg-surface border border-border rounded-[10px] shadow-[0_10px_30px_-4px_rgba(15,23,42,0.12),0_4px_12px_-2px_rgba(15,23,42,0.05)] box-border p-1.5 max-h-[280px] overflow-y-auto z-[999999] font-sans min-w-[160px] max-w-[min(500px,calc(100vw-20px))]'
      style={portalStyle}
      role='listbox'
    >
      {/* Quick search filter for long option lists */}
      {allOptionsCount > 7 && (
        <div className='sticky top-0 bg-surface px-1 pt-1 pb-2 border-b border-slate-100 mb-1 z-10'>
          <div className='relative flex items-center'>
            <Search
              size={12}
              className='absolute left-2 text-slate-dim pointer-events-none'
            />
            <input
              ref={searchInputRef}
              type='text'
              className='w-full h-[30px] bg-slate-50 border border-border rounded-md pl-[26px] pr-2 font-sans text-xs text-slate-text outline-none box-border focus:bg-surface focus:border-brand focus:ring-2 focus:ring-brand/10'
              placeholder='Cari pilihan... (gunakan ↑↓ lalu Enter)'
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {filteredOptions.length === 0 ? (
        <div className='py-3.5 px-2.5 text-center text-[12.5px] text-slate-dim'>
          Tidak ada opsi yang cocok
        </div>
      ) : (
        <>
          {/* Non-grouped items */}
          {groupedOptions.nonGrouped.map((opt, i) => {
            const selectableIdx = selectableOptions.findIndex(
              (o) => o.value === opt.value,
            );
            const isSelected = String(opt.value) === String(activeValue);
            const isHighlighted =
              selectableIdx !== -1 && highlightedIndex === selectableIdx;

            let itemClass =
              'text-slate-text hover:bg-slate-100 hover:text-slate-900';
            if (isSelected && isHighlighted) {
              itemClass =
                'bg-blue-100 text-blue-900 font-bold ring-2 ring-blue-500 shadow-xs';
            } else if (isHighlighted) {
              itemClass =
                'bg-blue-50 text-blue-900 font-semibold ring-1.5 ring-blue-400 shadow-xs';
            } else if (isSelected) {
              itemClass = 'bg-blue-50/70 text-blue-700 font-semibold';
            }

            return (
              <button
                key={`opt-${opt.value}-${i}`}
                type='button'
                role='option'
                aria-selected={isSelected}
                disabled={opt.disabled}
                data-option-value={String(opt.value)}
                data-selectable-index={
                  selectableIdx !== -1 ? selectableIdx : undefined
                }
                className={`w-full px-2.5 py-1.5 rounded-md text-[13px] flex items-center justify-between gap-2 cursor-pointer box-border text-left border-0 bg-transparent leading-[1.35] transition-colors select-none ${itemClass}`}
                onMouseEnter={() => {
                  if (!opt.disabled) handleItemHover(selectableIdx);
                }}
                onClick={() => onSelectOption(opt)}
              >
                <div className='flex items-center gap-1.5 flex-1 min-w-0'>
                  {isHighlighted && (
                    <span className='w-1 h-3.5 rounded-full bg-brand shrink-0' />
                  )}
                  <span className='flex-1 overflow-hidden text-ellipsis whitespace-nowrap'>
                    {opt.label}
                  </span>
                </div>
                {isSelected && (
                  <Check size={14} className='text-brand shrink-0' />
                )}
              </button>
            );
          })}

          {/* Grouped items */}
          {groupedOptions.groups.map((group) => (
            <div key={group.name}>
              <div className='px-2.5 pt-2 pb-1 text-[10.5px] font-bold text-slate-dim uppercase tracking-wider select-none'>
                {group.name}
              </div>
              {group.items.map((opt, i) => {
                const selectableIdx = selectableOptions.findIndex(
                  (o) => o.value === opt.value,
                );
                const isSelected = String(opt.value) === String(activeValue);
                const isHighlighted =
                  selectableIdx !== -1 && highlightedIndex === selectableIdx;

                let itemClass =
                  'text-slate-text hover:bg-slate-100 hover:text-slate-900';
                if (isSelected && isHighlighted) {
                  itemClass =
                    'bg-blue-100 text-blue-900 font-bold ring-2 ring-blue-500 shadow-xs';
                } else if (isHighlighted) {
                  itemClass =
                    'bg-blue-50 text-blue-900 font-semibold ring-1.5 ring-blue-400 shadow-xs';
                } else if (isSelected) {
                  itemClass = 'bg-blue-50/70 text-blue-700 font-semibold';
                }

                return (
                  <button
                    key={`grp-opt-${opt.value}-${i}`}
                    type='button'
                    role='option'
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    data-option-value={String(opt.value)}
                    data-selectable-index={
                      selectableIdx !== -1 ? selectableIdx : undefined
                    }
                    className={`w-full px-2.5 py-1.5 rounded-md text-[13px] flex items-center justify-between gap-2 cursor-pointer box-border text-left border-0 bg-transparent leading-[1.35] transition-colors select-none pl-3.5 ${itemClass}`}
                    onMouseEnter={() => {
                      if (!opt.disabled) handleItemHover(selectableIdx);
                    }}
                    onClick={() => onSelectOption(opt)}
                  >
                    <div className='flex items-center gap-1.5 flex-1 min-w-0'>
                      {isHighlighted && (
                        <span className='w-1 h-3.5 rounded-full bg-brand shrink-0' />
                      )}
                      <span className='flex-1 overflow-hidden text-ellipsis whitespace-nowrap'>
                        {opt.label}
                      </span>
                    </div>
                    {isSelected && (
                      <Check size={14} className='text-brand shrink-0' />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </>
      )}
    </div>,
    document.body,
  );
}
