'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import { useMounted } from './useMounted';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className='flex items-center justify-center h-full min-h-[180px] text-(--text-3) text-xs'>
      Memuat chart progress...
    </div>
  ),
});

export function StatusProgressDonut({
  breakdown,
}: {
  breakdown: { todo: number; inProgress: number; done: number };
}) {
  const mounted = useMounted();
  const total = breakdown.todo + breakdown.inProgress + breakdown.done;

  if (total === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-full min-h-[240px]'>
        <span className='dim small'>Belum ada data status task</span>
      </div>
    );
  }

  const series = [breakdown.todo, breakdown.inProgress, breakdown.done];
  const labels = ['To Do', 'In Progress', 'Done'];
  const colors = ['#94a3b8', '#3b82f6', '#22c55e'];

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
    },
    colors,
    labels,
    stroke: {
      colors: ['#ffffff'],
      width: 2,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Task',
              fontSize: '12px',
              fontWeight: 600,
              color: 'hsl(228 18% 72%)',
              formatter: () => `${total}`,
            },
            value: {
              fontSize: '22px',
              fontWeight: 800,
              color: '#ffffff',
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'bottom',
      labels: {
        colors: '#94a3b8',
      },
      fontSize: '12px',
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) =>
          `${val} task (${((val / total) * 100).toFixed(1)}%)`,
      },
    },
  };

  if (!mounted) {
    return <div className='h-[260px] w-full' />;
  }

  return (
    <div className='w-full'>
      <ReactApexChart
        options={options}
        series={series}
        type='donut'
        height={260}
      />
    </div>
  );
}
