import Link from 'next/link';
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
        <div className="text-center py-12">
          <p className="text-muted-foreground">아직 글이 없습니다</p>
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
    <div className={`divide-y divide-border/15 ${className}`}>
      {displayPosts.map(post => (
        <Link key={post.slug} href={`/blog/${post.slug}`} className="block py-4 group">
          <article className="space-y-2">
            <h3 className="text-lg font-medium text-foreground group-hover:underline decoration-1 underline-offset-2">
              {post.title}
            </h3>

            {post.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {post.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              {post.readingTime && (
                <>
                  <span>·</span>
                  <span>{post.readingTime}</span>
                </>
              )}
              {post.tags && post.tags.length > 0 && (
                <>
                  <span>·</span>
                  <span className="font-medium">{post.tags[0]}</span>
                </>
              )}
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
