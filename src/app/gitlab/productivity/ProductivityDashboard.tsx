'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { Scorecard } from '@/lib/scoring';
import { ScoreHeaderCard } from './ScoreHeaderCard';
import { ComponentScoreGrid } from './ComponentScoreGrid';
import { ActionPriorityCard } from './ActionPriorityCard';
import { HotspotTableCard } from './HotspotTableCard';
import { RecurringIssuesCard } from './RecurringIssuesCard';
import { LanguageSkillCard } from './LanguageSkillCard';
import { StaticIssuesCard } from './StaticIssuesCard';
import { ReviewCodeCard } from './ReviewCodeCard';
import { ProductivitySkeleton } from './ProductivitySkeleton';

interface ScorecardResponse extends Scorecard {
  user: { id: number; username: string; name: string } | null;
}

interface ProductivityDashboardProps {
  days: number;
}

export function ProductivityDashboard({ days }: ProductivityDashboardProps) {
  const [data, setData] = useState<ScorecardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const requestKey = `${days}:${retry}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let ignore = false;
    fetch(`/api/gitlab/score?days=${days}`)
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Gagal memuat skor');
        if (!ignore) {
          setData(json as ScorecardResponse);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message);
      })
      .finally(() => {
        if (!ignore) setLoadedKey(requestKey);
      });
    return () => {
      ignore = true;
    };
  }, [days, requestKey]);

  if (loading) {
    return <ProductivitySkeleton />;
  }

  if (error) {
    return (
      <section className='card animate-fade-up'>
        <div className='flex items-start gap-3'>
          <AlertCircle size={18} className='text-rose-600 shrink-0 mt-0.5' />
          <div className='min-w-0'>
            <h2 className='text-[15px] font-bold text-slate-text'>
              Skor belum bisa dimuat
            </h2>
            <p className='text-[12.5px] text-slate-muted mt-1'>{error}</p>
            <button
              type='button'
              className='btn btn-secondary btn-xs mt-3 inline-flex items-center gap-2'
              onClick={() => setRetry((value) => value + 1)}
            >
              <RefreshCw size={13} />
              <span>Coba lagi</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!data || !data.components.some((component) => component.available)) {
    return (
      <section className='card animate-fade-up'>
        <h2 className='text-[15px] font-bold text-slate-text'>
          Belum ada data untuk periode ini
        </h2>
        <p className='text-[12.5px] text-slate-muted mt-1 leading-relaxed'>
          Jalankan Sinkron GitLab, lalu pastikan email dan nama identitas di
          Pengaturan sudah cocok dengan akun GitLab Anda.
        </p>
      </section>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <ScoreHeaderCard card={data} userName={data.user?.name} />
      <ComponentScoreGrid card={data} />
      <ActionPriorityCard card={data} />
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch'>
        <StaticIssuesCard card={data} days={days} />
        <ReviewCodeCard card={data} />
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch'>
        <LanguageSkillCard card={data} days={days} />
        <RecurringIssuesCard card={data} days={days} />
      </div>
      <HotspotTableCard card={data} days={days} />
    </div>
  );
}
