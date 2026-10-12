import { NextResponse } from 'next/server';
import { runAiCompletion } from '@/lib/ai/client';
import { getSettings } from '@/lib/settings';
import { errorResponse } from '@/lib/http';
import type { WorkloadData } from '@/lib/workload';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const s = getSettings();
    const data = (await req.json()) as WorkloadData;

    const hasAi = Boolean(s.aiApiKey || s.geminiApiKey || s.aiProvider === 'custom');
    if (!hasAi) {
      throw new Error('API Key AI belum diatur di Pengaturan DEV HUB.');
    }

    const prompt = `Anda adalah Asisten AI Analis Produktivitas & Workload untuk software engineer/developer.
Berdasarkan data beban kerja dari Taiga untuk portal WAD:

INFORMASI KARYAWAN:
- Nama: ${data.user.name}
- Periode: ${data.monthLabel}
- Status Workload: ${data.kpis.status} (${data.kpis.percentage}%)
- Compliance: ${data.kpis.compliance}
- Jam Tercatat (Time Spent): ${data.kpis.timeSpent.toFixed(2)} jam
- Jam Target/Wajib: ${data.kpis.expectedHours.toFixed(2)} jam (${data.kpis.workdaysPassed} hari kerja telah berjalan)
- Total Task: ${data.kpis.activitiesCount} task (Done: ${data.statusBreakdown.done}, In Progress: ${data.statusBreakdown.inProgress}, To Do: ${data.statusBreakdown.todo})

ATURAN JAM KERJA WAJIB:
- Jam kerja wajib harian adalah 08:00 sampai 17:00 pada hari kerja (Senin - Jumat) = 8 jam kerja bersih per hari.
- Setiap hari kerja idealnya tercatat total 8 jam task di Taiga agar portal WAD mencatat status "Fit" (100%).

DAFTAR TASK BULAN INI:
${data.tasks
  .slice(0, 15)
  .map(
    (t) =>
      `- [${t.project}] #${t.ref} ${t.subject} | Tgl: ${t.activityDate} Jam: ${t.startTime} | Durasi: ${t.timeSpentHours} jam | Status: ${t.status}`,
  )
  .join('\n')}

INSTRUKSI ANALISIS:
Berikan analisis mendalam, profesional, dan to-the-point dalam Bahasa Indonesia dengan format Markdown:
1. **Evaluasi Kepatuhan Jam Kerja (08:00 - 17:00 Weekday)**: Analisis apakah target 8 jam/hari sudah terpenuhi, apakah ada gap jam yang kosong, dan apakah jam mulai (08:00-17:00) sudah tertib.
2. **Kesehatan & Distribusi Beban Kerja**: Komentar mengenai status workload (${data.kpis.status}), rasio task In Progress (${data.statusBreakdown.inProgress}) vs Done (${data.statusBreakdown.done}), dan fokus proyek (${data.assignments[0]?.project || 'SPC'}).
3. **3 Saran Tindakan Konkret**: Langkah spesifik apa yang harus dilakukan hari ini/besok agar pencatatan di WAD tetap Fit 100% dan bebas kendala saat evaluasi pimpinan/tribe.

Tulis dengan gaya suportif, ringkas, berbobot, dan actionable.`;

    const analysisText = await runAiCompletion({
      prompt,
      temperature: 0.3,
    });

    return NextResponse.json({
      ok: true,
      analysis: analysisText,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
