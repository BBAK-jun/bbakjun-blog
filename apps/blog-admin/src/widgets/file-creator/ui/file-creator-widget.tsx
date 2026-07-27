/**
 * File Creator Widget
 *
 * Complete file creation interface
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useScrollSync } from '@/shared/hooks/use-scroll-sync';
import {
  Save,
  Plus,
  AlertCircle,
  CheckCircle,
  Eye,
  PanelLeft,
  X,
} from 'lucide-react';
import { useFileCreator, CategorySelector, PathPreview } from '@/features/file-create';
import { ImageUploader, MarkdownEditor, TagInput } from '@/shared/ui';
import { toast } from 'sonner';

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
    lastSavedAt,
    isSaving,
    clearDraft,
  } = useFileCreator();

  const [showImageUploader, setShowImageUploader] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('editor');
  const [showDraftNotice, setShowDraftNotice] = useState(false);

  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  useScrollSync(editorScrollRef, previewScrollRef, { enabled: viewMode === 'split' });

  const handleImageUploaded = (url: string, filename: string) => {
    const imageMarkdown = `![${filename}](${url})`;
    setFormData({
      ...formData,
      content: formData.content + '\n' + imageMarkdown + '\n',
    });
    setShowImageUploader(false);
  };

  const handleImageDrop = async (file: File): Promise<string | void> => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('이미지 업로드 실패');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('이미지 업로드 실패', {
        description: '이미지 업로드에 실패했습니다.',
      });
    }
  };

  useEffect(() => {
    if (formData.content || formData.title) {
      setShowDraftNotice(true);
    }
  }, []);

  const isFormValid =
    category.trim() &&
    formData.title.trim() &&
    formData.description.trim() &&
    formData.date &&
    formData.tags.length > 0 &&
    formData.author.trim() &&
    formData.content.trim();

  const inputClass =
    'w-full min-h-[44px] px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Plus className="w-5 h-5 md:w-6 md:h-6" />
            새 파일 생성
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-muted-foreground">새로운 마크다운 파일을 생성합니다</p>
            {isSaving ? (
              <div className="flex items-center gap-1 text-xs text-warning-600 dark:text-warning-500">
                <div className="animate-spin w-3 h-3 border-2 border-warning-600 dark:border-warning-500 border-t-transparent rounded-full"></div>
                <span>저장 중...</span>
              </div>
            ) : (
              lastSavedAt && (
                <div className="flex items-center gap-1 text-xs text-success-600 dark:text-success-500">
                  <CheckCircle className="w-3 h-3" />
                  <span>
                    {new Date(lastSavedAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    저장됨
                  </span>
                </div>
              )
            )}
          </div>
        </div>
        <button
          onClick={() => create()}
          disabled={isCreating || !isFormValid}
          className="flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{isCreating ? '생성 중...' : '생성'}</span>
        </button>
      </div>

      {/* Draft Notice */}
      {showDraftNotice && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-accent border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-accent-foreground">
              저장된 초안이 복구되었습니다. 계속 작성하거나 새로 시작할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                clearDraft();
                setShowDraftNotice(false);
              }}
              className="text-sm px-3 py-2 min-h-[44px] text-primary hover:bg-background/50 rounded transition-colors"
            >
              새로 시작
            </button>
            <button
              onClick={() => setShowDraftNotice(false)}
              className="text-primary hover:bg-background/50 rounded p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {isSuccess && (
        <div className="flex items-center gap-2 p-3 bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-900 rounded-lg">
          <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400 flex-shrink-0" />
          <p className="text-sm text-success-700 dark:text-success-400">파일이 성공적으로 생성되었습니다</p>
        </div>
      )}

      {/* Error Message */}
      {createError && (
        <div className="flex items-center gap-2 p-3 bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-900 rounded-lg">
          <AlertCircle className="w-4 h-4 text-error-600 dark:text-error-400 flex-shrink-0" />
          <p className="text-sm text-error-700 dark:text-error-400">
            {createError instanceof Error ? createError.message : '파일 생성 실패'}
          </p>
        </div>
      )}

      {/* Front Matter Form */}
      <div className="bg-card rounded-lg border border-border p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">메타데이터</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <CategorySelector value={category} onChange={setCategory} />
            <PathPreview category={category} title={formData.title} customSlug={formData.slug} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="새 포스트의 제목"
              className={inputClass}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              파일명 (선택사항)
            </label>
            <input
              type="text"
              value={formData.slug || ''}
              onChange={e => setFormData({ ...formData, slug: e.target.value || undefined })}
              placeholder="비워두면 제목에서 자동 생성됩니다"
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground mt-1">
              영문, 숫자, 한글, 하이픈(-) 사용 가능 (예: my-custom-post)
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">설명 *</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="포스트의 간단한 설명"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">날짜 *</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">작성자 *</label>
            <input
              type="text"
              value={formData.author}
              onChange={e => setFormData({ ...formData, author: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">태그 *</label>
            <TagInput
              value={formData.tags}
              onChange={tags => setFormData({ ...formData, tags })}
              placeholder="태그를 입력하고 Enter를 누르세요 (예: nextjs, react, typescript)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter 또는 쉼표로 태그 추가, Backspace로 삭제
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              시리즈 (선택사항)
            </label>
            <input
              type="text"
              value={formData.series || ''}
              onChange={e => setFormData({ ...formData, series: e.target.value || undefined })}
              placeholder="예: react-deep-dive"
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground mt-1">시리즈 slug (영문, 소문자, 하이픈)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              시리즈 순서 (선택사항)
            </label>
            <input
              type="number"
              min="1"
              value={formData.seriesOrder || ''}
              onChange={e =>
                setFormData({
                  ...formData,
                  seriesOrder: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="1"
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground mt-1">시리즈 내 순서 (1부터 시작)</p>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={formData.draft || false}
                onChange={e => setFormData({ ...formData, draft: e.target.checked })}
                className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">임시 저장 (draft)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Image Uploader */}
      {showImageUploader && (
        <div className="bg-card rounded-lg border border-border p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-foreground">이미지 업로드</h2>
            <button
              onClick={() => setShowImageUploader(false)}
              className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <ImageUploader onImageUploaded={handleImageUploaded} />
        </div>
      )}

      {/* Editor & Preview */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-border px-4 md:px-6 py-3 flex items-center justify-between gap-2">
          <h2 className="text-base md:text-lg font-semibold text-foreground flex-shrink-0">
            마크다운 편집
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImageUploader(!showImageUploader)}
              className="text-sm px-3 py-2 min-h-[44px] text-foreground hover:bg-muted border border-border rounded"
            >
              + 이미지
            </button>
            <div className="flex items-center gap-1 border border-border rounded overflow-hidden">
              <button
                onClick={() => setViewMode('editor')}
                title="편집 모드"
                className={`px-3 py-2 min-h-[44px] text-sm ${
                  viewMode === 'editor'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-muted'
                }`}
              >
                편집
              </button>
              <button
                onClick={() => {
                  setViewMode('split');
                  handlePreview();
                }}
                title="분할 보기"
                className={`hidden md:inline-flex px-3 py-2 min-h-[44px] text-sm ${
                  viewMode === 'split'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-muted'
                }`}
              >
                <PanelLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setViewMode('preview');
                  handlePreview();
                }}
                title="미리보기"
                className={`px-3 py-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-sm ${
                  viewMode === 'preview'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-muted'
                }`}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - split mode only on md+ */}
        <div
          className={`grid ${viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'} gap-0`}
        >
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div
              className={`${viewMode === 'split' ? 'border-r border-border' : ''}`}
            >
              <div
                ref={editorScrollRef}
                data-testid="markdown-editor-scroll"
                className="p-4 overflow-auto"
                style={{ height: '500px' }}
              >
                <MarkdownEditor
                  value={formData.content}
                  onChange={value => setFormData({ ...formData, content: value })}
                  height="500px"
                  onImageClick={() => setShowImageUploader(true)}
                  onImageDrop={handleImageDrop}
                />
              </div>
            </div>
          )}

          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="p-4">
              <div
                ref={previewScrollRef}
                data-testid="preview-scroll"
                className="border border-border rounded-lg overflow-auto"
                style={{ height: '500px' }}
              >
                {isPreviewLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">미리보기 처리 중...</p>
                  </div>
                ) : previewHtml ? (
                  <article
                    className="prose prose-slate dark:prose-invert max-w-none px-4 md:px-8 py-4 md:py-8"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-sm">
                      내용을 입력하면 미리보기가 표시됩니다
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
