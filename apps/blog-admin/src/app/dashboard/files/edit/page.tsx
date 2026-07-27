'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, ImageIcon, Loader2, Upload, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { markdown } from '@codemirror/lang-markdown';
import { ViewPlugin, EditorView } from '@codemirror/view';
import { useFileEditor } from '@/features/file-edit';
import { ImageUploader, TagInput } from '@/shared/ui';
import { toast } from 'sonner';
import { uploadImage as uploadImageAction } from '@/app/actions/files';
import '../../../markdown.css';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror').then(mod => mod.default), {
  ssr: false,
});

// EditorView 레퍼런스를 저장하기 위한 ViewPlugin
const viewRefPlugin = (ref: React.MutableRefObject<EditorView | null>) =>
  ViewPlugin.fromClass(
    class {
      constructor(view: EditorView) {
        ref.current = view;
      }
      destroy() {
        ref.current = null;
      }
    }
  );

function EditPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = searchParams?.get('pathname') || null;
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [isPastingImage, setIsPastingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Scroll sync refs
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingSyncRef = useRef(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  const {
    fileData,
    isLoading,
    error,
    formData,
    setFormData,
    previewHtml,
    save,
    isSaving,
    hasUnsavedChanges,
  } = useFileEditor(pathname);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleImageUploaded = (url: string, filename: string) => {
    const imageMarkdown = `\n![${filename}](${url})\n`;
    const view = editorViewRef.current;

    if (view) {
      const transaction = view.state.update({
        changes: {
          from: view.state.selection.main.head,
          to: view.state.selection.main.head,
          insert: imageMarkdown,
        },
        selection: {
          anchor: view.state.selection.main.head + imageMarkdown.length,
          head: view.state.selection.main.head + imageMarkdown.length,
        },
      });
      view.dispatch(transaction);

      setFormData({
        ...formData,
        content: view.state.doc.toString(),
      });
    } else {
      setFormData({
        ...formData,
        content: formData.content + imageMarkdown,
      });
    }
    setShowImageUploader(false);
  };

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let imageFile: File | null = null;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        imageFile = item.getAsFile();
        break;
      }
    }

    if (!imageFile) return;

    e.preventDefault();
    setIsPastingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const result = await uploadImageAction(formData);

      if (!result.success || !result.url) {
        throw new Error(result.error || '이미지 업로드에 실패했습니다');
      }

      const view = editorViewRef.current;
      const imageMarkdown = `\n![${imageFile.name}](${result.url})\n`;

      if (view) {
        const transaction = view.state.update({
          changes: {
            from: view.state.selection.main.head,
            to: view.state.selection.main.head,
            insert: imageMarkdown,
          },
          selection: {
            anchor: view.state.selection.main.head + imageMarkdown.length,
            head: view.state.selection.main.head + imageMarkdown.length,
          },
        });
        view.dispatch(transaction);

        setFormData(prev => ({
          ...prev,
          content: view.state.doc.toString(),
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          content: prev.content + imageMarkdown,
        }));
      }

      toast.success('이미지 업로드 완료', {
        description: '이미지가 성공적으로 업로드되었습니다',
      });
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      toast.error('이미지 업로드 실패', {
        description: error instanceof Error ? error.message : '다시 시도해주세요',
      });
    } finally {
      setIsPastingImage(false);
    }
  }, []);

  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const pasteHandler = (e: Event) => {
      const clipboardEvent = e as ClipboardEvent;
      handlePaste(clipboardEvent);
    };

    container.addEventListener('paste', pasteHandler);

    return () => {
      container.removeEventListener('paste', pasteHandler);
    };
  }, [handlePaste]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        toast.error('이미지 파일만 업로드 가능합니다', {
          description: 'PNG, JPG, GIF, WebP 파일을 드래그해주세요',
        });
        return;
      }

      setIsPastingImage(true);

      try {
        const view = editorViewRef.current;

        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append('file', file);

          const result = await uploadImageAction(formData);

          if (!result.success || !result.url) {
            throw new Error(result.error || '이미지 업로드에 실패했습니다');
          }

          const imageMarkdown = `\n![${file.name}](${result.url})\n`;

          if (view) {
            const cursorPos = view.state.selection.main.head;
            const transaction = view.state.update({
              changes: {
                from: cursorPos,
                to: cursorPos,
                insert: imageMarkdown,
              },
              selection: {
                anchor: cursorPos + imageMarkdown.length,
                head: cursorPos + imageMarkdown.length,
              },
            });
            view.dispatch(transaction);
          } else {
            setFormData(prev => ({
              ...prev,
              content: prev.content + imageMarkdown,
            }));
          }
        }

        if (view) {
          setFormData(prev => ({
            ...prev,
            content: view.state.doc.toString(),
          }));
        }

        toast.success('이미지 업로드 완료', {
          description: `${imageFiles.length}개의 이미지가 업로드되었습니다`,
        });
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        toast.error('이미지 업로드 실패', {
          description: error instanceof Error ? error.message : '다시 시도해주세요',
        });
      } finally {
        setIsPastingImage(false);
      }
    },
    []
  );

  const handleSave = () => {
    save(undefined, {
      onSuccess: () => {
        toast.success('저장 완료', {
          description: '파일이 성공적으로 저장되었습니다',
        });
        router.push(`/dashboard/files/view?pathname=${encodeURIComponent(pathname || '')}`);
      },
      onError: err => {
        toast.error('저장 실패', {
          description: err instanceof Error ? err.message : '파일 저장에 실패했습니다',
        });
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
      const scrollPercentage =
        editorContainer.scrollTop / (editorContainer.scrollHeight - editorContainer.clientHeight);
      previewContainer.scrollTop =
        scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
    };

    const handlePreviewScroll = () => {
      if (isScrollingSyncRef.current) {
        isScrollingSyncRef.current = false;
        return;
      }

      isScrollingSyncRef.current = true;
      const scrollPercentage =
        previewContainer.scrollTop /
        (previewContainer.scrollHeight - previewContainer.clientHeight);
      editorContainer.scrollTop =
        scrollPercentage * (editorContainer.scrollHeight - editorContainer.clientHeight);
    };

    editorContainer.addEventListener('scroll', handleEditorScroll);
    previewContainer.addEventListener('scroll', handlePreviewScroll);

    return () => {
      editorContainer.removeEventListener('scroll', handleEditorScroll);
      previewContainer.removeEventListener('scroll', handlePreviewScroll);
    };
  }, []);

  const inputClass =
    'w-full min-h-[44px] px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">파일 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !fileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-error-600 dark:text-error-400">
            {error instanceof Error ? error.message : '파일을 찾을 수 없습니다'}
          </p>
          <button
            onClick={() => router.push('/dashboard/files')}
            className="mt-4 text-primary hover:underline min-h-[44px] inline-block"
          >
            파일 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-muted rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-foreground">파일 편집</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
              {fileData.metadata?.pathname || ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hasUnsavedChanges && (
            <span className="text-sm text-warning-600 dark:text-warning-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-warning-600 dark:bg-warning-500 rounded-full"></span>
              저장되지 않은 변경사항
            </span>
          )}
          <button
            onClick={() => setShowImageUploader(!showImageUploader)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 min-h-[44px] bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">이미지 추가</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 md:px-4 py-2 min-h-[44px] bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? '저장 중...' : '저장'}</span>
          </button>
        </div>
      </div>

      {/* Front Matter Form */}
      <div className="bg-card rounded-lg border border-border p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">메타데이터</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">설명 *</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
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
              <X className="w-4 h-4" />
            </button>
          </div>
          <ImageUploader onImageUploaded={handleImageUploaded} />
        </div>
      )}

      {/* Content Editor - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Editor Section */}
        <div
          className={`bg-card rounded-lg border border-border overflow-hidden relative transition-colors ${
            isDragging ? 'border-primary ring-2 ring-primary ring-opacity-50' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="border-b border-border px-4 md:px-6 py-3 flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold text-foreground">마크다운 편집</h2>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              💡 이미지 복사(Ctrl+V) 또는 드래그 앤 드롭
            </span>
          </div>
          <div
            ref={editorScrollRef}
            className="p-0 overflow-auto relative"
            style={{ height: '500px' }}
          >
            <div ref={editorContainerRef} className="h-full">
              <CodeMirror
                value={formData.content}
                onChange={value => setFormData({ ...formData, content: value })}
                height="100%"
                theme="dark"
                extensions={[markdown(), viewRefPlugin(editorViewRef)]}
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

          {/* 드래그 오버레이 */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center z-40 pointer-events-none">
              <div className="bg-card rounded-lg p-6 shadow-lg">
                <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="text-foreground font-semibold text-center">
                  이미지를 여기에 드롭하세요
                </p>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  PNG, JPG, GIF, WebP
                </p>
              </div>
            </div>
          )}

          {/* 붙여넣기/업로드 인디케이터 오버레이 */}
          {isPastingImage && (
            <div className="absolute inset-0 bg-neutral-950/50 flex items-center justify-center z-50">
              <div className="bg-card rounded-lg p-6 shadow-lg flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <div>
                  <p className="text-foreground font-semibold">이미지 업로드 중...</p>
                  <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="border-b border-border px-4 md:px-6 py-3">
            <h2 className="text-base md:text-lg font-semibold text-foreground">미리보기</h2>
          </div>
          <div
            ref={previewScrollRef}
            className="overflow-auto"
            style={{ height: '500px' }}
          >
            <article
              className="prose prose-slate dark:prose-invert max-w-none px-4 md:px-8 py-4 md:py-8"
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      }
    >
      <EditPageContent />
    </Suspense>
  );
}
