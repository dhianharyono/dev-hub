'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import type { IssueKey } from '@/lib/code-issues';
import type { IssueSeverity, Scorecard, StaticIssueRow } from '@/lib/scoring';
import { DetailCodeRow, DetailModal, DetailNote } from './DetailModal';
import { ScorePending } from './ScorePending';

interface StaticIssuesCardProps {
  card: Scorecard;
  days: number;
}

const STATUS_STYLE: Record<IssueSeverity, string> = {
  critical: 'badge-rose',
  warn: 'badge-amber',
  good: 'badge-green',
};

const STATUS_RANK: Record<IssueSeverity, number> = {
  critical: 0,
  warn: 1,
  good: 2,
};

const DOT: Record<IssueSeverity, string> = {
  critical: 'text-rose-500',
  warn: 'text-amber-500',
  good: 'text-emerald-500',
};

const ISSUE_WHY: Record<IssueKey, string> = {
  secret:
    'Satu kredensial yang tertulis di kode bisa dipakai siapa pun yang punya akses repo. Nilainya juga tetap tersimpan di riwayat Git meski nanti dihapus.',
  sqlString:
    'SQL yang dirangkai dari string sulit dibaca dan rawan SQL injection karena nilai user ikut masuk ke teks query.',
  emptyCatch:
    'Error yang ditelan tanpa jejak membuat kegagalan sulit dilacak. Bug jadi terlihat seperti data kosong.',
  debugPrint:
    'Debug print yang tertinggal membanjiri log dan bisa membocorkan data ke tempat yang tidak seharusnya.',
  commentedCode:
    'Kode mati di dalam komentar membingungkan pembaca dan menyamarkan perubahan yang benar-benar jalan.',
  duplicate:
    'Blok yang sama diulang membuat satu perbaikan harus dilakukan berkali-kali dan mudah terlewat.',
  anyType:
    'Tipe any mematikan pemeriksaan TypeScript. Kesalahan baru ketahuan saat aplikasi berjalan.',
  todo: 'TODO yang menumpuk jadi utang teknis tanpa pemilik dan tanpa tenggat.',
  deepNesting:
    'Nesting dalam menyulitkan pembacaan dan menaikkan risiko logika salah saat menambah kondisi baru.',
  longLine:
    'Baris yang terlalu panjang sulit dibaca dan sering menyembunyikan ekspresi yang sebenarnya kompleks.',
};

const ISSUE_DO: Record<IssueKey, string> = {
  secret:
    'Pindahkan nilainya ke environment variable atau secret manager, rotasi kredensialnya, lalu hapus dari kode.',
  sqlString:
    'Ganti dengan parameterized query atau query builder supaya nilai user dikirim sebagai parameter, bukan teks query.',
  emptyCatch:
    'Isi catch dengan log dan penanganan yang jelas, atau teruskan error ke pemanggil.',
  debugPrint: 'Hapus debug print, atau ganti dengan logger berlevel yang bisa dimatikan di produksi.',
  commentedCode:
    'Hapus baris yang dikomentari. Versi lama sudah tersimpan di riwayat Git bila masih dibutuhkan.',
  duplicate:
    'Satukan blok yang sama ke fungsi atau konstanta bersama, lalu panggil dari kedua tempat.',
  anyType:
    'Ganti any dengan tipe eksplisit. Bila bentuknya belum pasti, pakai unknown lalu validasi.',
  todo: 'Selesaikan sekarang, atau pindahkan ke tiket dengan pemilik dan tenggat.',
  deepNesting:
    'Pakai early return atau guard clause supaya blok utama tetap dangkal dan mudah dibaca.',
  longLine: 'Pecah per ekspresi atau tarik sebagian ke variabel bernama.',
};

interface IssueLocationDetail {
  sha: string;
  projectId: number;
  path: string;
  authoredAt: string;
  line: number;
  snippet: string;
}

function countLabel(issue: StaticIssueRow): string {
  return issue.count.toLocaleString('id-ID');
}

