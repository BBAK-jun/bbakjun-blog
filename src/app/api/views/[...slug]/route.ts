import { NextRequest, NextResponse } from 'next/server'
import { ViewCounter } from '@/lib/redis'

// 조회수 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params
    const slugString = slug.join('/')
    const views = await ViewCounter.get(slugString)

    return NextResponse.json(
      { slug: slugString, views },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      }
    )
  } catch (error) {
    console.error('Error getting view count:', error)
    return NextResponse.json(
      { error: 'Failed to get view count' },
      { status: 500 }
    )
  }
}

// 조회수 증가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params
    const slugString = slug.join('/')

    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 봇이나 크롤러 제외
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i,
      /pinterest/i
    ]

    const isBot = botPatterns.some(pattern => pattern.test(userAgent))

    if (isBot) {
      const views = await ViewCounter.get(slugString)
      return NextResponse.json({ slug: slugString, views, incremented: false })
    }

    const views = await ViewCounter.increment(slugString)

    return NextResponse.json(
      { slug: slugString, views, incremented: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    )
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    )
  }
}