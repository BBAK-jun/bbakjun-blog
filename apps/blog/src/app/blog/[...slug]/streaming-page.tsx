import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReadingProgress from '@/components/ReadingProgress'
import NewsletterSubscribe from '@/components/NewsletterSubscribe'
import Comments, { CommentsConfig } from '@/components/Comments'
import PostContent from '@/components/streaming/PostContent'
import PostSidebar from '@/components/streaming/PostSidebar'
import StreamingRelatedPosts from '@/components/streaming/StreamingRelatedPosts'
import StreamingSeriesNavigation from '@/components/streaming/StreamingSeriesNavigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ErrorBoundary from '@/components/ErrorBoundary'
import { getBlobFiles } from '@/lib/blob'
import { getPostBySlug, processMarkdown } from '@repo/content'
import { env } from '@/env'
import Link from 'next/link'

interface PostPageProps {
  params: Promise<{
    slug: string[]
  }>
}

// 정적 경로 생성 (ISR과 함께 사용)
export async function generateStaticParams() {
  const blobFiles = await getBlobFiles()
  const { getAllPosts } = await import('@repo/content')
  const posts = await getAllPosts(blobFiles)
  return posts.map((post) => ({
    slug: post.slug.split('/'),
  }))
}

// ISR 설정: 60초마다 재검증
export const revalidate = 60

// 동적 경로 처리 방식
export const dynamicParams = true

// 메타데이터 생성
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const slugString = slug.join('/')

  const post = await getPostBySlug(await getBlobFiles(), slugString)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const { frontMatter } = post

  const ogImageUrl = `${env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/og/${slugString}`

  return {
    title: `${frontMatter.title} | DEV_BBAK 블로그`,
    description: frontMatter.description,
    authors: [{ name: frontMatter.author || 'bbakjun' }],
    keywords: frontMatter.tags?.join(', '),
    openGraph: {
      title: frontMatter.title,
      description: frontMatter.description,
      type: 'article',
      publishedTime: frontMatter.date,
      authors: [frontMatter.author || 'bbakjun'],
      tags: frontMatter.tags,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: frontMatter.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: frontMatter.title,
      description: frontMatter.description,
      images: [ogImageUrl],
    },
  }
}

export default async function StreamingPostPage({ params }: PostPageProps) {
  const { slug } = await params
  const slugString = slug.join('/')

  // Initial server-side fetch for critical data
  const blobFiles = await getBlobFiles()
  const post = await getPostBySlug(blobFiles, slugString)

  if (!post) {
    notFound()
  }

  // Process markdown on the server
  const htmlContent = await processMarkdown(post.content)

  return (
    <>
      <ReadingProgress />
      <div className="mx-auto">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* 메인 콘텐츠 */}
          <article className="flex-1 min-w-0">
            <ErrorBoundary>
              {/* Post Content with initial data */}
              <PostContent
                slug={slugString}
                initialPost={post}
                initialHtmlContent={htmlContent}
              />
            </ErrorBoundary>

            {/* Series Navigation - Client-side streaming */}
            <ErrorBoundary>
              <Suspense fallback={<div />}>
                <StreamingSeriesNavigation currentSlug={slugString} />
              </Suspense>
            </ErrorBoundary>

            {/* Newsletter Subscribe - Load after content */}
            <div className="mb-16">
              <NewsletterSubscribe source="blog-post" />
            </div>

            {/* Related Posts - Client-side streaming */}
            <ErrorBoundary>
              <div className="mb-16">
                <Suspense fallback={<RelatedPostsLoadingFallback />}>
                  <StreamingRelatedPosts currentSlug={slugString} limit={4} />
                </Suspense>
              </div>
            </ErrorBoundary>

            {/* Other posts CTA */}
            <div className="text-center space-y-4 mb-16">
              <h3 className="text-xl font-bold text-foreground">
                다른 포스트 둘러보기
              </h3>
              <Button asChild size="lg" className="font-medium">
                <Link href="/blog">
                  모든 포스트 보기
                </Link>
              </Button>
            </div>

            {/* Comments Section - Load last */}
            <section className="space-y-6">
              <Separator />
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground">💬 댓글</h3>

                {!env.NEXT_PUBLIC_GISCUS_REPO_ID ? (
                  <CommentsConfig />
                ) : (
                  <ErrorBoundary>
                    <Comments identifier={slugString} title={post.frontMatter.title} />
                  </ErrorBoundary>
                )}
              </div>
            </section>
          </article>

          {/* 사이드바 - Deferred loading */}
          <aside className="hidden xl:block xl:w-64 xl:flex-shrink-0">
            <ErrorBoundary>
              <Suspense fallback={<SidebarSkeleton />}>
                <PostSidebar />
              </Suspense>
            </ErrorBoundary>
          </aside>
        </div>
      </div>
    </>
  )
}

function RelatedPostsLoadingFallback() {
  return (
    <div className="space-y-8">
      <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-3" />
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SidebarSkeleton() {
  return (
    <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto space-y-6">
      {/* Table of Contents skeleton */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-4" />
        <nav className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-2"
              style={{ paddingLeft: `${(i % 3) * 16}px` }}
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
            </div>
          ))}
        </nav>
      </div>

      {/* Popular Posts skeleton */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                  {i % 2 === 0 && (
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                  )}
                </div>
              </div>
              {i < 4 && <div className="border-b border-gray-100 dark:border-gray-700" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}