import 'server-only';
import { runAiCompletion, extractJsonFromAiResponse } from './client';
import { getSettings } from '../settings';
import {
  HealerResponseSchema,
  healerJsonSchema,
  type HealerContext,
  type HealerSuggestion,
} from './healer-types';

export {
  HealerSuggestionSchema,
  type HealerSuggestion,
  type HealerContext,
} from './healer-types';

export async function healTimesheetGap(
  ctx: HealerContext,
): Promise<{ suggestions: HealerSuggestion[]; source: 'gemini' | 'fallback' }> {
  const s = getSettings();
  const missing = Math.max(0.5, Math.min(8, Number(ctx.missingHours) || 8));

  const hasAi = Boolean(s.aiApiKey || s.geminiApiKey || s.aiProvider === 'custom');
  if (!hasAi) {
    return { suggestions: fallbackHealer(ctx, missing), source: 'fallback' };
  }

  const lang =
    s.writingLanguage === 'en'
      ? 'English'
      : 'Bahasa Indonesia baku yang profesional';

  const system = `Kamu adalah asisten pengisian lembar kerja (timesheet) WAD untuk software engineer.
Aturan Wajib WAD:
- Jam kerja wajib harian adalah 08:00 sampai 17:00 (hari kerja).
- Total durasi tugas yang dihasilkan HARUS TEPAT mengisi kekurangan waktu sebesar ${missing.toFixed(1)} jam.
- Jika ada commit GitLab yang terdeteksi, JADIKAN SEBAGAI SUMBER UTAMA dalam merumuskan judul dan rincian tugas. Rangkum dan sesuaikan pesan commit (misalnya "feat(insight-v2): accommodate dynamic responsive height..." atau "feat(transition): configure dynamic urls...") menjadi judul task formal profesional yang diawali kata kerja aktif (misal: "Mengembangkan penyesuaian tinggi responsif grafik modul insight", "Konfigurasi dynamic URL pada modul transition").
- Jika kekurangan waktu <= 3 jam, buat 1 task spesifik yang merangkum pekerjaan commit tersebut. Jika > 3 jam, bagi menjadi 1-2 task logis (misalnya sesi implementasi pagi dan sesi review/testing siang).
- Waktu mulai (startTime) harus di antara rentang 08:00 sampai 17:00, format HH:mm (misal: "09:00" atau "13:30").
- Tulis dalam ${lang}. Awali subject dengan kata kerja aktif spesifik (mis. "Mengimplementasikan", "Memperbaiki", "Refactoring", "Menyusun skenario pengujian").
- Kaitkan dengan User Story yang paling cocok dari daftar jika ada.
- Jangan gunakan tanda hubung em dash di teks apa pun.`;

  const prompt = `Tanggal log: ${ctx.date}
Total jam yang harus dipenuhi: ${missing.toFixed(1)} jam.
Konteks Commit GitLab pada tanggal tersebut:
${
  ctx.commits && ctx.commits.length > 0
    ? ctx.commits.map((c) => `- [${c.project || 'Repo'}] ${c.message} (${c.timestamp || 'hari ini'})`).join('\n')
    : '(Tidak ada catatan commit langsung, gunakan konteks backlog sprint)'
}

Daftar User Story aktif di sprint:
${
  ctx.userStories.map((u) => `${u.id} | #${u.ref} | ${u.subject}`).join('\n') ||
  '(Kosong, buat task umum)'
}

