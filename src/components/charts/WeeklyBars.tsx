'use client';

import React from 'react';
import type { ApexOptions } from 'apexcharts';
import { ReactApexChart, useMounted } from './apex-loader';

export function WeeklyBars({
  data,
  height = 220,
}: {
  data: { week: string; commits: number; mrs: number }[];
  height?: number;
}) {
  const mounted = useMounted();

  const categories = data.map((d) =>
    new Date(`${d.week}T00:00:00`).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    }),
  );

  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
    },
    colors: ['#1977f3', '#06b6d4'],
    stroke: {
      width: [0, 3],
      curve: 'smooth',
    },
    plotOptions: {
      bar: {
        columnWidth: '55%',
        borderRadius: 5,
      },
    },
    fill: {
      type: ['gradient', 'solid'],
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: ['#2563eb'],
        opacityFrom: 0.9,
        opacityTo: 0.6,
      },
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '11px',
        },
        rotate: -20,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        title: {
          text: 'Commit',
          style: { color: '#1977f3', fontSize: '11px', fontWeight: 600 },
        },
        labels: {
          style: { colors: '#64748b', fontSize: '10px' },
        },
      },
      {
        opposite: true,
        title: {
          text: 'MR Merged',
          style: { color: '#06b6d4', fontSize: '11px', fontWeight: 600 },
        },
        labels: {
          style: { colors: '#06b6d4', fontSize: '10px' },
        },
      },
    ],
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 3,
    },
    legend: {
      labels: { colors: '#64748b' },
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
    },
    tooltip: {
      theme: 'light',
    },
  };

  const series = [
    {
      name: 'Commit',
      type: 'column',
      data: data.map((d) => d.commits),
    },
    {
      name: 'MR Merged',
      type: 'line',
      data: data.map((d) => d.mrs),
    },
  ];

  if (!mounted) {
    return <div className='w-full h-[220px]' />;
  }

  return (
    <div className='w-full'>
      <ReactApexChart
        options={options}
        series={series}
        type='line'
        height={height}
      />
    </div>
  );
}
