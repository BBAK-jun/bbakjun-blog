import { ViewCounter } from '@repo/analytics'
import { getAllPosts } from '@repo/content'
import { getBlobFiles } from '@/lib/blob'

export interface PopularPost {
  slug: string
  title: string
  views: number
  date: string
  description?: string
  tags?: string[]
  readingTime?: string
}

export interface ViewStats {
  popularPosts: PopularPost[]
  totalViews: number
  totalPosts: number
}

/**
 * 서버 컴포넌트용 통계 데이터 조회 함수
 * - Redis와 블로그 포스트 데이터를 병렬로 조회
 * - N+1 문제 해결 (Map 기반 조인)
 * - 타임아웃 처리 및 폴백 로직
 */
export async function getPopularPostsStats(): Promise<ViewStats> {
  try {
    console.log('[getPopularPostsStats] 통계 조회 시작')

    // 타임아웃 헬퍼 함수
    const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ])
    }

    // 1. 병렬 데이터 페칭 (성능 향상)
    const [blobFiles, popularSlugs, totalViews] = await Promise.all([
      getBlobFiles(),
      withTimeout(ViewCounter.getPopularPosts(10), 10000).catch(() => []),
      withTimeout(ViewCounter.getTotalViews(), 8000).catch(() => 0)
    ])

    console.log(`[getPopularPostsStats] 인기글 ${popularSlugs.length}개, 총 조회수 ${totalViews}`)

    // 2. 포스트 데이터 로드
    const posts = await getAllPosts(blobFiles)

    // 3. Map으로 O(1) 조회 (N+1 문제 해결)
    const postMap = new Map(posts.map(p => [p.slug, p]))

    // 4. 데이터 조인
    const enrichedPopularPosts: PopularPost[] = popularSlugs
      .map(({ slug, views }) => {
        const post = postMap.get(slug)
        if (!post) return null

        return {
          slug,
          title: post.frontMatter.title,
          views,
          date: post.frontMatter.date,
          description: post.frontMatter.description || undefined,
          tags: post.frontMatter.tags || undefined,
          readingTime: post.readingTime || undefined
        }
      })
      .filter((post): post is NonNullable<typeof post> => post !== null)

    console.log(`[getPopularPostsStats] 통계 조회 완료: ${enrichedPopularPosts.length}개 포스트`)

    return {
      popularPosts: enrichedPopularPosts,
      totalViews,
      totalPosts: posts.length
    }
  } catch (error) {
    console.error('[getPopularPostsStats] 에러 발생:', error)

    // 폴백: 빈 통계 반환
    return {
      popularPosts: [],
      totalViews: 0,
      totalPosts: 0
    }
  }
}
