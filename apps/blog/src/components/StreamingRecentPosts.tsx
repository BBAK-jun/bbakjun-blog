'use client'

import { Button } from '@/components/ui/button'
import { useAllPosts } from '@/lib/hooks/use-posts'
import StreamingPostCard from './StreamingPostCard'
import Link from 'next/link'

interface StreamingRecentPostsProps {
  initialLimit?: number
  showMoreLimit?: number
  className?: string
}

export default function StreamingRecentPosts({
  initialLimit = 6,
  showMoreLimit = 12,
  className = ''
}: StreamingRecentPostsProps) {
  const { data: posts, isLoading, error } = useAllPosts({ limit: showMoreLimit })

  // Error state
  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-red-500 dark:text-red-400 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-md mx-auto">
          <h3 className="text-lg font-medium mb-2">포스트를 불러올 수 없습니다</h3>
          <p className="text-sm mb-4">최신 포스트 목록을 가져오는 중 오류가 발생했습니다.</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading || !posts) {
    return (
      <div className={`space-y-8 ${className}`}>
        {/* Initial posts skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: initialLimit }).map((_, index) => (
            <StreamingPostCard key={`skeleton-${index}`} post={null!} isLoading />
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground text-lg">
          아직 포스트가 없습니다. 첫 번째 포스트를 작성해보세요!
        </p>
      </div>
    )
  }

  const featuredPosts = posts.slice(0, initialLimit)
  const morePosts = posts.slice(initialLimit)

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Featured Posts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {featuredPosts.map((post) => (
          <StreamingPostCard key={post.slug} post={post} />
        ))}
      </div>

      {/* More Recent Posts */}
      {morePosts.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground border-t border-gray-200 dark:border-gray-700 pt-8">
            더 많은 포스트
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {morePosts.map((post) => (
              <StreamingPostCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}