import type { MetricsData } from '@/components/hooks';
import { ScoreOverallCard } from './ScoreOverallCard';
import { ScoreRadarCard } from './ScoreRadarCard';
import { ScoreInsightsCard } from './ScoreInsightsCard';

interface ScorePillarsSectionProps {
  data: MetricsData;
}

export function ScorePillarsSection({ data }: ScorePillarsSectionProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up'>
      <ScoreOverallCard data={data} />
      <ScoreRadarCard scores={data.scores} />
      <ScoreInsightsCard insights={data.insights} />
    </div>
  );
}
