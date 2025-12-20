import { env } from '@/env'

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
 * - Blog-Admin RPC로 통계 데이터 조회
 */
export async function getPopularPostsStats(): Promise<ViewStats> {
  try {
    console.log('[getPopularPostsStats] RPC 통계 조회 시작')

    const response = await fetch(
      `${env.NEXT_PUBLIC_ADMIN_URL}/api/v1/views/stats`,
      {
        next: { revalidate: 300 } // 5분 캐시
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch stats from RPC')
    }

    const data = await response.json()

    console.log(`[getPopularPostsStats] RPC 통계 조회 완료: ${data.popularPosts.length}개 포스트`)

    return {
      popularPosts: data.popularPosts,
      totalViews: data.totalViews,
      totalPosts: data.totalPosts
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
