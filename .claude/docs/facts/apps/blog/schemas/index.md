# Blog App - Schemas & Types

- **Scope**: Blog 앱의 데이터 스키마, 타입 정의, 유효성 검증
- **Source of Truth**: TypeScript 타입, @repo/content 패키지
- **Last Verified**: 2025-12-26
- **Repo Ref**: main

## 개요

Blog 앱은 다음과 같은 데이터 스키마를 사용합니다:

1. **Post**: MDX 프론트 매터 및 콘텐츠 (`@repo/content`)
2. **View**: 조회수 데이터 (via RPC)
3. **BlobFile**: Vercel Blob 파일 메타데이터 (via CDC)
4. **Environment**: 환경변수 스키마 (`@t3-oss/env-nextjs`)

---

## Post 스키마

### `Post` 타입

- **Location**: `packages/content/src/index.ts` (내보내기)
- **Purpose**: MDX 포스트 데이터 구조
- **Source**: `@repo/content` 패키지

**타입 정의**:

```typescript
interface Post {
  slug: string;           // 포스트 슬러그 (예: "DEV/my-post")
  frontMatter: PostFrontMatter;
  content: string;        // MDX 원본 콘텐츠
  readingTime: string;    // 예상 읽기 시간 (예: "5 min read")
}
```

**사용 위치**:

- 포스트 목록 페이지
- 개별 포스트 페이지
- 검색 결과
- 연관 포스트 계산

**Evidence**:

- `packages/content/src/posts.ts`: Post 타입 정의 및 사용

---

### `PostFrontMatter` 타입

- **Location**: `packages/content/src/posts.ts`
- **Purpose**: MDX 프론트 매터 (YAML) 스키마

**필드 정의**:

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `title` | string | ✅ | - | 포스트 제목 |
| `date` | string | ✅ | - | 작성 날짜 (ISO 8601) |
| `description` | string | ✅ | - | 포스트 요약 (OG, 메타데이터용) |
| `tags` | string[] | ✅ | [] | 태그 목록 |
| `author` | string | ❌ | 'bbakjun' | 작성자 |
| `draft` | boolean | ❌ | false | 초안 여부 (true면 빌드에서 제외) |

**MDX 예시**:

```yaml
---
title: 'Next.js 15 ISR 완벽 가이드'
date: '2025-12-26'
description: 'Incremental Static Regeneration의 개념과 구현 방법을 알아봅니다.'
tags: ['nextjs', 'react', 'typescript']
author: 'bbakjun'
draft: false
---
```

**유효성 검증**:

- `gray-matter`로 YAML 파싱
- 필수 필드 누락 시 에러 발생
- `date`는 ISO 8601 형식 검증

**Evidence**:

- `packages/content/src/posts.ts`: gray-matter로 프론트 매터 파싱

---

## View 스키마

### `ViewData` 타입

- **Location**: `src/shared/hooks/useViews.ts` (L7-L11)
- **Purpose**: 조회수 훅의 반환 타입

**타입 정의**:

```typescript
interface ViewData {
  views: number;        // 조회수
  loading: boolean;     // 로딩 상태
  error: string | null; // 에러 메시지
}
```

**Evidence**:

- `src/shared/hooks/useViews.ts:7-11`: ViewData 인터페이스 정의

---

### `PopularPost` 타입

- **Location**: `src/shared/lib/stats.ts` (L3-L11)
- **Purpose**: 인기 포스트 데이터 구조

**타입 정의**:

```typescript
interface PopularPost {
  slug: string;           // 포스트 슬러그
  title: string;          // 포스트 제목
  views: number;          // 조회수
  date: string;           // 작성 날짜
  description?: string;   // 포스트 설명
  tags?: string[];        // 태그 목록
  readingTime?: string;   // 읽기 시간
}
```

**사용 위치**:

- 인기글 위젯 (`PopularPosts`)
- About 페이지 통계
- 사이드바 인기글

**Evidence**:

- `src/shared/lib/stats.ts:3-11`: PopularPost 인터페이스 정의

---

### `ViewStats` 타입

- **Location**: `src/shared/lib/stats.ts` (L13-L19)
- **Purpose**: 블로그 전체 통계 데이터 구조

**타입 정의**:

