import { useState, useEffect } from 'react';
import type {
  TaigaProjectOption,
  TaigaMilestoneOption,
  TaigaStory,
  TaigaTask,
} from './types';

export function useTaigaMeta() {
  const [taigaProjects, setTaigaProjects] = useState<TaigaProjectOption[]>([]);
  const [selectedTaigaProject, setSelectedTaigaProject] = useState<string>('');
  const [taigaMilestones, setTaigaMilestones] = useState<TaigaMilestoneOption[]>([]);
  const [selectedTaigaSprint, setSelectedTaigaSprint] = useState<string>('');
  const [taigaBaseUrl, setTaigaBaseUrl] = useState<string>('');
  const [loadingTaiga, setLoadingTaiga] = useState(false);

  const [userStories, setUserStories] = useState<TaigaStory[]>([]);
  const [tasks, setTasks] = useState<TaigaTask[]>([]);
  const [selectedStoryRef, setSelectedStoryRef] = useState<number | ''>('');
  const [selectedTaskRef, setSelectedTaskRef] = useState<number | ''>('');

  const loadTaigaMeta = async (projSlug?: string, spSlug?: string) => {
    setLoadingTaiga(true);
    try {
      const q = new URLSearchParams();
      if (projSlug) q.set('project', projSlug);
      if (spSlug) q.set('sprint', spSlug);
      const res = await fetch(`/api/taiga/meta?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.projects)) setTaigaProjects(data.projects);
        if (data?.project?.slug) setSelectedTaigaProject(data.project.slug);
        if (Array.isArray(data?.milestones)) setTaigaMilestones(data.milestones);
        if (data?.baseUrl) setTaigaBaseUrl(data.baseUrl);
        const activeSprint =
          spSlug !== undefined
            ? spSlug
            : data?.sprint?.slug || data?.milestones?.[0]?.slug || 'backlog';
        setSelectedTaigaSprint(activeSprint);
        setUserStories(Array.isArray(data?.userStories) ? data.userStories : []);
        setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
      }
    } catch {
      // Fallback silently
    } finally {
      setLoadingTaiga(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function initTaiga() {
      setLoadingTaiga(true);
      try {
        const res = await fetch('/api/taiga/meta');
        if (res.ok && !ignore) {
          const data = await res.json();
          setTaigaBaseUrl(data?.baseUrl || '');
          if (Array.isArray(data?.projects)) setTaigaProjects(data.projects);
          if (data?.project?.slug) setSelectedTaigaProject(data.project.slug);
          if (Array.isArray(data?.milestones)) setTaigaMilestones(data.milestones);
          const activeSprint = data?.sprint?.slug || data?.milestones?.[0]?.slug || 'backlog';
          setSelectedTaigaSprint(activeSprint);
          setUserStories(Array.isArray(data?.userStories) ? data.userStories : []);
          setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
        }
      } catch {
        // Fallback silently
      } finally {
        if (!ignore) setLoadingTaiga(false);
      }
    }
    initTaiga();
    return () => {
      ignore = true;
    };
  }, []);

  const handleTaigaProjectChange = (slug: string) => {
    setSelectedTaigaProject(slug);
    setSelectedTaigaSprint('');
    setSelectedStoryRef('');
    setSelectedTaskRef('');
    loadTaigaMeta(slug, undefined);
  };

  const handleTaigaSprintChange = (sprintSlug: string) => {
    setSelectedTaigaSprint(sprintSlug);
    setSelectedStoryRef('');
    setSelectedTaskRef('');
    loadTaigaMeta(selectedTaigaProject, sprintSlug);
  };

  const handleStoryChange = (val: string) => {
    setSelectedStoryRef(val ? Number(val) : '');
    setSelectedTaskRef('');
  };

  const handleTaskChange = (val: string) => {
    const taskRef = val ? Number(val) : '';
    setSelectedTaskRef(taskRef);
    if (taskRef) {
      const found = tasks.find((t) => t.ref === taskRef);
      if (found?.userStoryRef && !selectedStoryRef) {
        setSelectedStoryRef(found.userStoryRef);
      }
    }
  };

  return {
    taigaProjects,
    selectedTaigaProject,
    taigaMilestones,
    selectedTaigaSprint,
    taigaBaseUrl,
    loadingTaiga,
    userStories,
    tasks,
    selectedStoryRef,
    selectedTaskRef,
    handleTaigaProjectChange,
    handleTaigaSprintChange,
    handleStoryChange,
    handleTaskChange,
  };
}
