# Blog App - API Endpoints

- **Scope**: Blog 앱의 모든 API 엔드포인트 및 RPC 클라이언트
- **Source of Truth**: App Router API Routes + Hono RPC
- **Last Verified**: 2025-12-26
- **Repo Ref**: main

## 개요

Blog 앱은 두 가지 API 패턴을 사용합니다:

1. **App Router API Routes**: OG 이미지 생성, ISR 재검증
2. **Hono RPC Client**: Blog-Admin 앱과의 타입 안전한 통신 (조회수, 통계 등)

---

## App Router API Routes

### `GET /api/og/[...slug]` - OG 이미지 생성

- **Location**: `src/app/api/og/[...slug]/route.tsx` (L1-L193)
- **Purpose**: 동적 Open Graph 이미지 생성
- **Method**: GET
- **Response**: PNG 이미지 (1200x630px)
- **Cache**: 없음 (매번 생성)

**요청 형식**:

```
GET /api/og/DEV/my-post
```

**응답**:

- Content-Type: `image/png`
- 이미지 바이너리 데이터

**구현 세부사항**:

1. 포스트 메타데이터 조회 (`getPostBySlug`)
2. Next.js `ImageResponse`로 SVG 렌더링
3. 그라데이션 배경, 장식 원형 요소
4. 포스트 제목, 날짜 표시

**디자인 스펙**:

- 사이즈: 1200x630px (표준 OG 이미지)
- 배경: `linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)`
- 제목: 72px, font-weight: 800
- 날짜 배지: 22px, rounded-full, border + shadow

**Dependencies**:

- `next/og` (`ImageResponse`)
- `@repo/content` (`getPostBySlug`)
- `@/shared/lib/blob` (`getBlobFiles`)

**Evidence**:

- `src/app/api/og/[...slug]/route.tsx:32-187`: ImageResponse로 OG 이미지 생성

---

### `POST /api/revalidate` - On-Demand ISR 재검증

- **Location**: `src/app/api/revalidate/route.ts` (L1-L69)
- **Purpose**: Blog-Admin에서 콘텐츠 업데이트 시 ISR 캐시 무효화
- **Method**: POST
- **Content-Type**: `application/json`

**요청 파라미터 (Query String)**:

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `secret` | string | ✅ | 재검증 시크릿 토큰 (`REVALIDATION_SECRET`) |
| `path` | string | ❌ | 재검증할 경로 (예: `/blog/my-post`) |
| `all` | boolean | ❌ | `true`시 전체 블로그 재검증 |

**요청 예시**:

```bash
# 특정 포스트 재검증
curl -X POST "https://your-blog.com/api/revalidate?secret=YOUR_SECRET&path=/blog/my-post"

# 전체 블로그 재검증
curl -X POST "https://your-blog.com/api/revalidate?secret=YOUR_SECRET&all=true"
```

**성공 응답** (200):

```json
{
  "revalidated": true,
  "paths": ["/blog/my-post", "/", "/blog"],
  "timestamp": "2025-12-26T10:30:00.000Z"
}
```

**에러 응답**:

- 401: 시크릿 토큰 불일치
- 400: `path` 또는 `all=true` 파라미터 누락
- 500: 재검증 실패

**Security**:

- `REVALIDATION_SECRET` 환경변수로 검증
- Blog-Admin에서만 호출 가능해야 함

**재검증 동작**:

1. `path` 지정 시:
   - `revalidatePath(path)` - 해당 경로 재검증
   - `revalidatePath('/')` - 홈 재검증
   - `revalidatePath('/blog')` - 블로그 목록 재검증

2. `all=true` 시:
   - `revalidatePath('/', 'layout')` - 루트 레이아웃 재검증 (중첩된 모든 페이지)
   - `revalidatePath('/blog', 'layout')` - 블로그 레이아웃 재검증

**Dependencies**:

- `next/cache` (`revalidatePath`)
- `@/env` (`REVALIDATION_SECRET`)

**Evidence**:

- `src/app/api/revalidate/route.ts:21-23`: 시크릿 토큰 검증
- `src/app/api/revalidate/route.ts:36-52`: revalidatePath 호출

---

### `GET /feed.xml` - RSS Feed

- **Location**: `src/app/feed.xml/route.ts` (L1-L50)
- **Purpose**: RSS 2.0 피드 생성
- **Method**: GET
- **Response**: XML (RSS 2.0)
- **Cache**: 1시간 (`Cache-Control: public, max-age=3600`)

**요청 형식**:

```
GET /feed.xml
```