function per100Label(value: number): string {
  if (value === 0) return '0';
  if (value < 1) {
    return value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return value.toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function StaticIssuesCard({ card, days }: StaticIssuesCardProps) {
  const { issues, scannedLines, coverage } = card.skill;
  const [selected, setSelected] = useState<StaticIssueRow | null>(null);
  const [locations, setLocations] = useState<IssueLocationDetail[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const sortedIssues = [...issues].sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
  );

  const openIssue = (issue: StaticIssueRow) => {
    setSelected(issue);
    setLocations([]);
    setLocationsError(null);
    setLoadingLocations(true);
  };

  useEffect(() => {
    if (!selected) return;
    let ignore = false;
    fetch(`/api/gitlab/issues?key=${selected.key}&days=${days}`)
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Gagal memuat lokasi');
        if (!ignore) setLocations((json.locations ?? []) as IssueLocationDetail[]);
      })
      .catch((e: Error) => {
        if (!ignore) setLocationsError(e.message);
      })
      .finally(() => {
        if (!ignore) setLoadingLocations(false);
      });
    return () => {
      ignore = true;
    };
  }, [selected, days]);

  return (
    <section className='card animate-fade-up h-full flex flex-col' aria-labelledby='static-issues-title'>
      <div className='card-title' id='static-issues-title'>
        <span>Isu Statis pada Kode</span>
      </div>

      {issues.length === 0 ? (
        <ScorePending description='Pemindai statis belum berjalan pada periode ini. Jalankan sinkronisasi GitLab; file yang belum dipindai tetap netral.' />
      ) : (
        <>
          <div className='overflow-x-auto'>
            <table className='table'>
              <thead>
                <tr>
                  <th>Isu</th>
                  <th className='num'>Jumlah</th>
                  <th className='num'>Per 100 baris</th>
                  <th>Status</th>
                  <th className='text-right'>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedIssues.map((issue) => (
                  <tr key={issue.key}>
                    <td>
                      <span className='inline-flex items-center gap-2 text-[12px]'>
                        <span className={`dot ${DOT[issue.status]}`} />
                        {issue.label}
                      </span>
                    </td>
                    <td className='num text-[12px]'>{countLabel(issue)}</td>
                    <td className='num text-[11.5px] text-slate-500'>
                      {per100Label(issue.per100)}
                    </td>
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

          <p className='text-[10.5px] text-slate-400 mt-3 leading-relaxed'>
            Sumber: pemindaian baris tambahan saat sinkron ({scannedLines.toLocaleString('id-ID')}{' '}
            baris, {coverage}% file). Duplikasi hanya dihitung dalam file yang sama; duplikasi
            lintas file dilewati. Status memakai ambang per 100 baris; secret dihitung absolut.
          </p>
        </>
      )}

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
                { label: 'Jumlah', value: countLabel(selected) },
                { label: 'Per 100 baris', value: per100Label(selected.per100) },
                { label: 'Status', value: selected.statusLabel },
              ]
            : []
        }
        listTitle='Lokasi temuan'
        loading={loadingLocations}
        error={locationsError}
        action={selected ? ISSUE_DO[selected.key] : ''}
      >
        {selected &&
          (locations.length === 0 ? (
            <DetailNote>
              {selected.count === 0
                ? 'Tidak ada temuan pada periode ini.'
                : 'Lokasi menunggu pemindaian ulang. Jalankan pemindaian ulang agar posisi temuan tersimpan.'}
            </DetailNote>
          ) : (
            <ul className='space-y-1.5'>
              {locations.map((location) => (
                <DetailCodeRow
                  key={`${location.sha}:${location.path}:${location.line}`}
                  path={location.path}
                  line={location.line}
                  snippet={location.snippet}
                  meta={`${location.sha.slice(0, 7)} · ${shortDate(location.authoredAt)}`}
                />
              ))}
            </ul>
          ))}
      </DetailModal>
    </section>
  );
}
