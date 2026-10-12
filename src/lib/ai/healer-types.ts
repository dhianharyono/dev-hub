import { z } from 'zod';

export const HealerSuggestionSchema = z.object({
  subject: z.string(),
  description: z.string(),
  activityDate: z.string(),
  startTime: z.string(),
  durationHours: z.number(),
  totalTimeSpentMinutes: z.number(),
  parentUserStoryId: z.number().nullable(),
  tags: z.array(z.string()),
});
export type HealerSuggestion = z.infer<typeof HealerSuggestionSchema>;

export const HealerResponseSchema = z.object({
  suggestions: z.array(HealerSuggestionSchema),
});

export interface HealerContext {
  date: string;
  missingHours: number;
  userStories: { id: number; ref: number; subject: string }[];
  commits?: { message: string; timestamp?: string; project?: string; url?: string }[];
  projectSlug?: string;
}

export const healerJsonSchema = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          subject: {
            type: 'string',
            description: 'Judul task diawali kata kerja, maksimal 90 karakter',
          },
          description: {
            type: 'string',
            description: 'Deskripsi singkat bullet points pekerjaan',
          },
          activityDate: {
            type: 'string',
            description: 'Tanggal dalam format YYYY-MM-DD',
          },
          startTime: {
            type: 'string',
            description: 'Jam mulai format HH:mm antara 08:00 s.d 16:00',
          },
          durationHours: {
            type: 'number',
            description: 'Durasi dalam jam desimal, misal 2.5 atau 4',
          },
          totalTimeSpentMinutes: {
            type: 'integer',
            description: 'Durasi dalam menit (durasi * 60)',
          },
          parentUserStoryId: {
            type: ['integer', 'null'],
            description: 'id user story yang cocok dari daftar atau null',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tag relevan seperti development, refactor, testing',
          },
        },
        required: [
          'subject',
          'description',
          'activityDate',
          'startTime',
          'durationHours',
          'totalTimeSpentMinutes',
          'parentUserStoryId',
          'tags',
        ],
      },
    },
  },
  required: ['suggestions'],
};
