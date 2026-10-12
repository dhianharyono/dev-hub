import Link from 'next/link';
import { GitBranch, CheckCircle2, Zap } from 'lucide-react';

export interface ServiceTelemetry {
  gitlab: {
    connected: boolean;
    commits: number;
    mrs: number;
  };
  taiga: {
    connected: boolean;
    done: number;
    total: number;
  };
  wad: {
    connected: boolean;
    timeSpent: number;
    expectedHours: number;
  };
}

interface SidebarTelemetryProps {
  telemetry: ServiceTelemetry;
}

export function SidebarTelemetry({ telemetry }: SidebarTelemetryProps) {
  return (
    <div className='flex flex-col gap-1.5'>
      <div className='text-[11px] font-bold uppercase tracking-wider text-slate-dim mb-0.5 px-2'>
        Layanan Terhubung
      </div>

      {/* GitLab */}
      <Link
        href={telemetry.gitlab.connected ? '/gitlab' : '/settings'}
        className={`flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all select-none no-underline ${
          telemetry.gitlab.connected
            ? 'hover:bg-surface-hover'
            : 'opacity-55 grayscale hover:opacity-85'
        }`}
        title={
          telemetry.gitlab.connected
            ? 'GitLab terhubung - Lihat produktivitas kode'
            : 'GitLab belum terhubung - Klik untuk konfigurasi di Pengaturan'
        }
      >
        <div
          className={`w-8 h-8 rounded-lg grid place-items-center text-base shrink-0 ${
            telemetry.gitlab.connected
              ? 'bg-red-50 text-coral-accent'
              : 'bg-slate-100 text-slate-400 border border-dashed border-slate-300'
          }`}
        >
          <GitBranch size={16} />
        </div>
        <div className='flex flex-col min-w-0'>
          <span className='text-[13px] font-bold text-slate-text leading-tight'>GitLab</span>
          <span className={`text-[11px] leading-tight mt-0.5 ${telemetry.gitlab.connected ? 'text-slate-muted' : 'text-slate-dim italic'}`}>
            {telemetry.gitlab.connected
              ? `${telemetry.gitlab.commits} Commit · ${telemetry.gitlab.mrs} MR`
              : 'Belum Terhubung'}
          </span>
        </div>
      </Link>

      {/* Taiga */}
      <Link
        href={telemetry.taiga.connected ? '/tasks' : '/settings'}
        className={`flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all select-none no-underline ${
          telemetry.taiga.connected
            ? 'hover:bg-surface-hover'
            : 'opacity-55 grayscale hover:opacity-85'
        }`}
        title={
          telemetry.taiga.connected
            ? 'Taiga terhubung - Lihat smart tasks'
            : 'Taiga belum terhubung - Klik untuk konfigurasi di Pengaturan'
        }
      >
        <div
          className={`w-8 h-8 rounded-lg grid place-items-center text-base shrink-0 ${
            telemetry.taiga.connected
              ? 'bg-purple-50 text-violet-accent'
              : 'bg-slate-100 text-slate-400 border border-dashed border-slate-300'
          }`}
        >
          <CheckCircle2 size={16} />
        </div>
        <div className='flex flex-col min-w-0'>
          <span className='text-[13px] font-bold text-slate-text leading-tight'>Taiga</span>
          <span className={`text-[11px] leading-tight mt-0.5 ${telemetry.taiga.connected ? 'text-slate-muted' : 'text-slate-dim italic'}`}>
            {telemetry.taiga.connected
              ? `${telemetry.taiga.done} / ${telemetry.taiga.total} Selesai`
              : 'Belum Terhubung'}
          </span>
        </div>
      </Link>

      {/* WAD */}
      <Link
        href={telemetry.wad.connected ? '/workload' : '/settings'}
        className={`flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all select-none no-underline ${
          telemetry.wad.connected
            ? 'hover:bg-surface-hover'
            : 'opacity-55 grayscale hover:opacity-85'
        }`}
        title={
          telemetry.wad.connected
            ? 'WAD terhubung - Lihat workload analysis'
            : 'WAD belum terhubung - Klik untuk konfigurasi di Pengaturan'
        }
      >
        <div
          className={`w-8 h-8 rounded-lg grid place-items-center text-base shrink-0 ${
            telemetry.wad.connected
              ? 'bg-cyan-50 text-cyan-accent'
              : 'bg-slate-100 text-slate-400 border border-dashed border-slate-300'
          }`}
        >
          <Zap size={16} />
        </div>
        <div className='flex flex-col min-w-0'>
          <span className='text-[13px] font-bold text-slate-text leading-tight'>WAD</span>
          <span className={`text-[11px] leading-tight mt-0.5 ${telemetry.wad.connected ? 'text-slate-muted' : 'text-slate-dim italic'}`}>
            {telemetry.wad.connected
              ? `${telemetry.wad.timeSpent.toFixed(0)}h / ${telemetry.wad.expectedHours.toFixed(0)}h Aktif`
              : 'Belum Terhubung'}
          </span>
        </div>
      </Link>
    </div>
  );
}
