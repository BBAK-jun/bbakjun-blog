'use client';

import { useRecentSuspensePosts } from '@/features/posts/lib/use-posts';
import PostCard from '@/entities/post/ui/post-card';
import { Post } from '@repo/content';

interface StreamingRecentPostsGridProps {
  limit?: number;
  showMoreLimit?: number;
}

export default function StreamingRecentPostsGrid({ limit = 6 }: StreamingRecentPostsGridProps) {
  const { data: posts } = useRecentSuspensePosts(limit);

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">아직 글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {posts.map((post: Post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}

export function StreamingRecentPostsSkeleton({ limit = 6 }: { limit?: number }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: limit }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm transition-all duration-200">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-18" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StreamingRecentPostFallback() {
  return (
    <div className="text-center py-8">
      <div className="text-red-500 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-sm">최신 글을 불러올 수 없습니다.</p>
      </div>
    </div>
  );
}
