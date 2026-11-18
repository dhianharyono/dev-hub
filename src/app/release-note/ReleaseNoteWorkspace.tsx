'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  RELEASE_TARGETS,
  buildStorySubject,
  deploymentTaskPayload,
  makeDeploymentTask,
  todayWib,
  type CreatedTask,
  type DeploymentTask,
  type ReleaseCreation,
  type ReleaseOptions,
  type ReleaseStoryForm,
} from '@/lib/release-deployment/model';
import { DeploymentFormStep } from './components/DeploymentFormStep';
import { ReleaseStepper } from './components/ReleaseStepper';
import { StoryFormStep } from './components/StoryFormStep';
import { UploadStep } from './components/UploadStep';

function initialForm(): ReleaseStoryForm {
  return {
    target: 'staging',
    squad: '',
    releaseDate: todayWib(),
    featureName: '',
    subject: '',
    description: '',
    assigneeId: null,
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function requestOptions(): Promise<ReleaseOptions> {
  const response = await fetch('/api/release-note/options');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? 'Gagal memuat data Taiga');
  }
  return data as ReleaseOptions;
}

export function ReleaseNoteWorkspace() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ReleaseStoryForm>(initialForm);
  const [subjectTouched, setSubjectTouched] = useState(false);
  const [tasks, setTasks] = useState<DeploymentTask[]>(() => [
    makeDeploymentTask('[FE] Deployment', true),
    makeDeploymentTask('[BE] Deployment', true),
  ]);
  const [options, setOptions] = useState<ReleaseOptions | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<ReleaseCreation | null>(null);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    setOptionsError(null);
    try {
      setOptions(await requestOptions());
    } catch (err) {
      setOptionsError(messageOf(err));
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    requestOptions()
      .then((data) => {
        if (ignore) return;
        setOptions(data);
        setOptionsError(null);
      })
      .catch((err) => {
        if (!ignore) setOptionsError(messageOf(err));
      })
      .finally(() => {
        if (!ignore) setOptionsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const filledTasks = useMemo(
    () => tasks.filter((task) => task.subject.trim()),
    [tasks],
  );

  const patchForm = useCallback(
    (patch: Partial<ReleaseStoryForm>) => {
      setCreated(null);
      setForm((previous) => {
        const next = { ...previous, ...patch };
        if (!subjectTouched) {
          next.subject = buildStorySubject(next);
        }
        return next;
      });
    },
    [subjectTouched],
  );

  const changeSubject = useCallback((subject: string) => {
    setCreated(null);
    setSubjectTouched(true);
    setForm((previous) => ({ ...previous, subject }));
  }, []);

  const addTemplate = useCallback((label: string) => {
    setCreated(null);
    setTasks((previous) =>
      previous.some((task) => task.subject === label)
        ? previous
        : [...previous, makeDeploymentTask(label, true)],
    );
  }, []);

  const addManual = useCallback(() => {
    setCreated(null);
    setTasks((previous) => [...previous, makeDeploymentTask('', false)]);
  }, []);

  const patchTask = useCallback(
    (id: string, changes: Partial<DeploymentTask>) => {
      setCreated(null);
      setTasks((previous) =>
        previous.map((task) =>
          task.id === id ? { ...task, ...changes } : task,
        ),
      );
    },
    [],
  );

  const removeTask = useCallback((id: string) => {
    setCreated(null);
    setTasks((previous) => previous.filter((task) => task.id !== id));
  }, []);

  function goToUpload() {
    const missing: string[] = [];
    if (!form.squad) missing.push('skuad');
    if (!form.releaseDate) missing.push('tanggal release');
    if (!form.featureName.trim()) missing.push('nama fitur');
    if (!form.subject.trim()) missing.push('judul user story');
    if (tasks.length === 0) missing.push('minimal satu task');
    if (tasks.some((task) => !task.subject.trim())) {
      missing.push('nama setiap task');
    }
    if (missing.length > 0) {
      setError(`Lengkapi dulu: ${missing.join(', ')}.`);
      return;
    }
    setError(null);
    setStep(2);
  }

  async function createInTaiga() {
    if (creating || created) return;
    if (!options) {
      setError('Data Taiga belum termuat. Muat ulang lalu coba lagi.');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const storyResponse = await fetch('/api/taiga/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: options.project.id,
          projectSlug: options.project.slug,
          items: [
            {
              kind: 'userstory',
              subject: form.subject.trim(),
              description: form.description,
              assignedTo: form.assigneeId,
              epicRef: RELEASE_TARGETS[form.target].epicRef,
            },
          ],
        }),
      });
      const storyData = await storyResponse.json();
      if (!storyResponse.ok) {
        throw new Error(storyData.error ?? 'Gagal membuat user story');
      }
      const storyResult = storyData.results?.[0];
      if (!storyResult?.ok) {
        throw new Error(storyResult?.error ?? 'Gagal membuat user story');
      }

      const story = {
        id: storyResult.id as number,
        ref: storyResult.ref as number,
        url: storyResult.url as string,
      };
      setCreated({ story, tasks: [] });

      if (filledTasks.length === 0) return;

      const taskResponse = await fetch('/api/taiga/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: options.project.id,
          projectSlug: options.project.slug,
          items: filledTasks.map((task) => ({
            kind: 'task',
            ...deploymentTaskPayload(task),
            userStoryId: story.id,
          })),
        }),
      });
      const taskData = await taskResponse.json();
      if (!taskResponse.ok) {
        throw new Error(
          `User story sudah dibuat, tetapi task gagal dibuat: ${
            taskData.error ?? 'kesalahan tidak diketahui'
          }`,
        );
      }
      const createdTasks: CreatedTask[] = (taskData.results ?? []).map(
        (item: {
          ok: boolean;
          subject: string;
          ref?: number;
          url?: string;
          error?: string;
        }) => ({
          subject: item.subject,
          ok: item.ok,
          ref: item.ref,
          url: item.url,
          error: item.error,
        }),
      );
      setCreated({ story, tasks: createdTasks });
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <header className='page-header'>
        <div>
          <div className='eyebrow'>Taiga · Deployment</div>
          <h1>Release Note</h1>
          <p>
            Susun user story dan task deployment, buat di Taiga, lalu isi form
            Deployment.
          </p>
        </div>
        <button
          type='button'
          className='btn btn-ghost btn-sm'
          onClick={() => void loadOptions()}
          disabled={optionsLoading}
        >
          {optionsLoading ? (
            <Loader2 size={14} className='animate-spin' />
          ) : (
            <RefreshCw size={14} />
          )}
          Muat ulang data Taiga
        </button>
      </header>

      <ReleaseStepper
        step={step}
        onSelect={(target) => {
          setError(null);
          setStep(target);
        }}
      />

      {step === 1 && (
        <StoryFormStep
          form={form}
          onChange={patchForm}
          onSubjectChange={changeSubject}
          members={options?.members ?? []}
          optionsLoading={optionsLoading}
          optionsError={optionsError}
          tasks={tasks}
          onAddTemplate={addTemplate}
          onAddManual={addManual}
          onTaskChange={patchTask}
          onRemoveTask={removeTask}
          error={error}
          onNext={goToUpload}
        />
      )}

      {step === 2 && (
        <UploadStep
          form={form}
          tasks={filledTasks}
          projectName={options?.project.name ?? ''}
          members={options?.members ?? []}
          creating={creating}
          error={error}
          created={created}
          onCreate={() => void createInTaiga()}
          onBack={() => {
            setError(null);
            setStep(1);
          }}
          onNext={() => {
            setError(null);
            setStep(3);
          }}
        />
      )}

      {step === 3 && created && (
        <DeploymentFormStep
          form={form}
          created={created}
          memberName={
            options?.members.find((member) => member.id === form.assigneeId)
              ?.name ?? ''
          }
          onBack={() => {
            setError(null);
            setStep(2);
          }}
        />
      )}
    </>
  );
}
