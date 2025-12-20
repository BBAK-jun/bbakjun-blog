import { Post } from '@repo/content'
import PostCard from '@/components/PostCard'
import Link from 'next/link'

interface BlogPostsListProps {
  posts: Post[]
  searchQuery: string
  totalPosts: number
}

export default function BlogPostsList({ posts, searchQuery, totalPosts }: BlogPostsListProps) {
  // 포스트가 있는 경우
  if (posts.length > 0) {
    return (
      <section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    )
  }

  // 검색 결과가 없는 경우
  if (searchQuery) {
    return (
      <section>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            검색 결과가 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            "{searchQuery}"에 대한 검색 결과를 찾을 수 없습니다.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            다른 키워드로 검색해보거나 검색어를 지워보세요.
          </p>
        </div>
      </section>
    )
  }

  // 포스트가 전혀 없는 경우
  return (
    <section>
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
    </section>
  )
}
