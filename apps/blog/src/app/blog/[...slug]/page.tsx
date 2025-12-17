import CodeBlockWrapper from '@/components/CodeBlockWrapper'
import Comments, { CommentsConfig } from '@/components/Comments'
import MermaidRenderer from '@/components/MermaidRenderer'
import NewsletterSubscribe from '@/components/NewsletterSubscribe'
import PopularPosts from '@/components/PopularPosts'
import ReadingProgress from '@/components/ReadingProgress'
import RelatedPosts from '@/components/RelatedPosts'
import SeriesNavigation from '@/components/SeriesNavigation'
import ShareButton from '@/components/ShareButton'
import TableOfContents from '@/components/TableOfContents'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ViewCounter from '@/components/ViewCounter'
import { client } from '@/lib/rpc'
import { getAllPosts, getPostBySlug, getPostSeries, getRelatedPosts, getSeriesNavigation, processMarkdown } from '@repo/content'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PostPageProps {
  params: Promise<{
    slug: string[]
  }>
}

// 정적 경로 생성 (ISR과 함께 사용)
export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    slug: post.slug.split('/'),
  }))
}

// ISR 설정: 60초마다 재검증
export const revalidate = 60

// 동적 경로 처리 방식
// true: 빌드 시 생성되지 않은 경로도 런타임에 생성 후 캐싱 (ISR)
// false: generateStaticParams에 없는 경로는 404
export const dynamicParams = true

// 메타데이터 생성
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const slugString = slug.join('/')
  const blobFilesResponse = await client.api.v1['blob-files'].$get({
    path: {
      slug: slugString,
    },
  })

  if (!blobFilesResponse.ok) {
    throw new Error('Failed to fetch blob files')
  }

  const blobFiles = await blobFilesResponse.json()

  const blobFile = blobFiles.files.find((file) => file.pathname.startsWith(slugString))



  const post = await getPostBySlug(slugString)

  if (!blobFile || !post) {
    return {
      title: 'Post Not Found',
    }
  }

  const { frontMatter } = post

  const ogImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/og/${slugString}`

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

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const slugString = slug.join('/')
  const post = await getPostBySlug(slugString)

  if (!post) {
    notFound()
  }

  const { frontMatter, content, readingTime } = post

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const htmlContent = await processMarkdown(content)
  const relatedPosts = await getRelatedPosts(post, 4)

  // Get series information if post belongs to a series
  const series = await getPostSeries(slugString)
  const seriesNav = series ? getSeriesNavigation(series, slugString) : null

  return (
    <>
      <ReadingProgress />
      <div className="mx-auto">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* 메인 콘텐츠 */}
          <article className="flex-1 min-w-0">
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
            <ViewCounter slug={slugString} increment={true} />
          </div>

          {frontMatter.author && (
            <div className="text-sm">
              by <span className="font-medium text-foreground">{frontMatter.author}</span>
            </div>
          )}
        </div>

        {frontMatter.tags && frontMatter.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {frontMatter.tags.map((tag) => (
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

      {/* 시리즈 네비게이션 */}
      {series && seriesNav && (
        <SeriesNavigation
          series={series}
          currentPost={post}
          prev={seriesNav.prev}
          next={seriesNav.next}
        />
      )}

      {/* 포스트 내용 */}
      <div
        className="prose prose-lg dark:prose-invert max-w-none mb-12 prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Mermaid 차트 렌더링 */}
      <MermaidRenderer content={htmlContent} />

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

        {/* Newsletter 구독 */}
        <div className="mb-16">
          <NewsletterSubscribe source="blog-post" />
        </div>

        {/* 연관 포스트 */}
        <div className="mb-16">
          <RelatedPosts posts={relatedPosts} />
        </div>

        {/* 다른 포스트 둘러보기 */}
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

        {/* 댓글 섹션 */}
        <section className="space-y-6">
          <Separator />
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-foreground">💬 댓글</h3>

            {/* giscus 환경 변수가 없으면 설정 안내 표시, 있으면 댓글 표시 */}
            {!process.env.NEXT_PUBLIC_GISCUS_REPO_ID ? (
              <CommentsConfig />
            ) : (
              <Comments identifier={slugString} title={frontMatter.title} />
            )}
          </div>
        </section>
      </footer>
        </article>

          {/* 사이드바 - 목차 및 인기 글 */}
          <aside className="hidden xl:block xl:w-64 xl:flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto space-y-6">
              {/* 목차 */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <TableOfContents />
              </div>

              {/* 인기 글 */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <PopularPosts limit={5} compact={true} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

