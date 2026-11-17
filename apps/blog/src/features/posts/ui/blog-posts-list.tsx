import type { Post } from '@repo/content';
import PostCard from '@/entities/post/ui/post-card';

interface BlogPostsListProps {
  posts: Post[];
  searchQuery: string;
}

export default function BlogPostsList({ posts, searchQuery }: BlogPostsListProps) {
  // 포스트가 있는 경우
  if (posts.length > 0) {
    return (
      <section>
        <div className="divide-y divide-border/15">
          {posts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    );
  }

  // 검색 결과가 없는 경우
  if (searchQuery) {
    return (
      <section>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">검색 결과가 없습니다</p>
        </div>
      </section>
    );
  }

  // 포스트가 전혀 없는 경우
  return (
    <section>
      <div className="py-12 text-center">
        <p className="text-muted-foreground">아직 포스트가 없습니다</p>
      </div>
    </section>
  );
}
