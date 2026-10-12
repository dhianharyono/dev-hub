'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import { useMounted } from './useMounted';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className='flex items-center justify-center h-full min-h-[180px] text-(--text-3) text-xs'>
      Memuat chart assignment...
    </div>
  ),
});

export function AssignmentBarChart({
  assignments,
}: {
  assignments: { name: string; timeSpent: number }[];
}) {
  const mounted = useMounted();
  if (!assignments || assignments.length === 0) return null;

  const categories = assignments.map((a) => a.name);
  const data = assignments.map((a) => a.timeSpent);

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      animations: { enabled: true },
    },
    colors: ['#3b82f6'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '50%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val}h`,
      offsetY: -18,
      style: {
        fontSize: '11px',
        fontWeight: 700,
        colors: ['#94a3b8'],
      },
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#94a3b8', fontSize: '11px' },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: {
        text: 'Time Spent (Jam)',
        style: { color: '#94a3b8', fontSize: '10px' },
      },
      labels: {
        style: { colors: '#94a3b8', fontSize: '10px' },
        formatter: (val) => `${val}h`,
      },
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.08)',
      strokeDashArray: 3,
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => `${val} jam kerja`,
      },
    },
  };

  const series = [{ name: 'Time Spent', data }];

  if (!mounted) {
    return <div className='h-[220px] w-full' />;
  }

  return (
    <div className='w-full'>
      <ReactApexChart
        options={options}
        series={series}
        type='bar'
        height={220}
      />
    </div>
  );
}
