import { ShieldCheck } from 'lucide-react';

interface SettingsSaveBarProps {
  saving: boolean;
  saveMsg: string | null;
}

export function SettingsSaveBar({ saving, saveMsg }: SettingsSaveBarProps) {
  return (
    <div className='card mt-3 flex items-center justify-between flex-wrap gap-4'>
      <div className='flex items-center gap-2 text-[13px] text-slate-muted'>
        <ShieldCheck size={18} className='text-emerald-accent' />
        <span>
          Kredensial dan token tersimpan aman di database SQLite lokal Anda.
        </span>
      </div>

      <div className='flex items-center gap-3'>
        {saveMsg && (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
              saveMsg.startsWith('✓')
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {saveMsg}
          </span>
        )}
        <button
          type='submit'
          className='btn btn-primary min-w-[170px]'
          disabled={saving}
        >
          {saving ? <span className='spinner' /> : null}
          <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
        </button>
      </div>
    </div>
  );
}
