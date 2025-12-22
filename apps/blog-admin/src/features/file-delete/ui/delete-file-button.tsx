/**
 * File Delete Feature - Delete Button Component
 */

import { Trash2 } from 'lucide-react';
import type { BlobFile } from '@/entities/file';

interface DeleteFileButtonProps {
  file: BlobFile;
  onDelete: (file: BlobFile) => void;
}

export function DeleteFileButton({ file, onDelete }: DeleteFileButtonProps) {
  return (
    <button
      className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
      title="삭제"
      onClick={() => onDelete(file)}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
