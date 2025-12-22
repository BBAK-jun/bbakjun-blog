/**
 * Query keys for related posts queries
 *
 * This file contains only the query keys structure, separate from query functions.
 * This enables:
 * - Easy group invalidation (relatedPostsKeys.all)
 * - Type-safe key construction
 * - Reusable across different hooks and components
 * - Clear separation of concerns
 */

// Base keys for hierarchical structure
export const relatedPostsKeys = {
  // Base key for all related posts queries
  all: ['relatedPosts'] as const,

  // Sub-keys for different query types
  forPost: () => [...relatedPostsKeys.all, 'post'] as const,
} as const;

// Specific key constructors
export const relatedPostsKeyConstructors = {
  // Related posts for a specific post with limit
  forPost: (slug: string, limit = 4) => [...relatedPostsKeys.forPost(), slug, { limit }] as const,
} as const;

// Type helpers for better type safety
export type RelatedPostsQueryKey = ReturnType<typeof relatedPostsKeyConstructors.forPost>;

// Utility to extract slug and limit from related posts query key
export const extractSlugAndLimitFromRelatedPostsKey = (
  queryKey: RelatedPostsQueryKey
): {
  slug: string;
  limit: number;
} => {
  return {
    slug: queryKey[2],
    limit: (queryKey[3] as { limit: number }).limit,
  };
};
