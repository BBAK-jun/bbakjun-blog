import PostsView from '@/features/post-search/ui/posts-view';
import SearchablePostsClient from '@/features/post-search/ui/searchable-posts-client';
import { getBlobFiles } from '@/shared/lib/blob';
import { getAllPosts } from '@repo/content';
import { Metadata } from 'next';
import { Suspense } from 'react';

// ISR: 60초마다 재검증 — 검색은 클라이언트에서 수행하므로
// searchParams를 읽지 않고 이 페이지는 완전히 정적으로 캐시된다.
export const revalidate = 60;

export const metadata: Metadata = {
  title: '포스트 | 박준형',
  description: '프론트엔드 개발자 박준형의 블로그 포스트',
};

/** 콘텐츠 검색에 사용되는 길이 (서버 검색 시절과 동일한 의미) */
const SEARCH_CONTENT_PREVIEW_LENGTH = 1000;

export default async function PostsPage() {
  // getBlobFiles는 React.cache로 중복 호출 방지
  const blobFiles = await getBlobFiles();

  // getAllTags()는 내부적으로 getAllPosts()를 다시 실행해 blob 전체를
  // 한 번 더 다운로드하므로, 여기서는 이미 받은 포스트에서 태그를 유도한다.
  const allPosts = await getAllPosts(blobFiles);
  const tags = Array.from(
    new Set(allPosts.flatMap(post => post.frontMatter.tags ?? []))
  ).sort();

  // 목록/검색에 필요한 만큼만 전달 — 전체 본문은 내려보내지 않는다.
  const posts = allPosts.map(post => ({
    ...post,
    content: post.content?.slice(0, SEARCH_CONTENT_PREVIEW_LENGTH) ?? '',
  }));

  return (
    // 정적 프리렌더 시 nuqs(useSearchParams)가 suspend하므로 Suspense 필수.
    // fallback도 같은 뷰를 서버 렌더링해 링크가 HTML에 그대로 남는다(SEO).
    <Suspense fallback={<PostsView posts={posts} tags={tags} searchQuery="" />}>
      <SearchablePostsClient posts={posts} tags={tags} />
    </Suspense>
  );
}
