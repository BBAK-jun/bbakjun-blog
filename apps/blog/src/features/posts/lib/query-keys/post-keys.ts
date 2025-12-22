/**
 * Query keys for post-related queries
 *
 * This file contains only the query keys structure, separate from query functions.
 * This enables:
 * - Easy group invalidation (postKeys.all)
 * - Type-safe key construction
 * - Reusable across different hooks and components
 * - Clear separation of concerns
 */

// Base keys for hierarchical structure
export const postKeys = {
  // Base key for all post-related queries
  all: ['posts'] as const,

  // Sub-keys for different query types
  details: () => [...postKeys.all, 'detail'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  recent: () => [...postKeys.all, 'recent'] as const,
  tags: () => [...postKeys.all, 'tags'] as const,
} as const;

// Specific key constructors
export const postKeyConstructors = {
  // Individual post by slug
  detail: (slug: string) => [...postKeys.details(), slug] as const,

  // Posts list with optional filters
  list: (filters?: { limit?: number; offset?: number; category?: string }) =>
    [...postKeys.lists(), filters] as const,

  // Recent posts with limit
  recent: (limit = 6) => [...postKeys.recent(), { limit }] as const,

  // All tags
  tags: () => [...postKeys.tags()] as const,
} as const;

// Type helpers for better type safety
export type PostQueryKey = ReturnType<typeof postKeyConstructors.detail>;
export type PostsListQueryKey = ReturnType<typeof postKeyConstructors.list>;
export type RecentPostsQueryKey = ReturnType<typeof postKeyConstructors.recent>;
export type TagsQueryKey = ReturnType<typeof postKeyConstructors.tags>;

// Utility to extract slug from post detail query key
export const extractSlugFromPostKey = (queryKey: PostQueryKey): string => {
  return queryKey[2];
};

// Utility to extract filters from posts list query key
export const extractFiltersFromPostsListKey = (queryKey: PostsListQueryKey) => {
  return queryKey[2];
};

// Utility to extract limit from recent posts query key
export const extractLimitFromRecentPostsKey = (queryKey: RecentPostsQueryKey): number => {
  return (queryKey[2] as { limit: number }).limit;
};
