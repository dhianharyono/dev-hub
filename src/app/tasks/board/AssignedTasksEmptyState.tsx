'use client';

import React from 'react';
import {
  CheckCircle2,
  FolderKanban,
  ListFilter,
  RotateCcw,
  SearchX,
  Sparkles,
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

interface AssignedTasksEmptyStateProps {
  assignedActiveOnly: boolean;
  setAssignedActiveOnly: (val: boolean) => void;
  onRefresh: (activeOnly: boolean) => void;
  onNavigateToStudio?: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  selectedProject?: number | 'all';
  onResetProject?: () => void;
  hasAnyTasks?: boolean;
}

export function AssignedTasksEmptyState({
  assignedActiveOnly,
  setAssignedActiveOnly,
  onRefresh,
  onNavigateToStudio,
  searchQuery = '',
  onClearSearch,
  selectedProject = 'all',
  onResetProject,
  hasAnyTasks = false,
}: AssignedTasksEmptyStateProps) {
  // Case 1: Filter pencarian aktif tetapi tidak ada hasil yang cocok
  if (searchQuery.trim().length > 0) {
    return (
      <EmptyState
        tone='blue'
        icon={<SearchX size={26} strokeWidth={2.2} />}
        title='Task Tidak Ditemukan'
        description={`Tidak ada task yang cocok dengan kata kunci "${searchQuery}". Silakan periksa kembali ejaan atau reset filter.`}
        action={
          onClearSearch && (
            <button
              type='button'
              className='btn btn-sm text-[12.5px] gap-1.5'
              onClick={onClearSearch}
            >
              <RotateCcw size={13} />
              <span>Reset Filter Pencarian</span>
            </button>
          )
        }
      />
    );
  }

  // Case 2: Filter proyek spesifik dipilih tetapi tidak ada task pada proyek tersebut
  if (selectedProject !== 'all') {
    return (
      <EmptyState
        tone='blue'
        icon={<SearchX size={26} strokeWidth={2.2} />}
        title='Tidak Ada Task di Proyek Ini'
        description='Tidak ditemukan task yang ditugaskan ke Anda pada proyek yang dipilih saat ini.'
        action={
          onResetProject && (
            <button
              type='button'
              className='btn btn-sm text-[12.5px] gap-1.5'
              onClick={onResetProject}
            >
              <ListFilter size={13} />
              <span>Tampilkan Semua Proyek</span>
            </button>
          )
        }
      />
    );
  }

  // Case 3: Filter Task Aktif Saja menyala dan semua tugas aktif sudah selesai (Kasus Gambar 1)
  if (assignedActiveOnly && hasAnyTasks) {
    return (
      <EmptyState
        tone='emerald'
        badge='100% On-Track'
        icon={<CheckCircle2 size={26} strokeWidth={2.2} />}
        title='Semua Task Aktif Telah Selesai'
        description='Luar biasa! Tidak ada tiket aktif yang tertunda atau dalam proses saat ini. Seluruh tugas Anda telah tuntas diselesaikan.'
        action={
          <>
            <button
              type='button'
              className='btn btn-sm text-[12.5px] gap-1.5'
              onClick={() => {
                setAssignedActiveOnly(false);
                onRefresh(false);
              }}
            >
              <ListFilter size={13} />
              <span>Tampilkan Riwayat Task Selesai</span>
            </button>
            {onNavigateToStudio && (
              <button
                type='button'
                className='btn btn-sm btn-primary text-[12.5px] gap-1.5'
                onClick={onNavigateToStudio}
              >
                <Sparkles size={13} />
                <span>Input Task Baru di Studio</span>
              </button>
            )}
          </>
        }
      />
    );
  }

  // Case 4: Akun baru atau belum ada task sama sekali
  return (
    <EmptyState
      tone='blue'
      icon={<FolderKanban size={26} strokeWidth={2.2} />}
      title='Belum Ada Task yang Ditugaskan'
      description='Saat ini belum ada task Taiga yang di-assign ke akun Anda. Mulai tambahkan catatan kerja di Studio untuk membuat User Story baru.'
      action={
        onNavigateToStudio && (
          <button
            type='button'
            className='btn btn-sm btn-primary text-[12.5px] gap-1.5'
            onClick={onNavigateToStudio}
          >
            <Sparkles size={13} />
            <span>Input Task Baru di Studio</span>
          </button>
        )
      }
    />
  );
}
