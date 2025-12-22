import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Suspense } from 'react'
import Link from 'next/link'
import StreamingRecentPosts from '@/components/StreamingRecentPosts'
import StreamingPopularPostsGrid from '@/components/StreamingPopularPostsGrid'
import PostCardSkeleton from '@/components/skeleton/PostCardSkeleton'

// ISR 설정: 60초마다 재검증 (최신글 자동 업데이트)
export const revalidate = 60

export default async function StreamingHomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-linear-to-r from-primary to-gray-600 bg-clip-text text-transparent">
          안녕하세요
        </h1>
        <p className="text-3xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          프론트엔드 개발자 박준형입니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="font-medium">
            <Link href="/blog">
              모든 포스트 보기
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-medium">
            <Link href="/about">
              소개
            </Link>
          </Button>
        </div>
      </section>

      {/* Tabbed Posts Section with Streaming */}
      <section className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-4">
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="recent" className="text-base font-medium">
                📅 최신글
              </TabsTrigger>
              <TabsTrigger value="popular" className="text-base font-medium">
                🔥 인기글
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">
                    최신 포스트
                  </h2>
                  <Button asChild variant="ghost" className="text-primary hover:text-primary/80">
                    <Link href="/blog">
                      전체 보기 →
                    </Link>
                  </Button>
                </div>

                {/* Streaming Recent Posts with Suspense */}
                <Suspense
                  fallback={
                    <div className="grid gap-6 lg:grid-cols-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <PostCardSkeleton key={index} />
                      ))}
                    </div>
                  }
                >
                  <StreamingRecentPosts initialLimit={6} showMoreLimit={12} />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="popular">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">
                    인기 포스트
                  </h2>
                  <Button asChild variant="ghost" className="text-primary hover:text-primary/80">
                    <Link href="/blog">
                      전체 보기 →
                    </Link>
                  </Button>
                </div>

                {/* Streaming Popular Posts with Suspense */}
                <Suspense
                  fallback={
                    <div className="grid gap-6 lg:grid-cols-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <PostCardSkeleton key={`popular-${index}`} />
                      ))}
                    </div>
                  }
                >
                  <StreamingPopularPostsGrid limit={12} />
                </Suspense>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}