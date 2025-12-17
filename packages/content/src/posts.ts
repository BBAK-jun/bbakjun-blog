import type { Post } from '@repo/types'
import { fetchAllPostsFromBlobFiles, type BlobFileInfo } from './posts-blob'

// CDC 캐시에서 가져온 BlobFile 목록 (전역 변수)
let blobFiles: BlobFileInfo[] = []

/**
 * CDC 캐시에서 가져온 BlobFile 목록을 설정
 */
export function setBlobFiles(files: BlobFileInfo[]): void {
  blobFiles = files
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const allPosts = await fetchAllPostsFromBlobFiles(blobFiles)
  return allPosts.find(post => post.slug === slug) || null
}

export async function getAllPosts(): Promise<Post[]> {
  const posts = await fetchAllPostsFromBlobFiles(blobFiles)
  return posts
    .filter((post) => !post.frontMatter.draft)
    .sort((a, b) => {
      const orderA = a.frontMatter.order ?? 999999
      const orderB = b.frontMatter.order ?? 999999
      if (orderA !== orderB) return orderA - orderB
      return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime()
    })
}

export async function getAllPostsIncludingDrafts(): Promise<Post[]> {
  const posts = await fetchAllPostsFromBlobFiles(blobFiles)
  return posts.sort((a, b) => {
    const orderA = a.frontMatter.order ?? 999999
    const orderB = b.frontMatter.order ?? 999999
    if (orderA !== orderB) return orderA - orderB
    return new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime()
  })
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const allPosts = await getAllPosts()
  return allPosts.filter((post) =>
    post.frontMatter.tags?.includes(tag)
  )
}

export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllPosts()
  const tags = new Set<string>()

  allPosts.forEach((post) => {
    post.frontMatter.tags?.forEach((tag) => tags.add(tag))
  })

  return Array.from(tags).sort()
}

// 연관 글을 찾는 함수
export async function getRelatedPosts(currentPost: Post, maxPosts: number = 4): Promise<Post[]> {
  const allPosts = await getAllPosts()
  const currentSlug = currentPost.slug
  const currentTags = currentPost.frontMatter.tags || []
  const currentCategory = currentPost.slug.split('/')[0] // 첫 번째 폴더를 카테고리로 사용

  // 현재 글 제외
  const otherPosts = allPosts.filter(post => post.slug !== currentSlug)

  // 각 글에 관련성 점수 계산
  const postsWithScores = otherPosts.map(post => {
    let score = 0
    const postTags = post.frontMatter.tags || []
    const postCategory = post.slug.split('/')[0]

    // 태그 매칭 점수 (가장 높은 가중치)
    const commonTags = postTags.filter(tag => currentTags.includes(tag))
    score += commonTags.length * 3

    // 카테고리 매칭 점수
    if (postCategory === currentCategory) {
      score += 2
    }

    // 최신성 점수 (최근 글일수록 약간의 보너스)
    const postDate = new Date(post.frontMatter.date).getTime()
    const currentDate = new Date(currentPost.frontMatter.date).getTime()
    const daysDiff = Math.abs(currentDate - postDate) / (1000 * 60 * 60 * 24)
    if (daysDiff < 30) {
      score += 0.5
    }

    return {
      post,
      score,
      commonTags: commonTags.length,
      sameCategory: postCategory === currentCategory
    }
  })

  // 점수순으로 정렬하고 상위 글들 반환
  return postsWithScores
    .sort((a, b) => {
      // 점수가 같으면 공통 태그 수로, 그것도 같으면 날짜로 정렬
      if (b.score === a.score) {
        if (b.commonTags === a.commonTags) {
          return new Date(b.post.frontMatter.date).getTime() - new Date(a.post.frontMatter.date).getTime()
        }
        return b.commonTags - a.commonTags
      }
      return b.score - a.score
    })
    .slice(0, maxPosts)
    .map(item => item.post)
}
