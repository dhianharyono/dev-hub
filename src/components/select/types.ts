import React from 'react';

export interface SelectOptionItem {
  value: string | number;
  label: string | React.ReactNode;
  group?: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  options?: SelectOptionItem[];
  children?: React.ReactNode;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
  error?: boolean;
  size?: 'sm' | 'md';
  'aria-label'?: string;
  required?: boolean;
}

export interface MenuCoords {
  top: number;
  left: number;
  width: number;
  placeAbove: boolean;
}
