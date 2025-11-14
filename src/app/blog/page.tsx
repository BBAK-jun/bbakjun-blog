import { getAllPosts, getAllTags } from '@/lib/posts'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '모든 포스트 | DEV_BBAK 블로그',
  description: 'DEV_BBAK 블로그의 모든 포스트를 확인해보세요.',
}

export default function PostsPage() {
  const posts = getAllPosts()
  const tags = getAllTags()

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          모든 포스트
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          총 {posts.length}개의 포스트가 있습니다.
        </p>
      </header>

      {/* 태그 필터 */}
      {tags.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            태그로 필터링
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/blog"
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              전체
            </Link>
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${tag}`}
                className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 포스트 목록 */}
      <section>
        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              아직 포스트가 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              첫 번째 포스트를 작성해보세요!
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </div>
        )}
      </section>

      {/* 페이지네이션 (나중에 구현 가능) */}
      {posts.length > 12 && (
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            페이지네이션 기능은 포스트가 더 많아지면 추가할 예정입니다.
          </p>
        </div>
      )}
    </div>
  )
}