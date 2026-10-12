'use client';

import React from 'react';
import type { ApexOptions } from 'apexcharts';
import { ReactApexChart, useMounted } from './apex-loader';

export function Radar({
  axes,
  size = 300,
}: {
  axes: { label: string; value: number }[];
  size?: number;
}) {
  const mounted = useMounted();

  const options: ApexOptions = {
    chart: {
      type: 'radar',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 700 },
      parentHeightOffset: 0,
      dropShadow: {
        enabled: true,
        blur: 8,
        left: 0,
        top: 0,
        opacity: 0.2,
        color: '#1977f3',
      },
    },
    colors: ['#1977f3'],
    fill: {
      opacity: 0.35,
      colors: ['#1977f3'],
    },
    stroke: {
      width: 2.5,
      colors: ['#2563eb'],
    },
    markers: {
      size: 5,
      colors: ['#06b6d4'],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: { size: 7 },
    },
    xaxis: {
      categories: axes.map((a) => a.label),
      labels: {
        show: true,
        style: {
          colors: axes.map(() => '#475569'),
          fontSize: '11px',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
        },
      },
    },
    yaxis: {
      show: false,
      min: 0,
      max: 100,
      tickAmount: 4,
    },
    plotOptions: {
      radar: {
        size: 60,
        offsetX: 0,
        offsetY: 0,
        polygons: {
          strokeColors: '#e2e8f0',
          connectorColors: '#e2e8f0',
          fill: {
            colors: ['transparent', 'rgba(241, 245, 249, 0.5)'],
          },
        },
      },
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val} / 100`,
      },
    },
  };

  const series = [
    {
      name: 'Skor',
      data: axes.map((a) => a.value),
    },
  ];

  if (!mounted) {
    return <div className='w-full min-h-[260px]' />;
  }

  return (
    <div className='w-full max-w-[360px] mx-auto flex items-center justify-center overflow-visible'>
      <ReactApexChart
        options={options}
        series={series}
        type='radar'
        width='100%'
        height={size}
      />
    </div>
  );
}
