import { NextResponse } from 'next/server'
import { ViewCounter } from '@/lib/redis'
import { getAllPosts } from '@/lib/posts'

// 조회수 통계 조회
export async function GET() {
  try {
    const [totalViews, posts, popularPosts] = await Promise.all([
      ViewCounter.getTotalViews(),
      getAllPosts(),
      ViewCounter.getPopularPosts(10)
    ])

    const postSlugs = posts.map(post => post.slug)
    const viewCounts = await ViewCounter.getMultiple(postSlugs)

    const postsWithViews = posts.map(post => ({
      slug: post.slug,
      title: post.frontMatter.title,
      views: viewCounts[post.slug] || 0,
      date: post.frontMatter.date
    }))

    const stats = {
      totalViews,
      totalPosts: posts.length,
      averageViews: posts.length > 0 ? Math.round(totalViews / posts.length) : 0,
      popularPosts: popularPosts.map(({ slug, views }) => {
        const post = posts.find(p => p.slug === slug)
        return {
          slug,
          title: post?.frontMatter.title || slug,
          views,
          date: post?.frontMatter.date || ''
        }
      }),
      recentPosts: postsWithViews
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
    }

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Error getting view stats:', error)
    return NextResponse.json(
      { error: 'Failed to get view stats' },
      { status: 500 }
    )
  }
}