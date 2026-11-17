'use client';

/**
 * 검색 가능한 포스트 목록 (클라이언트)
 *
 * - nuqs로 URL ?q= 상태를 읽고 클라이언트에서 필터링한다.
 *   (페이지는 ISR로 정적 캐시되고, 검색은 서버 왕복 없이 동작한다)
 * - 포스트 데이터는 서버에서 content를 첫 1000자로 잘라 전달한다.
 * - 정적 프리렌더를 위해 page.tsx에서 Suspense로 감싸며,
 *   fallback에는 같은 PostsView를 서버 렌더링해 HTML이 완전하게 유지된다.
 */

import { useQueryState, parseAsString } from 'nuqs';
import type { Post } from '@repo/content';
import { filterPosts } from '../lib/filter-posts';
import PostsView from './posts-view';

interface SearchablePostsClientProps {
  /** 서버에서 전달한 전체 포스트 (content는 첫 1000자로 트림됨) */
  posts: Post[];
  /** 전체 태그 목록 (정렬됨) */
  tags: string[];
}

export default function SearchablePostsClient({ posts, tags }: SearchablePostsClientProps) {
  const [searchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({
      scroll: false,
      shallow: true,
    })
  );

  const filteredPosts = searchQuery ? filterPosts(posts, searchQuery) : posts;

  return <PostsView posts={filteredPosts} tags={tags} searchQuery={searchQuery} />;
}
