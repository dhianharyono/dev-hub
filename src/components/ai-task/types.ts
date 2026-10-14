import type { IncomingMRItem, PreReviewOutput, ReviewToneMode } from '@/app/gitlab/reviews/types';

export type AiTaskType =
  | 'mr_review'
  | 'mr_assistant'
  | 'pre_review'
  | 'smart_task'
  | 'gap_healer'
  | 'general';

export type AiTaskStatus = 'running' | 'completed' | 'error' | 'cancelled';

export interface AiTask<TResult = unknown> {
  id: string;
  type: AiTaskType;
  title: string;
  subtitle?: string;
  status: AiTaskStatus;
  stepText: string;
  progressPercent: number;
  startedAt: number;
  completedAt?: number;
  result?: TResult;
  error?: string;
  isMinimized: boolean;
  params?: {
    mr?: IncomingMRItem;
    toneMode?: ReviewToneMode;
    projectId?: number | string;
    branch?: string;
    targetBranch?: string;
    date?: string;
    input?: string;
    [key: string]: unknown;
  };
  restoreUrl?: string;
  restoreAction?: string;
}

export interface MrReviewTaskParams {
  mr: IncomingMRItem;
  toneMode: ReviewToneMode;
}
