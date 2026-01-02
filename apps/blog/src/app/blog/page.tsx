import BlogPostsList from '@/features/posts/ui/blog-posts-list';
import SearchBarClient from '@/features/post-search/ui/search-bar-client';
import { getBlobFiles } from '@/shared/lib/blob';
import { searchParamsCache } from '@/shared/lib/searchParams';
import { getAllPosts, getAllTags } from '@repo/content';
import { Post } from '@repo/content';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '포스트 | 박준형',
  description: '프론트엔드 개발자 박준형의 블로그 포스트',
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// 서버에서 검색 필터링 수행
function filterPosts(posts: Post[], query: string): Post[] {
  if (!query.trim()) {
    return posts;
  }

  const lowerQuery = query.toLowerCase();
  return posts.filter(post => {
    // 제목 검색
    if (post.frontMatter.title?.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    // 설명 검색
    if (post.frontMatter.description?.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    // 태그 검색
    if (post.frontMatter.tags?.some(tag => tag?.toLowerCase().includes(lowerQuery))) {
      return true;
    }
    // 콘텐츠 검색 (첫 1000자)
    if (post.content?.slice(0, 1000).toLowerCase().includes(lowerQuery)) {
      return true;
    }
    return false;
  });
}

export default async function PostsPage({ searchParams }: PageProps) {
  // nuqs로 타입세이프한 searchParams 파싱
  const { q: searchQuery } = await searchParamsCache.parse(searchParams);

  // getBlobFiles는 React.cache로 중복 호출 방지
  const blobFiles = await getBlobFiles();

  // 병렬 데이터 페칭
  const [allPosts, tags] = await Promise.all([getAllPosts(blobFiles), getAllTags(blobFiles)]);

  const filteredPosts = filterPosts(allPosts, searchQuery);

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      {/* 페이지 헤더 */}
      <header>
        <h1 className="text-4xl font-bold mb-2">포스트</h1>
        <p className="text-muted-foreground">
          {searchQuery
            ? `${filteredPosts.length}개의 결과`
            : `${allPosts.length}개의 포스트`}
        </p>
      </header>

      {/* 검색 바 (클라이언트 컴포넌트) */}
      <section>
        <SearchBarClient placeholder="검색..." />
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
      <BlogPostsList posts={filteredPosts} searchQuery={searchQuery} />
    </div>
  );
}
