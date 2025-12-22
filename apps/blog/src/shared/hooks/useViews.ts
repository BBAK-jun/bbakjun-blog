'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/rpc';
import { useEffect } from 'react';

interface ViewData {
  views: number;
  loading: boolean;
  error: string | null;
}

export function useViews(slug: string, increment: boolean = false): ViewData {
  const queryClient = useQueryClient();

  // 조회수 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['views', slug],
    queryFn: async () => {
      const response = await client.api.rpc.getViewsBySlug[':slug'].$get({
        param: { slug },
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
      const response = await client.api.rpc.incrementViewsBySlug[':slug'].$post({
        param: { slug },
        json: {},
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
