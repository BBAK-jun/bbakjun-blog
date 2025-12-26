# Blog App - Utils & Libraries

- **Scope**: Blog 앱의 유틸리티 함수 및 헬퍼 라이브러리
- **Source of Truth**: `src/shared/lib/`, `src/shared/hooks/`
- **Last Verified**: 2025-12-26
- **Repo Ref**: main

## 개요

Blog 앱의 유틸리티는 다음과 같이 조직됩니다:

```
src/shared/
├── lib/           # 유틸리티 함수
│   ├── blob.ts    # Blob 파일 가져오기
│   ├── rpc.ts     # Hono RPC 클라이언트
│   ├── stats.ts   # 통계 조회
│   └── ...
├── hooks/         # React 훅
│   └── useViews.ts # 조회수 훅
└── ui/            # UI 유틸리티
    ├── utils.ts   # clsx, tailwind-merge
    └── ...
```

---

## Blob File Fetching

### `getBlobFiles()`

- **Location**: `src/shared/lib/blob.ts` (L1-L32)
- **Purpose**: Blog-Admin RPC로 Blob 파일 목록 조회 (CDC 캐시)
- **Return**: `Promise<BlobFileInfo[]>`
- **Cache**: `React.cache` (렌더링 컨텍스트 내 중복 방지)

**코드**:

```typescript
import { cache } from 'react';
import { client } from './rpc';
import type { BlobFileInfo } from '@repo/content';

export const getBlobFiles = cache(async (): Promise<BlobFileInfo[]> => {
  try {
    const response = await client.rpc.getBlobFiles.$get({
      query: {},
    });

    if (!response.ok) {
      console.error('Failed to fetch blob files:', response.status);
      return [];
    }

    const { files } = await response.json();
    return files.map(f => ({
      url: f.url,
      pathname: f.pathname,
      contentType: f.contentType,
    }));
  } catch (error) {
    console.error('Error fetching blob files:', error);
    return [];
  }
});
```

**특징**:

1. **React.cache**: 렌더링 컨텍스트 내에서 중복 호출 방지
2. **CDC 캐시**: Blog-Admin의 PostgreSQL BlobFile 테이블 조회
3. **에러 처리**: 빌드 타임이나 서버가 없을 때 빈 배열 반환
4. **타입 변환**: RPC 응답을 `BlobFileInfo` 형식으로 매핑

**사용 예시**:

```typescript
import { getBlobFiles } from '@/shared/lib/blob';
import { getAllPosts } from '@repo/content';

const blobFiles = await getBlobFiles();
const posts = await getAllPosts(blobFiles);
```

**사용 위치**:

- 모든 포스트 페이지 (`generateStaticParams`, `generateMetadata`)
- 블로그 목록 페이지
- 태그 페이지
- 시리즈 페이지
- About 페이지

**Evidence**:

- `src/shared/lib/blob.ts:9-31`: getBlobFiles 함수 정의

---

## RPC Client

### `client`

- **Location**: `src/shared/lib/rpc.ts` (L1-L6)
- **Purpose**: Blog-Admin Hono RPC 클라이언트
- **Type**: `HonoClient<BlogAdminApp>`

**코드**:

```typescript
import { BlogAdminApp } from '@apps/blog-admin/rpc';
import { hc } from 'hono/client';
import { env } from '@/env';

export const client = hc<BlogAdminApp>(`${env.NEXT_PUBLIC_ADMIN_URL}/api`);
```

**특징**:

1. **타입 안전**: Blog-Admin의 `AppType` 타입으로 자동 완성
2. **Base URL**: `NEXT_PUBLIC_ADMIN_URL` 환경변수 사용
3. **경로**: `/api` 프리픽스 자동 추가

**사용 예시**:

```typescript
import { client } from '@/shared/lib/rpc';

// 조회수 조회
const response = await client.rpc.getViewsBySlug.$get({
  query: { slug: 'DEV/my-post' },
});
const data = await response.json();

// 조회수 증가
await client.rpc.incrementViewsBySlug.$post({
  query: { slug: 'DEV/my-post' },
  json: {},
});
```

**Evidence**:

- `src/shared/lib/rpc.ts:1-6`: Hono 클라이언트 초기화

---

## Statistics Fetching

### `getPopularPostsStats()`

- **Location**: `src/shared/lib/stats.ts` (L1-L67)
- **Purpose**: Blog-Admin RPC로 블로그 통계 조회
- **Return**: `Promise<ViewStats>`
- **Cache**: Next.js 캐시 (5분, `next: { revalidate: 300 }`)

**코드**:

