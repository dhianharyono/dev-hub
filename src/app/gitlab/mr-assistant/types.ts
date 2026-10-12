export interface TaigaProjectOption {
  id: number;
  name: string;
  slug: string;
}

export interface TaigaMilestoneOption {
  id: number;
  name: string;
  slug: string;
  closed?: boolean;
}

export interface TaigaStory {
  id: number;
  ref: number;
  subject: string;
}

export interface TaigaTask {
  id: number;
  ref: number;
  subject: string;
  userStoryId: number | null;
  userStoryRef: number | null;
}

export interface MrResult {
  mrTitle: string;
  description: string;
  releaseNotes: string;
  source: 'gemini' | 'fallback';
}

export interface CreatedMr {
  id: number;
  iid: number;
  title: string;
  web_url: string;
  state: string;
}
