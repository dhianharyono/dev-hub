import type { ReleaseNoteDetail } from '@/lib/release-note/model';
import {
  SQUAD_OPTIONS,
  type CreatedTask,
  type ReleaseCreation,
  type ReleaseStoryForm,
} from './model';

/** Judul release note: [Squad] (dd/mm) Deployment Checklist <fitur>. */
const NOTE_SUBJECT_PATTERN =
  /^\s*\[([^\]]+)\]\s*(?:\(?\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*\)?)?\s*(.*)$/;

/** Singkatan skuad di judul release note. */
const SQUAD_ALIASES: Record<string, string> = {
  ct: 'Control Tower',
};

export interface ReleaseNoteSubjectParts {
  squad: string;
  day: number | null;
  month: number | null;
  featureName: string;
}

/** Pecah judul release note menjadi skuad, tanggal, dan nama fitur. */
export function parseReleaseNoteSubject(subject: string): ReleaseNoteSubjectParts {
  const match = NOTE_SUBJECT_PATTERN.exec(subject);
  if (!match) {
    return { squad: '', day: null, month: null, featureName: subject.trim() };
  }

  const [, squad, day, month, rest] = match;
  const dayNumber = day ? Number(day) : null;
  const monthNumber = month ? Number(month) : null;
  const featureName = rest
    .replace(/^deployment\s+checklist\s*:?\s*/i, '')
    .replace(/^deployment\s*:?\s*/i, '')
    .trim();

  return {
    squad: squad.trim(),
    day: dayNumber && dayNumber >= 1 && dayNumber <= 31 ? dayNumber : null,
    month: monthNumber && monthNumber >= 1 && monthNumber <= 12 ? monthNumber : null,
    featureName: featureName || subject.trim(),
  };
}

/** Samakan skuad dengan pilihan form; kosong bila tidak dikenal. */
export function canonicalSquad(squad: string): string {
  const text = squad.trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  const alias = SQUAD_ALIASES[lower];
  if (alias) return alias;
  return SQUAD_OPTIONS.find((option) => option.toLowerCase() === lower) ?? '';
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Tanggal release dari judul (dd/mm). Tahun mengikuti tanggal dibuat;
 * bila tanggal release jatuh jauh sebelum tanggal dibuat, dipakai tahun berikutnya.
 */
export function releaseDateFromSubject(
  parts: Pick<ReleaseNoteSubjectParts, 'day' | 'month'>,
  createdDate: string,
): string {
  if (!parts.day || !parts.month) return '';
  const created = new Date(createdDate);
  if (Number.isNaN(created.getTime())) return '';

  let year = created.getUTCFullYear();
  const candidate = Date.UTC(year, parts.month - 1, parts.day);
  const sixtyDays = 60 * 24 * 60 * 60 * 1000;
  if (candidate < created.getTime() - sixtyDays) {
    year += 1;
  }
  return `${year}-${twoDigits(parts.month)}-${twoDigits(parts.day)}`;
}

export interface DeploymentDraft {
  form: ReleaseStoryForm;
  created: ReleaseCreation;
}

/** Susun form deployment dari release note yang sudah ada. */
export function buildDeploymentDraft(note: ReleaseNoteDetail): DeploymentDraft {
  const parts = parseReleaseNoteSubject(note.subject);
  const tasks: CreatedTask[] = note.tasks.map((task) => ({
    subject: task.subject,
    ok: true,
    ref: task.ref,
    url: task.url,
  }));

  return {
    form: {
      target: note.source === 'Production' ? 'production' : 'staging',
      squad: canonicalSquad(parts.squad),
      releaseDate: releaseDateFromSubject(parts, note.createdDate),
      featureName: parts.featureName,
      subject: note.subject,
      description: note.description,
      assigneeId: null,
    },
    created: {
      story: { id: note.id, ref: note.ref, url: note.url },
      tasks,
    },
  };
}
