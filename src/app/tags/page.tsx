import { getAllTags, getPostsByTag } from '@/lib/posts'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '모든 태그 | DEV_BBAK 블로그',
  description: 'DEV_BBAK 블로그의 모든 태그를 확인해보세요.',
}

export default function TagsPage() {
  const tags = getAllTags()

  // 각 태그별 포스트 수 계산
  const tagsWithCount = tags.map(tag => ({
    name: tag,
    count: getPostsByTag(tag).length
  })).sort((a, b) => b.count - a.count) // 포스트 수가 많은 순으로 정렬

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <header className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          모든 태그
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          총 {tags.length}개의 태그가 있습니다.
        </p>
      </header>

      {/* 태그 목록 */}
      <section>
        {tagsWithCount.length > 0 ? (
          <div className="space-y-6">
            {/* 태그 클라우드 스타일 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
                태그 클라우드
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {tagsWithCount.map(({ name, count }) => {
                  // 포스트 수에 따라 태그 크기 조정
                  const maxCount = Math.max(...tagsWithCount.map(t => t.count))
                  const minSize = 0.8
                  const maxSize = 2
                  const scale = minSize + (count / maxCount) * (maxSize - minSize)

                  return (
                    <Link
                      key={name}
                      href={`/tags/${encodeURIComponent(name)}`}
                      className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 hover:scale-110"
                      style={{
                        fontSize: `${scale}rem`,
                        fontWeight: count > maxCount / 2 ? 'bold' : 'normal'
                      }}
                    >
                      #{name} ({count})
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* 태그 리스트 */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                태그 목록
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tagsWithCount.map(({ name, count }) => (
                  <Link
                    key={name}
                    href={`/tags/${encodeURIComponent(name)}`}
                    className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        #{name}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {count}개
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              태그가 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              포스트에 태그를 추가해보세요!
            </p>
            <Link
              href="/blog"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              포스트 보기
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}