Hasilkan draf task pengisi jam WAD dalam format JSON sesuai schema.`;

  try {
    const raw = await runAiCompletion({
      systemInstruction: system,
      prompt,
      temperature: 0.3,
      responseFormat: 'json',
      jsonSchema: healerJsonSchema,
    });

    const parsed = HealerResponseSchema.parse(JSON.parse(extractJsonFromAiResponse(raw)));
    const validStoryIds = new Set(ctx.userStories.map((u) => u.id));
    return {
      source: 'gemini',
      suggestions: parsed.suggestions.map((sug) => ({
        ...sug,
        activityDate: ctx.date,
        totalTimeSpentMinutes: Math.round(sug.durationHours * 60),
        parentUserStoryId:
          sug.parentUserStoryId && validStoryIds.has(sug.parentUserStoryId)
            ? sug.parentUserStoryId
            : ctx.userStories[0]?.id ?? null,
      })),
    };
  } catch (err) {
    console.error('[AI Healer] Parse schema error, falling back:', err);
    return { suggestions: fallbackHealer(ctx, missing), source: 'fallback' };
  }
}

export function fallbackHealer(ctx: HealerContext, missingHours: number): HealerSuggestion[] {
  const roundedHours = Math.round(missingHours * 2) / 2;
  const parentStory = ctx.userStories[0];

  // If commits exist, formulate tasks directly reflecting the commits!
  if (ctx.commits && ctx.commits.length > 0) {
    const cleanCommits = ctx.commits.map((c) => {
      // Strip conventional commit prefix like feat(...): or fix:
      let msg = c.message.replace(/^(feat|fix|refactor|chore|docs|test|perf|style|ci|build)(\([^)]+\))?:\s*/i, '');
      msg = msg.charAt(0).toUpperCase() + msg.slice(1);
      return msg;
    });

    if (roundedHours <= 3 || cleanCommits.length === 1) {
      return [
        {
          subject: `Implementasi: ${cleanCommits[0].slice(0, 75)}`,
          description: `- Berdasarkan commit GitLab hari ini\n- ${cleanCommits.slice(0, 3).map((m) => `Pengerjaan ${m}`).join('\n- ')}`,
          activityDate: ctx.date,
          startTime: '09:00',
          durationHours: roundedHours,
          totalTimeSpentMinutes: Math.round(roundedHours * 60),
          parentUserStoryId: parentStory?.id ?? null,
          tags: ['development', 'gitlab'],
        },
      ];
    }

    const h1 = Math.round((roundedHours / 2) * 2) / 2;
    const h2 = Math.round((roundedHours - h1) * 2) / 2;
    const mid = Math.ceil(cleanCommits.length / 2);
    const firstHalf = cleanCommits.slice(0, mid);
    const secondHalf = cleanCommits.slice(mid);

    return [
      {
        subject: `Implementasi: ${firstHalf[0]?.slice(0, 75) || 'Pengembangan fitur dan logic'}`,
        description: `- Berdasarkan commit GitLab sesi pagi\n- ${firstHalf.slice(0, 2).map((m) => `Pengerjaan ${m}`).join('\n- ')}`,
        activityDate: ctx.date,
        startTime: '08:30',
        durationHours: h1,
        totalTimeSpentMinutes: Math.round(h1 * 60),
        parentUserStoryId: parentStory?.id ?? null,
        tags: ['development', 'gitlab'],
      },
      {
        subject: `Pengujian dan integrasi: ${secondHalf[0]?.slice(0, 75) || cleanCommits[0]?.slice(0, 75)}`,
        description: `- Verifikasi, code refinement, dan pengujian commit terkait\n- ${(secondHalf.length > 0 ? secondHalf : firstHalf).slice(0, 2).map((m) => `Verifikasi ${m}`).join('\n- ')}`,
        activityDate: ctx.date,
        startTime: '13:30',
        durationHours: h2,
        totalTimeSpentMinutes: Math.round(h2 * 60),
        parentUserStoryId: parentStory?.id ?? null,
        tags: ['testing', 'refactor'],
      },
    ];
  }

  if (roundedHours <= 4) {
    return [
      {
        subject: parentStory
          ? `Pengembangan dan pengujian modul ${parentStory.subject.slice(0, 45)}`
          : 'Refactoring modul dan perbaikan unit test',
        description:
          '- Melakukan pengecekan fungsionalitas dan integrasi API\n- Perbaikan penanganan error dan refactoring kode\n- Verifikasi hasil pengujian lokal',
        activityDate: ctx.date,
        startTime: '09:00',
        durationHours: roundedHours,
        totalTimeSpentMinutes: Math.round(roundedHours * 60),
        parentUserStoryId: parentStory?.id ?? null,
        tags: ['development', 'refactor'],
      },
    ];
  }

  const h1 = Math.round((roundedHours / 2) * 2) / 2;
  const h2 = roundedHours - h1;

  return [
    {
      subject: parentStory
        ? `Implementasi fitur ${parentStory.subject.slice(0, 40)} bagian 1`
        : 'Pengembangan arsitektur komponen dan penyesuaian endpoint',
      description:
        '- Analisis requirement teknis dan struktur data\n- Penyusunan logic inti dan validasi schema payload',
      activityDate: ctx.date,
      startTime: '08:30',
      durationHours: h1,
      totalTimeSpentMinutes: Math.round(h1 * 60),
      parentUserStoryId: parentStory?.id ?? null,
      tags: ['feature', 'backend'],
    },
    {
      subject: parentStory
        ? `Pengujian dan integrasi ${parentStory.subject.slice(0, 40)} bagian 2`
        : 'Penyusunan automated test dan dokumentasi API internal',
      description:
        '- Pembuatan test cases dan penanganan skenario edge cases\n- Dokumentasi endpoint dan penyesuaian feedback tim',
      activityDate: ctx.date,
      startTime: '13:30',
      durationHours: h2,
      totalTimeSpentMinutes: Math.round(h2 * 60),
      parentUserStoryId: parentStory?.id ?? null,
      tags: ['testing', 'docs'],
    },
  ];
}
