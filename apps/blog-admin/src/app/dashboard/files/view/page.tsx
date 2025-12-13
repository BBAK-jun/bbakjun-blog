"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Calendar, HardDrive, Loader2, AlertCircle, Edit, Tag } from "lucide-react";
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

interface FrontMatter {
  title?: string;
  date?: string;
  description?: string;
  tags?: string[];
  author?: string;
  draft?: boolean;
  [key: string]: any;
}

export default function FileViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = searchParams.get("pathname");

  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Parse frontmatter from content
  const { frontMatter, markdownContent } = useMemo(() => {
    if (!fileData?.content) {
      return { frontMatter: null, markdownContent: "" };
    }

    const content = fileData.content;
    const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);

    if (!match) {
      return { frontMatter: null, markdownContent: content };
    }

    const frontMatterText = match[1];
    const markdown = match[2];

    // Simple YAML parser for frontmatter
    const fm: FrontMatter = {};
    frontMatterText.split("\n").forEach((line) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value: any = line.substring(colonIndex + 1).trim();

        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        // Parse arrays
        if (value.startsWith("[") && value.endsWith("]")) {
          value = value
            .slice(1, -1)
            .split(",")
            .map((v: string) => v.trim().replace(/['"]/g, ""));
        }

        // Parse booleans
        if (value === "true") value = true;
        if (value === "false") value = false;

        fm[key] = value;
      }
    });

    return { frontMatter: fm, markdownContent: markdown };
  }, [fileData?.content]);

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

      {/* Front Matter */}
      {frontMatter && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Front Matter
          </h2>
          <div className="space-y-3">
            {frontMatter.title && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  제목:
                </span>
                <p className="text-slate-900 dark:text-white font-semibold mt-1">
                  {frontMatter.title}
                </p>
              </div>
            )}
            {frontMatter.description && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  설명:
                </span>
                <p className="text-slate-700 dark:text-slate-300 mt-1">
                  {frontMatter.description}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {frontMatter.date && (
                <div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    날짜:
                  </span>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {frontMatter.date}
                  </p>
                </div>
              )}
              {frontMatter.author && (
                <div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    작성자:
                  </span>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {frontMatter.author}
                  </p>
                </div>
              )}
            </div>
            {frontMatter.tags && Array.isArray(frontMatter.tags) && frontMatter.tags.length > 0 && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                  태그:
                </span>
                <div className="flex flex-wrap gap-2">
                  {frontMatter.tags.map((tag, index) => (
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
            {frontMatter.draft !== undefined && (
              <div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  상태:
                </span>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      frontMatter.draft
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                        : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    }`}
                  >
                    {frontMatter.draft ? "초안" : "발행됨"}
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
        <article className="prose prose-slate dark:prose-invert max-w-none px-8 py-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Headings
              h1: ({ node, ...props }) => (
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mt-8 mb-4" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-8 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-6 mb-3" {...props} />
              ),
              h4: ({ node, ...props }) => (
                <h4 className="text-xl font-semibold text-slate-900 dark:text-white mt-4 mb-2" {...props} />
              ),
              // Paragraphs
              p: ({ node, ...props }) => (
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4" {...props} />
              ),
              // Links
              a: ({ node, ...props }) => (
                <a
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-blue-600/30 hover:decoration-blue-600 transition-colors"
                  target={props.href?.startsWith('http') ? '_blank' : undefined}
                  rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  {...props}
                />
              ),
              // Lists
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside space-y-2 mb-4 text-slate-700 dark:text-slate-300" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-inside space-y-2 mb-4 text-slate-700 dark:text-slate-300" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="ml-4" {...props} />
              ),
              // Blockquote
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 my-4 italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50" {...props} />
              ),
              // Code blocks and inline code
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <div className="my-6 rounded-lg overflow-hidden">
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              },
              // Tables
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-6">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className="bg-slate-50 dark:bg-slate-800" {...props} />
              ),
              th: ({ node, ...props }) => (
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700" {...props} />
              ),
              // Horizontal rule
              hr: ({ node, ...props }) => (
                <hr className="my-8 border-slate-200 dark:border-slate-700" {...props} />
              ),
              // Images
              img: ({ node, ...props }) => (
                <img className="rounded-lg my-6 max-w-full h-auto" {...props} />
              ),
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
