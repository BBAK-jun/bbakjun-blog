/**
 * Query keys for series-related queries
 *
 * This file contains only the query keys structure, separate from query functions.
 * This enables:
 * - Easy group invalidation (seriesKeys.all)
 * - Type-safe key construction
 * - Reusable across different hooks and components
 * - Clear separation of concerns
 */

// Base keys for hierarchical structure
export const seriesKeys = {
  // Base key for all series-related queries
  all: ['series'] as const,

  // Sub-keys for different query types
  details: () => [...seriesKeys.all, 'detail'] as const,
  navigation: () => [...seriesKeys.all, 'navigation'] as const,
} as const;

// Specific key constructors
export const seriesKeyConstructors = {
  // Individual series by slug
  detail: (slug: string) => [...seriesKeys.details(), slug] as const,

  // Series navigation for a specific post within a series
  navigation: (slug: string) => [...seriesKeys.navigation(), slug] as const,
} as const;

// Type helpers for better type safety
export type SeriesQueryKey = ReturnType<typeof seriesKeyConstructors.detail>;
export type SeriesNavigationQueryKey = ReturnType<typeof seriesKeyConstructors.navigation>;

// Utility to extract slug from series query keys
export const extractSlugFromSeriesKey = (queryKey: SeriesQueryKey): string => {
  return queryKey[2];
};

export const extractSlugFromSeriesNavigationKey = (queryKey: SeriesNavigationQueryKey): string => {
  return queryKey[2];
};
