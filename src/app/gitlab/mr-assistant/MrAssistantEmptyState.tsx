import { FileCode } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export function MrAssistantEmptyState() {
  return (
    <EmptyState
      icon={<FileCode size={24} />}
      tone='blue'
      title='Belum Ada Draf MR yang Dibuat'
      description='Pilih project dan branch di sebelah kiri, lalu klik Generate untuk menyusun deskripsi MR secara otomatis.'
      className='flex-1'
    />
  );
}
