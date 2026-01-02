import Link from 'next/link';
import { getPopularPostsStats } from '@/shared/lib/stats';

interface PopularPostsGridProps {
  limit?: number;
  className?: string;
}

export default async function PopularPostsGrid({
  limit = 12,
  className = '',
}: PopularPostsGridProps) {
  const stats = await getPopularPostsStats();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 빈 데이터 처리
  if (!stats || stats.popularPosts.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">아직 인기 글이 없습니다</p>
        </div>
      </div>
    );
  }

  const displayPosts = stats.popularPosts.slice(0, limit);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* 인기 글 목록 */}
      <div className="divide-y divide-border/15">
        {displayPosts.map((post, index) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block py-4 group">
            <article className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
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
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-medium text-muted-foreground tabular-nums">
                    {post.views.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">views</div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
