export function getStatusBadgeClass(status?: string) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border';
  if (!status) return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('selesai') || s.includes('closed')) {
    return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
  }
  if (s.includes('review') || s.includes('test')) {
    return `${base} bg-amber-50 text-amber-700 border-amber-200`;
  }
  if (s.includes('progress') || s.includes('doing') || s.includes('ongoing')) {
    return `${base} bg-blue-50 text-blue-700 border-blue-200`;
  }
  return `${base} bg-slate-50 text-slate-700 border-slate-200`;
}
