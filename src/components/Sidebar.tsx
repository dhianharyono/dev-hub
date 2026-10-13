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
  Menu,
  X,
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
  // Sidebar expanded by default on desktop; when collapsed, only the blue rail appears
  const [collapsed, setCollapsed] = useState(false);
  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  const [telemetry, setTelemetry] = useState<ServiceTelemetry>({
    gitlab: { connected: false, commits: 0, mrs: 0 },
    taiga: { connected: false, done: 0, total: 0 },
    wad: { connected: false, timeSpent: 0, expectedHours: 0 },
  });

  // Automatically close mobile drawer when navigating to another route
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  // Handle ESC key and lock body scroll when mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

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
    <>
      {/* 1. Mobile Top Bar with Hamburger Trigger (Visible on mobile/tablet < 1024px) */}
      <header className='sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center justify-between lg:hidden print:hidden'>
        <Link href='/' className='flex items-center gap-2.5 no-underline'>
          <div
            className='w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-[#1e62d0] text-white grid place-items-center shadow-[0_2px_8px_rgba(25,119,243,0.24)] shrink-0'
            aria-hidden='true'
          >
            <FolderGit2 size={18} strokeWidth={2.4} />
          </div>
          <div className='flex flex-col justify-center'>
            <span className='text-[16px] font-extrabold tracking-tight text-slate-text leading-tight'>
              DEV HUB
            </span>
            <span className='text-[10.5px] font-medium text-slate-muted leading-tight'>
              Asisten Produktivitas
            </span>
          </div>
        </Link>

        <button
          type='button'
          onClick={() => setMobileOpen(true)}
          className='w-10 h-10 rounded-xl border border-border bg-surface text-slate-muted flex items-center justify-center hover:text-slate-text hover:bg-surface-hover hover:border-border-strong transition-all focus-visible:outline-2 focus-visible:outline-brand cursor-pointer shadow-2xs'
          aria-label='Buka menu navigasi'
          aria-expanded={mobileOpen}
          aria-controls='mobile-sidebar-drawer'
          id='btn-open-mobile-menu'
        >
          <Menu size={20} strokeWidth={2.2} />
        </button>
      </header>

      {/* 2. Mobile Backdrop (Overlay) */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity duration-300 lg:hidden print:hidden ${
          mobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden='true'
      />

      {/* 3. Mobile Slide-over Drawer Panel */}
      <div
        id='mobile-sidebar-drawer'
        className={`fixed inset-y-0 left-0 w-[290px] max-w-[85vw] bg-surface z-50 border-r border-border shadow-2xl flex flex-col p-5 gap-5 overflow-y-auto transition-transform duration-300 ease-out lg:hidden print:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role='dialog'
        aria-modal={mobileOpen}
        aria-label='Navigasi Menu Mobile'
      >
        <div className='flex items-center justify-between pb-2 border-b border-border/60'>
          <div className='flex items-center gap-2.5 min-w-0'>
            <div
              className='w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-[#1e62d0] text-white grid place-items-center shadow-[0_4px_14px_rgba(25,119,243,0.24)] shrink-0'
              aria-hidden='true'
            >
              <FolderGit2 size={20} strokeWidth={2.4} />
            </div>
            <div className='flex flex-col justify-center min-w-0'>
              <span className='text-[17px] font-extrabold tracking-tight text-slate-text leading-tight'>
                DEV HUB
              </span>
              <span className='text-[11px] font-medium text-slate-muted leading-tight whitespace-nowrap'>
                Asisten Produktivitas
              </span>
            </div>
          </div>
          <button
            type='button'
            onClick={() => setMobileOpen(false)}
            className='w-8 h-8 rounded-lg border border-border bg-surface text-slate-muted grid place-items-center cursor-pointer hover:bg-surface-hover hover:text-slate-text hover:border-border-strong transition-all focus-visible:outline-2 focus-visible:outline-brand shrink-0'
            aria-label='Tutup menu navigasi'
            id='btn-close-mobile-menu'
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Connected Services (Informational only) */}
        <SidebarTelemetry telemetry={telemetry} />

        {/* Navigation Links */}
        <nav
          className='flex flex-col gap-1.5'
          aria-label='Menu navigasi mobile'
        >
          <div className='text-[11px] font-bold uppercase tracking-wider text-slate-dim mb-0.5 px-2'>
            Navigasi Cepat
          </div>

          {PRIMARY_NAV.map((item) => {
            const active =
              item.href === '/' ? path === '/' : path.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                  active
                    ? 'text-brand bg-surface-active font-bold shadow-2xs'
                    : 'text-slate-muted hover:text-slate-text hover:bg-surface-hover'
                }`}
                aria-current={active ? 'page' : undefined}
                id={`mobile-nav-${item.href.replace('/', '') || 'home'}`}
              >
                <Icon size={16} strokeWidth={active ? 2.4 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Drawer footer info */}
        <div className='mt-auto pt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-slate-muted'>
          <span>DevHub v1.0</span>
          <span className='inline-flex items-center gap-1.5 text-emerald-600 font-medium'>
            <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
            Online
          </span>
        </div>
      </div>

      {/* 4. Desktop Aside (Hidden on mobile < 1024px, visible on lg and up) */}
      <aside
        className={`sticky top-0 h-screen z-40 shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] print:hidden hidden lg:flex ${
          collapsed ? 'w-[68px]' : 'w-64'
        }`}
        aria-label='Navigasi utama'
      >
        {/* 4a. Primary Blue Icon Rail (Appears when sidebar is minimized / collapsed) */}
        <div
          className={`w-[68px] min-w-[68px] h-full bg-brand flex flex-col items-center py-5 pb-6 gap-4 text-white transition-all duration-300 ${
            collapsed ? 'flex' : 'hidden'
          }`}
        >
          <div className='flex flex-col items-center justify-center gap-3 w-full'>
            <button
              type='button'
              onClick={() => setCollapsed(false)}
              className='w-10 h-10 rounded-xl border border-white/25 bg-white/15 text-white grid place-items-center cursor-pointer transition-all hover:bg-white hover:text-brand hover:scale-105 hover:shadow-lg'
              title='Perluas Sidebar'
              aria-label='Perluas Sidebar'
              id='btn-expand-sidebar'
            >
              <ChevronRight size={18} strokeWidth={2.4} />
            </button>
          </div>

          <nav
            className='flex flex-col gap-2.5 items-center w-full'
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
                  className={`w-11 h-11 rounded-xl grid place-items-center transition-all ${
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

        {/* 4b. Secondary Workspace Panel (Appears when sidebar is expanded) */}
        <div
          className={`w-64 min-w-64 h-full bg-surface border-r border-border flex flex-col p-6 px-5 gap-5 overflow-y-auto transition-all duration-300 ${
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
          <nav className='flex flex-col gap-1.5' aria-label='Navigasi Cepat Desktop'>
            <div className='text-[11px] font-bold uppercase tracking-wider text-slate-dim mb-0.5 px-2'>
              Navigasi Cepat
            </div>

            {PRIMARY_NAV.map((item) => {
              const active =
                item.href === '/' ? path === '/' : path.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                    active
                      ? 'text-brand bg-surface-active font-bold shadow-2xs'
                      : 'text-slate-muted hover:text-slate-text hover:bg-surface-hover'
                  }`}
                  aria-current={active ? 'page' : undefined}
                  id={`desktop-nav-${item.href.replace('/', '') || 'home'}`}
                >
                  <Icon size={16} strokeWidth={active ? 2.4 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
