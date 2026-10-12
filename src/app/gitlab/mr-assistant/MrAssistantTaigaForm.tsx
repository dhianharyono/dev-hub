import { Calendar, FolderKanban, BookOpen, CheckSquare, ExternalLink } from 'lucide-react';
import { Select } from '@/components/Select';
import type {
  TaigaProjectOption,
  TaigaMilestoneOption,
  TaigaStory,
  TaigaTask,
} from './types';

interface MrAssistantTaigaFormProps {
  taigaProjects: TaigaProjectOption[];
  selectedTaigaProject: string;
  onSelectTaigaProject: (slug: string) => void;
  taigaMilestones: TaigaMilestoneOption[];
  selectedTaigaSprint: string;
  onSelectTaigaSprint: (slug: string) => void;
  taigaBaseUrl: string;
  loadingTaiga: boolean;
  userStories: TaigaStory[];
  selectedStoryRef: number | '';
  onSelectStory: (ref: string) => void;
  tasks: TaigaTask[];
  selectedTaskRef: number | '';
  onSelectTask: (ref: string) => void;
}

export function MrAssistantTaigaForm({
  taigaProjects,
  selectedTaigaProject,
  onSelectTaigaProject,
  taigaMilestones,
  selectedTaigaSprint,
  onSelectTaigaSprint,
  taigaBaseUrl,
  loadingTaiga,
  userStories,
  selectedStoryRef,
  onSelectStory,
  tasks,
  selectedTaskRef,
  onSelectTask,
}: MrAssistantTaigaFormProps) {
  const selectedStory = selectedStoryRef
    ? userStories.find((u) => u.ref === selectedStoryRef)
    : null;
  const storyTasks = selectedStory
    ? tasks.filter(
        (t) =>
          t.userStoryRef === selectedStory.ref ||
          (selectedStory.id && t.userStoryId === selectedStory.id),
      )
    : [];

  return (
    <>
      {/* 3. Pilihan Project Taiga & Sprint / Taskboard */}
      <div className='grid grid-cols-2 gap-2.5'>
        {/* Project Taiga */}
        <div>
          <div className='row-between mb-1.5'>
            <label className='xs dim flex items-center gap-1 font-semibold'>
              <FolderKanban size={13} className='text-amber-500' />
              <span>PROJECT TAIGA</span>
            </label>
            {loadingTaiga && <span className='xs dim'>...</span>}
          </div>

          <Select
            value={selectedTaigaProject}
            onChange={(e) => onSelectTaigaProject(e.target.value)}
            disabled={loadingTaiga}
            className='w-full h-[38px] text-[13px]'
          >
            {taigaProjects.length === 0 ? (
              <option value=''>
                {loadingTaiga ? 'Memuat project...' : 'Tidak ada project Taiga'}
              </option>
            ) : (
              taigaProjects.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name}
                </option>
              ))
            )}
          </Select>
        </div>

        {/* Sprint / Taskboard */}
        <div>
          <div className='row-between mb-1.5'>
            <label className='xs dim flex items-center gap-1 font-semibold'>
              <Calendar size={13} className='text-sky-500' />
              <span>SPRINT / TASKBOARD</span>
            </label>
            {taigaBaseUrl && selectedTaigaProject && (
              <a
                href={`${taigaBaseUrl}/project/${selectedTaigaProject}/${selectedTaigaSprint === 'backlog' ? 'backlog' : `taskboard${selectedTaigaSprint ? `/${selectedTaigaSprint}` : ''}`}`}
                target='_blank'
                rel='noreferrer'
                className='row xs text-primary no-underline gap-1'
                title={selectedTaigaSprint === 'backlog' ? 'Buka backlog di Taiga' : 'Buka taskboard di Taiga'}
              >
                <ExternalLink size={11} />
              </a>
            )}
          </div>

          <Select
            value={selectedTaigaSprint}
            onChange={(e) => onSelectTaigaSprint(e.target.value)}
            disabled={loadingTaiga}
            className='w-full h-[38px] text-[13px]'
          >
            <option value='backlog'>Backlog</option>
            {taigaMilestones.map((m) => (
              <option key={m.id} value={m.slug}>
                {m.name} {m.closed ? '(Closed)' : ''}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* 4. Pemilihan User Story Taiga */}
      <div>
        <div className='row-between mb-1.5'>
          <label className='xs dim flex items-center gap-1.5 font-semibold'>
            <BookOpen size={13} className='text-amber-500' />
            <span>PILIH USER STORY TAIGA</span>
          </label>
          {userStories.length > 0 && (
            <span className='xs dim'>
              {userStories.length} story tersedia
            </span>
          )}
        </div>
        <Select
          value={selectedStoryRef}
          onChange={(e) => onSelectStory(e.target.value)}
          disabled={loadingTaiga}
          className='w-full h-[38px] text-[13px]'
        >
          <option value=''>Tanpa User Story</option>
          {userStories.map((u) => (
            <option key={`story-${u.ref}`} value={u.ref}>
              [#{u.ref}] {u.subject}
            </option>
          ))}
        </Select>
      </div>

      {/* 5. Pemilihan Task Taiga */}
      <div>
        <div className='row-between mb-1.5'>
          <label className='xs dim flex items-center gap-1.5 font-semibold'>
            <CheckSquare size={13} className='text-emerald-500' />
            <span>PILIH TASK TAIGA</span>
          </label>
          {selectedStoryRef ? (
            <span className='xs dim'>
              {storyTasks.length > 0
                ? `${storyTasks.length} task tersedia di story ini`
                : '0 task di story ini'}
            </span>
          ) : (
            <span className='xs dim'>
              {tasks.length > 0
                ? `${tasks.length} task tersedia`
                : 'Tidak ada task'}
            </span>
          )}
        </div>
        <Select
          value={selectedTaskRef}
          onChange={(e) => onSelectTask(e.target.value)}
          disabled={
            loadingTaiga ||
            (selectedStoryRef ? storyTasks.length === 0 : tasks.length === 0)
          }
          className='w-full h-[38px] text-[13px]'
        >
          {selectedStoryRef ? (
            storyTasks.length === 0 ? (
              <option value=''>Tidak ada task pada User Story ini</option>
            ) : (
              <>
                <option value=''>Tanpa Task (Hanya User Story)</option>
                {storyTasks.map((t) => (
                  <option key={`task-${t.ref}`} value={t.ref}>
                    [#{t.ref}] {t.subject}
                  </option>
                ))}
              </>
            )
          ) : tasks.length === 0 ? (
            <option value=''>Tidak ada task tersedia</option>
          ) : (
            <>
              <option value=''>Pilih Task...</option>
              {tasks.map((t) => (
                <option key={`task-${t.ref}`} value={t.ref}>
                  [#{t.ref}] {t.subject}
                  {t.userStoryRef ? ` (Story #${t.userStoryRef})` : ''}
                </option>
              ))}
            </>
          )}
        </Select>
      </div>
    </>
  );
}
