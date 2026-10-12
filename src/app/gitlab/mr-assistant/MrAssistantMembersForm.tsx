import { useMemo } from 'react';
import { RotateCw, Sparkles, User, UserCheck } from 'lucide-react';
import type { GitLabMemberSummary } from '@/app/api/gitlab/members/route';
import { Select, type SelectOptionItem } from '@/components/Select';

interface MrAssistantMembersFormProps {
  members: GitLabMemberSummary[];
  loadingMembers: boolean;
  selectedAssigneeId: number | '' ;
  onSelectAssignee: (id: number | '') => void;
  selectedReviewerId: number | '';
  onSelectReviewer: (id: number | '') => void;
  selectedProjectId: number | '';
  onReloadMembers: () => void;
  error: string | null;
  loading: boolean;
  onGenerate: () => void;
}

export function MrAssistantMembersForm({
  members,
  loadingMembers,
  selectedAssigneeId,
  onSelectAssignee,
  selectedReviewerId,
  onSelectReviewer,
  selectedProjectId,
  onReloadMembers,
  error,
  loading,
  onGenerate,
}: MrAssistantMembersFormProps) {
  const assigneeOptions: SelectOptionItem[] = useMemo(
    () => [
      { value: '', label: 'Tanpa Assignee' },
      ...members.map((m) => ({
        value: m.id,
        label: `${m.name} (@${m.username})`,
      })),
    ],
    [members],
  );

  const reviewerOptions: SelectOptionItem[] = useMemo(
    () => [
      { value: '', label: 'Tanpa Reviewer' },
      ...members.map((m) => ({
        value: m.id,
        label: `${m.name} (@${m.username})`,
      })),
    ],
    [members],
  );

  return (
    <>
      {/* 6. Assignee & Reviewer GitLab */}
      <div className='grid grid-cols-2 gap-2.5'>
        {/* Assignee */}
        <div>
          <div className='row-between mb-1.5'>
            <label className='xs dim flex items-center gap-1 font-semibold'>
              <User size={13} className='text-primary' />
              <span>ASSIGNEE</span>
              {members.length > 0 && (
                <span className='xs dim font-normal'>
                  ({members.length})
                </span>
              )}
            </label>
            {loadingMembers ? (
              <span className='xs dim'>Memuat...</span>
            ) : members.length === 0 && selectedProjectId ? (
              <button
                type='button'
                onClick={onReloadMembers}
                className='btn btn-ghost px-1 h-auto text-[11px]'
                title='Muat ulang daftar member'
              >
                <RotateCw size={11} />
              </button>
            ) : null}
          </div>
          <Select
            value={selectedAssigneeId}
            options={assigneeOptions}
            onChange={(e) =>
              onSelectAssignee(
                e.target.value ? Number(e.target.value) : '',
              )
            }
            onValueChange={(val) =>
              onSelectAssignee(val ? Number(val) : '')
            }
            disabled={loadingMembers}
            placeholder={
              loadingMembers ? 'Memuat member...' : 'Pilih Assignee...'
            }
            className='w-full h-[38px] text-[13px]'
          />
        </div>

        {/* Reviewer */}
        <div>
          <div className='row-between mb-1.5'>
            <label className='xs dim flex items-center gap-1 font-semibold'>
              <UserCheck size={13} className='text-sky-500' />
              <span>REVIEWER</span>
              {members.length > 0 && (
                <span className='xs dim font-normal'>
                  ({members.length})
                </span>
              )}
            </label>
            {loadingMembers ? (
              <span className='xs dim'>Memuat...</span>
            ) : members.length === 0 && selectedProjectId ? (
              <button
                type='button'
                onClick={onReloadMembers}
                className='btn btn-ghost px-1 h-auto text-[11px]'
                title='Muat ulang daftar member'
              >
                <RotateCw size={11} />
              </button>
            ) : null}
          </div>
          <Select
            value={selectedReviewerId}
            options={reviewerOptions}
            onChange={(e) =>
              onSelectReviewer(
                e.target.value ? Number(e.target.value) : '',
              )
            }
            onValueChange={(val) =>
              onSelectReviewer(val ? Number(val) : '')
            }
            disabled={loadingMembers}
            placeholder={
              loadingMembers ? 'Memuat member...' : 'Pilih Reviewer...'
            }
            className='w-full h-[38px] text-[13px]'
          />
        </div>
      </div>

      {error && (
        <div className='alert alert-error px-3.5 py-2.5 text-[12.5px]'>
          {error}
        </div>
      )}

      <button
        type='button'
        className='btn btn-primary w-full h-[42px] text-[13.5px] font-semibold flex items-center justify-center gap-2 mt-1'
        disabled={loading}
        onClick={onGenerate}
      >
        {loading ? (
          <>
            <span className='spinner' />
            <span>Menganalisis Perubahan &amp; Menyusun MR...</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>Generate Deskripsi MR &amp; Release Note</span>
          </>
        )}
      </button>
    </>
  );
}
