import { useQuery, queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { getAllPosts, getPostBySlug, getAllTags } from '@repo/content';
import { getBlobFiles } from '@/lib/blob';
import { postKeyConstructors } from './query-keys';

// Factory function for post queries using separated query keys
export const postQueries = {
  // Individual post query with factory pattern
  detail: (slug: string) =>
    queryOptions({
      queryKey: postKeyConstructors.detail(slug),
      queryFn: async () => {
        if (!slug) return null;
        const blobFiles = await getBlobFiles();
        const post = await getPostBySlug(blobFiles, slug);
        return post;
      },
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    }),

  // All posts list with optional filters
  allPosts: (filters?: { limit?: number; offset?: number; category?: string }) =>
    queryOptions({
      queryKey: postKeyConstructors.list(filters),
      queryFn: async () => {
        const blobFiles = await getBlobFiles();
        const posts = await getAllPosts(blobFiles);

        let filteredPosts = posts;

        // Apply filters
        if (filters?.category) {
          filteredPosts = posts.filter(post => post.slug.startsWith(filters.category + '/'));
        }

        if (filters?.limit || filters?.offset) {
          const start = filters?.offset || 0;
          const end = start + (filters?.limit || posts.length);
          filteredPosts = filteredPosts.slice(start, end);
        }

        return filteredPosts;
      },
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    }),

  // Recent posts with limit
  recent: (limit = 6) =>
    queryOptions({
      queryKey: postKeyConstructors.recent(limit),
      queryFn: async () => {
        const blobFiles = await getBlobFiles();
        const posts = await getAllPosts(blobFiles);
        return posts.slice(0, limit);
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchOnWindowFocus: false,
    }),

  // Tags query
  tags: () =>
    queryOptions({
      queryKey: postKeyConstructors.tags(),
      queryFn: async () => {
        const blobFiles = await getBlobFiles();
        const tags = await getAllTags(blobFiles);
        return tags;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }),
};

// Hooks that use the query options
export function useAllPosts(filters?: { limit?: number; offset?: number; category?: string }) {
  return useQuery(postQueries.allPosts(filters));
}

export function usePost(slug: string) {
  return useQuery({
    ...postQueries.detail(slug),
    enabled: !!slug,
  });
}

export function useRecentSuspensePosts(limit = 6) {
  return useSuspenseQuery(postQueries.recent(limit));
}

export function useRecentPosts(limit = 6) {
  return useQuery(postQueries.recent(limit));
}

export function useAllTags() {
  return useQuery(postQueries.tags());
}
