'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import type { WorkloadTrend } from '@/lib/workload';
import { useMounted } from './useMounted';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className='flex items-center justify-center h-full min-h-[180px] text-(--text-3) text-xs'>
      Memuat chart workload...
    </div>
  ),
});

export function WorkloadTrendsChart({ data }: { data: WorkloadTrend[] }) {
  const mounted = useMounted();
  if (!data || data.length === 0) return null;

  const categories = data.map((d) => d.label);
  const activities = data.map((d) => d.totalActivities);
  const percentages = data.map((d) => d.workloadPercentage);

  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
    },
    colors: ['#3b82f6', '#ff4d4f'],
    stroke: {
      width: [0, 3],
      curve: 'smooth',
    },
    plotOptions: {
      bar: {
        columnWidth: '45%',
        borderRadius: 4,
      },
    },
    fill: {
      type: ['gradient', 'solid'],
      gradient: {
        shade: 'dark',
        type: 'vertical',
        gradientToColors: ['#1d4ed8'],
        opacityFrom: 0.9,
        opacityTo: 0.6,
      },
    },
    markers: {
      size: [0, 5],
      colors: ['#ff4d4f'],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: { size: 7 },
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#94a3b8', fontSize: '11px' },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        title: {
          text: 'Total Activities',
          style: { color: '#94a3b8', fontSize: '11px', fontWeight: 600 },
        },
        labels: {
          style: { colors: '#94a3b8', fontSize: '10px' },
        },
      },
      {
        opposite: true,
        max: 200,
        min: 0,
        title: {
          text: 'Workload %',
          style: { color: '#ff4d4f', fontSize: '11px', fontWeight: 600 },
        },
        labels: {
          style: { colors: '#ff4d4f', fontSize: '10px' },
          formatter: (val) => `${Math.round(val)}%`,
        },
      },
    ],
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.08)',
      strokeDashArray: 3,
    },
    legend: {
      labels: { colors: '#94a3b8' },
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
    },
    tooltip: {
      theme: 'dark',
      y: [
        { formatter: (val) => `${val} aktivitas` },
        { formatter: (val) => `${val}%` },
      ],
    },
  };

  const series = [
    {
      name: 'Total Activities',
      type: 'column',
      data: activities,
    },
    {
      name: 'Workload Percentage',
      type: 'line',
      data: percentages,
    },
  ];

  if (!mounted) {
    return <div className='h-[260px] w-full' />;
  }

  return (
    <div className='w-full'>
      <ReactApexChart
        options={options}
        series={series}
        type='line'
        height={260}
      />
    </div>
  );
}
