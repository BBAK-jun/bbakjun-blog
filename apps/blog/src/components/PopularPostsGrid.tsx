'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface PopularPost {
  slug: string
  title: string
  views: number
  date: string
  description?: string
  tags?: string[]
  readingTime?: string
}

interface ViewStats {
  popularPosts: PopularPost[]
  totalViews: number
  totalPosts: number
}

interface PopularPostsGridProps {
  limit?: number
  className?: string
}

export default function PopularPostsGrid({
  limit = 12,
  className = ''
}: PopularPostsGridProps) {
  const [stats, setStats] = useState<ViewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPopularPosts = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/views/stats')

        if (!response.ok) {
          throw new Error('Failed to fetch popular posts')
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPopularPosts()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center p-12">
          <div className="text-red-600 dark:text-red-400 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h3 className="text-lg font-medium mb-2">인기 글을 불러올 수 없습니다</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats || stats.popularPosts.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center p-12">
          <div className="text-gray-500 dark:text-gray-400 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">아직 인기 글이 없습니다</h3>
            <p className="text-sm">글을 작성하고 조회수가 쌓이면 인기 글이 표시됩니다.</p>
          </div>
        </div>
      </div>
    )
  }

  const displayPosts = stats.popularPosts.slice(0, limit)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 통계 정보 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              🔥 인기 글 통계
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              조회수가 높은 글들을 확인해보세요
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalViews.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              총 조회수
            </div>
          </div>
        </div>
      </div>

      {/* 인기 글 목록 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {displayPosts.map((post, index) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block group"
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
              {/* 순위와 조회수 */}
              <div className="flex items-start justify-between mb-4">
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${index < 3
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {index + 1}
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span className="font-medium">{post.views.toLocaleString()}</span>
                </div>
              </div>

              {/* 제목 */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-3">
                {post.title}
              </h3>

              {/* 설명 */}
              {post.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {post.description}
                </p>
              )}

              {/* 메타 정보 */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <time dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
                {post.readingTime && (
                  <span>{post.readingTime}</span>
                )}
              </div>

              {/* 태그 */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs hover:bg-secondary/80 transition-colors"
                    >
                      #{tag}
                    </Badge>
                  ))}
                  {post.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{post.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* 더보기 링크 */}
      {stats.popularPosts.length > limit && (
        <div className="text-center pt-4">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            모든 글 보기
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      )}
    </div>
  )
}