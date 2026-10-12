import type { MetricsData } from '@/components/hooks';

interface KpiCardsGridProps {
  data: MetricsData;
}

const fmt = (n: number) => n.toLocaleString('id-ID');

export function KpiCardsGrid({ data }: KpiCardsGridProps) {
  const k = data.kpis;
  const kpis = [
    {
      label: 'Total commit',
      value: fmt(k.commits),
      sub: `${k.activeDays} hari aktif`,
      icon: '◆',
    },
    {
      label: 'Baris kode',
      value: `+${fmt(k.linesAdded)}`,
      sub: `-${fmt(k.linesDeleted)} dihapus`,
      icon: '±',
    },
    {
      label: 'Merge request',
      value: fmt(k.mrsCreated),
      sub: `${k.mrsMerged} merged (${Math.round((k.mrsMerged / Math.max(1, k.mrsCreated)) * 100)}%)`,
      icon: '⑂',
    },
    {
      label: 'Tingkat lolos CI',
      value: `${Math.round((k.pipelineSuccessRate ?? 0) * 100)}%`,
      sub: `${k.pipelines} pipeline`,
      icon: '✓',
    },
    {
      label: 'Konsistensi',
      value: `${k.activeDays}/30`,
      sub: 'hari kerja berkontribusi',
      icon: '▦',
    },
    {
      label: 'Rerata commit / hari',
      value: (k.commits / Math.max(1, k.activeDays)).toFixed(1),
      sub: 'pada hari aktif',
      icon: '▲',
    },
    {
      label: 'Fix / revert',
      value: `${Math.round(k.fixRatio * 100)}%`,
      sub: 'dari total commit',
      icon: '↺',
    },
    {
      label: 'Jam produktif',
      value:
        k.peakHour == null ? '-' : `${String(k.peakHour).padStart(2, '0')}:00`,
      sub: `${k.projects} proyek tersentuh`,
      icon: '◷',
    },
  ];

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up'>
      {kpis.map((kp) => (
        <div
          key={kp.label}
          className='card kpi flex flex-col justify-between min-h-[140px]'
        >
          <span className='icon' aria-hidden>
            {kp.icon}
          </span>
          <div className='label'>{kp.label}</div>
          <div className='value'>{kp.value}</div>
          <div className='sub'>{kp.sub}</div>
        </div>
      ))}
    </div>
  );
}
