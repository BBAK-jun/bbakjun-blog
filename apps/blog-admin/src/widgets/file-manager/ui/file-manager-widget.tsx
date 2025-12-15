"use client";

import { lazy } from "react";
import { FileText, Loader2, RefreshCw, AlertCircle, CheckCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFilesQuery, type BlobFile } from "@/entities/file";
import { useFileDelete } from "@/features/file-delete";
import { useFileSearch } from "@/features/file-search";
import { useFileFilter } from "@/features/file-filter";
import { FileListWidget } from "@/widgets/file-list";
import { formatFileSize, formatDate } from "@/shared/lib/format";

// Lazy import for modal
const DeleteConfirmModal = lazy(() =>
  import("@/shared/ui/modal").then((m) => ({ default: m.DeleteConfirmModal }))
);

export function FileManagerWidget() {
  const router = useRouter();

  // Entity hook - 파일 목록 조회
  const {
    data: filesData,
    isLoading: isLoadingFiles,
    error: filesError,
    refetch: loadFiles,
  } = useFilesQuery();

  const files = filesData || [];

  // Feature hooks
  const { searchQuery, setSearchQuery, clearSearch, filteredFiles } =
    useFileSearch(files);

  const {
    category,
    sort,
    categories,
    setCategory,
    setSort,
    clearFilters,
    filteredAndSortedFiles,
    hasActiveFilters,
  } = useFileFilter(filteredFiles);

  const { deleteSuccess, deleteFile, isDeleting, error: deleteError } =
    useFileDelete();

  // 삭제 핸들러
  const handleDeleteClick = (file: BlobFile) => {
    import("overlay-kit").then(({ overlay }) => {
      overlay.open(({ isOpen, close }) => (
        <DeleteConfirmModal
          isOpen={isOpen}
          onClose={close}
          onConfirm={() => {
            deleteFile(file, close);
          }}
          fileName={file.pathname}
          isDeleting={isDeleting}
        />
      ));
    });
  };

  // 모든 필터 초기화
  const clearAllFilters = () => {
    clearSearch();
    clearFilters();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            파일 관리
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            업로드된 마크다운 파일 목록을 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/dashboard/files/create')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>새 글 작성</span>
          </button>
          <button
            onClick={() => loadFiles()}
            disabled={isLoadingFiles}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            {isLoadingFiles ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>새로고침 중...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>새로고침</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {deleteSuccess && (
        <div className="flex items-center gap-2 p-3 mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-600 dark:text-green-400">
            {deleteSuccess}
          </p>
        </div>
      )}

      {/* Error Messages */}
      {filesError && (
        <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {filesError.message}
          </p>
        </div>
      )}
      {deleteError && (
        <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {deleteError.message}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoadingFiles && files.length === 0 && (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">
            파일 목록을 불러오는 중...
          </p>
        </div>
      )}

      {/* Empty State - No files at all */}
      {!isLoadingFiles && files.length === 0 && !filesError && !deleteError && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            업로드된 파일이 없습니다
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Upload 탭에서 파일을 업로드하거나 벌크 업로드 스크립트를 사용하세요
          </p>
        </div>
      )}

      {/* File List Widget */}
      {!isLoadingFiles && files.length > 0 && (
        <FileListWidget
          files={filteredAndSortedFiles}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          clearSearch={clearSearch}
          category={category}
          categories={categories}
          setCategory={setCategory}
          sort={sort}
          setSort={setSort}
          hasActiveFilters={hasActiveFilters}
          clearAllFilters={clearAllFilters}
          onDelete={handleDeleteClick}
          formatFileSize={formatFileSize}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}
