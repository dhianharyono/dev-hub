'use client';

import React from 'react';
import type { ApexOptions } from 'apexcharts';
import { ReactApexChart, useMounted } from './apex-loader';

export function HourlyBars({ hourly }: { hourly: number[] }) {
  const mounted = useMounted();

  const total = hourly.reduce((a, b) => a + b, 0);
  const peakHour = hourly.indexOf(Math.max(...hourly));

  let workCount = 0;
  for (let h = 8; h < 18; h++) {
    workCount += hourly[h] ?? 0;
  }
  const afterCount = Math.max(0, total - workCount);
  const workPct = total > 0 ? Math.round((workCount / total) * 100) : 0;
  const afterPct = total > 0 ? Math.round((afterCount / total) * 100) : 0;

  const categories = Array.from(
    { length: 24 },
    (_, i) => `${String(i).padStart(2, '0')}:00`,
  );

  const colors = Array.from({ length: 24 }, (_, i) =>
    i >= 8 && i < 18 ? '#1977f3' : '#06b6d4',
  );

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      animations: { enabled: true },
      parentHeightOffset: 0,
    },
    colors,
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '65%',
        distributed: true,
      },
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#64748b', fontSize: '10px' },
        rotate: -45,
        rotateAlways: true,
        maxHeight: 38,
        minHeight: 34,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '10px' },
      },
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 3,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 8,
      },
    },
    legend: { show: false },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val} commit`,
      },
    },
  };

  const series = [{ name: 'Commit', data: hourly }];

  return (
    <div className='flex flex-col gap-3'>
      <div className='w-full'>
        {mounted ? (
          <ReactApexChart
            options={options}
            series={series}
            type='bar'
            height={165}
          />
        ) : (
          <div className='h-[165px]' />
        )}
      </div>

      <div className='grid grid-cols-3 gap-2.5'>
        <div className='py-2.5 px-3 bg-(--surface-subtle) rounded-(--radius-sm) border border-(--border)'>
          <div className='xs dim text-[11px] mb-0.5'>
            Jam Kerja
          </div>
          <div className='font-extrabold text-base text-(--text)'>
            {workPct}%
          </div>
          <div className='xs dim text-[10px]'>
            08:00-18:00 ({workCount})
          </div>
        </div>

        <div className='py-2.5 px-3 bg-(--surface-subtle) rounded-(--radius-sm) border border-(--border)'>
          <div className='xs dim text-[11px] mb-0.5'>
            Luar Jam
          </div>
          <div
            className={`font-extrabold text-base ${afterPct > 25 ? 'text-(--amber)' : 'text-(--text)'}`}
          >
            {afterPct}%
          </div>
          <div className='xs dim text-[10px]'>
            Lembur ({afterCount})
          </div>
        </div>

        <div className='py-2.5 px-3 bg-(--surface-subtle) rounded-(--radius-sm) border border-(--border)'>
          <div className='xs dim text-[11px] mb-0.5'>
            Jam Puncak
          </div>
          <div className='font-extrabold text-base text-(--primary)'>
            {String(peakHour).padStart(2, '0')}:00
          </div>
          <div className='xs dim text-[10px]'>
            {hourly[peakHour] ?? 0} commit
          </div>
        </div>
      </div>
    </div>
  );
}
