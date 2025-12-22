import { useQuery, queryOptions } from '@tanstack/react-query';
import { getBlobFiles } from '@/lib/blob';
import { getPostBySlug, getRelatedPosts } from '@repo/content';
import { relatedPostsKeyConstructors, relatedPostsKeys } from './query-keys';

// Factory function for related posts queries using separated query keys
export const relatedPostsQueries = {
  // Related posts for a specific post with limit
  forPost: (slug: string, limit = 4) =>
    queryOptions({
      queryKey: relatedPostsKeyConstructors.forPost(slug, limit),
      queryFn: async () => {
        if (!slug) return [];

        const blobFiles = await getBlobFiles();
        const currentPost = await getPostBySlug(blobFiles, slug);

        if (!currentPost) return [];

        const related = await getRelatedPosts(blobFiles, currentPost, limit);
        return related;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: false,
    }),
};

// Legacy keys for backward compatibility - marked as deprecated
/** @deprecated Use relatedPostsKeys.all from query-keys instead */
export const legacyRelatedPostsKeys = relatedPostsKeys;

// Legacy options for backward compatibility - marked as deprecated
/** @deprecated Use relatedPostsQueries.forPost instead */
export const relatedPostsOptions = relatedPostsQueries.forPost;

// Hook that uses the query options
export function useRelatedPosts(slug: string, limit = 4) {
  return useQuery({
    ...relatedPostsQueries.forPost(slug, limit),
    enabled: !!slug,
  });
}
