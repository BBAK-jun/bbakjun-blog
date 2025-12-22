'use client';

import Link from 'next/link';
import { Badge } from '@/shared/ui/badge';
import { useRelatedPosts } from '@/features/posts/lib/use-related-posts';

interface StreamingRelatedPostsProps {
  currentSlug: string;
  limit?: number;
}

export default function StreamingRelatedPosts({
  currentSlug,
  limit = 4,
}: StreamingRelatedPostsProps) {
  const { data: relatedPosts = [], isLoading, error } = useRelatedPosts(currentSlug, limit);

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm">연관 포스트를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <RelatedPostsSkeleton />;
  }

  if (relatedPosts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">연관 포스트가 없습니다.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold text-foreground">📚 관련 포스트</h3>

      <div className="grid gap-6 md:grid-cols-2">
        {relatedPosts.map(post => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
            <article className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-3 line-clamp-2">
                {post.frontMatter.title}
              </h4>

              {post.frontMatter.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {post.frontMatter.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <time dateTime={post.frontMatter.date}>{formatDate(post.frontMatter.date)}</time>
                {post.readingTime && <span>{post.readingTime}</span>}
              </div>

              {post.frontMatter.tags && post.frontMatter.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.frontMatter.tags.slice(0, 3).map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs hover:bg-secondary/80 transition-colors"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RelatedPostsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32" />

      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-3" />
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
