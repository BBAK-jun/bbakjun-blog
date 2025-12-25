import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Suspense } from 'react';
import Link from 'next/link';
import StreamingPostsGrid, {
  StreamingPostsFallback,
  StreamingPostsSkeleton,
} from '@/processes/streaming-posts/ui/streaming-posts-grid';
import StreamingRecentPostsGrid, {
  StreamingRecentPostFallback,
  StreamingRecentPostsSkeleton,
} from '@/processes/streaming-posts/ui/streaming-recent-posts-grid';
import ErrorBoundary from '@/shared/ui/error-boundary';

// ISR 설정: 60초마다 재검증 (최신글 자동 업데이트)
export const revalidate = 60;

export default function Home() {
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
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button asChild size="lg" className="font-medium">
            <Link href="/blog">모든 포스트 보기</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-medium">
            <Link href="/about">소개</Link>
          </Button>
        </div>
      </section>

      {/* Tabbed Posts Section */}
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
                  <h2 className="text-2xl font-bold text-foreground">최신 포스트</h2>
                  <Button asChild variant="ghost" className="text-primary hover:text-primary/80">
                    <Link href="/blog">전체 보기 →</Link>
                  </Button>
                </div>

                <ErrorBoundary fallback={StreamingRecentPostFallback}>
                  <Suspense fallback={<StreamingRecentPostsSkeleton limit={6} />}>
                    <StreamingRecentPostsGrid limit={6} />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </TabsContent>

            <TabsContent value="popular">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">인기 포스트</h2>
                  <Button asChild variant="ghost" className="text-primary hover:text-primary/80">
                    <Link href="/blog">전체 보기 →</Link>
                  </Button>
                </div>

                <ErrorBoundary fallback={StreamingPostsFallback}>
                  <Suspense fallback={<StreamingPostsSkeleton limit={12} />}>
                    <StreamingPostsGrid limit={12} />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        {/* <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <PopularPosts limit={5} />
          </div>
        </div> */}
      </section>
    </div>
  );
}