```typescript
import { client } from '@/shared/lib/rpc';

export interface PopularPost {
  slug: string;
  title: string;
  views: number;
  date: string;
  description?: string;
  tags?: string[];
  readingTime?: string;
}

export interface ViewStats {
  popularPosts: PopularPost[];
  totalViews: number;
  totalPosts: number;
  averageViews?: number;
  recentPosts?: PopularPost[];
}

export async function getPopularPostsStats(): Promise<ViewStats> {
  try {
    console.log('[getPopularPostsStats] RPC 통계 조회 시작');

    const response = await client.rpc.getViewsStats.$get(
      {},
      {
        init: {
          next: { revalidate: 300 }, // 5분 캐시
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch stats from RPC');
    }

    const data = await response.json();

    console.log(`[getPopularPostsStats] RPC 통계 조회 완료: ${data.popularPosts.length}개 포스트`);

    return {
      popularPosts: data.popularPosts,
      totalViews: data.totalViews,
      totalPosts: data.totalPosts,
      averageViews: data.averageViews,
      recentPosts: data.recentPosts,
    };
  } catch (error) {
    console.error('[getPopularPostsStats] 에러 발생:', error);

    // 폴백: 빈 통계 반환
    return {
      popularPosts: [],
      totalViews: 0,
      totalPosts: 0,
      averageViews: 0,
      recentPosts: [],
    };
  }
}
```

**특징**:

1. **Next.js 캐시**: 5분 동안 응답 캐싱
2. **에러 처리**: 실패 시 빈 통계 반환 (앱 계속 동작)
3. **로깅**: 콘솔에 진행 상황 출력

**사용 예시**:

```typescript
import { getPopularPostsStats } from '@/shared/lib/stats';

const stats = await getPopularPostsStats();
// stats.popularPosts: 인기 포스트 목록
// stats.totalViews: 총 조회수
// stats.averageViews: 평균 조회수
```

**사용 위치**:

- About 페이지 (통계 카드)
- 인기글 위젯
- 사이드바 인기글

**Evidence**:

- `src/shared/lib/stats.ts:26-66`: getPopularPostsStats 함수 정의

---

## Search Params Parsing

### `searchParamsCache`

- **Location**: `src/shared/lib/searchParams.ts`
- **Purpose**: nuqs로 타입 안전한 URL 쿼리 파라미터 파싱
- **Framework**: nuqs (URL query state for Next.js App Router)

**코드**:

```typescript
import { parseAsBoolean, parseAsString, createParser } from 'nuqs/server';

export const searchParamsCache = createParser({
  q: parseAsString.withDefault(''),
}).withType();
```

**특징**:

1. **타입 안전**: TypeScript 타입 자동 추론
2. **기본값**: `q: ""` (빈 문자열)
3. **서버 사이드**: `nuqs/server`로 서버 컴포넌트에서 사용

**사용 예시**:

```typescript
import { searchParamsCache } from '@/shared/lib/searchParams';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const { q: searchQuery } = await searchParamsCache.parse(searchParams);

  // searchQuery는 타입이 string으로 보장됨
  console.log(searchQuery);
}
```

**사용 위치**:

- 블로그 목록 페이지 (검색어 파싱)

**Evidence**:

- `src/app/blog/page.tsx:49`: searchParamsCache로 검색어 파싱

---

## UI Utilities

### `cn()`

- **Location**: `src/shared/lib/utils.ts` (L1-L5)
- **Purpose**: clsx + tailwind-merge로 조건부 클래스 병합
- **Return**: `string` (병합된 클래스 문자열)

**코드**:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**특징**:

1. **clsx**: 조건부 클래스 (예: `{ 'active': isActive }`)
2. **tailwind-merge**: Tailwind 클래스 충돌 해결 (예: `p-4 p-2` → `p-2`)

**사용 예시**:

```typescript
import { cn } from '@/shared/lib/utils';

<button className={cn(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  className
)}>
  Button
</button>
```

**사용 위치**:

- 대부분의 UI 컴포넌트
- 동적 스타일링이 필요한 곳

**Evidence**:

- `src/shared/lib/utils.ts:1-5`: cn 함수 정의

---

## Custom Hooks

### `useViews()`

- **Location**: `src/shared/hooks/useViews.ts` (L1-L70)
- **Purpose**: 조회수 조회 및 증가 훅
- **Return**: `ViewData`
- **Dependencies**: TanStack Query, Hono RPC 클라이언트

**코드**:

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/shared/lib/rpc';
import { useEffect } from 'react';

interface ViewData {
  views: number;
  loading: boolean;
  error: string | null;
}

