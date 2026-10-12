import { NextResponse } from 'next/server';
import { gl } from '@/lib/gitlab';
import { errorResponse } from '@/lib/http';
import { extractDiffSnippet, type DiffContext, type DiffLineContext } from '@/lib/diff-parser';

export const dynamic = 'force-dynamic';

export type { DiffContext, DiffLineContext };

export interface DiscussionNoteItem {
  id: number;
  type: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  system: boolean;
  resolvable: boolean;
  resolved: boolean;
  resolvedBy?: {
    id: number;
    username: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  resolvedAt?: string | null;
  author: {
    id: number;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
  position?: {
    oldPath?: string;
    newPath?: string;
    oldLine?: number | null;
    newLine?: number | null;
  } | null;
}

export interface MRDiscussionItem {
  id: string;
  individualNote: boolean;
  resolved: boolean;
  resolvedBy?: {
    id: number;
    username: string;
    name: string;
  } | null;
  resolvedAt?: string | null;
  diffContext?: DiffContext | null;
  notes: DiscussionNoteItem[];
}

export type MRNoteItem = DiscussionNoteItem;

interface GLChangeRaw {
  old_path: string;
  new_path: string;
  diff: string;
}

interface GLNoteRaw {
  id: number;
  type?: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  system: boolean;
  resolvable?: boolean;
  resolved?: boolean;
  resolved_by?: {
    id: number;
    username: string;
    name: string;
    avatar_url: string | null;
  } | null;
  resolved_at?: string | null;
  author: {
    id: number;
    username: string;
    name: string;
    avatar_url: string | null;
  };
  position?: {
    old_path?: string;
    new_path?: string;
    old_line?: number | null;
    new_line?: number | null;
  } | null;
}

interface GLDiscussionRaw {
  id: string;
  individual_note: boolean;
  notes: GLNoteRaw[];
}

function mapNote(n: GLNoteRaw): DiscussionNoteItem {
  return {
    id: n.id,
    type: n.type || null,
    body: n.body,
    createdAt: n.created_at,
    updatedAt: n.updated_at,
    system: Boolean(n.system),
    resolvable: Boolean(n.resolvable),
    resolved: Boolean(n.resolved),
    resolvedBy: n.resolved_by
      ? {
          id: n.resolved_by.id,
          username: n.resolved_by.username,
          name: n.resolved_by.name,
          avatarUrl: n.resolved_by.avatar_url || null,
        }
      : null,
    resolvedAt: n.resolved_at || null,
    author: {
      id: n.author?.id ?? 0,
      username: n.author?.username || 'unknown',
      name: n.author?.name || 'Unknown',
      avatarUrl: n.author?.avatar_url || null,
    },
    position: n.position
      ? {
          oldPath: n.position.old_path,
          newPath: n.position.new_path,
          oldLine: n.position.old_line,
          newLine: n.position.new_line,
        }
      : null,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const mrIid = url.searchParams.get('mrIid');

    if (!projectId || !mrIid) {
      return NextResponse.json(
        { ok: false, error: 'Parameter projectId dan mrIid wajib disertakan.' },
        { status: 400 },
      );
    }

    // Parallel fetch: discussions and changes
    const [rawDiscussionsResult, rawChangesResult] = await Promise.allSettled([
      gl<GLDiscussionRaw[]>(
        `/projects/${projectId}/merge_requests/${mrIid}/discussions?per_page=100`,
      ),
      gl<{ changes?: GLChangeRaw[] }>(
        `/projects/${projectId}/merge_requests/${mrIid}/changes`,
      ),
    ]);

    const rawDiscussions =
      rawDiscussionsResult.status === 'fulfilled' ? rawDiscussionsResult.value || [] : [];
    const changesMap = new Map<string, string>();

    if (rawChangesResult.status === 'fulfilled' && rawChangesResult.value?.changes) {
      for (const ch of rawChangesResult.value.changes) {
        if (ch.new_path && ch.diff) changesMap.set(ch.new_path, ch.diff);
        if (ch.old_path && ch.diff) changesMap.set(ch.old_path, ch.diff);
      }
    }

    const discussions: MRDiscussionItem[] = rawDiscussions.map((d) => {
      const mappedNotes = (d.notes || []).map(mapNote);
      const rootNote = mappedNotes[0];
      const resolvableNotes = mappedNotes.filter((n) => n.resolvable);
      const isResolved =
        resolvableNotes.length > 0 && resolvableNotes.every((n) => n.resolved);
      const firstResolved = mappedNotes.find((n) => n.resolved && n.resolvedBy);

      let diffContext: DiffContext | null = null;
      if (rootNote?.position) {
        const filePath = rootNote.position.newPath || rootNote.position.oldPath || '';
        const rawDiff = changesMap.get(filePath) || '';
        diffContext = extractDiffSnippet(
          rawDiff,
          filePath,
          rootNote.position.newLine,
          rootNote.position.oldLine,
        );
      }

      return {
        id: d.id,
        individualNote: Boolean(d.individual_note),
        resolved: isResolved,
        resolvedBy: firstResolved?.resolvedBy
          ? {
              id: firstResolved.resolvedBy.id,
              username: firstResolved.resolvedBy.username,
              name: firstResolved.resolvedBy.name,
            }
          : null,
        resolvedAt: firstResolved?.resolvedAt || null,
        diffContext,
        notes: mappedNotes,
      };
    });

    const flatNotes: MRNoteItem[] = discussions.flatMap((d) => d.notes);
    const userNotesCount = flatNotes.filter((n) => !n.system).length;

    return NextResponse.json({
      ok: true,
      discussions,
      notes: flatNotes,
      userNotesCount,
      totalCount: flatNotes.length,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
