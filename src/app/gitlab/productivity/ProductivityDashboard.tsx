import type { MetricsData } from '@/components/hooks';
import { ScorePillarsSection } from './ScorePillarsSection';
import { KpiCardsGrid } from './KpiCardsGrid';
import { ChartsAndProjectsSection } from './ChartsAndProjectsSection';

interface ProductivityDashboardProps {
  data: MetricsData;
}

export function ProductivityDashboard({ data }: ProductivityDashboardProps) {
  return (
    <div className='flex flex-col gap-7'>
      <ScorePillarsSection data={data} />
      <KpiCardsGrid data={data} />
      <ChartsAndProjectsSection data={data} />
    </div>
  );
}
