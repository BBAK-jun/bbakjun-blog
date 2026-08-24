import { describe, expect, it } from 'vitest';
import { filterPosts } from './filter-posts';

const posts = [
  {
    slug: 'a',
    frontMatter: { title: 'Redis 캐시 전략', description: '캐싱 이야기', tags: ['redis', 'cache'] },
    content: 'redis 본문 내용',
    readingTime: '5 min read',
  },
  {
    slug: 'b',
    frontMatter: { title: 'React 렌더링 최적화', description: '성능 개선기', tags: ['react'] },
    content: 'react 본문: ' + 'x'.repeat(1000) + ' hidden-needle',
    readingTime: '8 min read',
  },
  {
    slug: 'c',
    frontMatter: { title: 'TypeScript 타입 설계', description: '타입의 소임', tags: ['typescript'] },
    content: 'visible-needle 타입 본문',
    readingTime: '3 min read',
  },
];

describe('filterPosts', () => {
  it('빈 쿼리는 전체 포스트를 반환한다', () => {
    expect(filterPosts(posts, '')).toEqual(posts);
  });

  it('공백만 있는 쿼리는 전체 포스트를 반환한다', () => {
    expect(filterPosts(posts, '   ')).toEqual(posts);
  });

  it('제목 일치 — 대소문자 무시', () => {
    const result = filterPosts(posts, 'redis');
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('a');
  });

  it('설명 일치', () => {
    const result = filterPosts(posts, '성능 개선');
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('b');
  });

  it('태그 일치', () => {
    const result = filterPosts(posts, 'cache');
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('a');
  });

  it('콘텐츠 첫 1000자 이내 일치는 검색된다', () => {
    const result = filterPosts(posts, 'visible-needle');
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('c');
  });

  it('콘텐츠 1000자 이후는 검색되지 않는다 (기존 서버 검색 의미와 동일)', () => {
    const result = filterPosts(posts, 'hidden-needle');
    expect(result).toHaveLength(0);
  });

  it('일치하는 것이 없으면 빈 배열을 반환한다', () => {
    expect(filterPosts(posts, 'nomatch-zzz')).toHaveLength(0);
  });
});
