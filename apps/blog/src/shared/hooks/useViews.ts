'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/shared/lib/rpc';
import { useEffect } from 'react';

interface ViewData {
  views: number;
  loading: boolean;
  error: string | null;
}

const VIEW_SESSION_ID_KEY = 'view-session-id';

/**
 * 브라우저별 조회수 중복 집계 방지용 세션 ID 반환.
 * localStorage에 영속 저장되어 24시간 서버 세션 TTL과 함께 dedup를 구성한다.
 * localStorage 접근 불가 환경(시크릿 모드 등)에서는 빈 문자열을 반환하며,
 * 서버는 빈 세션 ID를 미전송과 동일하게 취급해 일반 increment로 처리한다.
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  try {
    let sessionId = window.localStorage.getItem(VIEW_SESSION_ID_KEY);

    if (!sessionId) {
      sessionId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `view-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(VIEW_SESSION_ID_KEY, sessionId);
    }

    return sessionId;
  } catch {
    return '';
  }
}

export function useViews(slug: string, increment: boolean = false): ViewData {
  const queryClient = useQueryClient();

  // 조회수 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['views', slug],
    queryFn: async () => {
      // Query parameter approach for nested paths like "DEV/my-post"
      const response = await client.rpc.getViewsBySlug.$get({
        query: { slug },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch views');
      }

      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!slug,
  });

  // 조회수 증가 mutation
  const incrementMutation = useMutation({
    mutationFn: async () => {
      // sessionId: 서버 24h 세션 dedup의 키.
      // userAgent: 서버 봇/크롤러 필터의 판별 소스.
      // 둘 다 누락되면 dedup·봇 필터가 무력화되어 새로고침마다 +1 된다.
      const response = await client.rpc.incrementViewsBySlug.$post({
        query: { slug },
        json: {
          sessionId: getOrCreateSessionId(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to increment views');
      }

      return response.json();
    },
    onSuccess: data => {
      // 캐시 업데이트
      queryClient.setQueryData(['views', slug], data);
    },
  });

  // increment가 true이고 아직 증가시키지 않은 경우 한 번만 실행
  useEffect(() => {
    if (increment && slug && !incrementMutation.isSuccess) {
      incrementMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [increment, slug]);

  return {
    views: data?.views ?? 0,
    loading: isLoading || (increment && incrementMutation.isPending),
    error: error?.message ?? incrementMutation.error?.message ?? null,
  };
}