export function useViews(slug: string, increment: boolean = false): ViewData {
  const queryClient = useQueryClient();

  // 조회수 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['views', slug],
    queryFn: async () => {
      const response = await client.rpc.getViewsBySlug.$get({
        query: { slug },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch views');
      }

      return response.json();
    },
    staleTime: 60 * 1000, // 1분 캐시
    enabled: !!slug,
  });

  // 조회수 증가 mutation
  const incrementMutation = useMutation({
    mutationFn: async () => {
      const response = await client.rpc.incrementViewsBySlug.$post({
        query: { slug },
        json: {},
      });

      if (!response.ok) {
        throw new Error('Failed to increment views');
      }

      return response.json();
    },
    onSuccess: data => {
      queryClient.setQueryData(['views', slug], data);
    },
  });

  // increment가 true이고 아직 증가시키지 않은 경우 한 번만 실행
  useEffect(() => {
    if (increment && slug && !incrementMutation.isSuccess) {
      incrementMutation.mutate();
    }
  }, [increment, slug]);

  return {
    views: data?.views ?? 0,
    loading: isLoading || (increment && incrementMutation.isPending),
    error: error?.message ?? incrementMutation.error?.message ?? null,
  };
}
```

**특징**:

1. **조회수 조회** (`useQuery`):
   - `queryKey: ['views', slug]`
   - `staleTime: 60 * 1000` (1분 캐시)
   - RPC `GET /rpc/views/[slug]` 호출

2. **조회수 증가** (`useMutation`):
   - `increment=true` 시 컴포넌트 마운트 후 한 번만 실행
   - RPC `POST /rpc/views/[slug]/increment` 호출
   - 성공 시 캐시 업데이트

3. **로딩 상태**:
   - 조회 로딩 + 증가 로딩 모두 고려

**사용 예시**:

```typescript
'use client';

import { useViews } from '@/shared/hooks/useViews';

export default function ViewCounter({ slug }: { slug: string }) {
  // 조회수만 표시
  const { views, loading } = useViews(slug);

  // 조회수 표시 + 증가
  const { views, loading } = useViews(slug, true);

  if (loading) return <span>로딩중...</span>;
  return <span>{views.toLocaleString()}회</span>;
}
```

**사용 위치**:

- `ViewCounter` 컴포넌트
- 포스트 페이지 (조회수 표시)

**Evidence**:

- `src/shared/hooks/useViews.ts:13-69`: useViews 훅 정의

---

## Package Utilities

### `@repo/content`

- **Location**: `packages/content/src/`
- **Purpose**: MDX 콘텐츠 처리 (파싱, 변환, 관련 포스트 계산)

**주요 함수**:

| 함수 | 설명 | 인자 | 반환값 |
|------|------|------|--------|
| `getAllPosts()` | 모든 포스트 조회 | `blobFiles: BlobFileInfo[]` | `Promise<Post[]>` |
| `getPostBySlug()` | 특정 포스트 조회 | `blobFiles, slug` | `Promise<Post \| null>` |
| `getAllTags()` | 모든 태그 조회 | `blobFiles` | `Promise<string[]>` |
| `getPostsByTag()` | 태그별 포스트 조회 | `blobFiles, tag` | `Promise<Post[]>` |
| `getRelatedPosts()` | 연관 포스트 계산 | `blobFiles, post, limit` | `Promise<Post[]>` |
| `processMarkdown()` | MDX → HTML 변환 | `content: string` | `Promise<string>` |
| `getPostSeries()` | 시리즈 포스트 조회 | `blobFiles, slug` | `Promise<Series \| null>` |
| `getSeriesNavigation()` | 시리즈 네비게이션 | `series, slug` | `{ prev, next }` |
| `getSeriesSummaries()` | 모든 시리즈 요약 | `blobFiles` | `Promise<Series[]>` |

**사용 예시**:

```typescript
import {
  getAllPosts,
  getPostBySlug,
  processMarkdown,
  getRelatedPosts
} from '@repo/content';
import { getBlobFiles } from '@/shared/lib/blob';

const blobFiles = await getBlobFiles();

// 모든 포스트 조회
const posts = await getAllPosts(blobFiles);

// 특정 포스트 조회
const post = await getPostBySlug(blobFiles, 'DEV/my-post');

// MDX 처리
const html = await processMarkdown(post.content);

