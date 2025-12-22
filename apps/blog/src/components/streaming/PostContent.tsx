'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ViewCounter from '@/components/ViewCounter'
import ShareButton from '@/components/ShareButton'
import TableOfContents from '@/components/TableOfContents'
import MermaidRenderer from '@/components/MermaidRenderer'
import CodeBlockWrapper from '@/components/CodeBlockWrapper'
import { usePost } from '@/lib/hooks/use-posts'
import Link from 'next/link'

interface PostContentProps {
  slug: string
  initialPost?: any
  initialHtmlContent?: string
}

export default function PostContent({
  slug,
  initialPost,
  initialHtmlContent
}: PostContentProps) {
  const { data: post, isLoading, error } = usePost(slug)

  // Use initial data if available, otherwise use fetched data
  const currentPost = initialPost || post
  const htmlContent = initialHtmlContent // Will be passed from parent

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 dark:text-red-400 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-md mx-auto">
          <h3 className="text-lg font-medium mb-2">포스트를 불러올 수 없습니다</h3>
          <p className="text-sm mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !currentPost) {
    return <PostContentSkeleton />
  }

  const { frontMatter, content, readingTime } = currentPost

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <>
      {/* 포스트 헤더 */}
      <header className="mb-10">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/80 -ml-4">
            <Link href="/blog">
              ← 포스트 목록으로 돌아가기
            </Link>
          </Button>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground leading-tight">
          {frontMatter.title}
        </h1>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 text-muted-foreground">
          <div className="flex items-center space-x-4 mb-4 md:mb-0 text-sm">
            <time dateTime={frontMatter.date} className="font-medium">
              {formatDate(frontMatter.date)}
            </time>
            <span className="text-muted-foreground/60">•</span>
            <span>{readingTime}</span>
            <span className="text-muted-foreground/60">•</span>
            <ViewCounter slug={slug} increment={true} />
          </div>

          {frontMatter.author && (
            <div className="text-sm">
              by <span className="font-medium text-foreground">{frontMatter.author}</span>
            </div>
          )}
        </div>

        {frontMatter.tags && frontMatter.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {frontMatter.tags.map((tag: string) => (
              <Link key={tag} href={`/tags/${tag}`}>
                <Badge
                  variant="secondary"
                  className="hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        <Separator className="my-8" />

        {/* 모바일 목차 */}
        <div className="xl:hidden mb-8">
          <details className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <summary className="p-4 cursor-pointer font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-lg">
              📑 목차 보기
            </summary>
            <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
              <TableOfContents />
            </div>
          </details>
        </div>
      </header>

      {/* 포스트 내용 */}
      <div
        className="prose prose-lg dark:prose-invert max-w-none mb-12 prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground"
        dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
      />

      {/* Mermaid 차트 렌더링 */}
      {htmlContent && <MermaidRenderer content={htmlContent} />}

      {/* 코드 블록 복사 버튼 */}
      <CodeBlockWrapper />

      {/* 포스트 푸터 */}
      <footer>
        <Separator className="mb-8" />

        <div className="flex items-center justify-between mb-12">
          <div className="text-sm text-muted-foreground">
            마지막 수정: <span className="font-medium">{formatDate(frontMatter.date)}</span>
          </div>

          <div className="flex items-center space-x-4">
            <ShareButton title={frontMatter.title} description={frontMatter.description} />
          </div>
        </div>
      </footer>
    </>
  )
}

function PostContentSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Back button skeleton */}
      <div className="mb-6">
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-48" />
      </div>

      {/* Title skeleton */}
      <div className="h-12 md:h-14 bg-gray-200 dark:bg-gray-700 rounded w-full mb-6" />

      {/* Meta info skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>

      {/* Tags skeleton */}
      <div className="flex gap-2 mb-8">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-28" />
      </div>

      <div className="border border-gray-200 dark:border-gray-700 mb-8" />

      {/* Content skeleton */}
      <div className="space-y-4 mb-12">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${i % 3 === 0 ? 'w-4/5' : 'w-full'}`} />
            {i % 2 === 0 && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12" />}
          </div>
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="border border-gray-200 dark:border-gray-700 mb-8" />
      <div className="flex justify-between items-center mb-12">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>
    </div>
  )
}