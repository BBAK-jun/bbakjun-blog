'use client'

import { useViews } from '@/hooks/useViews'

interface ViewCounterProps {
  slug: string
  increment?: boolean
  className?: string
}

export default function ViewCounter({ slug, increment = false, className = '' }: ViewCounterProps) {
  const { views, loading, error } = useViews(slug, increment)

  if (error) {
    return (
      <span className={`text-gray-500 dark:text-gray-400 ${className}`}>
        조회수 로드 실패
      </span>
    )
  }

  if (loading) {
    return (
      <span className={`text-gray-500 dark:text-gray-400 ${className}`}>
        <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mr-2"></span>
        로딩중...
      </span>
    )
  }

  return (
    <span className={`text-gray-500 dark:text-gray-400 ${className}`}>
      <svg
        className="inline-block w-4 h-4 mr-1"
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
      {views.toLocaleString()}회
    </span>
  )
}

// 여러 포스트의 조회수를 표시하는 컴포넌트
interface ViewBadgeProps {
  slug: string
  className?: string
}

export function ViewBadge({ slug, className = '' }: ViewBadgeProps) {
  const { views, loading } = useViews(slug, false)

  if (loading) {
    return (
      <div className={`inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full ${className}`}>
        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-1"></div>
        ...
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full ${className}`}>
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
      {views.toLocaleString()}
    </div>
  )
}