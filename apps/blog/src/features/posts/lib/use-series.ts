import { useQuery, queryOptions } from '@tanstack/react-query';
import { getBlobFiles } from '@/lib/blob';
import { getPostSeries, getSeriesNavigation } from '@repo/content';
import type { Series } from '@repo/types';
import { seriesKeyConstructors, seriesKeys } from './query-keys';

// Factory function for series queries using separated query keys
export const seriesQueries = {
  // Individual series query with factory pattern
  detail: (slug: string) =>
    queryOptions({
      queryKey: seriesKeyConstructors.detail(slug),
      queryFn: async () => {
        if (!slug) return null;

        const blobFiles = await getBlobFiles();
        const seriesData = await getPostSeries(blobFiles, slug);
        return seriesData;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }),

  // Series navigation for a specific post within a series
  navigation: (slug: string, seriesData?: Series | null) =>
    queryOptions({
      queryKey: seriesKeyConstructors.navigation(slug),
      queryFn: async () => {
        if (!slug || !seriesData) return null;

        const nav = getSeriesNavigation(seriesData, slug);
        // Calculate current index from the posts array
        const currentIndex = seriesData.posts.findIndex(p => p.slug === slug);

        return { ...nav, currentIndex };
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }),
};

// Legacy keys for backward compatibility - marked as deprecated
/** @deprecated Use seriesKeys.all from query-keys instead */
export const legacySeriesKeys = seriesKeys;

// Legacy options for backward compatibility - marked as deprecated
/** @deprecated Use seriesQueries.detail instead */
export const postSeriesOptions = seriesQueries.detail;

/** @deprecated Use seriesQueries.navigation instead */
export const seriesNavigationOptions = seriesQueries.navigation;

// Hooks that use the query options
export function usePostSeries(slug: string) {
  return useQuery({
    ...seriesQueries.detail(slug),
    enabled: !!slug,
  });
}

export function useSeriesNavigation(slug: string, seriesData?: Series | null) {
  return useQuery({
    ...seriesQueries.navigation(slug, seriesData),
    enabled: !!slug && !!seriesData,
  });
}