```typescript
interface ViewStats {
  popularPosts: PopularPost[];  // 인기 포스트 목록
  totalViews: number;           // 총 조회수
  totalPosts: number;           // 총 포스트 수
  averageViews?: number;        // 평균 조회수
  recentPosts?: PopularPost[];  // 최근 포스트 목록
}
```

**사용 위치**:

- `getPopularPostsStats()` 함수 반환값
- About 페이지 통계 카드

**Evidence**:

- `src/shared/lib/stats.ts:13-19`: ViewStats 인터페이스 정의

---

## Blob File 스키마

### `BlobFileInfo` 타입

- **Location**: `packages/content/src/index.ts` (내보내기)
- **Purpose**: Vercel Blob Storage 파일 메타데이터

**타입 정의**:

```typescript
interface BlobFileInfo {
  url: string;          // Blob URL (콘텐츠 다운로드용)
  pathname: string;     // 파일 경로 (고유 식별자)
  contentType?: string; // MIME 타입 (예: "text/markdown")
}
```

**주요 특징**:

- `pathname`이 고유 식별자 (NOT `url`)
- Vercel Blob은 같은 파일을 다시 업로드하면 새 URL 생성
- CDC 캐시는 `pathname`을 기준으로 중복 방지

**사용 위치**:

- `getAllPosts(blobFiles)` - 모든 포스트 조회
- `getPostBySlug(blobFiles, slug)` - 특정 포스트 조회
- `getAllTags(blobFiles)` - 모든 태그 조회

**Evidence**:

- `src/shared/lib/blob.ts:21-25`: BlobFileInfo 매핑

---

## MDX 컴포넌트 스키마

### `MDXComponents` 타입

- **Location**: `mdx-components.tsx` (L1-L67)
- **Purpose**: MDX에서 사용하는 커스텀 컴포넌트 매핑

**매핑되는 요소**:

| MDX 요소 | 컴포넌트 | 스타일 클래스 |
|----------|----------|---------------|
| `h1` | 커스텀 h1 | `text-4xl font-bold mb-6` |
| `h2` | 커스텀 h2 | `text-3xl font-semibold mb-4 mt-8` |
| `h3` | 커스텀 h3 | `text-2xl font-semibold mb-3 mt-6` |
| `p` | 커스텀 p | `mb-4 text-gray-700 dark:text-gray-300` |
| `a` | 커스텀 a | `text-blue-600 dark:text-blue-400 hover:underline` |
| `ul` | 커스텀 ul | `mb-4 ml-6 list-disc` |
| `ol` | 커스텀 ol | `mb-4 ml-6 list-decimal` |
| `li` | 커스텀 li | `mb-1` |
| `blockquote` | 커스텀 blockquote | `border-l-4 border-blue-500 pl-4 mb-4 italic` |
| `code` (inline) | 커스텀 code | `bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded` |
| `pre` (block) | 커스텀 pre | `bg-gray-100 dark:bg-gray-800 p-4 rounded-lg` |
| `img` | Next.js Image | `width={800} height={400} rounded-lg` |

**Evidence**:

- `mdx-components.tsx:4-67`: useMDXComponents 함수로 매핑

---

## 환경변수 스키마

### `env` 객체

- **Location**: `src/env.ts` (L1-L48)
- **Purpose**: 타입 안전한 환경변수 접근
- **Validation**: `@t3-oss/env-nextjs` + Zod

**서버 사이드 변수**:

| 변수명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `REDIS_URL` | string (URL) | ❌ | Redis 연결 URL (선택사항) |
| `REVALIDATION_SECRET` | string (min 1) | ❌ | ISR 재검증 시크릿 토큰 |

**클라이언트 사이드 변수**:

| 변수명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| `NEXT_PUBLIC_SITE_URL` | string (URL) | ❌ | 사이트 기본 URL (OG 이미지용) |
| `NEXT_PUBLIC_ADMIN_URL` | string (URL) | ✅ | Blog-Admin 앱 URL (RPC 통신용) |
| `NEXT_PUBLIC_GISCUS_REPO` | string | ❌ | Giscus 리포지토리 (예: "BBAK-jun/bbakjun-blog") |
| `NEXT_PUBLIC_GISCUS_REPO_ID` | string | ❌ | Giscus 리포지토리 ID |
| `NEXT_PUBLIC_GISCUS_CATEGORY` | string | ❌ | Giscus 카테고리명 |
| `NEXT_PUBLIC_GISCUS_CATEGORY_ID` | string | ❌ | Giscus 카테고리 ID |

