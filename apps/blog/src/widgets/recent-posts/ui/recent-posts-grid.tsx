import Link from 'next/link';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import { getPopularPostsStats } from '@/shared/lib/stats';

interface RecentPostsGridProps {
  limit?: number;
  className?: string;
}

export default async function RecentPostsGrid({ limit = 6, className = '' }: RecentPostsGridProps) {
  const stats = await getPopularPostsStats();

  // recentPosts가 없으면 빈 상태 표시
  if (!stats.recentPosts || stats.recentPosts.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center p-12">
          <div className="text-gray-500 dark:text-gray-400 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">아직 글이 없습니다</h3>
            <p className="text-sm">첫 번째 글을 작성해보세요!</p>
          </div>
        </div>
      </div>
    );
  }

  const displayPosts = stats.recentPosts.slice(0, limit);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-2 ${className}`}>
      {displayPosts.map(post => (
        <Card
          key={post.slug}
          className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
        >
          <Link href={`/blog/${post.slug}`} className="block">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
                  {post.title}
                </h3>

                {post.description && (
                  <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                    {post.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <time dateTime={post.date} className="font-medium">
                    {formatDate(post.date)}
                  </time>
                  {post.readingTime && (
                    <span className="text-xs bg-muted px-2 py-1 rounded-md">
                      {post.readingTime}
                    </span>
                  )}
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {post.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs font-normal">
                        #{tag}
                      </Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        +{post.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}
