'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { client } from '@/lib/rpc';
import { formatFileSize, formatDate } from '@/shared/lib/format';
import { FileText, Trash2, RefreshCw, Search, Filter, X } from 'lucide-react';

interface HistoryItem {
  id: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE';
  pathname: string;
  fileUrl: string | null;
  fileSize: number | null;
  contentType: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

interface HistoryData {
  history: HistoryItem[];
  total: number;
  hasMore: boolean;
}

interface HistoryWidgetProps {
  initialData: HistoryData;
}

export function HistoryWidget({ initialData }: HistoryWidgetProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoryData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const actionTypeMeta = {
    CREATE: {
      label: '생성',
      badge: 'bg-success-50 text-success-600',
      icon: FileText,
    },
    UPDATE: {
      label: '수정',
      badge: 'bg-accent text-accent-foreground',
      icon: FileText,
    },
    DELETE: {
      label: '삭제',
      badge: 'bg-error-50 text-error-600',
      icon: Trash2,
    },
  } as const;

  const updateUrlParams = (newPage: number, newSearch?: string, newActionType?: string) => {
    const params = new URLSearchParams();
    params.set('page', String(newPage));
    if (newSearch ?? searchTerm) {
      params.set('search', newSearch ?? searchTerm);
    }
    if (newActionType ?? actionTypeFilter) {
      const actionType = newActionType ?? actionTypeFilter;
      if (actionType !== 'ALL') {
        params.set('actionType', actionType);
      }
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const fetchHistory = async (newPage: number, newSearch?: string, newActionType?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await client.rpc['upload-history'].$get({
        query: {
          limit: String(50),
          offset: String((newPage - 1) * 50),
          search: newSearch ?? searchTerm ?? undefined,
          actionType:
            (newActionType ?? actionTypeFilter) === 'ALL'
              ? undefined
              : ((newActionType ?? actionTypeFilter) as 'CREATE' | 'UPDATE' | 'DELETE'),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const result = await response.json();
      setData(result);
      setPage(newPage);
      updateUrlParams(newPage, newSearch, newActionType);
    } catch (err) {
      setError('이력을 불러오는데 실패했습니다');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      if (page === 1) {
        fetchHistory(1, value, actionTypeFilter);
      } else {
        router.push(`?page=1&search=${encodeURIComponent(value)}${actionTypeFilter !== 'ALL' ? `&actionType=${actionTypeFilter}` : ''}`, {
          scroll: false,
        });
      }
    }, 300);
  };

  const handleActionTypeChange = (value: string) => {
    setActionTypeFilter(value);
    fetchHistory(1, searchTerm, value);
  };

  const handleLoadMore = () => {
    fetchHistory(page + 1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActionTypeFilter('ALL');
    fetchHistory(1, '', 'ALL');
  };

  const hasActiveFilters = searchTerm !== '' || actionTypeFilter !== 'ALL';

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-8">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-foreground mb-1 md:mb-2">
          업로드 이력
        </h2>
        <p className="text-sm text-muted-foreground">
          파일 업로드 및 수정 이력을 확인합니다
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="파일명 또는 경로로 검색..."
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-10 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
                aria-label="검색어 지우기"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={actionTypeFilter}
            onChange={e => handleActionTypeChange(e.target.value)}
            className="min-h-[44px] px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">전체</option>
            <option value="CREATE">생성</option>
            <option value="UPDATE">수정</option>
            <option value="DELETE">삭제</option>
          </select>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">필터 적용 중:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground text-xs rounded">
                검색: &quot;{searchTerm}&quot;
              </span>
            )}
            {actionTypeFilter !== 'ALL' && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  actionTypeMeta[actionTypeFilter as keyof typeof actionTypeMeta].badge
                }`}
              >
                {actionTypeMeta[actionTypeFilter as keyof typeof actionTypeMeta].label}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 min-h-[32px] px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              <X className="w-3 h-3" />
              초기화
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading && page === 1 ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-sm text-muted-foreground">이력을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-error-600">{error}</p>
        </div>
      ) : data.history.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters ? '검색 결과가 없습니다' : '업로드 이력이 없습니다'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">작업</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">파일</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">크기</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">작업자</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">시간</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map(item => {
                  const meta = actionTypeMeta[item.actionType];
                  return (
                    <tr key={item.id} className="border-b border-border/60 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <meta.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground font-mono break-all">
                            {item.pathname}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {item.fileSize ? formatFileSize(item.fileSize) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{item.uploadedBy || '-'}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground text-right">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {data.history.map(item => {
              const meta = actionTypeMeta[item.actionType];
              return (
                <div key={item.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <meta.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground font-mono break-all">
                      {item.pathname}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {item.fileSize && <span>{formatFileSize(item.fileSize)}</span>}
                    {item.uploadedBy && <span>· {item.uploadedBy}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-4 md:mt-6 flex justify-between items-center gap-2">
            <p className="text-sm text-muted-foreground">총 {data.total}건</p>
            {data.hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="min-h-[44px] px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    불러오는 중...
                  </>
                ) : (
                  '더보기'
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
