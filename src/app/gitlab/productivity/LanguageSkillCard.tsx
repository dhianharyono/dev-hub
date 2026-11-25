'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import type { LanguageDetail } from '@/lib/card-detail';
import type { LanguageSkill, Scorecard } from '@/lib/scoring';
import { DetailCodeRow, DetailCountRow, DetailModal, DetailNote } from './DetailModal';
import { ScorePending } from './ScorePending';

interface LanguageSkillCardProps {
  card: Scorecard;
  days: number;
}

function toneOf(score: number | null): 'green' | 'amber' | 'rose' {
  if (score === null) return 'amber';
  if (score >= 70) return 'green';
  if (score >= 40) return 'amber';
  return 'rose';
}

const DOT: Record<'green' | 'amber' | 'rose', string> = {
  green: 'text-emerald-500',
  amber: 'text-amber-500',
  rose: 'text-rose-500',
};

const SCORE_TEXT: Record<'green' | 'amber' | 'rose', string> = {
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
};

const INTENSITY_STYLE: Record<LanguageSkill['intensity'], string> = {
  Intensif: 'badge badge-cyan',
  Aktif: 'badge',
  Dasar: 'badge',
};

const STATUS_STYLE: Record<'critical' | 'warn' | 'good', string> = {
  critical: 'badge-rose',
  warn: 'badge-amber',
  good: 'badge-green',
};

const fmt = (value: number) => value.toLocaleString('id-ID');

