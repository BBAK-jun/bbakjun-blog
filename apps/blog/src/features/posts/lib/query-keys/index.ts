/**
 * Centralized query keys for all post-related features
 *
 * This provides a single entry point for all query keys while maintaining
 * separation of concerns and enabling easy group operations.
 */

// Re-export all query keys and constructors
export * from './post-keys';
export * from './series-keys';
export * from './related-posts-keys';

// Combined base keys for easy invalidation
export const allQueryKeys = {
  posts: ['posts'] as const,
  series: ['series'] as const,
  relatedPosts: ['relatedPosts'] as const,
} as const;

// Combined invalidation helpers
export const allPostRelatedKeys = [
  allQueryKeys.posts,
  allQueryKeys.series,
  allQueryKeys.relatedPosts,
] as const;

// Type guard utilities
export type AnyPostRelatedQueryKey =
  | import('./post-keys').PostQueryKey
  | import('./post-keys').PostsListQueryKey
  | import('./post-keys').RecentPostsQueryKey
  | import('./post-keys').TagsQueryKey
  | import('./series-keys').SeriesQueryKey
  | import('./series-keys').SeriesNavigationQueryKey
  | import('./related-posts-keys').RelatedPostsQueryKey;
