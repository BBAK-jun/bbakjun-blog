import PopularPostsGrid from '@/components/PopularPostsGrid'
import PostCard from '@/components/PostCard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAllPosts } from '@repo/content'
import Link from 'next/link'
import { getBlobFiles } from '@/lib/blob'

// ISR 설정: 60초마다 재검증 (최신글 자동 업데이트)
export const revalidate = 60

export default async function Home() {
  const blobFiles = await getBlobFiles()
  const posts = await getAllPosts(blobFiles)
  const featuredPosts = posts.slice(0, 12) // 최신 포스트

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
                  <h2 className="text-2xl font-bold text-foreground">
                    최신 포스트
                  </h2>
                  <Button asChild variant="ghost" className="text-primary hover:text-primary/80">
                    <Link href="/blog">
                      전체 보기 →
                    </Link>
                  </Button>
                </div>

                {featuredPosts.length > 0 ? (
                  <>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {featuredPosts.slice(0, 6).map((post) => (
                        <PostCard key={post.slug} post={post} />
                      ))}
                    </div>

                    {/* More Recent Posts */}
                    {featuredPosts.length > 6 && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-foreground border-t border-gray-200 dark:border-gray-700 pt-8">
                          더 많은 포스트
                        </h3>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {featuredPosts.slice(6).map((post) => (
                            <PostCard key={post.slug} post={post} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      아직 포스트가 없습니다. 첫 번째 포스트를 작성해보세요!
                    </p>
                  </div>
                )}
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

                <PopularPostsGrid limit={12} />
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
  )
}
