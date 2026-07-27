'use client';

import { useRouter } from 'next/navigation';
import { FileText, X, Filter as FilterIcon, Edit, Trash2, Eye } from 'lucide-react';
import { type BlobFile } from '@/entities/file';
import { SearchInput } from '@/features/file-search';
import { CategoryFilter, SortSelect, type SortOption } from '@/features/file-filter';

interface FileListWidgetProps {
  files: BlobFile[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  clearSearch: () => void;
  category: string;
  categories: string[];
  setCategory: (value: string) => void;
  sort: SortOption;
  setSort: (value: SortOption) => void;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
  onDelete: (file: BlobFile) => void;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
}

export function FileListWidget({
  files,
  searchQuery,
  setSearchQuery,
  clearSearch,
  category,
  categories,
  setCategory,
  sort,
  setSort,
  hasActiveFilters,
  clearAllFilters,
  onDelete,
  formatFileSize,
  formatDate,
}: FileListWidgetProps) {
  const router = useRouter();
  const hasAnyFilter = searchQuery !== '' || hasActiveFilters;

  const getSortLabel = (s: SortOption) => {
    switch (s) {
      case 'date-asc':
        return '오래된순';
      case 'name-asc':
        return '이름(A-Z)';
      case 'name-desc':
        return '이름(Z-A)';
      case 'size-asc':
        return '크기(작은순)';
      case 'size-desc':
        return '크기(큰순)';
      default:
        return '최신순';
    }
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={clearSearch}
            placeholder="파일명 또는 경로로 검색..."
          />
          <CategoryFilter value={category} categories={categories} onChange={setCategory} />
          <SortSelect value={sort} onChange={setSort} />
        </div>

        {/* Active Filters Summary */}
        {hasAnyFilter && (
          <div className="flex items-center gap-2 flex-wrap">
            <FilterIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">필터 적용 중:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground text-xs rounded">
                검색: &quot;{searchQuery}&quot;
              </span>
            )}
            {category !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground text-xs rounded">
                카테고리: {category}
              </span>
            )}
            {sort !== 'date-desc' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-400 text-xs rounded">
                정렬: {getSortLabel(sort)}
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-2 py-1 min-h-[44px] text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              <X className="w-3 h-3" />
              초기화
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {files.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-foreground mb-2">검색 결과가 없습니다</p>
          <p className="text-sm text-muted-foreground mb-4">
            다른 검색어나 필터를 시도해보세요
          </p>
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm text-primary hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            필터 초기화
          </button>
        </div>
      )}

      {/* Files Table - Desktop only */}
      {files.length > 0 && (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">제목</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">경로</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">크기</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">
                    게시 날짜
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">액션</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => {
                  const filename = file.pathname.split('/').pop() || file.pathname;
                  return (
                    <tr
                      key={file.pathname}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/files/view?pathname=${encodeURIComponent(file.pathname)}`
                            )
                          }
                          className="text-left text-foreground hover:text-primary font-medium"
                        >
                          {filename}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground font-mono break-all">
                        {file.pathname}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                        {formatFileSize(Number(file.size))}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                        {formatDate(file.uploadedAt.toString())}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/files/view?pathname=${encodeURIComponent(file.pathname)}`
                              )
                            }
                            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                            title="보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/files/edit?pathname=${encodeURIComponent(file.pathname)}`
                              )
                            }
                            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                            title="편집"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(file)}
                            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-muted-foreground hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-950/40 rounded"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Files Cards - Mobile only */}
          <div className="md:hidden space-y-3">
            {files.map(file => {
              const filename = file.pathname.split('/').pop() || file.pathname;
              return (
                <div
                  key={file.pathname}
                  className="bg-card rounded-lg border border-border p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/files/view?pathname=${encodeURIComponent(file.pathname)}`
                          )
                        }
                        className="text-left text-foreground font-medium hover:text-primary block truncate w-full"
                      >
                        {filename}
                      </button>
                      <p className="text-xs text-muted-foreground font-mono mt-1 break-all line-clamp-2">
                        {file.pathname}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>{formatFileSize(Number(file.size))}</span>
                    <span>{formatDate(file.uploadedAt.toString())}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/files/view?pathname=${encodeURIComponent(file.pathname)}`
                        )
                      }
                      className="inline-flex flex-col items-center gap-1 py-2 min-h-[44px] text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      보기
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/files/edit?pathname=${encodeURIComponent(file.pathname)}`
                        )
                      }
                      className="inline-flex flex-col items-center gap-1 py-2 min-h-[44px] text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      편집
                    </button>
                    <button
                      onClick={() => onDelete(file)}
                      className="inline-flex flex-col items-center gap-1 py-2 min-h-[44px] text-xs text-muted-foreground hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-950/40 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Files Count */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">총 {files.length}개의 파일</p>
          </div>
        </>
      )}
    </div>
  );
}
