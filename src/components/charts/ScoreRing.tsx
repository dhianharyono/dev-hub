'use client';

import React from 'react';
import type { ApexOptions } from 'apexcharts';
import { ReactApexChart, useMounted } from './apex-loader';

export function ScoreRing({
  value,
  size = 168,
  label,
  sub,
}: {
  value: number;
  size?: number;
  label?: string;
  sub?: string;
}) {
  const mounted = useMounted();

  const options: ApexOptions = {
    chart: {
      type: 'radialBar',
      sparkline: { enabled: true },
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          size: '68%',
          background: 'transparent',
        },
        track: {
          background: '#e2e8f0',
          strokeWidth: '100%',
        },
        dataLabels: {
          name: {
            show: Boolean(label),
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748b',
            offsetY: 22,
          },
          value: {
            offsetY: -8,
            fontSize: size > 180 ? '36px' : '28px',
            fontWeight: '800',
            color: '#1e293b',
            formatter: (val) => `${Math.round(val)}`,
          },
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'horizontal',
        gradientToColors: ['#06b6d4'],
        stops: [0, 100],
      },
    },
    colors: ['#1977f3'],
    stroke: { lineCap: 'round' },
    labels: [label || 'Skor'],
  };

  const dimensionClass =
    size === 164 ? 'w-[164px] h-[164px]' : 'w-[180px] h-[180px]';

  if (!mounted) {
    return (
      <div className={`grid place-items-center ${dimensionClass}`}>
        <div className='absolute inset-0 flex flex-col items-center justify-center'>
          <span className='text-[40px] font-extrabold tracking-tight leading-none text-slate-text'>
            {value}
          </span>
          {label && (
            <span className='text-xs font-bold tracking-wider uppercase text-slate-muted mt-1.5'>
              {label}
            </span>
          )}
          {sub && <span className='text-xs text-slate-dim'>{sub}</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center ${dimensionClass}`}
    >
      <ReactApexChart
        options={options}
        series={[value]}
        type='radialBar'
        width={size}
        height={size + 20}
      />
      {sub && (
        <span
          className={`text-slate-dim absolute text-[11px] ${size > 180 ? 'bottom-6' : 'bottom-4'}`}
        >
          {sub}
        </span>
      )}
    </div>
  );
}
