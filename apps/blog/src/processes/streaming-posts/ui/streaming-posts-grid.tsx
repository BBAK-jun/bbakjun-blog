'use client';

import { usePopluarPostsStatsSuspsenseQuery } from '@/features/posts/lib/use-popular-posts';
import { Badge } from '@/shared/ui/badge';
import Link from 'next/link';

interface StreamingPostsGridProps {
  limit?: number;
  showMoreLimit?: number;
}

export default function StreamingPostsGrid({ limit = 6 }: StreamingPostsGridProps) {
  const { data: stats } = usePopluarPostsStatsSuspsenseQuery();

  if (!stats || stats.popularPosts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">아직 인기 글이 없습니다.</p>
      </div>
    );
  }

  const displayPosts = stats.popularPosts.slice(0, limit);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {displayPosts.map((post, index) => (
        <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
          <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            {/* 순위 */}
            <div
              className={`
              flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${
                index < 3
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }
            `}
            >
              {index + 1}
            </div>

            {/* 내용 */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {post.title}
              </h4>

              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{formatDate(post.date)}</span>
                {post.readingTime && (
                  <>
                    <span>•</span>
                    <span>{post.readingTime}</span>
                  </>
                )}
              </div>

              {/* 태그 */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.tags.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 조회수 */}
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <span>{post.views.toLocaleString()}</span>
            </div>
          </div>
        </Link>
      ))}

      {/* 더보기 */}
      {stats.popularPosts.length > limit && (
        <div className="text-center pt-2">
          <Link
            href="/blog"
            className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            모든 인기 글 보기
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}

export function StreamingPostsSkeleton({ limit = 6 }: { limit?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: limit }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex items-start space-x-3 p-3">
            {/* 순위 스켈레톤 */}
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />

            {/* 내용 스켈레톤 */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>

            {/* 조회수 스켈레톤 */}
            <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StreamingPostsFallback() {
  return (
    <div className="text-center py-8">
      <div className="text-red-500 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-sm">인기 글을 불러올 수 없습니다.</p>
      </div>
    </div>
  );
}
