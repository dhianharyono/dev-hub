'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import type { HotspotDetail } from '@/lib/card-detail';
import type { HotspotFile, Scorecard } from '@/lib/scoring';
import { DetailCommitRow, DetailModal, DetailNote } from './DetailModal';
import { ScorePending } from './ScorePending';

interface HotspotTableCardProps {
  card: Scorecard;
  days: number;
}

const REWORK_TARGET_PCT = 10;

function reworkTone(pct: number): string {
  if (pct >= 20) return 'text-rose-600';
  if (pct >= REWORK_TARGET_PCT) return 'text-amber-600';
  return 'text-slate-500';
}

function shortPath(path: string): string {
  return path.replace(/^src\//, '');
}

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
}

const fmt = (value: number) => value.toLocaleString('id-ID');

export function HotspotTableCard({ card, days }: HotspotTableCardProps) {
  const [selected, setSelected] = useState<HotspotFile | null>(null);
  const [detail, setDetail] = useState<HotspotDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sortedHotspots = [...card.hotspots].sort(
    (a, b) => b.selfReworkLines - a.selfReworkLines || b.commits - a.commits,
  );

  useEffect(() => {
    if (!selected) return;
    let ignore = false;
    const params = new URLSearchParams({
      kind: 'hotspot',
      path: selected.path,
      days: String(days),
    });
    fetch(`/api/gitlab/detail?${params.toString()}`)
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Gagal memuat detail file');
        if (!ignore) setDetail(json as HotspotDetail);
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [selected, days]);

  const openFile = (hotspot: HotspotFile) => {
    setSelected(hotspot);
    setDetail(null);
    setError(null);
    setLoading(true);
  };

  return (
    <section className='card animate-fade-up' aria-labelledby='hotspot-title'>
      <div className='card-title' id='hotspot-title'>
        <span>Hotspot — File Paling Sering Diubah</span>
      </div>

      {!card.diffReady ? (
        <ScorePending description='Baris diff commit belum tersedia. Jalankan Sinkron GitLab untuk menghitung hotspot dan self-rework.' />
      ) : (
        <div className='overflow-x-auto'>
          <table className='table'>
            <thead>
              <tr>
                <th>File</th>
                <th className='num'>Commit</th>
                <th className='num'>Baris</th>
                <th className='num'>Self-rework</th>
                <th className='text-right'>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedHotspots.map((hotspot) => (
                <tr key={hotspot.path}>
                  <td>
                    <div
                      className='max-w-[300px] break-words text-[11.5px] leading-snug'
                      title={hotspot.path}
                    >
                      {shortPath(hotspot.path)}
                    </div>
                  </td>
                  <td className='num text-[12px]'>{hotspot.commits}</td>
                  <td className='num text-[12px]'>
                    {hotspot.lines.toLocaleString('id-ID')}
                  </td>
                  <td
                    className={`num text-[12px] font-bold ${reworkTone(hotspot.selfReworkPct)}`}
                    title={`${hotspot.selfReworkPct}% dari baris yang berubah`}
                  >
                    {hotspot.selfReworkLines.toLocaleString('id-ID')}
                  </td>
                  <td className='text-right'>
                    <button
                      type='button'
                      className='btn btn-ghost btn-icon !h-7 !w-7 text-slate-400 hover:text-cyan-700'
                      onClick={() => openFile(hotspot)}
                      aria-label={`Lihat detail file ${shortPath(hotspot.path)}`}
                      title={`Lihat detail file ${shortPath(hotspot.path)}`}
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className='text-[10.5px] text-slate-400 mt-3 leading-relaxed'>
        Semakin merah self-rework, semakin besar penalti Kualitas Kode. File di
        atas adalah daftar kerja perbaikan Anda.
      </p>

      <DetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? shortPath(selected.path) : ''}
        badge={
          selected ? (
            <span className={`badge ${selected.selfReworkPct >= REWORK_TARGET_PCT ? 'badge-amber' : 'badge-green'}`}>
              {selected.selfReworkPct}% self-rework
            </span>
          ) : null
        }
        explanation={
          selected
            ? `File ini menyumbang ${fmt(selected.selfReworkLines)} baris self-rework, ${selected.selfReworkPct}% dari ${fmt(selected.lines)} baris yang berubah. Baris yang diubah lagi dalam 21 hari membuat pekerjaan terasa maju-mundur.`
            : ''
        }
        stats={
          selected
            ? [
                { label: 'Commit', value: fmt(selected.commits) },
                { label: 'Baris', value: fmt(selected.lines) },
                {
                  label: 'Self-rework',
                  value: `${fmt(selected.selfReworkLines)} (${selected.selfReworkPct}%)`,
                },
                { label: 'Fix', value: `${fmt(selected.fixCommits)} commit` },
              ]
            : []
        }
        listTitle='Commit yang menyentuh file ini'
        loading={loading}
        error={error}
        action={
          selected
            ? `Refactor terarah dan selesaikan sekali jalan. Target self-rework <${REWORK_TARGET_PCT}% dari baris berubah (sekarang ${selected.selfReworkPct}%), dengan commit perbaikan yang tidak menumpuk.`
            : ''
        }
      >
        {detail &&
          (detail.commits.length === 0 ? (
            <DetailNote>Tidak ada commit pada periode ini.</DetailNote>
          ) : (
            <ul className='space-y-1'>
              {detail.commits.map((commit) => (
                <DetailCommitRow
                  key={commit.sha}
                  title={commit.title}
                  sha={commit.sha}
                  date={shortDate(commit.authoredAt)}
                  hint={commit.isFix ? 'commit perbaikan' : undefined}
                />
              ))}
            </ul>
          ))}
      </DetailModal>
    </section>
  );
}
