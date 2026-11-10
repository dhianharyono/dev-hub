export interface ReleaseNoteMr {
  iid: number;
  title: string;
  description: string;
  mergedAt: string;
  mergedAtLabel: string;
  author: string;
  webUrl: string;
  projectId: number;
  sourceBranch: string;
}

export interface ReleaseNoteCandidateGroup {
  name: string;
  mrs: Array<{ iid: number; reason: string }>;
}

export interface DbColumnChange {
  table: string;
  column: string;
}

export interface DbTypeChange {
  table: string;
  column: string;
  type: string;
}

export interface DbDefaultChange {
  table: string;
  column: string;
  value: string;
}

export interface DbImpact {
  tables: string[];
  columns: DbColumnChange[];
  defaultChanges: DbDefaultChange[];
  typeChanges: DbTypeChange[];
  /** Existing tables written by SQL in the diff (UPDATE/INSERT/DELETE), not new tables. */
  writeTables: string[];
  envVars: string[];
  sqlFiles: string[];
  hasDatabaseChanges: boolean;
}

export interface ReleaseNoteResult {
  title: string;
  mrIids: number[];
  deployAt: string;
  content: string;
  dbImpact: DbImpact;
  usedAi: boolean;
  targetBranch?: string;
}

export interface SavedReleaseNote {
  id: number;
  projectId: number;
  projectPath: string;
  releaseTitle: string;
  featureName: string;
  service: string;
  deployAt: string;
  mrIids: number[];
  content: string;
  targetBranch?: string | null;
  createdAt: string;
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  diff: string;
  newFile: boolean;
  deletedFile: boolean;
}
