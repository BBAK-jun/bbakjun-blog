import Link from 'next/link'
import { Post } from '@/lib/posts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RelatedPostsProps {
  posts: Post[]
}

interface RelatedPostCardProps {
  post: Post
}

function RelatedPostCard({ post }: RelatedPostCardProps) {
  const { slug, frontMatter, readingTime } = post
  const { title, date, description, tags } = frontMatter

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <Link href={`/blog/${slug}`} className="block h-full">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="space-y-3 flex-1">
            <h4 className="text-base font-semibold text-foreground line-clamp-2 leading-snug hover:text-primary transition-colors">
              {title}
            </h4>

            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {description}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <time dateTime={date} className="font-medium">
                {formatDate(date)}
              </time>
              <span className="bg-muted px-2 py-1 rounded-md">
                {readingTime}
              </span>
            </div>

            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs font-normal px-2 py-0.5"
                  >
                    #{tag}
                  </Badge>
                ))}
                {tags.length > 2 && (
                  <Badge
                    variant="outline"
                    className="text-xs font-normal px-2 py-0.5"
                  >
                    +{tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">
          🔗 연관 글
        </h3>
        <p className="text-sm text-muted-foreground">
          비슷한 주제의 다른 포스트들을 확인해보세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post) => (
          <RelatedPostCard key={post.slug} post={post} />
        ))}
      </div>

      {posts.length < 4 && (
        <div className="text-center pt-4">
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
          >
            더 많은 포스트 보기 →
          </Link>
        </div>
      )}
    </section>
  )
}