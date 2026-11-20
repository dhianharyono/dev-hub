'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import type {
  ReleaseNoteDetail,
  ReleaseNoteSummary,
} from '@/lib/release-note/model';
import type { ReleaseOptions } from '@/lib/release-deployment/model';
import { buildDeploymentDraft } from '@/lib/release-deployment/from-note';
import { DeploymentFormStep } from './DeploymentFormStep';
import { ReleaseNoteList } from './ReleaseNoteList';

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Tab ketiga: susun form deployment dari release note yang sudah ada. */
export function ReleaseDeploymentTab() {
  const [options, setOptions] = useState<ReleaseOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReleaseNoteSummary | null>(null);
  const [detail, setDetail] = useState<ReleaseNoteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    let ignore = false;
    fetch('/api/release-note/options')
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? 'Gagal memuat data Taiga');
        }
        return payload as ReleaseOptions;
      })
      .then((payload) => {
        if (!ignore) setOptions(payload);
      })
      .catch((err) => {
        if (!ignore) setOptionsError(messageOf(err));
      });
    return () => {
      ignore = true;
    };
  }, []);

  const backToList = useCallback(() => {
    requestRef.current += 1;
    setSelected(null);
    setDetail(null);
    setError(null);
    setLoading(false);
  }, []);

  const pick = useCallback(async (note: ReleaseNoteSummary) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setSelected(note);
    setDetail(null);
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/release-note/detail?ref=${note.ref}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Gagal memuat detail release note');
      }
      if (requestRef.current === requestId) {
        setDetail(payload.note as ReleaseNoteDetail);
      }
    } catch (err) {
      if (requestRef.current === requestId) setError(messageOf(err));
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, []);

  const draft = useMemo(
    () => (detail ? buildDeploymentDraft(detail) : null),
    [detail],
  );

  return (
    <>
      {optionsError && (
        <div className='alert alert-error mb-3 flex items-start gap-2'>
          <AlertCircle size={16} className='mt-0.5 shrink-0' />
          <span>
            Data form deployment tidak termuat: {optionsError}. Link form bisa
            diisi lewat menu Pengaturan.
          </span>
        </div>
      )}

      <div hidden={Boolean(selected)}>
        <ReleaseNoteList
          title='Buat form deployment dari release note'
          hint='Pilih release note yang sudah ada. Judul, tiket, waktu, dan task deployment-nya dipakai untuk menyiapkan isian form.'
          actionLabel='Buat form'
          onAction={(note) => void pick(note)}
        />
      </div>

      {selected &&
        (draft ? (
          <DeploymentFormStep
            form={draft.form}
            created={draft.created}
            memberName=''
            formUrl={options?.formUrl ?? ''}
            onBack={backToList}
          />
        ) : (
          <section className='card animate-fade-up'>
            <h2 className='card-title mb-1'>Release note #{selected.ref}</h2>
            <p className='muted text-[13px]'>{selected.subject}</p>

            {loading ? (
              <div className='py-10 flex items-center justify-center gap-2 text-slate-500 text-sm'>
                <Loader2 size={16} className='animate-spin' />
                Memuat detail release note...
              </div>
            ) : (
              <>
                <div className='alert alert-error mt-4 flex items-start gap-2'>
                  <AlertCircle size={16} className='mt-0.5 shrink-0' />
                  <span>{error ?? 'Detail release note tidak dapat dimuat.'}</span>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <button
                    type='button'
                    className='btn btn-ghost'
                    onClick={backToList}
                  >
                    <ArrowLeft size={16} />
                    Kembali ke daftar
                  </button>
                  <button
                    type='button'
                    className='btn btn-primary'
                    onClick={() => void pick(selected)}
                  >
                    Coba lagi
                  </button>
                </div>
              </>
            )}
          </section>
        ))}
    </>
  );
}
