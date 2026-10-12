'use client';

import { useState, useEffect, useCallback } from 'react';
import { MrList } from './MrList';
import { MrReviewModal } from './MrReviewModal';
import type {
  IncomingMRItem,
  ReviewScope,
  ReviewStatus,
  DetailTab,
} from './types';

export function IncomingReviewsCard() {
  const [mrs, setMrs] = useState<IncomingMRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scope, setScope] = useState<ReviewScope>('authored');
  const [status, setStatus] = useState<ReviewStatus>('opened');
  const [search, setSearch] = useState('');

  const [selectedMr, setSelectedMr] = useState<IncomingMRItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<DetailTab>('discussions');

  const fetchMrs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/gitlab/incoming-reviews?scope=${scope}&state=${status}`,
      );
      const data = await res.json();
      if (!res.ok || !data.ok)
        throw new Error(data.error || 'Gagal memuat MR.');
      const items: IncomingMRItem[] = data.mrs || [];
      setMrs(items);
      if (items.length > 0) {
        setSelectedMr((prev) =>
          prev ? items.find((m) => m.id === prev.id) || items[0] : items[0],
        );
      } else {
        setSelectedMr(null);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope, status]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch(
          `/api/gitlab/incoming-reviews?scope=${scope}&state=${status}`,
        );
        const data = await res.json();
        if (!active) return;
        if (!res.ok || !data.ok)
          throw new Error(data.error || 'Gagal memuat MR.');
        const items: IncomingMRItem[] = data.mrs || [];
        setMrs(items);
        if (items.length > 0) {
          setSelectedMr((prev) =>
            prev ? items.find((m) => m.id === prev.id) || items[0] : items[0],
          );
        } else {
          setSelectedMr(null);
        }
      } catch (e) {
        if (!active) return;
        setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [scope, status]);

  const handleOpenModal = (mr: IncomingMRItem, tab: DetailTab) => {
    setSelectedMr(mr);
    setModalTab(tab);
    setModalOpen(true);
  };

  return (
    <div className='flex flex-col gap-5 animate-fade-up'>
      {/* Main MR List Section */}
      <section className='card p-[22px]'>
        <MrList
          mrs={mrs}
          loading={loading}
          error={error}
          selectedMr={selectedMr}
          onSelectMr={setSelectedMr}
          onOpenModal={handleOpenModal}
          scope={scope}
          onScopeChange={setScope}
          status={status}
          onStatusChange={setStatus}
          search={search}
          onSearchChange={setSearch}
          onRefresh={fetchMrs}
        />
      </section>

      {/* Wide Popup Modal for MR Review & Discussions */}
      <MrReviewModal
        key={`${selectedMr?.id || 0}-${modalTab}`}
        mr={selectedMr}
        isOpen={modalOpen}
        initialTab={modalTab}
        onClose={() => setModalOpen(false)}
        onRefreshMrs={fetchMrs}
      />
    </div>
  );
}