function shortPath(path: string): string {
  return path.replace(/^src\//, '');
}

function recommendationOf(detail: LanguageDetail): string {
  const top = detail.findings.slice(0, 2);
  if (top.length === 0) {
    return `Tidak ada temuan statis di file ${detail.language}. Pertahankan pola kode saat ini.`;
  }
  const names = top.map((finding) => `${finding.label.toLowerCase()} (${fmt(finding.count)})`);
  const worst = top[0].files[0];
  const start = worst ? ` Mulai dari ${shortPath(worst.path)} (${fmt(worst.count)} temuan).` : '';
  return `Fokus ke ${names.join(' dan ')} di file ${detail.language}.${start}`;
}

export function LanguageSkillCard({ card, days }: LanguageSkillCardProps) {
  const { languages, scannedFiles, scannedLines, coverage } = card.skill;
  const [selected, setSelected] = useState<LanguageSkill | null>(null);
  const [detail, setDetail] = useState<LanguageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sortedLanguages = [...languages].sort(
    (a, b) => (a.score ?? 101) - (b.score ?? 101) || b.lines - a.lines,
  );
  const weakest = sortedLanguages.find(
    (language) => language.intensity !== 'Dasar' && language.score !== null,
  );

  useEffect(() => {
    if (!selected) return;
    let ignore = false;
    const params = new URLSearchParams({
      kind: 'language',
      language: selected.language,
      days: String(days),
    });
    fetch(`/api/gitlab/detail?${params.toString()}`)
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Gagal memuat detail bahasa');
        if (!ignore) setDetail(json as LanguageDetail);
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

  const openLanguage = (language: LanguageSkill) => {
    setSelected(language);
    setDetail(null);
    setError(null);
    setLoading(true);
  };

  return (
    <section className='card animate-fade-up h-full flex flex-col' aria-labelledby='language-skill-title'>
      <div className='card-title' id='language-skill-title'>
        <span>Profil Skill per Bahasa</span>
      </div>

      {languages.length === 0 ? (
        <ScorePending description='Belum ada file kode yang dipindai. Jalankan sinkronisasi GitLab untuk mengisi profil bahasa.' />
      ) : (
        <>
          <div className='overflow-x-auto'>
            <table className='table'>
              <thead>
                <tr>
                  <th>Bahasa</th>
                  <th className='num'>Baris</th>
                  <th className='num'>Commit</th>
                  <th>Intensitas</th>
                  <th className='num'>Skor</th>
                  <th className='text-right'>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedLanguages.map((language) => {
                  const tone = toneOf(language.score);
                  return (
                    <tr key={language.language}>
                      <td>
                        <span className='inline-flex items-center gap-2 text-[12px]'>
                          <span className={`dot ${DOT[tone]}`} />
                          {language.language}
                        </span>
                      </td>
                      <td className='num text-[12px]'>
                        {language.lines.toLocaleString('id-ID')}
                      </td>
                      <td className='num text-[12px]'>{language.commits}</td>
                      <td>
                        <span className={`${INTENSITY_STYLE[language.intensity]} text-[10px]`}>
                          {language.intensity}
                        </span>
                      </td>
                      <td className={`num text-[13px] font-extrabold ${language.score === null ? 'text-slate-400' : SCORE_TEXT[tone]}`}>
                        {language.score ?? '—'}
                      </td>
                      <td className='text-right'>
                        <button
                          type='button'
                          className='btn btn-ghost btn-icon !h-7 !w-7 text-slate-400 hover:text-cyan-700'
                          onClick={() => openLanguage(language)}
                          aria-label={`Lihat detail bahasa ${language.language}`}
                          title={`Lihat detail bahasa ${language.language}`}
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className='text-[10.5px] text-slate-400 mt-3 leading-relaxed'>
            {weakest
              ? `${weakest.language} adalah titik terlemah (${weakest.score}). Perbaikan statis di bahasa itu memberi efek terbesar ke Skill Kode. `
              : ''}
            Intensif ≥3.000 baris, Aktif ≥800, Dasar di bawahnya. {scannedFiles.toLocaleString('id-ID')} file /{' '}
            {scannedLines.toLocaleString('id-ID')} baris dipindai ({coverage}%).
          </p>
        </>
      )}

      <DetailModal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.language ?? ''}
        badge={
          selected ? (
            <span className={`${INTENSITY_STYLE[selected.intensity]} text-[10px]`}>
              {selected.intensity}
            </span>
          ) : null
        }
        explanation={
          selected
            ? selected.score === null
              ? `Skor ${selected.language} belum dihitung karena baris tambahan di bawah 30 baris.`
              : `Skor ${selected.language} ${selected.score}/100. Penalti datang dari temuan statis di file ${selected.language}; semakin padat temuannya per 100 baris, semakin besar penaltinya.`
            : ''
        }
        stats={
          selected
            ? [
                { label: 'Baris', value: fmt(selected.lines) },
                { label: 'Commit', value: fmt(selected.commits) },
                { label: 'Skor', value: selected.score === null ? '—' : String(selected.score) },
              ]
            : []
        }
        listTitle='Temuan yang menekan skor'
        loading={loading}
        error={error}
        action={detail ? recommendationOf(detail) : ''}
      >
        {detail &&
          (detail.findings.length === 0 ? (
            <DetailNote>Tidak ada temuan statis pada file bahasa ini.</DetailNote>
          ) : (
            <ul className='space-y-2'>
              {detail.findings.map((finding) => (
                <li key={finding.key} className='rounded-md border border-border bg-surface-subtle px-2.5 py-2'>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-[12px] font-semibold text-slate-text'>
                      {finding.label}
                    </span>
                    <span className={`badge ${STATUS_STYLE[finding.status]} text-[10px]`}>
                      {finding.statusLabel}
                    </span>
                  </div>
                  <div className='mt-0.5 text-[10.5px] text-slate-400'>
                    {fmt(finding.count)} temuan · {finding.per100}/100 baris · penalti −
                    {finding.penalty.toLocaleString('id-ID')}
                  </div>
                  {finding.locations.length > 0 ? (
                    <ul className='mt-1.5 space-y-1'>
                      {finding.locations.map((location) => (
                        <DetailCodeRow
                          key={`${finding.key}:${location.sha}:${location.path}:${location.line}`}
                          path={location.path}
                          line={location.line}
                          snippet={location.snippet}
                        />
                      ))}
                    </ul>
                  ) : finding.files.length > 0 ? (
                    <ul className='mt-1.5 space-y-1'>
                      {finding.files.map((file) => (
                        <DetailCountRow
                          key={file.path}
                          label={shortPath(file.path)}
                          value={`${fmt(file.count)}×`}
                        />
                      ))}
                      <DetailNote>Lokasi baris menunggu pemindaian ulang.</DetailNote>
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          ))}
      </DetailModal>
    </section>
  );
}
