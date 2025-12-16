import type { Series, SeriesSummary, Post } from '@repo/types'
import { getAllPosts } from './posts'

/**
 * Get all available series with their posts
 */
export async function getAllSeries(): Promise<Series[]> {
  const allPosts = await getAllPosts()

  // Group posts by series
  const seriesMap = new Map<string, Post[]>()

  for (const post of allPosts) {
    const seriesSlug = post.frontMatter.series
    if (seriesSlug) {
      if (!seriesMap.has(seriesSlug)) {
        seriesMap.set(seriesSlug, [])
      }
      seriesMap.get(seriesSlug)!.push(post)
    }
  }

  // Convert to Series objects
  const series: Series[] = []

  for (const [slug, posts] of seriesMap.entries()) {
    // Sort posts by seriesOrder
    const sortedPosts = posts.sort((a, b) => {
      const orderA = a.frontMatter.seriesOrder ?? 999
      const orderB = b.frontMatter.seriesOrder ?? 999
      return orderA - orderB
    })

    const firstPost = sortedPosts[0]
    const lastPost = sortedPosts[sortedPosts.length - 1]

    // Infer series title from slug (can be customized later)
    const title = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    series.push({
      slug,
      title,
      description: `${sortedPosts.length}개의 포스트로 구성된 시리즈`,
      status: 'ongoing', // Can be determined by checking if there are recent posts
      posts: sortedPosts,
      totalPosts: sortedPosts.length,
      startedAt: firstPost.frontMatter.date,
      updatedAt: lastPost.frontMatter.date,
    })
  }

  // Sort by most recently updated
  return series.sort((a, b) => {
    const dateA = new Date(a.updatedAt || '')
    const dateB = new Date(b.updatedAt || '')
    return dateB.getTime() - dateA.getTime()
  })
}

/**
 * Get series summaries without full post content
 */
export async function getSeriesSummaries(): Promise<SeriesSummary[]> {
  const allSeries = await getAllSeries()

  return allSeries.map(series => ({
    slug: series.slug,
    title: series.title,
    description: series.description,
    cover: series.cover,
    status: series.status,
    totalPosts: series.totalPosts,
    startedAt: series.startedAt,
    updatedAt: series.updatedAt,
  }))
}

/**
 * Get a specific series by slug
 */
export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const allSeries = await getAllSeries()
  return allSeries.find(s => s.slug === slug) || null
}

/**
 * Get next and previous posts in a series
 */
export function getSeriesNavigation(
  series: Series,
  currentSlug: string
): { prev: Post | null; next: Post | null } {
  const currentIndex = series.posts.findIndex(p => p.slug === currentSlug)

  if (currentIndex === -1) {
    return { prev: null, next: null }
  }

  return {
    prev: currentIndex > 0 ? series.posts[currentIndex - 1] : null,
    next: currentIndex < series.posts.length - 1 ? series.posts[currentIndex + 1] : null,
  }
}

/**
 * Check if a post belongs to a series
 */
export async function getPostSeries(postSlug: string): Promise<Series | null> {
  const allSeries = await getAllSeries()

  for (const series of allSeries) {
    if (series.posts.some(p => p.slug === postSlug)) {
      return series
    }
  }

  return null
}
