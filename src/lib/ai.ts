import "server-only";
import { runAiCompletion, extractJsonFromAiResponse } from "./ai/client";
import { z } from "zod";
import { getSettings } from "./settings";

export const TaskDraftSchema = z.object({
  kind: z.enum(["userstory", "task"]),
  subject: z.string(),
  description: z.string(),
  parentUserStoryId: z.number().nullable(),
  statusName: z.string().nullable(),
  estimateHours: z.number().nullable(),
  tags: z.array(z.string()),
});
export type TaskDraft = z.infer<typeof TaskDraftSchema>;

const ResponseSchema = z.object({ items: z.array(TaskDraftSchema) });

const jsonSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["userstory", "task"], description: "userstory = item baru level user story; task = sub-task di bawah user story yang sudah ada" },
          subject: { type: "string", description: "Judul ringkas maks 90 karakter. Untuk daily standup WAJIB '[Meeting] Daily Standup DD/MM'. Untuk semua meeting WAJIB diawali '[Meeting] '. Untuk task teknis diawali kata kerja." },
          description: { type: "string", description: "Deskripsi singkat dalam markdown: konteks + poin-poin pekerjaan / acceptance criteria" },
          parentUserStoryId: { type: ["integer", "null"], description: "id user story induk dari daftar yang diberikan (wajib jika kind=task dan ada yang cocok), selain itu null" },
          statusName: { type: ["string", "null"], description: "nama status dari daftar status jika user menyebut progres (mis. selesai, sedang dikerjakan), selain itu null" },
          estimateHours: { type: ["number", "null"], description: "estimasi jam jika disebut user" },
          tags: { type: "array", items: { type: "string" }, description: "Selalu array kosong []" },
        },
        required: ["kind", "subject", "description", "parentUserStoryId", "statusName", "estimateHours", "tags"],
      },
    },
  },
  required: ["items"],
};

export interface ParseContext {
  mode: "auto" | "userstory" | "task";
  defaultParentId?: number | null;
  userStories: { id: number; ref: number; subject: string }[];
  statuses: string[];
}

import { formatTaskSubject } from "./task-utils";
export { formatTaskSubject };

