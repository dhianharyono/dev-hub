import React from 'react';
import type { SelectOptionItem } from './types';

export function extractNodeText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node) && node.props?.children) {
    return extractNodeText(node.props.children);
  }
  return '';
}

export function parseChildrenToOptions(children: React.ReactNode): SelectOptionItem[] {
  const result: SelectOptionItem[] = [];

  const processChild = (child: React.ReactNode, groupName?: string) => {
    if (!React.isValidElement(child)) return;

    if (child.type === React.Fragment) {
      const fragmentProps = child.props as { children?: React.ReactNode };
      React.Children.forEach(fragmentProps.children, (nested) =>
        processChild(nested, groupName),
      );
      return;
    }

    if (child.type === 'optgroup') {
      const optGroupProps = child.props as { label?: string; children?: React.ReactNode };
      const gName = optGroupProps.label || '';
      React.Children.forEach(optGroupProps.children, (nested) =>
        processChild(nested, gName),
      );
      return;
    }

    if (child.type === 'option') {
      const optProps = child.props as {
        value?: string | number;
        disabled?: boolean;
        children?: React.ReactNode;
      };
      const rawVal =
        optProps.value !== undefined ? optProps.value : optProps.children;
      const val =
        typeof rawVal === 'number' || typeof rawVal === 'string' ? rawVal : '';
      const textLabel = extractNodeText(optProps.children) || String(val);
      result.push({
        value: val,
        label: textLabel,
        group: groupName,
        disabled: optProps.disabled,
      });
    }
  };

  React.Children.forEach(children, (child) => processChild(child));
  return result;
}
