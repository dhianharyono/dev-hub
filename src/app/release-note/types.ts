export interface ReleaseNoteProjectOption {
  id: number;
  name: string;
  nameWithNamespace: string;
  pathWithNamespace: string;
  defaultBranch?: string;
  webUrl?: string;
  lastActivityAt?: string;
}

export interface ReleaseNoteResultDraft {
  title: string;
  mrIids: number[];
  deployAt: string;
  service: string;
  content: string;
  projectId: number;
  projectPath: string;
  targetBranch?: string;
  usedAi?: boolean;
}
