"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Trash2, Download, RefreshCw, AlertCircle, CheckCircle, Search, X, Filter } from "lucide-react";
import DeleteConfirmModal from "@/components/delete-confirm-modal";
import { listFiles, deleteFile } from "@/app/actions/files";

interface BlobFile {
  filename: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  url: string;
}

type SortOption = "name-asc" | "name-desc" | "date-asc" | "date-desc" | "size-asc" | "size-desc";

export default function FilesPage() {
  const router = useRouter();
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    file: BlobFile | null;
  }>({ isOpen: false, file: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");

  // 페이지 로드 시 파일 목록 조회
  useEffect(() => {
    loadFiles();
  }, []);

  // 파일 목록 로드
  const loadFiles = async () => {
    setIsLoadingFiles(true);
    setFilesError("");

    try {
      const result = await listFiles(100);

      if (result.success) {
        setFiles(result.files || []);
      } else {
        setFilesError(result.error || "파일 목록을 불러올 수 없습니다.");
      }
    } catch (error) {
      setFilesError("서버에 연결할 수 없습니다.");
      console.error("Load files error:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

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

  // 삭제 모달 열기
  const handleDeleteClick = (file: BlobFile) => {
    setDeleteModal({ isOpen: true, file });
    setDeleteSuccess(null);
  };

  // 삭제 모달 닫기
  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, file: null });
    }
  };

  // 파일 삭제 실행
  const handleDeleteConfirm = async () => {
    if (!deleteModal.file) return;

    setIsDeleting(true);
    setFilesError("");

    try {
      const result = await deleteFile(deleteModal.file.pathname);

      if (result.success) {
        // 성공: 목록에서 제거하고 성공 메시지 표시
        setFiles((prev) => prev.filter((f) => f.pathname !== deleteModal.file!.pathname));
        setDeleteSuccess(`${deleteModal.file.filename} 파일이 삭제되었습니다.`);
        setDeleteModal({ isOpen: false, file: null });

        // 3초 후 성공 메시지 제거
        setTimeout(() => setDeleteSuccess(null), 3000);
      } else {
        setFilesError(result.error || "파일 삭제 중 오류가 발생했습니다.");
        setDeleteModal({ isOpen: false, file: null });
      }
    } catch (error) {
      setFilesError("서버에 연결할 수 없습니다.");
      console.error("Delete file error:", error);
      setDeleteModal({ isOpen: false, file: null });
    } finally {
      setIsDeleting(false);
    }
  };

  // Extract unique categories from files
  const categories = useMemo(() => {
    const cats = new Set<string>();
    files.forEach((file) => {
      const category = file.pathname.split("/")[0];
      if (category) cats.add(category);
    });
    return Array.from(cats).sort();
  }, [files]);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (file) =>
          file.filename.toLowerCase().includes(query) ||
          file.pathname.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter((file) => file.pathname.startsWith(categoryFilter + "/"));
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.filename.localeCompare(b.filename);
        case "name-desc":
          return b.filename.localeCompare(a.filename);
        case "date-asc":
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        case "date-desc":
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case "size-asc":
          return a.size - b.size;
        case "size-desc":
          return b.size - a.size;
        default:
          return 0;
      }
    });

    return result;
  }, [files, searchQuery, categoryFilter, sortOption]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setSortOption("date-desc");
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== "" || categoryFilter !== "all" || sortOption !== "date-desc";

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
          onClick={loadFiles}
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
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="파일명 또는 경로로 검색..."
              className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">모든 카테고리</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sort Options */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date-desc">최신순</option>
            <option value="date-asc">오래된순</option>
            <option value="name-asc">이름 (A-Z)</option>
            <option value="name-desc">이름 (Z-A)</option>
            <option value="size-desc">크기 (큰순)</option>
            <option value="size-asc">크기 (작은순)</option>
          </select>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
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
            {categoryFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                카테고리: {categoryFilter}
              </span>
            )}
            {sortOption !== "date-desc" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                정렬: {sortOption === "date-asc" ? "오래된순" : sortOption === "name-asc" ? "이름(A-Z)" : sortOption === "name-desc" ? "이름(Z-A)" : sortOption === "size-asc" ? "크기(작은순)" : "크기(큰순)"}
              </span>
            )}
            <button
              onClick={clearFilters}
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
          <p className="text-sm text-green-600 dark:text-green-400">{deleteSuccess}</p>
        </div>
      )}

      {/* Error Message */}
      {filesError && (
        <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{filesError}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoadingFiles && files.length === 0 && (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">파일 목록을 불러오는 중...</p>
        </div>
      )}

      {/* Empty State - No files at all */}
      {!isLoadingFiles && files.length === 0 && !filesError && (
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
      {!isLoadingFiles && files.length > 0 && filteredAndSortedFiles.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            검색 결과가 없습니다
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
            다른 검색어나 필터를 시도해보세요
          </p>
          <button
            onClick={clearFilters}
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
                  파일명
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  경로
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  크기
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  업로드 일시
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedFiles.map((file, index) => (
                <tr
                  key={file.pathname}
                  className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    index === filteredAndSortedFiles.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <button
                      onClick={() => router.push(`/dashboard/files/view?pathname=${encodeURIComponent(file.pathname)}`)}
                      className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 -mx-2 px-2 py-1 rounded transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-sm text-slate-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400">
                        {file.filename}
                      </span>
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {file.pathname}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatFileSize(file.size)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(file.uploadedAt)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="삭제"
                        onClick={() => handleDeleteClick(file)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Files Count */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {filteredAndSortedFiles.length === files.length
                ? `총 ${files.length}개의 파일`
                : `${filteredAndSortedFiles.length}개 표시 (전체 ${files.length}개)`
              }
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        fileName={deleteModal.file?.pathname || ""}
        isDeleting={isDeleting}
      />
    </div>
  );
}
