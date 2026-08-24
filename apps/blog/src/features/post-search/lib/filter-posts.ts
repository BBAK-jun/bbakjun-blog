/**
 * 포스트 검색 필터링 (클라이언트/서버 공용 순수 함수)
 *
 * 기존 서버 사이드 검색(app/blog/page.tsx)의 의미를 그대로 유지한다:
 * - 제목 / 설명 / 태그 / 콘텐츠 첫 1000자 대소문자 무시 부분 일치
 */

/** Post를 포함한 구조적 타입 — 테스트와 클라이언트에서 @repo/content 의존 없이 사용 */
export interface FilterablePost {
  frontMatter: {
    title?: string;
    description?: string;
    tags?: (string | undefined)[];
  };
  content?: string;
}

export function filterPosts<T extends FilterablePost>(posts: T[], query: string): T[] {
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
