'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatFileSize, formatDate } from '@/shared/lib/format';
import {
  FileText,
  Trash2,
  RefreshCw,
  Search,
} from 'lucide-react';

// Server action for fetching upload history
async function fetchUploadHistory(params: {
  limit: number;
  offset: number;
  search?: string;
  actionType?: 'CREATE' | 'UPDATE' | 'DELETE';
}) {
  const response = await fetch('/api/rpc/getUploadHistory?' + new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    ...(params.search && { search: params.search }),
    ...(params.actionType && { actionType: params.actionType }),
  }));

  if (!response.ok) {
    throw new Error('Failed to fetch upload history');
  }

  return response.json();
}

interface HistoryItem {
  id: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE';
  pathname: string;
  fileUrl: string | null;
  fileSize: number | null;
  contentType: string | null;
  uploadedBy: string;
  createdAt: Date;
}

interface HistoryWidgetProps {
  initialData: {
    history: HistoryItem[];
    total: number;
    hasMore: boolean;
  };
}

export default function HistoryWidget({ initialData }: HistoryWidgetProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['upload-history', page, searchTerm, actionTypeFilter],
    queryFn: () => fetchUploadHistory({
      limit: 50,
      offset: (page - 1) * 50,
      search: searchTerm || undefined,
      actionType: actionTypeFilter === 'ALL' ? undefined : actionTypeFilter as 'CREATE' | 'UPDATE' | 'DELETE',
    }),
    initialData,
  });

  const actionTypeLabels: Record<HistoryItem['actionType'], { label: string; color: string }> = {
    CREATE: { label: '생성', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    UPDATE: { label: '수정', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    DELETE: { label: '삭제', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  };

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const handleFilterChange = (value: string) => {
    setActionTypeFilter(value);
    setPage(1);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          업로드 이력
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          파일 업로드 및 수정 이력을 확인합니다
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="파일명 또는 경로로 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <select
          value={actionTypeFilter}
          onChange={e => handleFilterChange(e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="ALL">전체</option>
          <option value="CREATE">생성</option>
          <option value="UPDATE">수정</option>
          <option value="DELETE">삭제</option>
        </select>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">이력을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">이력을 불러오는데 실패했습니다</p>
        </div>
      ) : data.history.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">업로드 이력이 없습니다</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">작업</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">파일</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">크기</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">작업자</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">시간</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((item: HistoryItem) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionTypeLabels[item.actionType].color}`}>
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
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {item.uploadedBy}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 text-right">
                      {formatDate(item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              총 {data.total}건
            </p>
            {data.hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                더보기
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
