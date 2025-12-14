"use client";

import { lazy } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, RefreshCw, AlertCircle, CheckCircle, X, Filter } from "lucide-react";
import { useFilesQuery, FileListItem } from "@/entities/file";
import { useFileDelete } from "@/features/file-delete";
import { useFileSearch, SearchInput } from "@/features/file-search";
import { useFileFilter, CategoryFilter, SortSelect } from "@/features/file-filter";

// Lazy import for modal (code-splitting)
const DeleteConfirmModal = lazy(() =>
  import("@/shared/ui/modal").then((m) => ({ default: m.DeleteConfirmModal }))
);

export default function FilesPage() {
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

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // 삭제 핸들러
  const handleDeleteClick = (file: typeof files[number]) => {
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

  const hasAnyFilter = searchQuery !== "" || hasActiveFilters;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            파일 관리
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            업로드된 마크다운 파일 목록을 관리합니다
          </p>
        </div>
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

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={clearSearch}
            placeholder="파일명 또는 경로로 검색..."
          />

          <CategoryFilter
            value={category}
            categories={categories}
            onChange={setCategory}
          />

          <SortSelect value={sort} onChange={setSort} />
        </div>

        {/* Active Filters Summary */}
        {hasAnyFilter && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              필터 적용 중:
            </span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                검색: "{searchQuery}"
              </span>
            )}
            {category !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                카테고리: {category}
              </span>
            )}
            {sort !== "date-desc" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                정렬:{" "}
                {sort === "date-asc"
                  ? "오래된순"
                  : sort === "name-asc"
                  ? "이름(A-Z)"
                  : sort === "name-desc"
                  ? "이름(Z-A)"
                  : sort === "size-asc"
                  ? "크기(작은순)"
                  : "크기(큰순)"}
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <X className="w-3 h-3" />
              초기화
            </button>
          </div>
        )}
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

      {/* Empty State - No results from filter */}
      {!isLoadingFiles &&
        files.length > 0 &&
        filteredAndSortedFiles.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              검색 결과가 없습니다
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
              다른 검색어나 필터를 시도해보세요
            </p>
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              필터 초기화
            </button>
          </div>
        )}

      {/* Files Table */}
      {!isLoadingFiles && filteredAndSortedFiles.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  제목
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  경로
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  크기
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  게시 날짜
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedFiles.map((file) => (
                <FileListItem
                  key={file.pathname}
                  file={file}
                  onView={(f) =>
                    router.push(
                      `/dashboard/files/view?pathname=${encodeURIComponent(
                        f.pathname
                      )}`
                    )
                  }
                  onDelete={handleDeleteClick}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                />
              ))}
            </tbody>
          </table>

          {/* Files Count */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {filteredAndSortedFiles.length === files.length
                ? `총 ${files.length}개의 파일`
                : `${filteredAndSortedFiles.length}개 표시 (전체 ${files.length}개)`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
