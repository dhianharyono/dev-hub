import type { PreReviewOutput, ReviewFinding } from '@/lib/ai-assistant';
import type { IncomingMRItem } from '@/app/api/gitlab/incoming-reviews/route';
import type {
  MRNoteItem,
  MRDiscussionItem,
  DiscussionNoteItem,
  DiffContext,
  DiffLineContext,
} from '@/app/api/gitlab/incoming-reviews/notes/route';

export type {
  IncomingMRItem,
  MRNoteItem,
  MRDiscussionItem,
  DiscussionNoteItem,
  DiffContext,
  DiffLineContext,
  PreReviewOutput,
  ReviewFinding,
};

export type ReviewScope = 'assigned' | 'all_team' | 'authored';
export type ReviewStatus = 'opened' | 'merged' | 'closed' | 'all';
export type ReviewToneMode = 'audit' | 'lgtm';
export type DetailTab = 'discussions' | 'ai_review';
