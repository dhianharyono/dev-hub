'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  Activity,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
} from 'lucide-react';
import { SidebarTelemetry, type ServiceTelemetry } from './SidebarTelemetry';

const PRIMARY_NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Smart Task', icon: Sparkles },
  { href: '/gitlab', label: 'Productivity Monitor', icon: Activity },
  { href: '/workload', label: 'Workload Analysis', icon: Zap },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  // Sidebar expanded by default; when collapsed, only the blue rail appears
  const [collapsed, setCollapsed] = useState(false);
  const [telemetry, setTelemetry] = useState<ServiceTelemetry>({
    gitlab: { connected: false, commits: 0, mrs: 0 },
    taiga: { connected: false, done: 0, total: 0 },
    wad: { connected: false, timeSpent: 0, expectedHours: 0 },
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [integrationsRes, statsRes, workloadRes] =
          await Promise.allSettled([
            fetch('/api/integrations/status').then((r) =>
              r.ok ? r.json() : null,
            ),
            fetch('/api/gitlab/stats?days=30').then((r) =>
              r.ok ? r.json() : null,
            ),
            fetch('/api/workload').then((r) => (r.ok ? r.json() : null)),
          ]);

        if (!isMounted) return;

        const integrations =
          integrationsRes.status === 'fulfilled' ? integrationsRes.value : null;
        const stats = statsRes.status === 'fulfilled' ? statsRes.value : null;
        const workload =
          workloadRes.status === 'fulfilled' ? workloadRes.value : null;

        const gitlabConnected = Boolean(integrations?.gitlab?.connected);
        const taigaConnected = Boolean(integrations?.taiga?.connected);
        const wadConnected = Boolean(integrations?.wad?.connected);

        const glCommits = gitlabConnected ? (stats?.kpis?.commits ?? 0) : 0;
        const glMrs = gitlabConnected ? (stats?.kpis?.mrsMerged ?? 0) : 0;

        const taigaDone = taigaConnected
          ? (workload?.statusBreakdown?.done ?? 0)
          : 0;
        const taigaTotal = taigaConnected
          ? (workload?.kpis?.activitiesCount ?? 0)
          : 0;

        const wadSpent = wadConnected ? (workload?.kpis?.timeSpent ?? 0) : 0;
        const wadExpected = wadConnected
          ? (workload?.kpis?.expectedHours ?? 0)
          : 0;

        setTelemetry({
          gitlab: {
            connected: gitlabConnected,
            commits: glCommits,
            mrs: glMrs,
          },
          taiga: {
            connected: taigaConnected,
            done: taigaDone,
            total: taigaTotal,
          },
          wad: {
            connected: wadConnected,
            timeSpent: wadSpent,
            expectedHours: wadExpected,
          },
        });
      } catch {
        // Silently preserve initial values on error
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <aside
      className={`sticky top-0 h-screen z-40 shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] print:hidden max-lg:static max-lg:h-auto max-lg:w-full max-lg:flex-col max-lg:overflow-visible ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
      aria-label='Navigasi utama'
    >
      {/* 1. Primary Blue Icon Rail (Appears when sidebar is minimized / collapsed or on mobile) */}
      <div
        className={`w-[68px] min-w-[68px] h-full bg-brand flex flex-col items-center py-5 pb-6 gap-4 text-white transition-all duration-300 max-lg:w-full max-lg:h-[60px] max-lg:flex-row max-lg:px-4 max-lg:py-0 max-lg:justify-between max-lg:static ${
          collapsed ? 'flex' : 'hidden max-lg:flex'
        }`}
      >
        <div className='flex flex-col items-center justify-center gap-3 w-full max-lg:flex-row max-lg:w-auto'>
          <button
            type='button'
            onClick={() => setCollapsed(false)}
            className='w-10 h-10 rounded-xl border border-white/25 bg-white/15 text-white grid place-items-center cursor-pointer transition-all hover:bg-white hover:text-brand hover:scale-105 hover:shadow-lg max-lg:hidden'
            title='Perluas Sidebar'
            aria-label='Perluas Sidebar'
            id='btn-expand-sidebar'
          >
            <ChevronRight size={18} strokeWidth={2.4} />
          </button>
        </div>

        <nav
          className='flex flex-col gap-2.5 items-center w-full max-lg:flex-row max-lg:w-auto'
          aria-label='Menu Modul Minimized'
        >
          {PRIMARY_NAV.map((item) => {
            const active =
              item.href === '/' ? path === '/' : path.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-11 h-11 rounded-xl grid place-items-center transition-all max-lg:w-10 max-lg:h-10 ${
                  active
                    ? 'bg-white text-brand shadow-md font-bold'
                    : 'text-white/75 hover:text-white hover:bg-white/15'
                }`}
                aria-current={active ? 'page' : undefined}
                title={item.label}
                id={`rail-nav-${item.href.replace('/', '') || 'home'}`}
              >
                <Icon size={20} strokeWidth={2.2} />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 2. Secondary Workspace Panel (Appears when sidebar is expanded) */}
      <div
        className={`w-64 min-w-64 h-full bg-surface border-r border-border flex flex-col p-6 px-5 gap-5 overflow-y-auto transition-all duration-300 max-lg:hidden ${
          collapsed ? 'hidden' : 'flex'
        }`}
      >
        <div className='flex items-center justify-between gap-3 pb-0.5'>
          <div className='flex items-center gap-3 min-w-0'>
            <div
              className='w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-[#1e62d0] text-white grid place-items-center shadow-[0_4px_14px_rgba(25,119,243,0.24)] shrink-0'
              aria-hidden='true'
            >
              <FolderGit2 size={22} strokeWidth={2.4} />
            </div>
            <div className='flex flex-col justify-center gap-0.5 min-w-0'>
              <h2 className='text-[19px] font-extrabold tracking-tight text-slate-text leading-tight m-0'>
                DEV HUB
              </h2>
              <span className='text-[11.5px] font-medium text-slate-muted leading-tight whitespace-nowrap'>
                Asisten Produktivitas
              </span>
            </div>
          </div>
          <button
            type='button'
            onClick={() => setCollapsed(true)}
            className='w-8 h-8 rounded-lg border border-border bg-surface text-slate-muted grid place-items-center cursor-pointer shrink-0 transition-all hover:bg-surface-hover hover:text-slate-text hover:border-border-strong focus-visible:outline-2 focus-visible:outline-brand'
            title='Perkecil sidebar'
            aria-label='Perkecil sidebar'
            id='btn-collapse-sidebar'
          >
            <ChevronLeft size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* Connected Services (Informational only) */}
        <SidebarTelemetry telemetry={telemetry} />

        {/* Navigation Links */}
        <div className='flex flex-col gap-1.5'>
          <div className='text-[11px] font-bold uppercase tracking-wider text-slate-dim mb-0.5 px-2'>
            Navigasi Cepat
          </div>

          <Link
            href='/'
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
              path === '/'
                ? 'text-brand bg-surface-active font-bold shadow-2xs'
                : 'text-slate-muted hover:text-slate-text hover:bg-surface-hover'
            }`}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

          <Link
            href='/tasks'
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
              path.startsWith('/tasks')
                ? 'text-brand bg-surface-active font-bold shadow-2xs'
                : 'text-slate-muted hover:text-slate-text hover:bg-surface-hover'
            }`}
          >
            <Sparkles size={16} />
            <span>Smart Task</span>
          </Link>

          <Link
            href='/gitlab'
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
              path.startsWith('/gitlab')
                ? 'text-brand bg-surface-active font-bold shadow-2xs'
                : 'text-slate-muted hover:text-slate-text hover:bg-surface-hover'
            }`}
          >
            <Activity size={16} />
            <span>Productivity Monitor</span>
          </Link>

          <Link
            href='/workload'
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
              path.startsWith('/workload')
                ? 'text-brand bg-surface-active font-bold shadow-2xs'
                : 'text-slate-muted hover:text-slate-text hover:bg-surface-hover'
            }`}
          >
            <Zap size={16} />
            <span>Workload Analysis</span>
          </Link>

          <Link
            href='/settings'
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
              path.startsWith('/settings')
                ? 'text-brand bg-surface-active font-bold shadow-2xs'
                : 'text-slate-muted hover:text-slate-text hover:bg-surface-hover'
            }`}
          >
            <Settings size={16} />
            <span>Pengaturan</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
