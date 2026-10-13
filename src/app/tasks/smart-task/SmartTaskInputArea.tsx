import { useEffect } from 'react';
import { ListPlus, Plus, Sparkles } from 'lucide-react';
import { Select } from '@/components/Select';
import { useNotification } from '@/components/Notification';
import type { Meta } from './types';

interface SmartTaskInputAreaProps {
  activeTab: 'smart' | 'bulk';
  setActiveTab: (tab: 'smart' | 'bulk') => void;
  mode: 'auto' | 'userstory' | 'task';
  setMode: (mode: 'auto' | 'userstory' | 'task') => void;
  parentId: number | null;
  setParentId: (id: number | null) => void;
  meta: Meta | null;
  input: string;
  setInput: (value: string) => void;
  parsing: boolean;
  parseError: string | null;
  onParse: () => void;
  bulkPasteInput: string;
  setBulkPasteInput: (value: string) => void;
  onBulkPasteAdd: () => void;
}

export function SmartTaskInputArea({
  activeTab,
  setActiveTab,
  mode,
  setMode,
  parentId,
  setParentId,
  meta,
  input,
  setInput,
  parsing,
  parseError,
  onParse,
  bulkPasteInput,
  setBulkPasteInput,
  onBulkPasteAdd,
}: SmartTaskInputAreaProps) {
  const { notify } = useNotification();

  useEffect(() => {
    if (parseError) {
      notify.error(parseError, 'Gagal Memproses Catatan');
    }
  }, [parseError, notify]);

  return (
    <section
      className='card flex flex-col gap-6'
      aria-label='Input Catatan Kerja'
    >
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='card-title m-0' id='input-title'>
          Input Catatan Kerja
        </div>

        <div className='flex gap-1.5 bg-surface-subtle p-1.5 rounded-xl border border-border' role='tablist'>
          <button
            type='button'
            role='tab'
            aria-selected={activeTab === 'smart'}
            className={`flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 text-xs sm:text-[13px] font-semibold border-0 rounded-lg cursor-pointer transition-all ${
              activeTab === 'smart'
                ? 'text-white bg-brand shadow-sm font-bold'
                : 'text-slate-muted bg-transparent hover:text-slate-text hover:bg-black/5'
            }`}
            onClick={() => setActiveTab('smart')}
          >
            <Sparkles size={14} />
            <span>Naratif</span>
          </button>
          <button
            type='button'
            role='tab'
            aria-selected={activeTab === 'bulk'}
            className={`flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 text-xs sm:text-[13px] font-semibold border-0 rounded-lg cursor-pointer transition-all ${
              activeTab === 'bulk'
                ? 'text-white bg-brand shadow-sm font-bold'
                : 'text-slate-muted bg-transparent hover:text-slate-text hover:bg-black/5'
            }`}
            onClick={() => setActiveTab('bulk')}
          >
            <ListPlus size={14} />
            <span>Multi</span>
          </button>
        </div>
      </div>

      {activeTab === 'smart' ? (
        <>
          {/* TARGET JENIS ITEM & DEFAULT USER STORY */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <div className='field'>
              <span className='label-sm'>Target Jenis Item</span>
              <div
                className='segmented w-full !h-11 flex'
                role='group'
                aria-label='Jenis item'
              >
                {(
                  [
                    ['task', 'Task'],
                    ['userstory', 'User Story'],
                    ['auto', 'Otomatis'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    type='button'
                    id={`mode-${v}`}
                    aria-pressed={mode === v}
                    onClick={() => setMode(v)}
                    className='flex-1 h-full flex items-center justify-center text-xs font-semibold'
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'task' ? (
              <div className='field'>
                <label htmlFor='parent-us'>User Story Induk (Default)</label>
                <Select
                  id='parent-us'
                  value={parentId ?? ''}
                  onChange={(e) =>
                    setParentId(e.target.value ? Number(e.target.value) : null)
                  }
                  className='!h-11'
                >
                  <option value=''>Pilih otomatis / per-task</option>
                  {meta?.userStories.map((u) => (
                    <option key={u.id} value={u.id}>
                      #{u.ref} · {u.subject}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div
                className='field justify-center pb-1'
              >
                <span className='text-xs text-slate-400'>
                  {mode === 'userstory'
                    ? 'Dibuat sebagai User Story baru di sprint aktif'
                    : 'AI memilih otomatis: Task jika ada US cocok, atau US baru'}
                </span>
              </div>
            )}
          </div>

          {/* TEXTAREA UTAMA DENGAN META */}
          <div className='relative flex flex-col'>
            <textarea
              id='notes'
              className='textarea min-h-[200px] text-sm leading-relaxed rounded-2xl p-4'
              placeholder='Tulis pekerjaan Anda di sini. Bisa berupa catatan bebas, list standup, atau estimasi:&#10;1. Fix bug login expired (2 jam)&#10;2. Integrasi endpoint payment gateway (3 jam)&#10;3. Review MR squad core (1 jam)'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onParse();
              }}
            />

            <div className='flex items-center justify-between mt-2 px-1'>
              <span className='text-xs text-slate-400'>
                {input.trim()
                  ? `${input.length} karakter · ${input.split('\n').filter(Boolean).length} baris`
                  : 'Ketik catatan harian kerja'}
              </span>
              <div className='flex items-center gap-2.5'>
                {input.trim() && (
                  <button
                    type='button'
                    className='btn btn-ghost btn-sm text-xs text-slate-500 px-2.5 h-7 rounded-lg'
                    onClick={() => setInput('')}
                  >
                    Bersihkan
                  </button>
                )}
                <span className='text-xs text-slate-400 inline-flex items-center gap-1 font-mono'>
                  <kbd className='px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]'>⌘</kbd> + <kbd className='px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]'>Enter</kbd>
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div>
            <button
              type='button'
              id='btn-parse'
              className='btn btn-primary w-full h-11 text-sm font-semibold rounded-xl'
              onClick={onParse}
              disabled={parsing || input.trim().length < 3}
            >
              {parsing ? <span className='spinner' /> : <Sparkles size={16} />}
              <span>
                {parsing
                  ? 'Sedang Memproses dengan AI...'
                  : 'Rapikan & Pecah Task (AI)'}
              </span>
            </button>
          </div>

        </>
      ) : (
        /* TAB MULTI-BARIS QUICK PASTE */
        <div className='border border-border bg-surface rounded-[10px] p-4 shadow-sm flex flex-col gap-3'>
          <div className='row-between'>
            <div className='small font-bold flex items-center gap-1.5'>
              <ListPlus size={16} className='text-(--cyan)' />
              <span>Mode Multi-Baris Cepat</span>
            </div>
            <span className='badge badge-cyan xs'>1 baris = 1 task</span>
          </div>
          <div className='xs dim'>
            Paste daftar task dari clipboard. Estimasi dalam kurung seperti{' '}
            <code>(2 jam)</code> atau <code>(1.5j)</code> otomatis terdeteksi.
          </div>
          <textarea
            className='textarea min-h-[150px] font-(family-name:--font-mono) text-[13px]'
            placeholder='Review MR API contract (1 jam)&#10;Fix bug dag airflow (2 jam)&#10;Daily standup tim (0.5 jam)'
            value={bulkPasteInput}
            onChange={(e) => setBulkPasteInput(e.target.value)}
          />
          <div className='row-between'>
            <span className='xs dim'>
              {bulkPasteInput.split('\n').filter((l) => l.trim()).length} task
              terdeteksi
            </span>
            <button
              type='button'
              className='btn btn-sm btn-primary'
              onClick={onBulkPasteAdd}
              disabled={!bulkPasteInput.trim()}
            >
              <Plus size={14} />
              <span>Tambahkan ke Draft</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
