/**
 * File Delete Feature - Business Logic Hook
 */

import { useState } from "react";
import { overlay } from "overlay-kit";
import { useDeleteFileMutation, type BlobFile } from "@/entities/file";

export function useFileDelete() {
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const deleteMutation = useDeleteFileMutation();

  const handleDelete = (file: BlobFile, onConfirm: (isOpen: boolean, close: () => void) => React.ReactNode) => {
    setDeleteSuccess(null);

    overlay.open(({ isOpen, close }) => {
      return onConfirm(isOpen, close);
    });
  };

  const deleteFile = (file: BlobFile, onSuccess?: () => void) => {
    deleteMutation.mutate(
      { pathname: file.pathname },
      {
        onSuccess: () => {
          setDeleteSuccess(`${file.filename} 파일이 삭제되었습니다.`);
          setTimeout(() => setDeleteSuccess(null), 3000);
          onSuccess?.();
        },
      }
    );
  };

  return {
    deleteSuccess,
    deleteFile,
    handleDelete,
    isDeleting: deleteMutation.isPending,
    error: deleteMutation.error,
  };
}
