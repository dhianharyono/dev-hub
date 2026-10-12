import React, { useCallback, useEffect, useState } from 'react';
import type { MenuCoords } from './types';

export function useSelectPositionAndEvents(
  isOpen: boolean,
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
  allOptionsLength: number,
  setSearchQuery: (q: string) => void,
  triggerRef: React.RefObject<HTMLButtonElement | null>,
  menuRef: React.RefObject<HTMLDivElement | null>,
  searchInputRef: React.RefObject<HTMLInputElement | null>,
) {
  const [menuCoords, setMenuCoords] = useState<MenuCoords>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(280, allOptionsLength * 36 + 60);
    const placeAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    setMenuCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 12)),
      width: rect.width,
      placeAbove,
    });
  }, [allOptionsLength, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScroll = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      updatePosition();
    };

    const handleResize = () => updatePosition();

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
      setSearchQuery('');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    const timer = setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition, menuRef, triggerRef, searchInputRef, setIsOpen, setSearchQuery]);

  return { menuCoords, updatePosition };
}