// 연관 포스트 (4개)
const related = await getRelatedPosts(blobFiles, post, 4);
```

**특징**:

1. **Blob 필수**: 모든 함수가 `blobFiles`를 첫 번째 인자로 받음
2. **병렬 처리**: `Promise.all`로 병렬 다운로드 (200~300ms 절약)
3. **관련 포스트 알고리즘**:
   - 같은 태그: +3점
   - 같은 카테고리: +2점
   - 최신 글: +0.5점
4. **Reading Time**: `reading-time` 라이브러리로 계산

**Markdown 처리 파이프라인**:

```
Raw MDX
  → remark-parse (markdown → AST)
  → remark-gfm (GitHub Flavored Markdown)
  → remark-rehype (markdown AST → HTML AST)
  → rehype-slug (헤딩 ID 추가)
  → rehype-autolink-headings (헤딩 앵커 링크)
  → rehype-highlight (코드 하이라이팅)
  → rehype-mermaid (Mermaid 차트 변환)
  → rehype-optimize-images (이미지 최적화)
  → rehype-stringify (HTML AST → string)
```

**Evidence**:

- `packages/content/src/posts.ts`: 포스트 관련 함수
- `packages/content/src/markdown.ts`: Markdown 처리 파이프라인

---

### `@repo/analytics`

- **Location**: `packages/analytics/src/`
- **Purpose**: Redis 기반 조회수 추적

**주요 함수**:

| 함수 | 설명 |
|------|------|
| `getViews(slug)` | 조회수 조회 |
| `incrementViews(slug)` | 조회수 증가 (세션 기반) |
| `getViewsStats()` | 통계 조회 (총 조회수, 인기글) |

**특징**:

1. **Redis 해시**: `views:{slug}` 키에 저장
2. **세션 기반 중복 방지**: `HSETNX`로 원자적 증가
3. **봇 필터링**: User-Agent로 크롤러 제외
4. **TTL**: 24시간 만료

**참고**: 현재는 Blog-Admin RPC로 대체됨

---

## Date Formatting

### `formatDate()`

- **Location**: 여러 페이지에서 사용
- **Purpose**: 날짜를 한국어 형식으로 포맷팅

**코드**:

```typescript
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
```

**출력 예시**:

- 입력: `"2025-12-26"`
- 출력: `"2025년 12월 26일"`

**사용 위치**:

- 포스트 카드
- 포스트 상세 페이지
- 시리즈 페이지

**Evidence**:

- `src/entities/post/ui/post-card.tsx:14-21`: formatDate 함수

---

## Number Formatting

### `toLocaleString('ko-KR')`

- **Purpose**: 천 단위 콤마 구분

**사용 예시**:

```typescript
const views = 1234567;
views.toLocaleString('ko-KR'); // "1,234,567"
```

**사용 위치**:

- 조회수 표시
- 통계 카드

**Evidence**:

- `src/shared/ui/view-counter.tsx:50`: toLocaleString 사용

---

## Error Handling Utilities

### 에러 로깅

```typescript
try {
  // ...
} catch (error) {
  console.error('[FunctionName] 에러 발생:', error);
  // 폴백 값 반환
  return defaultValue;
}
```

**특징**:

1. **콘솔 로그**: 에러 발생 위치 명시
2. **폴백 값**: 앱이 계속 동작하도록 기본값 반환

**사용 예시**:

```typescript
// src/shared/lib/blob.ts:26-30
} catch (error) {
  console.error('Error fetching blob files:', error);
  return []; // 빈 배열 반환 (앱 계속 동작)
}
```

**Evidence**:

- `src/shared/lib/blob.ts:26-30`: 에러 처리 예시

---

## Performance Utilities

### React.cache

- **Purpose**: 렌더링 컨텍스트 내 중복 호출 방지

**사용 예시**:

```typescript
import { cache } from 'react';

export const getBlobFiles = cache(async () => {
  // 비용이 큰 작업
  return result;
});
```

**특징**:

1. **렌더링 컨텍스트**: 같은 렌더링 사이클 내에서 재호출 시 캐시된 값 반환
2. **자동 무효화**: 다음 렌더링 사이클에서 캐시 삭제

**사용 위치**:

- `getBlobFiles()`: Blob 파일 목록 조회

**Evidence**:

- `src/shared/lib/blob.ts:1-32`: React.cache 사용

---

### Promise.all

- **Purpose**: 병렬 비동기 작업 (성능 최적화)

**사용 예시**:

```typescript
const [htmlContent, relatedPosts, series] = await Promise.all([
  processMarkdown(content),
  getRelatedPosts(blobFiles, post, 4),
  getPostSeries(blobFiles, slugString),
]);
```

**특징**:

1. **병렬 실행**: 여러 비동기 작업을 동시에 실행
2. **시간 절약**: 200~300ms 절약 (순차 실행 대비)

**사용 위치**:

- 포스트 페이지: MDX 처리, 연관 포스트, 시리즈 조회

**Evidence**:

- `src/app/blog/[...slug]/page.tsx:123-127`: Promise.all 사용
