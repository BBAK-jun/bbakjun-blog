/**
 * File Creator Widget
 *
 * Complete file creation interface
 */

"use client";

import { useState } from "react";
import { Save, Plus, AlertCircle, CheckCircle, Eye } from "lucide-react";
import { useFileCreator, CategorySelector, PathPreview } from "@/features/file-create";
import { ImageUploader } from "@/shared/ui";

export function FileCreatorWidget() {
  const {
    formData,
    setFormData,
    category,
    setCategory,
    previewHtml,
    handlePreview,
    isPreviewLoading,
    create,
    isCreating,
    createError,
    isSuccess,
  } = useFileCreator();

  const [showImageUploader, setShowImageUploader] = useState(false);

  const handleImageUploaded = (url: string, filename: string) => {
    const imageMarkdown = `![${filename}](${url})`;
    setFormData({
      ...formData,
      content: formData.content + "\n" + imageMarkdown + "\n",
    });
    setShowImageUploader(false);
  };

  const isFormValid =
    category.trim() &&
    formData.title.trim() &&
    formData.description.trim() &&
    formData.date &&
    formData.tags.length > 0 &&
    formData.author.trim() &&
    formData.content.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-6 h-6" />
            새 파일 생성
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            새로운 마크다운 파일을 생성합니다
          </p>
        </div>
        <button
          onClick={() => create()}
          disabled={isCreating || !isFormValid}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{isCreating ? "생성 중..." : "생성"}</span>
        </button>
      </div>

      {/* Success Message */}
      {isSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-600 dark:text-green-400">
            파일이 성공적으로 생성되었습니다
          </p>
        </div>
      )}

      {/* Error Message */}
      {createError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {createError instanceof Error ? createError.message : "파일 생성 실패"}
          </p>
        </div>
      )}

      {/* Front Matter Form */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          메타데이터
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Selector */}
          <div className="md:col-span-2">
            <CategorySelector value={category} onChange={setCategory} />
            <PathPreview category={category} title={formData.title} />
          </div>

          {/* Title */}
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
              placeholder="새 포스트의 제목"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
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
              placeholder="포스트의 간단한 설명"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Date */}
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

          {/* Author */}
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

          {/* Tags */}
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
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="예: nextjs, react, typescript"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Draft */}
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

      {/* Editor */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            마크다운 편집
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImageUploader(!showImageUploader)}
              className="text-sm px-3 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded"
            >
              + 이미지
            </button>
            <button
              onClick={handlePreview}
              disabled={isPreviewLoading || !formData.content}
              className="flex items-center gap-1 text-sm px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              미리보기
            </button>
          </div>
        </div>
        <div className="p-4">
          <textarea
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            placeholder="마크다운 내용을 입력하세요..."
            className="w-full h-96 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 resize-none"
            required
          />
        </div>
      </div>

      {/* Preview */}
      {previewHtml && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              미리보기
            </h2>
          </div>
          <div className="overflow-auto max-h-96">
            {isPreviewLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-slate-600 dark:text-slate-400">
                  미리보기 처리 중...
                </p>
              </div>
            ) : (
              <article
                className="prose prose-slate dark:prose-invert max-w-none px-8 py-8"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
