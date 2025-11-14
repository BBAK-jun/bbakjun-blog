import Link from 'next/link'
import { Post } from '@/lib/posts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const { slug, frontMatter, readingTime } = post
  const { title, date, description, tags } = frontMatter

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <Link href={`/blog/${slug}`} className="block">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
              {title}
            </h3>

            <p className="text-muted-foreground line-clamp-3 leading-relaxed">
              {description}
            </p>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <time dateTime={date} className="font-medium">
                {formatDate(date)}
              </time>
              <span className="text-xs bg-muted px-2 py-1 rounded-md">
                {readingTime}
              </span>
            </div>

            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    #{tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    +{tags.length - 3}
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