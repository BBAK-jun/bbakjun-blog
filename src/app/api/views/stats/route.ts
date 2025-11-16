import { NextResponse } from 'next/server'
import { ViewCounter } from '@/lib/redis'
import { getAllPosts } from '@/lib/posts'

// 조회수 통계 조회 - 타임아웃과 에러 핸들링 개선
export async function GET() {
  try {
    console.log('[stats] API 호출 시작')

    // 타임아웃 함수 추가
    const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
        )
      ])
    }

    // 포스트 데이터는 빠르게 가져옴
    const posts = getAllPosts()
    console.log(`[stats] ${posts.length}개 포스트 로드 완료`)

    // Redis 작업들을 단계별로 실행하여 타임아웃 방지
    let popularPosts: Array<{ slug: string; views: number }> = []
    let totalViews = 0

    try {
      console.log('[stats] 인기글 조회 시작')
      popularPosts = await withTimeout(ViewCounter.getPopularPosts(10), 10000) // 10초 타임아웃
      console.log(`[stats] 인기글 ${popularPosts.length}개 조회 완료`)
    } catch (error) {
      console.error('[stats] 인기글 조회 실패:', error)
      // 인기글 조회 실패시 빈 배열로 처리
      popularPosts = []
    }

    try {
      console.log('[stats] 총 조회수 계산 시작')
      totalViews = await withTimeout(ViewCounter.getTotalViews(), 8000) // 8초 타임아웃
      console.log(`[stats] 총 조회수 ${totalViews} 계산 완료`)
    } catch (error) {
      console.error('[stats] 총 조회수 계산 실패:', error)
      // 총 조회수 계산 실패시 인기글에서 계산
      totalViews = popularPosts.reduce((sum, post) => sum + post.views, 0)
    }

    // 인기글에 포스트 메타데이터 추가
    const enrichedPopularPosts = popularPosts.map(({ slug, views }) => {
      const post = posts.find(p => p.slug === slug)
      return {
        slug,
        title: post?.frontMatter.title || slug,
        views,
        date: post?.frontMatter.date || '',
        description: post?.frontMatter.description || '',
        tags: post?.frontMatter.tags || [],
        readingTime: post?.readingTime || ''
      }
    }).filter(post => post.title !== post.slug) // 포스트 메타데이터가 없는 것들 제외

    const stats = {
      totalViews,
      totalPosts: posts.length,
      averageViews: posts.length > 0 ? Math.round(totalViews / posts.length) : 0,
      popularPosts: enrichedPopularPosts,
      recentPosts: posts
        .slice(0, 10)
        .map(post => ({
          slug: post.slug,
          title: post.frontMatter.title,
          views: 0, // 최신글은 조회수 0으로 설정 (성능 향상)
          date: post.frontMatter.date,
          description: post.frontMatter.description || '',
          tags: post.frontMatter.tags || [],
          readingTime: post.readingTime || ''
        }))
    }

    console.log('[stats] API 응답 준비 완료')

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('[stats] API 에러:', error)

    // 에러 발생시 기본값 반환
    const posts = getAllPosts()
    const fallbackStats = {
      totalViews: 0,
      totalPosts: posts.length,
      averageViews: 0,
      popularPosts: [],
      recentPosts: posts
        .slice(0, 10)
        .map(post => ({
          slug: post.slug,
          title: post.frontMatter.title,
          views: 0,
          date: post.frontMatter.date,
          description: post.frontMatter.description || '',
          tags: post.frontMatter.tags || [],
          readingTime: post.readingTime || ''
        }))
    }

    return NextResponse.json(fallbackStats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' // 에러시 짧은 캐시
      }
    })
  }
}