"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Calendar, HardDrive, Loader2, AlertCircle, Edit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface FileData {
  content: string;
  metadata: {
    pathname: string;
    size: number;
    uploadedAt: string;
    url: string;
  };
}

export default function FileViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = searchParams.get("pathname");

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
      // 세션에서 API 키 가져오기
      const sessionResponse = await fetch("/api/admin/session");
      if (!sessionResponse.ok) {
        setError("인증이 만료되었습니다. 다시 로그인해주세요.");
        setIsLoading(false);
        return;
      }

      const { apiKey } = await sessionResponse.json();

      const response = await fetch(
        `/api/admin/file/content?pathname=${encodeURIComponent(pathname!)}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setFileData(result);
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
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            파일 목록
          </button>
          <button
            onClick={() => alert("편집 기능은 곧 추가될 예정입니다.")}
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

      {/* Markdown Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          미리보기
        </h2>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {fileData.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
