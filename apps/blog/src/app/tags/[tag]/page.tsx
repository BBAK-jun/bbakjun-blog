import { notFound } from 'next/navigation'
import { getPostsByTag, getAllTags } from '@repo/content'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import { Metadata } from 'next'
import { getBlobFiles } from '@/lib/blob'

interface TagPageProps {
  params: Promise<{
    tag: string
  }>
}

// 정적 경로 생성 (ISR과 함께 사용)
export async function generateStaticParams() {
  const blobFiles = await getBlobFiles()
  const tags = await getAllTags(blobFiles)
  return tags.map((tag) => ({
    tag: encodeURIComponent(tag),
  }))
}

// ISR 설정: 300초(5분)마다 재검증
export const revalidate = 300

// 새 태그가 추가되면 런타임에 생성 후 캐싱
export const dynamicParams = true

// 메타데이터 생성
export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  const blobFiles = await getBlobFiles()
  const posts = await getPostsByTag(blobFiles, decodedTag)

  if (posts.length === 0) {
    return {
      title: 'Tag Not Found',
    }
  }

  return {
    title: `#${decodedTag} 태그 | DEV_BBAK 블로그`,
    description: `${decodedTag} 태그와 관련된 포스트들을 확인해보세요. 총 ${posts.length}개의 포스트가 있습니다.`,
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  const blobFiles = await getBlobFiles()
  const posts = await getPostsByTag(blobFiles, decodedTag)
  const allTags = await getAllTags(blobFiles)

  if (posts.length === 0) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <header className="text-center">
        <div className="mb-4">
          <Link
            href="/blog"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            ← 모든 포스트
          </Link>
        </div>

        <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-lg font-semibold mb-4">
          #{decodedTag}
        </div>

        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {decodedTag} 태그
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          총 {posts.length}개의 포스트가 있습니다.
        </p>
      </header>

      {/* 다른 태그들 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          다른 태그들
        </h2>
        <div className="flex flex-wrap gap-2">
          {allTags
            .filter(tag => tag !== decodedTag)
            .slice(0, 10)
            .map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                #{tag}
              </Link>
            ))}
        </div>
      </section>

      {/* 포스트 목록 */}
      <section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  )
}