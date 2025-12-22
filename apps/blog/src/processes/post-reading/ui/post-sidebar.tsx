'use client';

import { Suspense } from 'react';
import TableOfContents from '@/processes/post-reading/ui/table-of-contents';
import StreamingPostsGrid from '@/processes/streaming-posts/ui/streaming-posts-grid';

export default function PostSidebar() {
  return (
    <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto space-y-6">
      {/* 목차 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">📑 목차</h3>
        <Suspense fallback={<TableOfContentsSkeleton />}>
          <TableOfContents />
        </Suspense>
      </div>

      {/* 인기 글 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">🔥 인기 글</h3>
        <Suspense fallback={<PopularPostsSkeleton />}>
          <StreamingPostsGrid limit={5} />
        </Suspense>
      </div>
    </div>
  );
}

function TableOfContentsSkeleton() {
  return (
    <nav className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-2 text-sm"
          style={{ paddingLeft: `${(i % 3) * 16}px` }}
        >
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
      ))}
    </nav>
  );
}

function PopularPostsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded text-xs flex items-center justify-center text-gray-500" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              {i % 2 === 0 && <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />}
            </div>
          </div>
          {i < 4 && <div className="border-b border-gray-100 dark:border-gray-700" />}
        </div>
      ))}
    </div>
  );
}