**사용 예시**:

```typescript
import { env } from '@/env';

// 서버 사이드
const redisUrl = env.REDIS_URL;
const secret = env.REVALIDATION_SECRET;

// 클라이언트 사이드
const adminUrl = env.NEXT_PUBLIC_ADMIN_URL;
const siteUrl = env.NEXT_PUBLIC_SITE_URL;
```

**검증 동작**:

- 개발/빌드 시 첫 `import`에서 검증 실행
- 필수 변수 누락 시 에러 발생
- `SKIP_ENV_VALIDATION=true` 시 검증 건너뜀 (Docker 빌드용)

**Evidence**:

- `src/env.ts:4-47`: createEnv로 환경변수 스키마 정의

---

## Series 스키마

### `Series` 타입

- **Location**: `packages/content/src/posts.ts`
- **Purpose**: 포스트 시리즈 데이터 구조

**타입 정의**:

```typescript
interface Series {
  slug: string;           // 시리즈 슬러그 (예: "nextjs-guide")
  title: string;          // 시리즈 제목
  description: string;    // 시리즈 설명
  status: 'completed' | 'ongoing'; // 완료 여부
  posts: SeriesPost[];    // 속한 포스트 목록
  totalPosts: number;     // 총 포스트 수
  updatedAt?: string;     // 최근 업데이트 날짜
}

interface SeriesPost {
  slug: string;           // 포스트 슬러그
  title: string;          // 포스트 제목
  order: number;          // 시리즈 내 순서
}
```

**사용 위치**:

- 시리즈 목록 페이지 (`/series`)
- 시리즈 상세 페이지 (`/series/[slug]`)
- 포스트 내 시리즈 네비게이션

**Evidence**:

- `packages/content/src/posts.ts`: getPostSeries, getSeriesNavigation 함수

---

## Navigation 스키마

### `SeriesNavigation` 타입

- **Location**: `packages/content/src/posts.ts`
- **Purpose**: 시리즈 내 이전/다음 포스트 네비게이션

**타입 정의**:

```typescript
interface SeriesNavigationItem {
  post: Post;       // 포스트 데이터
  order: number;    // 시리즈 내 순서
}

interface SeriesNavigation {
  series: Series;                    // 시리즈 정보
  current: SeriesNavigationItem;     // 현재 포스트
  prev?: SeriesNavigationItem;       // 이전 포스트
  next?: SeriesNavigationItem;       // 다음 포스트
}
```

**사용 위치**:

- 포스트 페이지 시리즈 네비게이션 컴포넌트

**Evidence**:

- `src/entities/post/ui/series-navigation.tsx`: SeriesNavigation 컴포넌트

---

## Search Params 스키마

### `searchParamsCache` 스키마

- **Location**: `src/shared/lib/searchParams.ts`
- **Purpose**: nuqs로 타입 안전한 URL 쿼리 파라미터 파싱

**정의된 파라미터**:

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `q` | string | "" | 검색어 (블로그 목록) |

**사용 예시**:

```typescript
import { searchParamsCache } from '@/shared/lib/searchParams';

const { q: searchQuery } = await searchParamsCache.parse(searchParams);

// searchQuery는 타입이 string으로 보장됨
```

**Evidence**:

- `src/shared/lib/searchParams.ts`: nuqs parser 캐시 정의

---

## Props 스키마

### `PostCardProps`

- **Location**: `src/entities/post/ui/post-card.tsx` (L6-L8)
- **Purpose**: 포스트 카드 컴포넌트 Props

```typescript
interface PostCardProps {
  post: Post;
}
```

**Evidence**:

- `src/entities/post/ui/post-card.tsx:6-8`: PostCardProps 정의

---

### `ViewCounterProps`

- **Location**: `src/shared/ui/view-counter.tsx` (L5-L9)
- **Purpose**: 조회수 카운터 컴포넌트 Props

