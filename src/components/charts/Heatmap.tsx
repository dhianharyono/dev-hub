'use client';

import React from 'react';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const LVL_COLORS = [
  'fill-[#e2e8f0]',
  'fill-[#bfdbfe]',
  'fill-[#60a5fa]',
  'fill-[#2563eb]',
  'fill-[#1d4ed8]',
];

export function Heatmap({
  daily,
  start,
  end,
}: {
  daily: Record<string, number>;
  start: string;
  end: string;
}) {
  const cell = 12;
  const gap = 3;
  const padL = 30;
  const padT = 18;
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); // back to Monday
  const e = new Date(end);
  const days: { date: string; count: number; col: number; row: number }[] = [];
  const max = Math.max(1, ...Object.values(daily));

  // Track month headers above columns
  const monthLabels: { col: number; text: string }[] = [];
  let lastMonth = -1;

  for (let d = new Date(s), i = 0; d <= e; d.setDate(d.getDate() + 1), i++) {
    const key = d.toLocaleDateString('en-CA');
    const col = Math.floor(i / 7);
    const row = i % 7;
    days.push({ date: key, count: daily[key] ?? 0, col, row });

    if (row === 0) {
      const curMonth = d.getMonth();
      if (curMonth !== lastMonth) {
        monthLabels.push({ col, text: MONTHS[curMonth] });
        lastMonth = curMonth;
      }
    }
  }

  const cols = Math.max(1, (days[days.length - 1]?.col ?? 0) + 1);
  const level = (c: number) =>
    c === 0 ? 0 : Math.min(4, Math.ceil((c / max) * 4));
  const W = padL + cols * (cell + gap) + 8;
  const H = padT + 7 * (cell + gap) + 4;

  return (
    <div className='overflow-x-auto'>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width='100%'
        className='block min-w-[780px]'
        role='img'
        aria-label='Heatmap aktivitas harian'
      >
        {/* Month labels at top */}
        {monthLabels.map((ml, idx) => (
          <text
            key={idx}
            x={padL + ml.col * (cell + gap)}
            y={padT - 6}
            className='text-[9px] font-medium fill-slate-400 uppercase tracking-tight font-sans'
          >
            {ml.text}
          </text>
        ))}

        {/* Day labels on left */}
        {['Sen', '', 'Rab', '', 'Jum', '', ''].map((l, i) => (
          <text
            key={i}
            x='0'
            y={padT + i * (cell + gap) + cell - 3}
            className='text-[9px] font-medium fill-slate-400 uppercase tracking-tight font-sans'
          >
            {l}
          </text>
        ))}

        {/* Heatmap cells */}
        {days.map((d) => (
          <rect
            key={d.date}
            x={padL + d.col * (cell + gap)}
            y={padT + d.row * (cell + gap)}
            width={cell}
            height={cell}
            rx='2.5'
            className={LVL_COLORS[level(d.count)]}
          >
            <title>{`${new Date(d.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}: ${d.count} commit`}</title>
          </rect>
        ))}
      </svg>
      <div className='flex items-center justify-end gap-1 text-[11px] text-slate-muted mt-2'>
        <span className='mx-1'>Sedikit</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <svg key={l} width='12' height='12'>
            <rect width='12' height='12' rx='2.5' className={LVL_COLORS[l]} />
          </svg>
        ))}
        <span className='mx-1'>Banyak</span>
      </div>
    </div>
  );
}
