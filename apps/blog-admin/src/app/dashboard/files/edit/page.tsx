"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useRef, useEffect } from "react";
import { ArrowLeft, Save, ImageIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { markdown } from "@codemirror/lang-markdown";
import { useFileEditor } from "@/features/file-edit";
import { ImageUploader } from "@/shared/ui";
import "../../../markdown.css";

const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((mod) => mod.default),
  { ssr: false }
);

function EditPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = searchParams?.get("pathname") || null;
  const [showImageUploader, setShowImageUploader] = useState(false);

  // Scroll sync refs
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingSyncRef = useRef(false);

  const {
    fileData,
    isLoading,
    error,
    formData,
    setFormData,
    previewHtml,
    save,
    isSaving,
  } = useFileEditor(pathname);

  const handleImageUploaded = (url: string, filename: string) => {
    // Insert markdown image syntax at cursor position or end of content
    const imageMarkdown = `![${filename}](${url})`;
    setFormData({
      ...formData,
      content: formData.content + "\n" + imageMarkdown + "\n",
    });
    setShowImageUploader(false);
  };

  const handleSave = () => {
    save(undefined, {
      onSuccess: () => {
        alert("파일이 성공적으로 저장되었습니다");
        router.push(
          `/dashboard/files/view?pathname=${encodeURIComponent(pathname || "")}`
        );
      },
      onError: (err) => {
        alert(err instanceof Error ? err.message : "파일 저장에 실패했습니다");
      },
    });
  };

  // Scroll synchronization
  useEffect(() => {
    const editorContainer = editorScrollRef.current;
    const previewContainer = previewScrollRef.current;

    if (!editorContainer || !previewContainer) return;

    const handleEditorScroll = () => {
      if (isScrollingSyncRef.current) {
        isScrollingSyncRef.current = false;
        return;
      }

      isScrollingSyncRef.current = true;
      const scrollPercentage = editorContainer.scrollTop / (editorContainer.scrollHeight - editorContainer.clientHeight);
      previewContainer.scrollTop = scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
    };

    const handlePreviewScroll = () => {
      if (isScrollingSyncRef.current) {
        isScrollingSyncRef.current = false;
        return;
      }

      isScrollingSyncRef.current = true;
      const scrollPercentage = previewContainer.scrollTop / (previewContainer.scrollHeight - previewContainer.clientHeight);
      editorContainer.scrollTop = scrollPercentage * (editorContainer.scrollHeight - editorContainer.clientHeight);
    };

    editorContainer.addEventListener("scroll", handleEditorScroll);
    previewContainer.addEventListener("scroll", handlePreviewScroll);

    return () => {
      editorContainer.removeEventListener("scroll", handleEditorScroll);
      previewContainer.removeEventListener("scroll", handlePreviewScroll);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            파일 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (error || !fileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : "파일을 찾을 수 없습니다"}
          </p>
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
              {fileData.metadata?.pathname || ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImageUploader(!showImageUploader)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            <span>이미지 추가</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "저장 중..." : "저장"}</span>
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
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              설명 *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
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
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
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
              value={formData.author}
              onChange={(e) =>
                setFormData({ ...formData, author: e.target.value })
              }
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
              value={Array.isArray(formData.tags) ? formData.tags.join(", ") : ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: [e.target.value] as any, // Store raw input as single-element array
                })
              }
              placeholder="예: nextjs, react, typescript"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              시리즈 (선택사항)
            </label>
            <input
              type="text"
              value={formData.series || ""}
              onChange={(e) =>
                setFormData({ ...formData, series: e.target.value || undefined })
              }
              placeholder="예: react-deep-dive"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              시리즈 slug (영문, 소문자, 하이픈)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              시리즈 순서 (선택사항)
            </label>
            <input
              type="number"
              min="1"
              value={formData.seriesOrder || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  seriesOrder: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="1"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              시리즈 내 순서 (1부터 시작)
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.draft || false}
                onChange={(e) =>
                  setFormData({ ...formData, draft: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                임시 저장 (draft)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Image Uploader */}
      {showImageUploader && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              이미지 업로드
            </h2>
            <button
              onClick={() => setShowImageUploader(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>
          <ImageUploader onImageUploaded={handleImageUploaded} />
        </div>
      )}

      {/* Content Editor - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Section */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              마크다운 편집
            </h2>
          </div>
          <div ref={editorScrollRef} className="p-0 overflow-auto" style={{ height: "600px" }}>
            <CodeMirror
              value={formData.content}
              onChange={(value) =>
                setFormData({ ...formData, content: value })
              }
              height="100%"
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
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              미리보기
            </h2>
          </div>
          <div ref={previewScrollRef} className="overflow-auto" style={{ height: "600px" }}>
            <article
              className="prose prose-slate dark:prose-invert max-w-none px-8 py-8"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
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
