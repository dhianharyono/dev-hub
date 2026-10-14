import type { MetricsData } from '@/components/hooks';
import { ScoreOverallCard } from './ScoreOverallCard';
import { ScoreRadarCard } from './ScoreRadarCard';
import { ScoreInsightsCard } from './ScoreInsightsCard';

interface ScorePillarsSectionProps {
  data: MetricsData;
}

export function ScorePillarsSection({ data }: ScorePillarsSectionProps) {
  // Catatan Layout: 3 kartu pilar performa (Skor Keseluruhan, Profil Performa, dan Insight & saran / Work-Life Balance)
  // memiliki tinggi minimal yang sejajar (equal height grid via min-h-full).
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up'>
      <ScoreOverallCard data={data} />
      <ScoreRadarCard scores={data.scores} />
      <ScoreInsightsCard data={data} insights={data.insights} />
    </div>
  );
}
