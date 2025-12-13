"use client";

import { useState, useEffect } from "react";
import { FileText, Loader2, Trash2, Download, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import DeleteConfirmModal from "@/components/delete-confirm-modal";

interface BlobFile {
  filename: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  url: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [filesError, setFilesError] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    file: BlobFile | null;
  }>({ isOpen: false, file: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // 페이지 로드 시 파일 목록 조회
  useEffect(() => {
    loadFiles();
  }, []);

  // 파일 목록 로드
  const loadFiles = async () => {
    setIsLoadingFiles(true);
    setFilesError("");

    try {
      // 세션에서 API 키 가져오기
      const sessionResponse = await fetch("/api/admin/session");
      if (!sessionResponse.ok) {
        setFilesError("인증이 만료되었습니다. 다시 로그인해주세요.");
        setIsLoadingFiles(false);
        return;
      }

      const { apiKey } = await sessionResponse.json();

      const response = await fetch("/api/admin/files?limit=100", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      } else if (response.status === 401) {
        setFilesError("인증이 만료되었습니다. 다시 로그인해주세요.");
      } else {
        setFilesError("파일 목록을 불러올 수 없습니다.");
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
      // 세션에서 API 키 가져오기
      const sessionResponse = await fetch("/api/admin/session");
      if (!sessionResponse.ok) {
        setFilesError("인증이 만료되었습니다. 다시 로그인해주세요.");
        setIsDeleting(false);
        setDeleteModal({ isOpen: false, file: null });
        return;
      }

      const { apiKey } = await sessionResponse.json();

      const response = await fetch(
        `/api/admin/file?pathname=${encodeURIComponent(deleteModal.file.pathname)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
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

      {/* Empty State */}
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

      {/* Files Table */}
      {!isLoadingFiles && files.length > 0 && (
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
              {files.map((file, index) => (
                <tr
                  key={file.pathname}
                  className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    index === files.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-sm text-slate-900 dark:text-white font-medium">
                        {file.filename}
                      </span>
                    </div>
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
              총 {files.length}개의 파일
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
