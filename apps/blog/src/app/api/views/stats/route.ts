import { NextResponse } from 'next/server'
import { env } from '@/env'

// 조회수 통계 조회 - RPC로 위임
export async function GET() {
  try {
    console.log('[stats] RPC API 호출 시작')

    const response = await fetch(
      `${env.NEXT_PUBLIC_ADMIN_URL}/api/v1/views/stats`
    )

    if (!response.ok) {
      throw new Error('Failed to get stats from RPC')
    }

    const data = await response.json()

    console.log('[stats] RPC API 응답 완료')

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('[stats] API 에러:', error)

    // 에러 발생시 기본값 반환
    const fallbackStats = {
      totalViews: 0,
      totalPosts: 0,
      averageViews: 0,
      popularPosts: [],
      recentPosts: []
    }

    return NextResponse.json(fallbackStats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    })
  }
}