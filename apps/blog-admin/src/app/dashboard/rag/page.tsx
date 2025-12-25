'use client';

import { Button } from '@repo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hc } from 'hono/client';
import { BarChart3, Clock, Database, Search, type LucideIcon } from 'lucide-react';
import type { RagGatewayClient } from '@apps/rag-gateway';

// RAG 게이트웨이 RPC 클라이언트
const ragGatewayClient = hc<RagGatewayClient>(
  process.env.NEXT_PUBLIC_RAG_GATEWAY_URL || 'http://localhost:3002'
);

// RPC를 통한 API 함수들
const ragApi = {
  // RAG 통계 조회
  getStats: async () => {
    const response = await ragGatewayClient.admin.stats.$get();
    if (!response.ok) {
      throw new Error('RAG 통계 조회 실패');
    }
    return response.json();
  },

  // 인제스션 시작
  startIngestion: async (force: boolean = false, batchSize: number = 20) => {
    const response = await ragGatewayClient.admin.reindex.$post({
      json: { force, batchSize },
    });
    if (!response.ok) {
      throw new Error('인제스션 시작 실패');
    }
    return response.json();
  },

  // 인제스션 상태 확인
  getIngestionStatus: async (jobId: string) => {
    const response = await ragGatewayClient.admin.reindex[':jobId'].$get({
      param: { jobId },
    });
    if (!response.ok) {
      throw new Error('상태 확인 실패');
    }
    return response.json();
  },
};

export default function RAGManagement() {
  const queryClient = useQueryClient();

  // RAG 통계 쿼리
  const {
    data: stats,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['rag', 'stats'],
    queryFn: ragApi.getStats,
    refetchInterval: 30000, // 30초마다 자동 갱신
    retry: 1,
  });

  // 인제스션 시작 뮤테이션
  const ingestionMutation = useMutation({
    mutationFn: ({ force, batchSize }: { force: boolean; batchSize: number }) =>
      ragApi.startIngestion(force, batchSize),
    onSuccess: data => {
      // 상태 폴링 시작
      pollJobStatus(data.jobId);
    },
    onError: err => {
      console.error('인제스션 시작 실패:', err);
      alert('인제스션을 시작하는데 실패했습니다');
    },
  });

  // 현재 작업 상태 폴링
  const pollJobStatus = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const job = await ragApi.getIngestionStatus(jobId);

        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(interval);
          // 통계 갱신
          queryClient.invalidateQueries({ queryKey: ['rag', 'stats'] });
        }
      } catch (error) {
        console.error('상태 확인 실패:', error);
      }
    }, 2000);

    // 5분 후 정리
    setTimeout(() => clearInterval(interval), 300000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">RAG 관리</h1>
        <p className="text-muted-foreground mt-2">
          블로그 콘텐츠 검색 및 AI 질문 답변 시스템을 관리합니다
        </p>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              RAG 시스템 정보를 불러오는 중...
            </p>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">
            RAG 시스템에 연결할 수 없습니다. 서비스 상태를 확인해주세요.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={Database}
          title="총 문서"
          value={stats?.documents.total || 0}
          subtitle={`인덱싱된 문서: ${stats?.documents.indexed || 0}`}
        />
        <StatCard
          icon={Search}
          title="총 질의"
          value={stats?.usage.totalQueries || 0}
          subtitle="누적 질문 수"
        />
        <StatCard
          icon={Clock}
          title="평균 응답시간"
          value={`${stats?.usage.avgQueryTime || 0}ms`}
          subtitle="RAG 쿼리 평균"
        />
        <StatCard
          icon={BarChart3}
          title="시스템 상태"
          value="Active"
          subtitle={stats?.system.uptime || ''}
        />
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4">문서 인덱싱</h2>
        <p className="text-muted-foreground mb-4">
          블로그 포스트들을 RAG 시스템에 인덱싱하여 검색 가능하게 만듭니다
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => ingestionMutation.mutate({ force: false, batchSize: 20 })}
            disabled={ingestionMutation.isPending}
          >
            {ingestionMutation.isPending ? '인덱싱 중...' : '변경된 문서만 인덱싱'}
          </Button>
          <Button
            variant="outline"
            onClick={() => ingestionMutation.mutate({ force: true, batchSize: 20 })}
            disabled={ingestionMutation.isPending}
          >
            전체 재인덱싱
          </Button>
        </div>
      </div>

      {/* Category Distribution */}
      {stats?.documents.categories && Object.keys(stats.documents.categories).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">카테고리별 문서 수</h2>
          <div className="space-y-2">
            {Object.entries(stats.documents.categories).map(([category, count]) => (
              <div key={category} className="flex justify-between">
                <span className="text-sm font-medium">{category}</span>
                <span className="text-sm text-muted-foreground">{count}개</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
    </div>
  );
}
