'use client';

import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { usePostSeries, useSeriesNavigation } from '@/features/posts/lib/use-series';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StreamingSeriesNavigationProps {
  currentSlug: string;
}

export default function StreamingSeriesNavigation({ currentSlug }: StreamingSeriesNavigationProps) {
  const { data: series, isLoading: seriesLoading } = usePostSeries(currentSlug);
  const { data: seriesNav, isLoading: navLoading } = useSeriesNavigation(currentSlug, series);

  if (seriesLoading || navLoading) {
    return <SeriesNavigationSkeleton />;
  }

  if (!series || !seriesNav || (!seriesNav.prev && !seriesNav.next)) {
    return null;
  }

  // Type assertions for better type safety
  const seriesTyped = series as {
    title: string;
    slug: string;
    posts: Array<{ slug: string; frontMatter: { title: string } }>;
  };
  const seriesNavTyped = seriesNav as {
    prev?: { slug: string; frontMatter: { title: string } };
    next?: { slug: string; frontMatter: { title: string } };
    currentIndex: number;
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          📖 {seriesTyped.title}
        </h3>
        <span className="text-sm text-blue-700 dark:text-blue-300">
          {seriesNavTyped.currentIndex + 1} / {seriesTyped.posts.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seriesNavTyped.prev && (
          <Button
            asChild
            variant="outline"
            className="justify-start h-auto p-4 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            <Link href={`/blog/${seriesNavTyped.prev.slug}`}>
              <div className="flex items-center space-x-3">
                <ChevronLeft className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                    이전 포스트
                  </div>
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {seriesNavTyped.prev.frontMatter.title}
                  </div>
                </div>
              </div>
            </Link>
          </Button>
        )}

        {seriesNavTyped.next && (
          <Button
            asChild
            variant="outline"
            className="justify-end h-auto p-4 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 md:col-start-2"
          >
            <Link href={`/blog/${seriesNavTyped.next.slug}`}>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                    다음 포스트
                  </div>
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {seriesNavTyped.next.frontMatter.title}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </div>
            </Link>
          </Button>
        )}

        {/* Spacer for when only prev or next exists */}
        {!seriesNavTyped.prev && seriesNavTyped.next && <div />}
        {!seriesNavTyped.next && seriesNavTyped.prev && <div />}
      </div>

      {/* Series index */}
      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
        <Link
          href={`/series/${seriesTyped.slug}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          시리즈 전체 보기 ({seriesTyped.posts.length}편) →
        </Link>
      </div>
    </div>
  );
}

function SeriesNavigationSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-blue-200 dark:bg-blue-800 rounded w-48" />
          <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-16" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-20 bg-blue-100 dark:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-700" />
          <div className="h-20 bg-blue-100 dark:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-700" />
        </div>

        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
          <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-40" />
        </div>
      </div>
    </div>
  );
}
