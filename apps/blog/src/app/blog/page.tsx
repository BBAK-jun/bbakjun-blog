import BlogPostsList from '@/components/BlogPostsList'
import SearchBarClient from '@/components/SearchBarClient'
import { getBlobFiles } from '@/lib/blob'
import { searchParamsCache } from '@/lib/searchParams'
import { getAllPosts, getAllTags } from '@repo/content'
import { Post } from '@repo/content'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '모든 포스트 | DEV_BBAK 블로그',
  description: 'DEV_BBAK 블로그의 모든 포스트를 확인해보세요.',
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// 서버에서 검색 필터링 수행
function filterPosts(posts: Post[], query: string): Post[] {
  if (!query.trim()) {
    return posts
  }

  const lowerQuery = query.toLowerCase()
  return posts.filter((post) => {
    // 제목 검색
    if (post.frontMatter.title?.toLowerCase().includes(lowerQuery)) {
      return true
    }
    // 설명 검색
    if (post.frontMatter.description?.toLowerCase().includes(lowerQuery)) {
      return true
    }
    // 태그 검색
    if (post.frontMatter.tags?.some(tag => tag?.toLowerCase().includes(lowerQuery))) {
      return true
    }
    // 콘텐츠 검색 (첫 1000자)
    if (post.content?.slice(0, 1000).toLowerCase().includes(lowerQuery)) {
      return true
    }
    return false
  })
}

export default async function PostsPage({ searchParams }: PageProps) {
  // nuqs로 타입세이프한 searchParams 파싱
  const { q: searchQuery } = await searchParamsCache.parse(searchParams)

  // getBlobFiles는 React.cache로 중복 호출 방지
  const blobFiles = await getBlobFiles()

  // 병렬 데이터 페칭
  const [allPosts, tags] = await Promise.all([
    getAllPosts(blobFiles),
    getAllTags(blobFiles)
  ])

  const filteredPosts = filterPosts(allPosts, searchQuery)

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          모든 포스트
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          {searchQuery
            ? `"${searchQuery}" 검색결과 ${filteredPosts.length}개 / 전체 ${allPosts.length}개`
            : `총 ${allPosts.length}개의 포스트가 있습니다.`
          }
        </p>
      </header>

      {/* 검색 바 (클라이언트 컴포넌트) */}
      <section className="max-w-2xl mx-auto">
        <SearchBarClient placeholder="제목, 내용, 태그로 검색..." />
      </section>

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
      <BlogPostsList
        posts={filteredPosts}
        searchQuery={searchQuery}
        totalPosts={allPosts.length}
      />

      {/* 페이지네이션 */}
      {filteredPosts.length > 12 && (
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            페이지네이션 기능은 포스트가 더 많아지면 추가할 예정입니다.
          </p>
        </div>
      )}
    </div>
  )
}