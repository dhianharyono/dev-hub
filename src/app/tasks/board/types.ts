import type { AssignedTaskItem } from '@/app/api/taiga/assigned/route';

export interface Status {
  id: number;
  name: string;
  color: string;
  is_closed: boolean;
}

export interface AssignedTasksBoardProps {
  assignedTasks: AssignedTaskItem[];
  setAssignedTasks: React.Dispatch<React.SetStateAction<AssignedTaskItem[]>>;
  projectStatuses: Record<number, Status[]>;
  assignedProjects: { id: number; name: string; slug: string }[];
  loadingAssigned: boolean;
  assignedError: string | null;
  assignedActiveOnly: boolean;
  setAssignedActiveOnly: (activeOnly: boolean) => void;
  onRefresh: (activeOnly?: boolean) => void;
  baseUrl?: string;
  onNavigateToStudio?: () => void;
}

export interface ProjectTaskGroup {
  projectId: number;
  projectName: string;
  projectSlug: string;
  tasks: AssignedTaskItem[];
}
