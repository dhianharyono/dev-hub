'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import type { RecurringDetail, RecurringKey } from '@/lib/card-detail';
import type { IssueStatus, RecurringIssue, Scorecard } from '@/lib/scoring';
import { FINDING_THRESHOLDS } from '@/lib/talent-report';
import {
  DetailCommitRow,
  DetailCountRow,
  DetailModal,
  DetailNote,
} from './DetailModal';
import { ScorePending } from './ScorePending';

interface RecurringIssuesCardProps {
  card: Scorecard;
  days: number;
}

const STATUS_STYLE: Record<IssueStatus, string> = {
  critical: 'badge-rose',
  warn: 'badge-amber',
  good: 'badge-green',
};

const STATUS_RANK: Record<IssueStatus, number> = {
  critical: 0,
  warn: 1,
  good: 2,
};

const ISSUE_WHY: Record<RecurringKey, string> = {
  fixOnFix:
    'Commit perbaikan yang mengganti baris hasil perbaikan sebelumnya dalam 45 hari. Artinya perbaikan pertama belum menyelesaikan akar masalah.',
  repeatedFix:
    'File yang diperbaiki minimal 3 kali pada periode ini. File yang sama terus dibuka ulang untuk perbaikan kecil.',
  backAndForth:
    'Baris yang ditambahkan lalu dihapus lagi dalam 21 hari. Pekerjaan bolak-balik yang menghasilkan baris sia-sia.',
  revert:
    'Commit yang membatalkan commit lain dengan format “Revert …”. Pertanda perubahan yang belum matang saat masuk.',
};

const ISSUE_DO: Record<RecurringKey, string> = {
  fixOnFix:
    'Selesaikan akar masalah dalam satu perbaikan, bukan patch bertahap. Tulis tes yang mereproduksi masalah sebelum menutup.',
  repeatedFix:
    'Ambil file teratas, refactor sekaligus, lalu verifikasi dengan tes supaya tidak dibuka lagi.',
  backAndForth:
    'Rencanakan perubahan sebelum coding. Gabungkan percobaan ke satu commit atau MR supaya tidak bolak-balik.',
  revert:
    'Perbaiki di branch dan MR dengan tes serta review sebelum merge supaya tidak perlu revert.',
};

const fmt = (value: number) => value.toLocaleString('id-ID');

function shortPath(path: string): string {
  return path.replace(/^src\//, '');
}

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
}

function thresholdText(issue: RecurringIssue): string {
  const band = FINDING_THRESHOLDS.duplicateLinesPer100;
  const unit = issue.key === 'backAndForth' ? 'per 1.000 baris' : 'per 100 commit';
  return `Perhatian ≥${band.warn}, Kritis ≥${band.critical} ${unit}.`;
}

export function RecurringIssuesCard({ card, days }: RecurringIssuesCardProps) {
  const [selected, setSelected] = useState<RecurringIssue | null>(null);
  const [detail, setDetail] = useState<RecurringDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sortedIssues = [...card.recurringIssues].sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
  );

  useEffect(() => {
    if (!selected) return;
    let ignore = false;
    const params = new URLSearchParams({
      kind: 'recurring',
      key: selected.key,
      days: String(days),
    });
    fetch(`/api/gitlab/detail?${params.toString()}`)
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Gagal memuat detail isu');
        if (!ignore) setDetail(json as RecurringDetail);
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

  const openIssue = (issue: RecurringIssue) => {
    setSelected(issue);
    setDetail(null);
    setError(null);
    setLoading(true);
  };

  return (
    <section className='card animate-fade-up h-full flex flex-col' aria-labelledby='recurring-title'>
      <div className='card-title' id='recurring-title'>
        <span>Isu Berulang pada Kode</span>
      </div>

      {!card.diffReady ? (
        <ScorePending description='Riwayat diff per file belum tersedia. Jalankan Sinkron GitLab untuk menghitung isu berulang.' />
      ) : (
        <div className='overflow-x-auto'>
          <table className='table'>
            <thead>
              <tr>
                <th>Isu</th>
                <th className='num'>Jumlah</th>
                <th className='num'>Rasio</th>
                <th>Status</th>
                <th className='text-right'>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedIssues.map((issue) => (
                <tr key={issue.key}>
                  <td className='text-[12px]'>{issue.label}</td>
                  <td className='num text-[12px]'>
                    {issue.count.toLocaleString('id-ID')}
                    <span className='text-[10px] text-slate-400'> {issue.unit}</span>
                  </td>
                  <td className='num text-[11.5px] text-slate-500'>{issue.ratioLabel}</td>
                  <td>
                    <span className={`badge ${STATUS_STYLE[issue.status]}`}>
                      {issue.statusLabel}
                    </span>
                  </td>
                  <td className='text-right'>
                    <button
                      type='button'
                      className='btn btn-ghost btn-icon !h-7 !w-7 text-slate-400 hover:text-cyan-700'
                      onClick={() => openIssue(issue)}
                      aria-label={`Lihat detail isu ${issue.label}`}
                      title={`Lihat detail isu ${issue.label}`}
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
        Ambang status mengikuti pita FINDING_THRESHOLDS (perhatian/kritis).
        Revert hanya menghitung commit berformat &quot;Revert ...&quot;.
      </p>

      <DetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.label ?? ''}
        badge={
          selected ? (
            <span className={`badge ${STATUS_STYLE[selected.status]}`}>{selected.statusLabel}</span>
          ) : null
        }
        explanation={selected ? ISSUE_WHY[selected.key] : ''}
        stats={
          selected
            ? [
                { label: 'Jumlah', value: `${fmt(selected.count)} ${selected.unit}` },
                { label: 'Rasio', value: selected.ratioLabel },
                { label: 'Status', value: selected.statusLabel },
              ]
            : []
        }
        listTitle='File dan commit terkait'
        loading={loading}
        error={error}
        action={selected ? ISSUE_DO[selected.key] : ''}
      >
        {selected && detail && (
          <div className='flex flex-col gap-2'>
            <p className='text-[10.5px] text-slate-400'>{thresholdText(selected)}</p>
            {detail.files.length === 0 && detail.commits.length === 0 ? (
              <DetailNote>Tidak ada kejadian pada periode ini.</DetailNote>
            ) : (
              <>
                {detail.files.length > 0 && (
                  <ul className='space-y-1'>
                    {detail.files.map((file) => (
                      <DetailCountRow
                        key={file.path}
                        label={shortPath(file.path)}
                        value={`${fmt(file.count)}×`}
                        hint={
                          file.avgLines !== undefined ? `~${fmt(file.avgLines)} baris/fix` : undefined
                        }
                      />
                    ))}
                  </ul>
                )}
                {detail.commits.length > 0 && (
                  <ul className='space-y-1'>
                    {detail.commits.map((commit) => (
                      <DetailCommitRow
                        key={commit.sha}
                        title={commit.title}
                        sha={commit.sha}
                        date={shortDate(commit.authoredAt)}
                      />
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </DetailModal>
    </section>
  );
}
