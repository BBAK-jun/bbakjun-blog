import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Post } from '@repo/types'

interface StreamingPostCardProps {
  post: Post
  isLoading?: boolean
}

export default function StreamingPostCard({ post, isLoading }: StreamingPostCardProps) {
  if (isLoading || !post) {
    return (
      <div className="animate-pulse">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          {/* Title skeleton */}
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />

          {/* Description skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          </div>

          {/* Tags skeleton */}
          <div className="flex gap-2 mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          </div>

          {/* Meta info skeleton */}
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <article className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
        <header>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-3 line-clamp-2">
            {post.title}
          </h3>
        </header>

        {post.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {post.description}
          </p>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
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

        <footer className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <time dateTime={post.date}>
            {formatDate(post.date)}
          </time>
          {post.readingTime && (
            <span>{post.readingTime}</span>
          )}
        </footer>
      </article>
    </Link>
  )
}