**응답 형식**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DEV_BBAK 블로그</title>
    <link>https://your-site.com</link>
    <description>프론트엔드 개발자 박준형의 기술 블로그</description>
    <language>ko</language>
    <lastBuildDate>Fri, 26 Dec 2025 10:30:00 GMT</lastBuildDate>
    <atom:link href="https://your-site.com/feed.xml" rel="self" type="application/rss+xml"/>
    <item>
      <title><![CDATA[포스트 제목]]></title>
      <link>https://your-site.com/blog/post-slug</link>
      <description><![CDATA[포스트 설명]]></description>
      <pubDate>Fri, 26 Dec 2025 00:00:00 GMT</pubDate>
      <guid>https://your-site.com/blog/post-slug</guid>
      <author>bbakjun</author>
      <category>nextjs</category>
      <category>react</category>
    </item>
  </channel>
</rss>
```

**구현 세부사항**:

1. 최신 20개 포스트 가져오기 (`getAllPosts().slice(0, 20)`)
2. RSS XML 문자열 생성
3. `Content-Type: application/xml` 헤더 설정
4. 1시간 캐시 설정

**Dependencies**:

- `@repo/content` (`getAllPosts`)
- `@/shared/lib/blob` (`getBlobFiles`)
- `@/env` (`NEXT_PUBLIC_SITE_URL`)

**Evidence**:

- `src/app/feed.xml/route.ts:9-49`: RSS XML 생성 및 반환

---

## Hono RPC Client (Blog-Admin 통신)

Blog 앱은 **Hono RPC 클라이언트**를 통해 Blog-Admin 앱과 타입 안전하게 통신합니다.

### RPC 클라이언트 설정

- **Location**: `src/shared/lib/rpc.ts` (L1-L6)
- **Purpose**: Blog-Admin Hono 앱의 타입 안전한 클라이언트 생성
- **Base URL**: `NEXT_PUBLIC_ADMIN_URL/api`

**코드**:

```typescript
// src/shared/lib/rpc.ts
import { BlogAdminApp } from '@apps/blog-admin/rpc';
import { hc } from 'hono/client';
import { env } from '@/env';

export const client = hc<BlogAdminApp>(`${env.NEXT_PUBLIC_ADMIN_URL}/api`);
```

**사용 패턴**:

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

**Dependencies**:

- `@apps/blog-admin/rpc` (`BlogAdminApp` 타입)
- `hono/client` (`hc`)
- `@/env` (`NEXT_PUBLIC_ADMIN_URL`)

**Evidence**:

- `src/shared/lib/rpc.ts:1-6`: Hono 클라이언트 초기화

---

### `GET /rpc/views/[slug]` - 조회수 조회 (via RPC)

- **Location**: Blog-Admin 앱 (`apps/blog-admin/src/rpc/routes/views.ts`)
- **Purpose**: 특정 포스트의 조회수 조회
- **Method**: GET (via Hono RPC)
- **RPC 경로**: `client.rpc.getViewsBySlug.$get()`

**요청 파라미터**:

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `slug` | string | ✅ | 포스트 슬러그 (예: `DEV/my-post`) |

**요청 예시**:

```typescript
const response = await client.rpc.getViewsBySlug.$get({
  query: { slug: 'DEV/my-post' },
});

if (!response.ok) {
  throw new Error('Failed to fetch views');
}

const data = await response.json();
// data.views: number
```

**응답**:

```json
{
  "views": 1234
}
```

**사용 위치**:

- `src/shared/hooks/useViews.ts:17-33`: TanStack Query로 조회수 조회
- `staleTime: 60 * 1000` (1분 캐시)

**Evidence**:

- `src/shared/hooks/useViews.ts:19-29`: RPC 클라이언트로 조회수 조회

---

### `POST /rpc/views/[slug]/increment` - 조회수 증가 (via RPC)

- **Location**: Blog-Admin 앱 (`apps/blog-admin/src/rpc/routes/views.ts`)
- **Purpose**: 특정 포스트의 조회수 증가 (세션 기반 중복 방지)
- **Method**: POST (via Hono RPC)
- **RPC 경로**: `client.rpc.incrementViewsBySlug.$post()`

**요청 파라미터**:

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `slug` | string | ✅ | 포스트 슬러그 (query parameter) |
| `json` | object | ✅ | 빈 객체 `{}` |

**요청 예시**:

```typescript
const response = await client.rpc.incrementViewsBySlug.$post({
  query: { slug: 'DEV/my-post' },
  json: {},
});

if (!response.ok) {
  throw new Error('Failed to increment views');
}

