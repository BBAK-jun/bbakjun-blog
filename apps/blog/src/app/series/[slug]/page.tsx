import { getSeriesBySlug, getAllSeries } from '@repo/content'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { getBlobFiles } from '@/lib/blob'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, ArrowLeft, CheckCircle2 } from 'lucide-react'

interface SeriesPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const blobFiles = await getBlobFiles()
  const series = await getAllSeries(blobFiles)
  return series.map((s) => ({
    slug: s.slug,
  }))
}

export const revalidate = 300 // 5 minutes
export const dynamicParams = true

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params
  const blobFiles = await getBlobFiles()
  const series = await getSeriesBySlug(blobFiles, slug)

  if (!series) {
    return {
      title: 'Series Not Found',
    }
  }

  return {
    title: `${series.title} | 시리즈`,
    description: series.description,
  }
}

export default async function SeriesDetailPage({ params }: SeriesPageProps) {
  const { slug } = await params
  const blobFiles = await getBlobFiles()
  const series = await getSeriesBySlug(blobFiles, slug)

  if (!series) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="-ml-4 mb-4">
          <Link href="/series">
            <ArrowLeft className="w-4 h-4 mr-2" />
            모든 시리즈
          </Link>
        </Button>

        <div className="flex items-start justify-between mb-4">
          <h1 className="text-4xl md:text-5xl font-bold">{series.title}</h1>
          <Badge
            variant={series.status === 'completed' ? 'default' : 'secondary'}
            className="ml-4"
          >
            {series.status === 'completed' ? '완료' : '진행중'}
          </Badge>
        </div>

        <p className="text-xl text-muted-foreground mb-6">{series.description}</p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{series.totalPosts}개의 포스트</span>
          </div>
          {series.startedAt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>시작: {formatDate(series.startedAt)}</span>
            </div>
          )}
          {series.updatedAt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>최근 업데이트: {formatDate(series.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Posts List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">포스트 목록</h2>

        {series.posts.map((post, index) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl mb-2">
                      {post.frontMatter.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mb-3">
                      {post.frontMatter.description}
                    </CardDescription>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(post.frontMatter.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.readingTime}</span>
                      </div>
                      {post.frontMatter.tags && post.frontMatter.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.frontMatter.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <Button asChild size="lg">
          <Link href="/series">모든 시리즈 보기</Link>
        </Button>
      </div>
    </div>
  )
}
