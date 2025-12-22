'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Series, SeriesNavigation } from '@repo/types'

interface StreamingSeriesNavigationProps {
  currentSlug: string
}

export default function StreamingSeriesNavigation({ currentSlug }: StreamingSeriesNavigationProps) {
  const [series, setSeries] = useState<Series | null>(null)
  const [seriesNav, setSeriesNav] = useState<SeriesNavigation | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSeriesData() {
      try {
        setIsLoading(true)
        const { getBlobFiles } = await import('@/lib/blob')
        const blobFiles = await getBlobFiles()
        const { getPostSeries, getSeriesNavigation } = await import('@repo/content')

        const seriesData = await getPostSeries(blobFiles, currentSlug)
        if (seriesData) {
          setSeries(seriesData)
          const nav = getSeriesNavigation(seriesData, currentSlug)
          setSeriesNav(nav)
        }
      } catch (error) {
        console.error('Failed to fetch series data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (currentSlug) {
      fetchSeriesData()
    }
  }, [currentSlug])

  if (isLoading) {
    return <SeriesNavigationSkeleton />
  }

  if (!series || !seriesNav || (!seriesNav.prev && !seriesNav.next)) {
    return null
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          📖 {series.title}
        </h3>
        <span className="text-sm text-blue-700 dark:text-blue-300">
          {seriesNav.currentIndex + 1} / {series.posts.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seriesNav.prev && (
          <Button
            asChild
            variant="outline"
            className="justify-start h-auto p-4 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            <Link href={`/blog/${seriesNav.prev.slug}`}>
              <div className="flex items-center space-x-3">
                <ChevronLeft className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                    이전 포스트
                  </div>
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {seriesNav.prev.title}
                  </div>
                </div>
              </div>
            </Link>
          </Button>
        )}

        {seriesNav.next && (
          <Button
            asChild
            variant="outline"
            className="justify-end h-auto p-4 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 md:col-start-2"
          >
            <Link href={`/blog/${seriesNav.next.slug}`}>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                    다음 포스트
                  </div>
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {seriesNav.next.title}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </div>
            </Link>
          </Button>
        )}

        {/* Spacer for when only prev or next exists */}
        {!seriesNav.prev && seriesNav.next && (
          <div />
        )}
        {!seriesNav.next && seriesNav.prev && (
          <div />
        )}
      </div>

      {/* Series index */}
      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
        <Link
          href={`/series/${series.slug}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          시리즈 전체 보기 ({series.posts.length}편) →
        </Link>
      </div>
    </div>
  )
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
  )
}