const data = await response.json();
// data.views: number
```

**응답**:

```json
{
  "views": 1235
}
```

**세션 기반 중복 방지**:

- Blog-Admin 앱에서 세션 쿠키로 중복 카운트 방지
- 동일 세션에서 24시간 내 재방문 시 카운트하지 않음

**사용 위치**:

- `src/shared/hooks/useViews.ts:36-54`: TanStack Query mutation으로 조회수 증가
- `useEffect`로 컴포넌트 마운트 시 한 번만 실행

**Evidence**:

- `src/shared/hooks/useViews.ts:38-48`: RPC mutation으로 조회수 증가

---

### `GET /rpc/views/stats` - 통계 조회 (via RPC)

- **Location**: Blog-Admin 앱 (`apps/blog-admin/src/rpc/routes/views.ts`)
- **Purpose**: 블로그 전체 통계 (총 조회수, 인기글 등)
- **Method**: GET (via Hono RPC)
- **RPC 경로**: `client.rpc.getViewsStats.$get()`
- **Cache**: 5분 (`next: { revalidate: 300 }`)

**요청 예시**:

```typescript
const response = await client.rpc.getViewsStats.$get(
  {},
  {
    init: {
      next: { revalidate: 300 }, // 5분 캐시
    },
  }
);

if (!response.ok) {
  throw new Error('Failed to fetch stats');
}

const data = await response.json();
// data.popularPosts: PopularPost[]
// data.totalViews: number
// data.totalPosts: number
// data.averageViews: number
// data.recentPosts: PopularPost[]
```

**응답**:

```json
{
  "popularPosts": [
    {
      "slug": "DEV/my-post",
      "title": "포스트 제목",
      "views": 1234,
      "date": "2025-12-26",
      "description": "포스트 설명",
      "tags": ["nextjs", "react"],
      "readingTime": "5 min read"
    }
  ],
  "totalViews": 50000,
  "totalPosts": 50,
  "averageViews": 1000,
  "recentPosts": [...]
}
```

**사용 위치**:

- `src/shared/lib/stats.ts:26-66`: `getPopularPostsStats()` 함수
- About 페이지 (`/about`), 인기글 위젯

**Evidence**:

- `src/shared/lib/stats.ts:30-37`: RPC 클라이언트로 통계 조회

---

### `GET /rpc/blob-files` - Blob 파일 목록 조회 (via RPC)

- **Location**: Blog-Admin 앱 (`apps/blog-admin/src/rpc/routes/blob-files.ts`)
- **Purpose**: Vercel Blob Storage의 파일 목록 조회 (CDC 캐시)
- **Method**: GET (via Hono RPC)
- **RPC 경로**: `client.rpc.getBlobFiles.$get()`
- **Cache**: React.cache (렌더링 컨텍스트 내 중복 방지)

**요청 파라미터**:

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `limit` | number | ❌ | 1000 | 최대 파일 수 |
| `offset` | number | ❌ | 0 | 오프셋 |
| `search` | string | ❌ | - | 검색어 (pathname 필터링) |

**요청 예시**:

```typescript
const response = await client.rpc.getBlobFiles.$get({
  query: { limit: 1000, search: 'posts/' },
});

if (!response.ok) {
  throw new Error('Failed to fetch blob files');
}

const { files, total, hasMore } = await response.json();
// files: BlobFileInfo[]
```

**응답**:

```json
{
  "files": [
    {
      "url": "https://...",
      "pathname": "posts/DEV/my-post/index.mdx",
      "contentType": "text/markdown",
      "size": 12345,
      "uploadedAt": "2025-12-26T10:00:00Z"
    }
  ],
  "total": 50,
  "hasMore": false
}
```

**CDC 캐시**:

- Blog-Admin의 PostgreSQL BlobFile 테이블 조회
- Vercel Blob API 직접 호출하지 않음 (비용 절감)
- 30분 간격 자동 동기화

**사용 위치**:

- `src/shared/lib/blob.ts:9-31`: `getBlobFiles()` 함수 (React.cache로 감싸짐)
- 모든 포스트 페이지, 블로그 목록, 태그 페이지

**Evidence**:

- `src/shared/lib/blob.ts:11-25`: RPC 클라이언트로 Blob 파일 목록 조회

---

## Custom Hooks

### `useViews` - 조회수 훅

- **Location**: `src/shared/hooks/useViews.ts` (L1-L70)
- **Purpose**: 조회수 조회 및 증가 훅 (클라이언트 사이드)
- **Dependencies**: TanStack Query, Hono RPC 클라이언트

**시그니처**:

```typescript
function useViews(slug: string, increment: boolean = false): ViewData
```

**파라미터**:

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `slug` | string | ✅ | 포스트 슬러그 |
| `increment` | boolean | ❌ | 조회수 증가 여부 (기본값: false) |

**반환값**:

```typescript
interface ViewData {
  views: number;        // 조회수
  loading: boolean;     // 로딩 상태
  error: string | null; // 에러 메시지
}
```

**동작**:

1. **조회수 조회** (`useQuery`):
   - `queryKey: ['views', slug]`
   - `staleTime: 60 * 1000` (1분 캐시)
   - RPC `GET /rpc/views/[slug]` 호출

2. **조회수 증가** (`useMutation`):
   - `increment=true` 시 컴포넌트 마운트 후 한 번만 실행
   - RPC `POST /rpc/views/[slug]/increment` 호출
   - 성공 시 캐시 업데이트 (`queryClient.setQueryData`)

**사용 예시**:

```typescript
// 조회수만 표시
const { views, loading } = useViews('DEV/my-post');

