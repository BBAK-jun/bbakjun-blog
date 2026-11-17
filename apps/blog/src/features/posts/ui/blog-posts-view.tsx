import BlogPostsList from '@/features/posts/ui/blog-posts-list';
import SearchBarClient from '@/features/post-search/ui/search-bar-client';
import { Post } from '@repo/content';
import Link from 'next/link';
import { Suspense } from 'react';

interface BlogPostsViewProps {
  posts: Post[];
  tags: string[];
  searchQuery: string;
}

export default function BlogPostsView({ posts, tags, searchQuery }: BlogPostsViewProps) {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="mb-2 text-4xl font-bold">포스트</h1>
        <p className="text-muted-foreground">
          {searchQuery ? `${posts.length}개의 결과` : `${posts.length}개의 포스트`}
        </p>
      </header>

      <section>
        <Suspense fallback={<div className="h-12" />}>
          <SearchBarClient placeholder="검색..." />
        </Suspense>
      </section>

      {tags.length > 0 && !searchQuery && (
        <section>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/blog"
              className="text-foreground hover:underline decoration-1 underline-offset-2"
            >
              전체
            </Link>
            {tags.map(tag => (
              <Link
                key={tag}
                href={`/tags/${tag}`}
                className="text-muted-foreground hover:text-foreground hover:underline decoration-1 underline-offset-2"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </section>
      )}

      <BlogPostsList posts={posts} searchQuery={searchQuery} />
    </div>
  );
}