export async function parseTasks(input: string, ctx: ParseContext): Promise<{ items: TaskDraft[]; source: "gemini" | "fallback" }> {
  const s = getSettings();
  const hasAi = Boolean(s.aiApiKey || s.geminiApiKey || s.aiProvider === "custom");
  if (!hasAi) return { items: fallbackParse(input, ctx), source: "fallback" };

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const todayFormatted = `${dd}/${mm}`;

  const lang = s.writingLanguage === "en" ? "English" : "Bahasa Indonesia baku yang profesional";
  const modeRule =
    ctx.mode === "userstory"
      ? "Semua item WAJIB kind=userstory."
      : ctx.mode === "task"
        ? `Semua item WAJIB kind=task.${ctx.defaultParentId ? ` Gunakan parentUserStoryId=${ctx.defaultParentId} kecuali jelas lebih cocok ke user story lain.` : " Pilih parentUserStoryId yang paling cocok."}`
        : "Gunakan kind=task bila pekerjaan jelas termasuk salah satu user story yang ada; selain itu kind=userstory (aktivitas harian baru).";

  const system = `Kamu adalah asisten project manager untuk seorang software engineer.
Tugasmu mengubah catatan kerja informal (bisa campur bahasa, singkatan, typo) menjadi item Taiga yang rapi.

Aturan Penting:
- PENTING TENTANG MULTI-TASK: Jika catatan berisi lebih dari satu pekerjaan (misalnya dipisahkan baris baru, nomor urut 1/2/3, bullet -, titik koma, atau alur waktu seperti 'pagi...', 'lanjut...', 'sore...'), PECAH MENJADI ITEM-ITEM TERPISAH (1 pekerjaan = 1 item di array 'items'). Jangan pernah menggabungkan beberapa pekerjaan berbeda ke dalam 1 subject!
- ATURAN FORMAT JUDUL (SUBJECT):
  1. Khusus untuk Daily Standup, format judul WAJIB PERSIS: "[Meeting] Daily Standup ${todayFormatted}" (atau tanggal DD/MM jika user menyebut tanggal spesifik). Jangan gunakan format lain!
  2. Semua jenis meeting / rapat / sync / briefing / retro / planning / grooming WAJIB diawali dengan prefix "[Meeting] ". Contoh: "[Meeting] Sprint Planning", "[Meeting] Sync arsitektur backend", "[Meeting] Koordinasi Payment Gateway".
  3. Untuk pekerjaan teknis/non-meeting, awali kata kerja aktif (mis. "Memperbaiki", "Mengimplementasikan", "Melakukan review", "Menyusun"), spesifik, ringkas, tanpa titik di akhir.
- ATURAN TAG:
  * JANGAN tambahkan tag apa pun (user tidak menggunakan tag). Field 'tags' WAJIB selalu berupa array kosong [].
- Tulis dalam ${lang}. Pertahankan istilah teknis (API, endpoint, MR, deploy, DAG, dsb) dan nama sistem apa adanya.
- Description: 1 kalimat konteks + 2-4 bullet "- " berisi langkah/hasil yang diharapkan. Jika ada estimasi waktu, tulis juga "Estimasi: X jam".
- ${modeRule}
- parentUserStoryId hanya boleh berisi id dari daftar user story di bawah.
- statusName hanya boleh berisi salah satu dari daftar status, atau null.`;

  const prompt = `Daftar user story di sprint aktif (id | #ref | subject):
${ctx.userStories.map((u) => `${u.id} | #${u.ref} | ${u.subject}`).join("\n") || "(kosong)"}

Daftar status: ${ctx.statuses.join(", ") || "(default)"}

Catatan kerja yang harus dipecah menjadi item-item task/US:
"""
${input}
"""`;

  try {
    const rawText = await runAiCompletion({
      systemInstruction: system,
      prompt,
      temperature: 0.3,
      responseFormat: "json",
      jsonSchema,
    });

    const parsed = ResponseSchema.parse(JSON.parse(extractJsonFromAiResponse(rawText)));
    const validIds = new Set(ctx.userStories.map((u) => u.id));
    return {
      source: "gemini",
      items: parsed.items.map((it) => ({
        ...it,
        subject: formatTaskSubject(it.subject, todayFormatted),
        tags: [],
        parentUserStoryId: it.parentUserStoryId && validIds.has(it.parentUserStoryId) ? it.parentUserStoryId : it.kind === "task" ? (ctx.defaultParentId ?? null) : null,
        statusName: it.statusName && ctx.statuses.includes(it.statusName) ? it.statusName : null,
      })),
    };
  } catch (err) {
    console.error("[AI Parse] AI invocation failed, falling back to manual parse:", err);
    return { items: fallbackParse(input, ctx), source: "fallback" };
  }
}

/** Used when no Gemini key is configured: one item per line / sentence, cleanly cleaned. */
export function fallbackParse(input: string, ctx: Pick<ParseContext, "mode" | "defaultParentId">): TaskDraft[] {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const todayFormatted = `${dd}/${mm}`;

  return input
    .split(/\r?\n|;|(?:,\s*(?=(?:fix|buat|bikin|review|deploy|meeting|refactor|update|test|analisis|kerjakan|sync|daily|standup)\b))/i)
    .map((l) => l.replace(/^[\s\-*•\d.)\]>]+/, "").trim())
    .filter((l) => l.length > 2)
    .map((l) => {
      const est = l.match(/(\d+(?:[.,]\d+)?)\s*(?:jam|j|h|hours?)\b/i);
      const clean = l.replace(/\(?\s*\d+(?:[.,]\d+)?\s*(?:jam|j|h|hours?)\b\s*\)?/i, "").trim();
      const subject = clean.charAt(0).toUpperCase() + clean.slice(1);
      const kind: TaskDraft["kind"] = ctx.mode === "task" ? "task" : "userstory";
      return {
        kind,
        subject: formatTaskSubject(subject.slice(0, 90), todayFormatted),
        description: est ? `Estimasi: ${est[1].replace(",", ".")} jam` : "",
        parentUserStoryId: kind === "task" ? (ctx.defaultParentId ?? null) : null,
        statusName: null,
        estimateHours: est ? Number(est[1].replace(",", ".")) : null,
        tags: [],
      };
    });
}

export async function weeklySummary(data: unknown): Promise<string> {
  const s = getSettings();
  const hasAi = Boolean(s.aiApiKey || s.geminiApiKey || s.aiProvider === "custom");
  if (!hasAi) throw new Error("API Key AI belum diatur di Settings DEV HUB.");

  try {
    return await runAiCompletion({
      systemInstruction: `Kamu menulis laporan mingguan singkat seorang software engineer untuk atasan, dalam ${s.writingLanguage === "en" ? "English" : "Bahasa Indonesia profesional"}.
Format markdown: **Highlight** (3-5 bullet hasil utama), **Detail Pekerjaan** (dikelompokkan per proyek), **Metrik** (angka penting), **Rencana / Kendala** (jika bisa disimpulkan, jika tidak tulis "-").
Ringkas, faktual, jangan mengarang.`,
      prompt: `Buat ringkasan kerja mingguan dari data berikut (JSON):\n${JSON.stringify(data)}`,
      temperature: 0.5,
    });
  } catch (e) {
    console.error("[AI Summary] Invocation failed:", (e as Error).message);
    return "";
  }
}
