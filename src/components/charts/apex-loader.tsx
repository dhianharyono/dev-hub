'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

// Dynamic load for Next.js SSR compatibility
export const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className='flex items-center justify-center h-full min-h-[140px] text-(--text-3) text-xs'>
      Memuat chart...
    </div>
  ),
});
