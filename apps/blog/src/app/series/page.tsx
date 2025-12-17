import { getSeriesSummaries } from '@repo/content'
import Link from 'next/link'
import { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { getBlobFiles } from '@/lib/blob'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { BookOpen, Calendar, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: '시리즈 | DEV_BBAK 블로그',
  description: '주제별로 정리된 포스트 시리즈를 확인하세요',
}

export const revalidate = 300 // 5 minutes

export default async function SeriesPage() {
  const blobFiles = await getBlobFiles()
  const series = await getSeriesSummaries(blobFiles)

  if (series.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">시리즈</h1>
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">
            아직 시리즈가 없습니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">시리즈</h1>
        <p className="text-xl text-muted-foreground">
          주제별로 정리된 포스트 시리즈를 확인하세요
        </p>
      </div>

      <div className="grid gap-6">
        {series.map((s) => (
          <Link key={s.slug} href={`/series/${s.slug}`}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{s.title}</CardTitle>
                    <CardDescription className="text-base">
                      {s.description}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={s.status === 'completed' ? 'default' : 'secondary'}
                    className="ml-4"
                  >
                    {s.status === 'completed' ? '완료' : '진행중'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{s.totalPosts}개의 포스트</span>
                  </div>
                  {s.updatedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        최근 업데이트:{' '}
                        {new Date(s.updatedAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
