import { referenceReportData, type FullReportData } from './reportData';
import { ReportFooter } from './ReportFooter';

interface ReportReleaseFlowPageProps {
  data?: FullReportData;
  currentPage?: number;
  totalPages?: number;
}

const STAGE_ORDER = ['develop', 'release', 'master', 'other'];

export function ReportReleaseFlowPage({
  data = referenceReportData,
  currentPage = 2,
  totalPages = 7,
}: ReportReleaseFlowPageProps) {
  const flow = data.talentProfile.releaseFlow;
  const monthly = data.talentProfile.monthlyContributions;
  const stages = flow ? [...flow.stages].sort((a, b) => STAGE_ORDER.indexOf(a.key) - STAGE_ORDER.indexOf(b.key)) : [];
  const visibleStages = stages.filter((s) => s.key !== 'other' || flow?.hasOtherBranch);
  const totalPoints = flow?.totalPoints ?? 0;
  const branches = flow?.branches ?? 0;
  const maxPoints = Math.max(1, ...(flow?.monthly.map((m) => m.points) ?? [1]));
  const fmt = (v: number | string) => (typeof v === 'number' ? v.toLocaleString('id-ID') : v);

  return (
    <article className='report-sheet bg-white text-slate-900 border border-slate-200 rounded-lg p-[36px_42px_26px] mb-8 shadow-sm flex flex-col justify-between min-h-[1350px] box-border'>
      <div className='flex-1 print:overflow-hidden'>
        <h2 className='text-xl font-extrabold text-slate-900 tracking-tight mb-1 print:text-base print:mb-1'>
          ALUR KERJA: BRANCH → DEVELOP → RELEASE → MASTER
        </h2>
        <p className='text-[14.3px] text-slate-500 mb-3 print:text-[10.0px] print:mb-1.5'>
          Poin dihitung dari MR yang sudah merged. Branch baru 1 poin, MR ke develop 2, release 3, master 5.
        </p>

        {/* Flow table */}
        <div className='overflow-x-auto my-2'>
          <table className='w-full border-collapse text-xs print:text-[10.0px] [&_th]:text-left [&_th]:text-[9.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1.5 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1.5 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <colgroup>
              <col style={{ width: '24%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '22%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>TAHAP</th>
                <th className='num text-right'>MR DIBUAT</th>
                <th className='num text-right'>MR MERGED</th>
                <th className='num text-right'>IKUT TERBAWA</th>
                <th className='num text-right'>POIN/MR</th>
                <th className='num text-right'>POIN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className='font-semibold text-slate-800'>Branch dibuat</td>
                <td className='num mono text-right'>{branches.toLocaleString('id-ID')} branch</td>
                <td className='num mono text-right'>-</td>
                <td className='num mono text-right'>-</td>
                <td className='num mono text-right'>1</td>
                <td className='num mono text-right font-bold'>{branches.toLocaleString('id-ID')}</td>
              </tr>
              {visibleStages.map((s) => (
                <tr key={s.key}>
                  <td className='font-semibold text-slate-800'>{s.label}</td>
                  <td className='num mono text-right'>{s.created.toLocaleString('id-ID')}</td>
                  <td className='num mono text-right'>{s.merged.toLocaleString('id-ID')}</td>
                  <td className='num mono text-right'>{s.carried ? s.carried.toLocaleString('id-ID') : '0'}</td>
                  <td className='num mono text-right'>{s.pointsPerMr}</td>
                  <td className='num mono text-right font-bold'>{s.points.toLocaleString('id-ID')}</td>
                </tr>
              ))}
              <tr className='bg-slate-50 font-bold'>
                <td>Total poin alur kerja</td>
                <td className='num mono text-right'>-</td>
                <td className='num mono text-right'>-</td>
                <td className='num mono text-right'>-</td>
                <td className='num mono text-right'>-</td>
                <td className='num mono text-right'>{(flow?.pointsPerMonth ?? 0).toLocaleString('id-ID')} /bln · {totalPoints.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          <div className='text-[11.7px] text-slate-500 mt-1 leading-snug print:text-[8.8px]'>
            Pekerjaan yang ikut masuk dalam MR milik rekan dihitung setengah poin (50%). Poin master paling besar karena pekerjaannya dipakai di production.
          </div>
        </div>

        {/* Funnel */}
        <section className='my-3 print:my-1.5'>
          <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[10.6px]'>
            SEJAUH MANA COMMIT ANDA SAMPAI
          </h3>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 print:gap-1'>
            {[
              { label: 'Sampai master/production', value: flow?.funnel.master ?? 0, pct: flow?.funnel.masterPct ?? 0, tone: 'emerald' },
              { label: 'Sampai release', value: flow?.funnel.release ?? 0, pct: flow?.funnel.releasePct ?? 0, tone: 'blue' },
              { label: 'Sampai develop', value: flow?.funnel.develop ?? 0, pct: flow?.funnel.developPct ?? 0, tone: 'amber' },
              { label: 'Belum di-merge', value: flow?.funnel.none ?? 0, pct: flow ? Math.round((flow.funnel.none / Math.max(1, flow.funnel.total)) * 1000) / 10 : 0, tone: 'slate' },
            ].map((f) => (
              <div key={f.label} className='border border-slate-200 rounded-lg p-2 bg-slate-50 print:p-1'>
                <div className='text-[11.1px] font-extrabold uppercase tracking-wider text-slate-500 print:text-[8.8px]'>{f.label}</div>
                <div className='text-lg font-extrabold text-slate-900 leading-tight print:text-[16.2px]'>
                  {f.value.toLocaleString('id-ID')} <span className='text-xs font-bold text-slate-500'>({f.pct.toLocaleString('id-ID')}%)</span>
                </div>
              </div>
            ))}
          </div>
          {flow?.firstMasterMonth ? (
            <div className='text-[12.3px] text-slate-500 mt-1 print:text-[9.4px]'>
              Kontribusi pertama yang sampai ke master tercatat pada {flow.firstMasterMonth}.
            </div>
          ) : null}
        </section>

        {/* Monthly points chart */}
        <section className='my-3 print:my-1.5'>
          <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[10.6px]'>
            POIN ALUR KERJA PER BULAN
          </h3>
          <div className='flex items-end gap-2 h-[110px] print:h-[70px]'>
            <div className='flex flex-col justify-between text-[10.4px] font-mono text-slate-400 h-full pr-1'>
              <span>{Math.ceil(maxPoints)}</span>
              <span>{Math.ceil(maxPoints * 0.5)}</span>
              <span>0</span>
            </div>
            <div className='flex items-end gap-1.5 flex-1 h-full border-b border-l border-slate-300 pl-1 pb-0.5'>
              {(flow?.monthly ?? []).map((m) => {
                const branchPts = m.branches;
                const devPts = m.develop * 2;
                const relPts = m.release * 3;
                const masterPts = m.master * 5;
                const total = branchPts + devPts + relPts + masterPts;
                const h = (n: number) => (total > 0 ? Math.max(0, (n / maxPoints) * 100) : 0);
                return (
                  <div key={m.ym} className='flex flex-col items-center flex-1 h-full justify-end'>
                    <span className='text-[10.4px] font-mono text-slate-500 mb-0.5'>{Math.round(m.points)}</span>
                    <div className='w-full max-w-[22px] flex flex-col justify-end flex-1' style={{ minHeight: 0 }}>
                      <div className='w-full bg-blue-800 rounded-t-sm' style={{ height: `${h(masterPts)}%` }} title={`Master ${masterPts} poin`} />
                      <div className='w-full bg-blue-600' style={{ height: `${h(relPts)}%` }} title={`Release ${relPts} poin`} />
                      <div className='w-full bg-blue-400' style={{ height: `${h(devPts)}%` }} title={`Develop ${devPts} poin`} />
                      <div className='w-full bg-slate-300' style={{ height: `${h(branchPts)}%` }} title={`Branch ${branchPts} poin`} />
                    </div>
                    <span className='text-[9.8px] text-slate-400 font-mono mt-0.5'>{m.label.split(' ')[0].slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className='flex items-center gap-3 mt-1 text-[11.1px] text-slate-500 print:text-[8.8px]'>
            <span className='flex items-center gap-1'><span className='w-2.5 h-2.5 bg-slate-300 rounded-xs' />Branch</span>
            <span className='flex items-center gap-1'><span className='w-2.5 h-2.5 bg-blue-400 rounded-xs' />Develop</span>
            <span className='flex items-center gap-1'><span className='w-2.5 h-2.5 bg-blue-600 rounded-xs' />Release</span>
            <span className='flex items-center gap-1'><span className='w-2.5 h-2.5 bg-blue-800 rounded-xs' />Master (production)</span>
          </div>
        </section>

        {/* Monthly table */}
        <section className='my-3 print:my-1.5'>
          <h3 className='text-[13.7px] font-extrabold tracking-widest uppercase text-slate-600 mb-1.5 print:text-[10.6px]'>
            PERGERAKAN BULANAN
          </h3>
          <table className='w-full border-collapse text-[13.7px] print:text-[9.2px] [&_th]:text-left [&_th]:text-[8.5px] [&_th]:font-extrabold [&_th]:tracking-wider [&_th]:uppercase [&_th]:text-slate-500 [&_th]:p-1 [&_th]:border-b-[1.5px] [&_th]:border-slate-300 [&_th]:bg-slate-50 print:[&_th]:p-0.5 [&_td]:p-1 [&_td]:border-b [&_td]:border-slate-200 print:[&_td]:p-0.5'>
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>BULAN</th>
                <th className='num text-right'>COMMIT</th>
                <th className='num text-right'>HARI AKTIF</th>
                <th className='num text-right'>BARIS</th>
                <th className='num text-right'>BRANCH</th>
                <th className='num text-right'>MR→DEV</th>
                <th className='num text-right'>MR→REL</th>
                <th className='num text-right'>MR→MST</th>
                <th className='num text-right'>POIN</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m, idx) => {
                const isTotal = idx === monthly.length - 1;
                return (
                  <tr key={m.month} className={isTotal ? 'font-bold bg-slate-50' : undefined}>
                    <td className={isTotal ? 'font-bold' : undefined}>{m.month}</td>
                    <td className='num mono text-right'>{fmt(m.commits)}</td>
                    <td className='num mono text-right'>{fmt(m.activeDays)}</td>
                    <td className='num mono text-right'>{m.linesChanged}</td>
                    <td className='num mono text-right'>{fmt(m.branches)}</td>
                    <td className='num mono text-right'>{fmt(m.mrDevelop)}</td>
                    <td className='num mono text-right'>{fmt(m.mrRelease)}</td>
                    <td className='num mono text-right'>{fmt(m.mrMaster)}</td>
                    <td className='num mono text-right'>{fmt(m.points)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className='text-[12.3px] text-slate-500 mt-1 print:text-[9.4px]'>{data.talentProfile.monthlySummary}</div>
        </section>
      </div>

      <ReportFooter currentPage={currentPage} totalPages={totalPages} />
    </article>
  );
}
