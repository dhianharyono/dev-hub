import { FileCode2 } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export function PreReviewEmptyState() {
  return (
    <EmptyState
      icon={<FileCode2 size={24} />}
      tone='emerald'
      title='Belum Ada Hasil Audit'
      description='Pilih project dan branch yang ingin diperiksa di panel sebelah kiri, lalu klik tombol Audit untuk menjalankan pemeriksaan otomatis.'
      className='flex-1'
    />
  );
}
