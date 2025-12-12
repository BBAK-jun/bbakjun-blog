'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Post } from '@repo/content'
import PostCard from '@/components/PostCard'
import SearchBar from '@/components/SearchBar'
import Link from 'next/link'

interface BlogWithSearchProps {
  posts: Post[]
  tags: string[]
}

export default function BlogWithSearch({ posts: allPosts, tags }: BlogWithSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')

  // Initialize and sync search query from URL
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    setSearchQuery(urlQuery)
  }, [searchParams])

  // Search filtering logic
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return allPosts
    }

    const query = searchQuery.toLowerCase()
    return allPosts.filter((post: Post) => {
      // Search in title
      if (post.frontMatter.title && post.frontMatter.title.toLowerCase().includes(query)) {
        return true
      }

      // Search in description
      if (post.frontMatter.description && post.frontMatter.description.toLowerCase().includes(query)) {
        return true
      }

      // Search in tags
      if (post.frontMatter.tags?.some(tag => tag && tag.toLowerCase().includes(query))) {
        return true
      }

      // Search in content (basic search, first 1000 characters)
      if (post.content && post.content.slice(0, 1000).toLowerCase().includes(query)) {
        return true
      }

      return false
    })
  }, [allPosts, searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)

    // Update URL with search query
    const params = new URLSearchParams(searchParams.toString())
    if (query.trim()) {
      params.set('q', query)
    } else {
      params.delete('q')
    }

    const newUrl = params.toString() ? `/blog?${params.toString()}` : '/blog'
    router.push(newUrl, { scroll: false })
  }

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

      {/* 검색 바 */}
      <section className="max-w-2xl mx-auto">
        <SearchBar
          placeholder="제목, 내용, 태그로 검색..."
          onSearch={handleSearch}
          className="mb-8"
          initialValue={searchQuery}
        />
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
      <section>
        {filteredPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : searchQuery ? (
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