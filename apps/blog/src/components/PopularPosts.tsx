import Link from 'next/link'
import { getPopularPostsStats } from '@/lib/stats'

interface PopularPostsProps {
  limit?: number
  showHeader?: boolean
  className?: string
  compact?: boolean
}

export default async function PopularPosts({
  limit = 5,
  showHeader = true,
  className = '',
  compact = false
}: PopularPostsProps) {
  // 서버에서 직접 데이터 조회 (API 호출 불필요)
  const stats = await getPopularPostsStats()

  // 빈 데이터 처리
  if (!stats || stats.popularPosts.length === 0) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🔥 인기 글
          </h3>
        )}
        <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          아직 인기 글이 없습니다
        </div>
      </div>
    )
  }

  const displayPosts = stats.popularPosts.slice(0, limit)

  return (
    <div className={`space-y-4 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            🔥 인기 글
          </h3>
          {!compact && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              총 {stats.totalViews.toLocaleString()}회 조회
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {displayPosts.map((post, index) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block group"
          >
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              {/* 순위 표시 */}
              <div className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${index < 3
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }
              `}>
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`
                  font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors
                  ${compact ? 'text-sm line-clamp-1' : 'text-sm line-clamp-2'}
                `}>
                  {post.title}
                </h4>

                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <svg
                      className="w-3 h-3 mr-1"
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
                    {post.views.toLocaleString()}
                  </div>

                  {post.date && !compact && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <time className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(post.date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </time>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 더보기 링크 */}
      {!compact && stats.popularPosts.length > limit && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/blog"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            더 많은 글 보기 →
          </Link>
        </div>
      )}
    </div>
  )
}