// 조회수 표시 + 증가
const { views, loading } = useViews('DEV/my-post', true);
```

**사용 위치**:

- `src/shared/ui/view-counter.tsx:12`: ViewCounter 컴포넌트
- 포스트 페이지에서 조회수 표시

**Evidence**:

- `src/shared/hooks/useViews.ts:13-69`: TanStack Query로 조회수 조회/증가

---

## 타입 정의

### `BlobFileInfo`

```typescript
interface BlobFileInfo {
  url: string;          // Blob URL (다운로드용)
  pathname: string;     // 파일 경로 (고유 식별자)
  contentType?: string; // MIME 타입
}
```

### `PopularPost`

```typescript
interface PopularPost {
  slug: string;
  title: string;
  views: number;
  date: string;
  description?: string;
  tags?: string[];
  readingTime?: string;
}
```

### `ViewStats`

```typescript
interface ViewStats {
  popularPosts: PopularPost[];
  totalViews: number;
  totalPosts: number;
  averageViews?: number;
  recentPosts?: PopularPost[];
}
```

---

## API 호출 흐름도

```
Blog App (Client/Server)
    ↓
Hono RPC Client (타입 안전)
    ↓ HTTP
Blog-Admin API (Hono)
    ↓
PostgreSQL (CDC 캐시)
    ↓
Vercel Blob Storage
```

---

## 보안 고려사항

### 1. 재검증 API (`/api/revalidate`)

- **시크릿 토큰**: `REVALIDATION_SECRET` 환경변수로 검증
- **호출 소스**: Blog-Admin 앱에서만 호출해야 함
- **CORS**: 필요시 Blog-Admin 도메인만 허용

### 2. RPC 클라이언트

- **공개 엔드포인트**: 조회수, Blob 파일 목록 (인증 불필요)
- **내부 통신**: Blog-Admin 앱과의 통신은 사설 네트워크 또는 VPC 내부에서 처리 권장

### 3. 봇 필터링

- Blog-Admin 앞단에서 User-Agent 필터링
- 조회수 증가 API에서 크롤러 제외

---

## 에러 처리

### RPC 클라이언트 에러

```typescript
const response = await client.rpc.getViewsBySlug.$get({
  query: { slug: 'DEV/my-post' },
});

if (!response.ok) {
  // 1. 로깅
  console.error('Failed to fetch views:', response.status);

  // 2. 폴백 값 반환
  return { views: 0 };
}
```

### Blob 파일 에러

```typescript
// src/shared/lib/blob.ts:26-30
} catch (error) {
  // 빌드 타임이나 서버가 없을 때 에러 처리
  console.error('Error fetching blob files:', error);
  return []; // 빈 배열 반환 (앱 계속 동작)
}
```

---

## 캐싱 전략

| 엔드포인트 | 캐시 타입 | 기간 | 목적 |
|------------|-----------|------|------|
| `/api/og/[...slug]` | 없음 | - | 항상 최신 OG 이미지 |
| `/api/revalidate` | 없음 | - | 즉시 재검증 |
| `/feed.xml` | HTTP 캐시 | 1시간 | RSS 리더 부하 감소 |
| `GET /rpc/views/[slug]` | TanStack Query | 1분 | 클라이언트 캐시 |
| `GET /rpc/views/stats` | Next.js 캐시 | 5분 | 서버 캐시 |
| `GET /rpc/blob-files` | React.cache | 영구 | 렌더링 컨텍스트 내 |

---

## 모니터링 및 로깅

### 1. Vercel Analytics

- Root Layout에서 자동 로드
- 페이지 뷰, 성능 메트릭 수집

### 2. 콘솔 로그

```typescript
// src/shared/lib/stats.ts:28
console.log('[getPopularPostsStats] RPC 통계 조회 시작');

// src/shared/lib/stats.ts:45
console.log(`[getPopularPostsStats] RPC 통계 조회 완료: ${data.popularPosts.length}개 포스트`);
```

### 3. 에러 로그

```typescript
// src/shared/lib/blob.ts:16
console.error('Failed to fetch blob files:', response.status);

// src/shared/lib/blob.ts:28
console.error('Error fetching blob files:', error);
```
