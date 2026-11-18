'use client';

import { Plus, Trash2 } from 'lucide-react';
import { TASK_TEMPLATES, type DeploymentTask } from '@/lib/release-deployment/model';

interface TaskChecklistProps {
  tasks: DeploymentTask[];
  onAddTemplate: (label: string) => void;
  onAddManual: () => void;
  onChange: (id: string, subject: string) => void;
  onRemove: (id: string) => void;
}

export function TaskChecklist({
  tasks,
  onAddTemplate,
  onAddManual,
  onChange,
  onRemove,
}: TaskChecklistProps) {
  return (
    <div>
      <p className='hint mb-2'>
        Klik chip untuk menambah task ke daftar. Task dari chip diberi badge
        TEMPLATE.
      </p>

      <div className='flex flex-wrap gap-2 mb-3'>
        {TASK_TEMPLATES.map((template) => (
          <button
            key={template.key}
            type='button'
            onClick={() => onAddTemplate(template.label)}
            className='inline-flex items-center gap-1 rounded-full border border-dashed border-brand px-3.5 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand-light'
          >
            <Plus size={12} />
            {template.label}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <p className='rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-slate-400'>
          Belum ada task. Tambahkan dari chip atau tombol task manual.
        </p>
      ) : (
        <ul className='space-y-2'>
          {tasks.map((task, index) => (
            <li key={task.id} className='flex items-center gap-2.5'>
              <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light text-[11px] font-bold text-brand'>
                {index + 1}
              </span>
              <input
                type='text'
                value={task.subject}
                onChange={(event) => onChange(task.id, event.target.value)}
                placeholder='Nama task deployment...'
                aria-label={`Task ${index + 1}`}
                className='input !h-9 flex-1 text-[13px]'
              />
              {task.template && (
                <span className='shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700'>
                  TEMPLATE
                </span>
              )}
              <button
                type='button'
                onClick={() => onRemove(task.id)}
                aria-label={`Hapus task ${index + 1}`}
                className='btn btn-ghost btn-icon !h-8 !w-8 shrink-0 text-slate-400 hover:text-rose-600'
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type='button'
        onClick={onAddManual}
        className='btn btn-ghost btn-sm mt-3 text-brand'
      >
        <Plus size={14} />
        Tambah task manual
      </button>
    </div>
  );
}
