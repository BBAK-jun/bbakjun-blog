'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { client } from '@/lib/rpc';
import { formatFileSize, formatDate } from '@/shared/lib/format';
import { FileText, Upload, Trash2, RefreshCw, Search, Filter, X } from 'lucide-react';

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

  const actionTypeLabels = {
    CREATE: { label: '생성', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    UPDATE: { label: '수정', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    DELETE: { label: '삭제', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  };

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
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">업로드 이력</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          파일 업로드 및 수정 이력을 확인합니다
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="파일명 또는 경로로 검색..."
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={actionTypeFilter}
            onChange={e => handleActionTypeChange(e.target.value)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">필터 적용 중:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                검색: &quot;{searchTerm}&quot;
              </span>
            )}
            {actionTypeFilter !== 'ALL' && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  actionTypeLabels[actionTypeFilter as keyof typeof actionTypeLabels].color
                }`}
              >
                {actionTypeLabels[actionTypeFilter as keyof typeof actionTypeLabels].label}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <X className="w-3 h-3" />
              초기화
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading && page === 1 ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">이력을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : data.history.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {hasActiveFilters ? '검색 결과가 없습니다' : '업로드 이력이 없습니다'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    작업
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    파일
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    크기
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    작업자
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                    시간
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.history.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          actionTypeLabels[item.actionType].color
                        }`}
                      >
                        {actionTypeLabels[item.actionType].label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {item.actionType === 'DELETE' ? (
                          <Trash2 className="w-4 h-4 text-slate-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-sm text-slate-900 dark:text-white font-mono">
                          {item.pathname}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {item.fileSize ? formatFileSize(item.fileSize) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{item.uploadedBy || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 text-right">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">총 {data.total}건</p>
            {data.hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
