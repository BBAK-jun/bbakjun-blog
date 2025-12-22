import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { getPopularPostsStats } from '@/lib/stats';

export const popularPostsKeys = {
  all: ['popularPosts'] as const,
  stats: () => [...popularPostsKeys.all, 'stats'] as const,
};

export function usePopularPostsStats() {
  return useQuery({
    queryKey: popularPostsKeys.stats(),
    queryFn: async () => {
      const stats = await getPopularPostsStats();
      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
export function usePopluarPostsStatsSuspsenseQuery() {
  return useSuspenseQuery({
    queryKey: popularPostsKeys.stats(),
    queryFn: async () => {
      const stats = await getPopularPostsStats();
      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
