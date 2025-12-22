import { useQuery } from '@tanstack/react-query'
import { getAllPosts, getPostBySlug, getAllTags } from '@repo/content'
import { getBlobFiles } from '@/lib/blob'
import { Post } from '@repo/types'

// Query keys
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (slug: string) => [...postKeys.details(), slug] as const,
  tags: () => [...postKeys.all, 'tags'] as const,
}

export function useAllPosts(filters?: { limit?: number; offset?: number; category?: string }) {
  return useQuery({
    queryKey: postKeys.list(filters),
    queryFn: async () => {
      const blobFiles = await getBlobFiles()
      const posts = await getAllPosts(blobFiles)

      let filteredPosts = posts

      // Apply filters
      if (filters?.category) {
        filteredPosts = posts.filter(post =>
          post.slug.startsWith(filters.category + '/')
        )
      }

      if (filters?.limit || filters?.offset) {
        const start = filters?.offset || 0
        const end = start + (filters?.limit || posts.length)
        filteredPosts = filteredPosts.slice(start, end)
      }

      return filteredPosts
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  })
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: postKeys.detail(slug),
    queryFn: async () => {
      if (!slug) return null
      const blobFiles = await getBlobFiles()
      const post = await getPostBySlug(blobFiles, slug)
      return post
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!slug,
  })
}

export function useAllTags() {
  return useQuery({
    queryKey: postKeys.tags(),
    queryFn: async () => {
      const blobFiles = await getBlobFiles()
      const tags = await getAllTags(blobFiles)
      return tags
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}