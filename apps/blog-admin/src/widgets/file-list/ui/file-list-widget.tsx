'use client';

import { useRouter } from 'next/navigation';
import { FileText, X, Filter as FilterIcon } from 'lucide-react';
import { FileListItem, type BlobFile } from '@/entities/file';
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

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
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
            <FilterIcon className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">필터 적용 중:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                검색: "{searchQuery}"
              </span>
            )}
            {category !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                카테고리: {category}
              </span>
            )}
            {sort !== 'date-desc' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                정렬:{' '}
                {sort === 'date-asc'
                  ? '오래된순'
                  : sort === 'name-asc'
                    ? '이름(A-Z)'
                    : sort === 'name-desc'
                      ? '이름(Z-A)'
                      : sort === 'size-asc'
                        ? '크기(작은순)'
                        : '크기(큰순)'}
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <X className="w-3 h-3" />
              초기화
            </button>
          </div>
        )}
      </div>

      {/* Empty State - No results */}
      {files.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 mb-2">검색 결과가 없습니다</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
            다른 검색어나 필터를 시도해보세요
          </p>
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            필터 초기화
          </button>
        </div>
      )}

      {/* Files Table */}
      {files.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  제목
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  경로
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  크기
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  게시 날짜
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <FileListItem
                  key={file.pathname}
                  file={file}
                  onView={f =>
                    router.push(`/dashboard/files/view?pathname=${encodeURIComponent(f.pathname)}`)
                  }
                  onDelete={onDelete}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                />
              ))}
            </tbody>
          </table>

          {/* Files Count */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">총 {files.length}개의 파일</p>
          </div>
        </div>
      )}
    </div>
  );
}
