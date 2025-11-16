import { getAllPosts, getAllTags } from '@/lib/posts'
import BlogWithSearch from '@/components/BlogWithSearch'
import { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: '모든 포스트 | DEV_BBAK 블로그',
  description: 'DEV_BBAK 블로그의 모든 포스트를 확인해보세요.',
}

function BlogWithSearchFallback() {
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          모든 포스트
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          포스트를 불러오는 중...
        </p>
      </header>
      <section className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-8"></div>
        </div>
      </section>
      <section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function PostsPage() {
  const posts = getAllPosts()
  const tags = getAllTags()

  return (
    <Suspense fallback={<BlogWithSearchFallback />}>
      <BlogWithSearch posts={posts} tags={tags} />
    </Suspense>
  )
}