```typescript
interface ViewCounterProps {
  slug: string;           // 포스트 슬러그
  increment?: boolean;    // 조회수 증가 여부 (기본값: false)
  className?: string;     // 추가 CSS 클래스
}
```

**Evidence**:

- `src/shared/ui/view-counter.tsx:5-9`: ViewCounterProps 정의

---

### `TableOfContentsProps`

- **Location**: `src/processes/post-reading/ui/table-of-contents.tsx` (L11-L13)
- **Purpose**: 목차 컴포넌트 Props

```typescript
interface TableOfContentsProps {
  className?: string;  // 추가 CSS 클래스
}
```

**Evidence**:

- `src/processes/post-reading/ui/table-of-contents.tsx:11-13`: TableOfContentsProps 정의

---

### `HeadingItem` 타입

- **Location**: `src/processes/post-reading/ui/table-of-contents.tsx` (L5-L9)
- **Purpose**: 목차 항목 데이터 구조

```typescript
interface HeadingItem {
  id: string;      // 헤딩 ID (anchor link)
  text: string;    // 헤딩 텍스트
  level: number;   // 헤딩 레벨 (1-6)
}
```

**Evidence**:

- `src/processes/post-reading/ui/table-of-contents.tsx:5-9`: HeadingItem 정의

---

## 유효성 검증

### 프론트 매터 검증

**검증 규칙**:

1. **필수 필드**: `title`, `date`, `description`, `tags`
2. **날짜 형식**: ISO 8601 (YYYY-MM-DD)
3. **태그**: 배열이며 각 요소는 string
4. **초안 필드**: `draft: true`면 빌드에서 제외

**검증 코드**:

```typescript
// packages/content/src/posts.ts
export async function getPostBySlug(blobFiles: BlobFileInfo[], slug: string) {
  // ...

  const { data, content } = matter(file.markdown, {
    excerpt: true,
  });

  // 필수 필드 검증
  if (!data.title || !data.date || !data.description) {
    throw new Error(`Invalid front matter in ${file.pathname}`);
  }

  // ...
}
```

**Evidence**:

- `packages/content/src/posts.ts`: gray-matter로 파싱 후 필수 필드 검증

---

### 환경변수 검증

**검증 규칙**:

1. **타입 검증**: Zod 스키마로 타입 검증
2. **필수 여부**: `.optional()`로 선택적 변수 지정
3. **형식 검증**: `.url()`로 URL 형식 검증, `.min(1)`로 비어있지 않음 검증

**검증 코드**:

```typescript
// src/env.ts
export const env = createEnv({
  server: {
    REDIS_URL: z.string().url().optional(),
    REVALIDATION_SECRET: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_ADMIN_URL: z.string().url(), // 필수
    // ...
  },
  runtimeEnv: { /* ... */ },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

**Evidence**:

- `src/env.ts:4-47`: Zod 스키마로 환경변수 검증

---

## 타입 내보내기

### `@repo/types` 패키지

공유 타입은 `packages/types/`에 정의되어 있습니다:

- **Post**: 포스트 데이터 구조
- **BlobFileInfo**: Blob 파일 메타데이터
- **Series**: 시리즈 데이터 구조

**사용**:

```typescript
import { Post, BlobFileInfo } from '@repo/types';
```

---

## 타입 추론

### React Query 타입 추론

TanStack Query는 Hono RPC 클라이언트에서 타입을 자동 추론합니다:

```typescript
// 반화 타입이 자동으로 추론됨
const { data } = await client.rpc.getViewsBySlug.$get({
  query: { slug: 'DEV/my-post' },
});

// data는 { views: number } 타입
```

**Evidence**:

- `src/shared/hooks/useViews.ts:24-29`: RPC 응답 타입 자동 추론

---

## 타입 안전성 보장

### 1. 컴파일 타임 검증

- TypeScript 컴파일러로 타입 오류 조기 발견
- `tsc --noEmit`으로 타입 검증

### 2. 런타임 검증

- Zod로 환경변수 런타임 검증
- gray-matter로 프론트 매터 파싱 후 필수 필드 검증

### 3. RPC 타입 안전성

- Hono RPC로 클라이언트-서버 타입 동기화
- OpenAPI 스키마 자동 생성

### 4. 빌드 타임 검증

- `next build` 시 타입 검증 실행
- 실패 시 빌드 중단
