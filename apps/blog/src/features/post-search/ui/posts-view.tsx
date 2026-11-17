/**
 * 포스트 목록 뷰 (서버/클라이언트 공용)
 *
 * 서버에서는 ISR 정적 HTML의 fallback으로, 클라이언트에서는
 * 검색어가 적용된 뷰로 사용된다 — 같은 마크업을 공유해
 * 하이드레이션 전후 깜빡임이 없다.
 */

import type { Post } from '@repo/content';
import Link from 'next/link';
import { Suspense } from 'react';
import BlogPostsList from '@/features/posts/ui/blog-posts-list';
import SearchBarClient from './search-bar-client';

interface PostsViewProps {
  posts: Post[];
  tags: string[];
  searchQuery: string;
}

/** 정적 프리렌더 시 nuqs(useSearchParams)는 Suspense 경계가 필요하다 */
function SearchBarSlot({ placeholder }: { placeholder: string }) {
  return (
    <Suspense fallback={<div className="block w-full py-3" aria-hidden="true" />}>
      <SearchBarClient placeholder={placeholder} />
    </Suspense>
  );
}

export default function PostsView({ posts, tags, searchQuery }: PostsViewProps) {
  return (
    <div className="space-y-12">
      {/* 페이지 헤더 */}
      <header>
        <h1 className="text-4xl font-bold mb-2">포스트</h1>
        <p className="text-muted-foreground">
          {searchQuery ? `${posts.length}개의 결과` : `${posts.length}개의 포스트`}
        </p>
      </header>

      {/* 검색 바 (클라이언트) */}
      <section>
        <SearchBarSlot placeholder="검색..." />
      </section>

      {/* 태그 필터 */}
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

      {/* 포스트 목록 */}
      <BlogPostsList posts={posts} searchQuery={searchQuery} />
    </div>
  );
}
