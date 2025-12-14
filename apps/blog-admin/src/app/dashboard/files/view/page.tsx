"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Calendar, HardDrive, Loader2, AlertCircle, Edit, Tag } from "lucide-react";
import type { FileData } from "@/entities/file";
import { getFileContent } from "@/app/actions/files";
import "../../../markdown.css";

export default function FileViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = searchParams?.get("pathname") || null;

  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (pathname) {
      loadFileContent();
    } else {
      setError("파일 경로가 지정되지 않았습니다.");
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const loadFileContent = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await getFileContent(pathname!);

      if (result.success) {
        setFileData(result as FileData);
      } else {
        setError(result.error || "파일을 불러올 수 없습니다.");
      }
    } catch (error) {
      setError("서버에 연결할 수 없습니다.");
      console.error("Load file content error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">파일을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </button>
      </div>
    );
  }

  if (!fileData) {
    return null;
  }

  const filename = fileData.metadata.pathname.split("/").pop() || "Unknown";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              파일 목록
            </button>
          </div>
          <button
            onClick={() => router.push(`/dashboard/files/edit?pathname=${encodeURIComponent(pathname || "")}`)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            편집
          </button>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {filename}
            </h1>
            <p className="text-sm font-mono text-slate-600 dark:text-slate-400 mb-4 break-all">
              {fileData.metadata.pathname}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                <span>{formatFileSize(fileData.metadata.size)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(fileData.metadata.uploadedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Front Matter */}
      {fileData.frontMatter && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Front Matter
          </h2>
          <div className="space-y-3">
            {fileData.frontMatter.title && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  제목:
                </span>
                <p className="text-slate-900 dark:text-white font-semibold mt-1">
                  {fileData.frontMatter.title}
                </p>
              </div>
            )}
            {fileData.frontMatter.description && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  설명:
                </span>
                <p className="text-slate-700 dark:text-slate-300 mt-1">
                  {fileData.frontMatter.description}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {fileData.frontMatter.date && (
                <div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    날짜:
                  </span>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {fileData.frontMatter.date}
                  </p>
                </div>
              )}
              {fileData.frontMatter.author && (
                <div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    작성자:
                  </span>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {fileData.frontMatter.author}
                  </p>
                </div>
              )}
            </div>
            {fileData.frontMatter.tags && Array.isArray(fileData.frontMatter.tags) && fileData.frontMatter.tags.length > 0 && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                  태그:
                </span>
                <div className="flex flex-wrap gap-2">
                  {fileData.frontMatter.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {fileData.frontMatter.draft !== undefined && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  상태:
                </span>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      fileData.frontMatter.draft
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                        : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    }`}
                  >
                    {fileData.frontMatter.draft ? "초안" : "발행됨"}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Markdown Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            미리보기
          </h2>
        </div>
        <article
          className="prose prose-slate dark:prose-invert max-w-none px-8 py-8"
          dangerouslySetInnerHTML={{ __html: fileData.htmlContent }}
        />
      </div>
    </div>
  );
}
