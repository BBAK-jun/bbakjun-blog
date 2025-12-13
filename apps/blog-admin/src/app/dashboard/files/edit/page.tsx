"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ArrowLeft, Save, Eye, Code } from "lucide-react";
import dynamic from "next/dynamic";
import { markdown } from "@codemirror/lang-markdown";
import "../../../markdown.css";

const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((mod) => mod.default),
  { ssr: false }
);

type FileData = {
  rawContent: string;
  htmlContent: string;
  frontMatter: Record<string, any> | null;
  metadata: {
    pathname: string;
    size: number;
    uploadedAt: string;
    url: string;
  };
};

function EditPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = searchParams.get("pathname");

  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Editing states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState("");
  const [draft, setDraft] = useState(false);
  const [content, setContent] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    if (!pathname) {
      setError("파일 경로가 필요합니다");
      setLoading(false);
      return;
    }

    fetchFileData();
  }, [pathname]);

  const fetchFileData = async () => {
    if (!pathname) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/file/content?pathname=${encodeURIComponent(pathname)}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "파일을 불러올 수 없습니다");
      }

      const data: FileData = await response.json();
      setFileData(data);

      // Initialize form fields
      if (data.frontMatter) {
        setTitle(data.frontMatter.title || "");
        setDescription(data.frontMatter.description || "");
        setTags(
          Array.isArray(data.frontMatter.tags)
            ? data.frontMatter.tags.join(", ")
            : data.frontMatter.tags || ""
        );
        setAuthor(data.frontMatter.author || "");
        setDate(data.frontMatter.date || "");
        setDraft(data.frontMatter.draft === true || data.frontMatter.draft === "true");
      }

      // Extract content without frontmatter
      const frontMatterRegex = /^---\n[\s\S]*?\n---\n([\s\S]*)$/;
      const match = data.rawContent.match(frontMatterRegex);
      setContent(match ? match[1] : data.rawContent);
      setPreviewHtml(data.htmlContent);
    } catch (err) {
      console.error("Error fetching file:", err);
      setError(err instanceof Error ? err.message : "파일을 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = async (newContent: string) => {
    try {
      const response = await fetch("/api/admin/file/preview", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (!response.ok) {
        console.error("Failed to generate preview");
        return;
      }

      const data = await response.json();
      setPreviewHtml(data.htmlContent);
    } catch (error) {
      console.error("Error generating preview:", error);
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    // Debounce preview updates
    if (showPreview) {
      updatePreview(value);
    }
  };

  const handleSave = async () => {
    if (!pathname || !fileData) return;

    try {
      setSaving(true);

      // Construct frontmatter
      const frontMatterObj: Record<string, any> = {
        title,
        date,
        description,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        author,
      };

      if (draft) {
        frontMatterObj.draft = true;
      }

      // Construct full content with frontmatter
      const frontMatterYaml = Object.entries(frontMatterObj)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`;
          }
          if (typeof value === "boolean") {
            return `${key}: ${value}`;
          }
          return `${key}: "${value}"`;
        })
        .join("\n");

      const fullContent = `---\n${frontMatterYaml}\n---\n${content}`;

      const response = await fetch(
        `/api/admin/file?pathname=${encodeURIComponent(pathname)}`,
        {
          method: "PUT",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: fullContent,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "파일 저장에 실패했습니다");
      }

      alert("파일이 성공적으로 저장되었습니다");
      router.push(`/dashboard/files/view?pathname=${encodeURIComponent(pathname)}`);
    } catch (err) {
      console.error("Error saving file:", err);
      alert(err instanceof Error ? err.message : "파일 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">파일 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !fileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || "파일을 찾을 수 없습니다"}</p>
          <button
            onClick={() => router.push("/dashboard/files")}
            className="mt-4 text-blue-600 hover:underline"
          >
            파일 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              파일 편집
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {fileData.metadata.pathname}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowPreview(!showPreview);
              if (!showPreview) {
                updatePreview(content);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showPreview
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            {showPreview ? (
              <>
                <Code className="w-4 h-4" />
                <span>편집</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>미리보기</span>
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "저장 중..." : "저장"}</span>
          </button>
        </div>
      </div>

      {/* Front Matter Form */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          메타데이터
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              설명 *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              날짜 *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              작성자 *
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              태그 (쉼표로 구분) *
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="예: nextjs, react, typescript"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft}
                onChange={(e) => setDraft(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                임시 저장 (draft)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {showPreview ? "미리보기" : "마크다운 편집"}
          </h2>
        </div>
        <div className="p-0">
          {showPreview ? (
            <article
              className="prose prose-slate dark:prose-invert max-w-none px-8 py-8"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <CodeMirror
              value={content}
              onChange={handleContentChange}
              height="600px"
              theme="dark"
              extensions={[markdown()]}
              className="text-sm"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightSpecialChars: true,
                foldGutter: true,
                drawSelection: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                searchKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function EditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">로딩 중...</p>
          </div>
        </div>
      }
    >
      <EditPageContent />
    </Suspense>
  );
}
