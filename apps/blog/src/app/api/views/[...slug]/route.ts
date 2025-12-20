import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/env'

// 조회수 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params
    const slugString = slug.join('/')

    const response = await fetch(
      `${env.NEXT_PUBLIC_ADMIN_URL}/api/v1/views/${slugString}`
    )

    if (!response.ok) {
      throw new Error('Failed to get view count from RPC')
    }

    const data = await response.json()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
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
    const sessionId = request.cookies.get('sessionId')?.value

    const response = await fetch(
      `${env.NEXT_PUBLIC_ADMIN_URL}/api/v1/views/${slugString}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          userAgent
        })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to increment view count from RPC')
    }

    const data = await response.json()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    )
  }
}