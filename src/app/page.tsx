import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'
import PostCard from '@/components/PostCard'
import PopularPosts from '@/components/PopularPosts'
import { Button } from '@/components/ui/button'

export default function Home() {
  const posts = getAllPosts()
  const featuredPosts = posts.slice(0, 12) // 최신 6개 포스트만 표시

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

      {/* Popular Posts Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              최근 포스트
            </h2>
            <Button asChild variant="ghost" className="text-primary hover:text-primary/80">
              <Link href="/blog">
                전체 보기 →
              </Link>
            </Button>
          </div>

          {featuredPosts.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {featuredPosts.slice(0, 6).map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                아직 포스트가 없습니다. 첫 번째 포스트를 작성해보세요!
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <PopularPosts limit={5} />
          </div>
        </div>
      </section>

      {/* More Recent Posts Section */}
      {featuredPosts.length > 6 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              더 많은 포스트
            </h2>
            <Button asChild variant="ghost" className="text-primary hover:text-primary/80">
              <Link href="/blog">
                전체 보기 →
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.slice(6).map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
