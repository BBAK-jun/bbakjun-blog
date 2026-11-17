'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Calendar,
  HardDrive,
  Loader2,
  AlertCircle,
  Edit,
  Tag,
} from 'lucide-react';
import { useFileQuery } from '@/entities/file';
import { formatFileSize, formatDateLong } from '@/shared/lib/format';
import '../../../app/markdown.css';

interface FileViewerWidgetProps {
  pathname: string | null;
}

export function FileViewerWidget({ pathname }: FileViewerWidgetProps) {
  const router = useRouter();

  const { data: fileData, isLoading, error } = useFileQuery(pathname);

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 md:p-8">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">파일을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 md:p-8">
        <div className="flex items-center gap-2 p-4 bg-error-50 dark:bg-error-950/30 border border-error-200 dark:border-error-900 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0" />
          <p className="text-sm text-error-700 dark:text-error-400">
            {error instanceof Error ? error.message : '파일을 불러올 수 없습니다.'}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
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

  const filename = fileData.metadata.pathname.split('/').pop() || 'Unknown';

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg border border-border p-4 md:p-6">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              파일 목록
            </button>
            <button
              onClick={() =>
                router.push(`/dashboard/files/edit?pathname=${encodeURIComponent(pathname || '')}`)
              }
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              편집
            </button>
          </div>

          <div className="flex items-start gap-3 md:gap-4 pt-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-foreground mb-1 md:mb-2 break-words">
                {filename}
              </h1>
              <p className="text-xs md:text-sm font-mono text-muted-foreground mb-3 md:mb-4 break-all">
                {fileData.metadata.pathname}
              </p>
              <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" />
                  <span>{formatFileSize(fileData.metadata.size)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateLong(fileData.metadata.uploadedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Front Matter */}
      {fileData.frontMatter && (
        <div className="bg-card rounded-lg border border-border p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">Front Matter</h2>
          <div className="space-y-3">
            {fileData.frontMatter.title && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">제목:</span>
                <p className="text-foreground font-semibold mt-1">{fileData.frontMatter.title}</p>
              </div>
            )}
            {fileData.frontMatter.description && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">설명:</span>
                <p className="text-foreground mt-1">{fileData.frontMatter.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {fileData.frontMatter.date && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">날짜:</span>
                  <p className="text-foreground mt-1">{fileData.frontMatter.date}</p>
                </div>
              )}
              {fileData.frontMatter.author && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">작성자:</span>
                  <p className="text-foreground mt-1">{fileData.frontMatter.author}</p>
                </div>
              )}
            </div>
            {fileData.frontMatter.tags &&
              Array.isArray(fileData.frontMatter.tags) &&
              fileData.frontMatter.tags.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground mb-2 block">
                    태그:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {fileData.frontMatter.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-accent text-accent-foreground text-sm rounded-full"
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
                <span className="text-sm font-medium text-muted-foreground">상태:</span>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      fileData.frontMatter.draft
                        ? 'bg-warning-100 dark:bg-warning-950/40 text-warning-800 dark:text-warning-400'
                        : 'bg-success-100 dark:bg-success-950/40 text-success-800 dark:text-success-400'
                    }`}
                  >
                    {fileData.frontMatter.draft ? '초안' : '발행됨'}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Markdown Preview */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 md:px-8 py-4 md:py-6 border-b border-border">
          <h2 className="text-base md:text-lg font-semibold text-foreground">미리보기</h2>
        </div>
        <article
          className="prose prose-slate dark:prose-invert max-w-none px-4 md:px-8 py-4 md:py-8"
          dangerouslySetInnerHTML={{ __html: fileData.htmlContent }}
        />
      </div>
    </div>
  );
}
