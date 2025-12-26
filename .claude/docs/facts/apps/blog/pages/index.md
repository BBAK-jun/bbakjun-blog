# Blog App - Pages & Routes

- **Scope**: Blog 앱의 모든 페이지 및 라우팅 구조
- **Source of Truth**: App Router (Next.js 15)
- **Last Verified**: 2025-12-26
- **Repo Ref**: main

## 개요

Blog 앱은 Next.js 15 App Router를 사용하며, ISR(Incremental Static Regeneration)로 최적화된 정적/동적 하이브리드 라우팅을 구현합니다.

---

## 라우팅 구조

### `/` - 홈 페이지

- **Location**: `src/app/page.tsx` (L1-L82)
- **Purpose**: 사이트 메인 페이지, 최신글/인기글 탭 UI
- **ISR**: 60초 재검증 (`revalidate = 60`)
- **Key Features**:
  - Hero 섹션 (소개, CTA 버튼)
  - 최신글/인기글 탭 (`RecentPostsGrid`, `PopularPostsGrid`)
  - 탭 상태 관리 (클라이언트 사이드)
- **Dependencies**:
  - `@/widgets/recent-posts`, `@/widgets/popular-posts`
  - `@/shared/ui/tabs`, `@/shared/ui/button`
- **Evidence**:
  - `src/app/page.tsx`: Hero 섹션, Tabs 컴포넌트로 최신/인기글 표시

---

### `/blog` - 모든 포스트 목록

- **Location**: `src/app/blog/page.tsx` (L1-L116)
- **Purpose**: 전체 포스트 목록, 검색, 태그 필터링
- **Rendering**: 서버 컴포넌트 (검색은 nuqs로 URL 파라미터 처리)
- **Key Features**:
  - 서버 사이드 검색 필터링 (제목, 설명, 태그, 내용)
  - 태그 필터 UI
  - 검색 바 (클라이언트 컴포넌트)
- **Dependencies**:
  - `@repo/content` (`getAllPosts`, `getAllTags`)
  - `@/shared/lib/searchParams` (nuqs cache)
- **Evidence**:
  - `src/app/blog/page.tsx:20-45`: filterPosts 함수로 서버 사이드 필터링
  - `src/app/blog/page.tsx:49`: nuqs의 searchParamsCache로 타입세이프 파싱

---

### `/blog/[...slug]` - 개별 포스트 페이지

- **Location**: `src/app/blog/[...slug]/page.tsx` (L1-L292)
- **Purpose**: MDX 포스트 렌더링, 조회수, 댓글, 연관 포스트
- **ISR**: 60초 재검증 (`revalidate = 60`)
- **Dynamic Params**: `true` (빌드 시 생성되지 않은 경로도 런타임에 생성)
- **Static Generation**:
  - `generateStaticParams()`: Blob 파일 목록으로 정적 경로 생성
  - `generateMetadata()`: 동적 OG 이미지 URL 생성
- **Key Features**:
  - 포스트 헤더 (제목, 날짜, 조회수, 태그)
  - 시리즈 네비게이션 (`SeriesNavigation`)
  - MDX 내용 렌더링 (`processMarkdown`)
  - Mermaid 차트 (`MermaidRenderer`)
  - 목차 (`TableOfContents`)
  - 댓글 (Giscus)
  - 연관 포스트 (`RelatedPosts`)
  - 인기 글 사이드바
- **Dependencies**:
  - `@repo/content` (getPostBySlug, processMarkdown, getRelatedPosts, etc.)
  - `@/processes/post-reading` (MermaidRenderer, TableOfContents, Comments)
  - `@/entities/post` (RelatedPosts, SeriesNavigation, ShareButton)
- **Evidence**:
  - `src/app/blog/[...slug]/page.tsx:35-41`: generateStaticParams로 빌드 타임에 정적 경로 생성
  - `src/app/blog/[...slug]/page.tsx:123-127`: Promise.all로 병렬 데이터 페칭 (200~300ms 절약)

---

### `/tags` - 태그 목록 페이지

- **Location**: `src/app/tags/page.tsx`
- **Purpose**: 모든 태그 목록 표시
- **Rendering**: 서버 컴포넌트
- **Dependencies**:
  - `@repo/content` (`getAllTags`)
- **Evidence**:
  - 태그 리스트 UI, 태그별 포스트 수 표시

---

### `/tags/[tag]` - 태그별 포스트 목록

- **Location**: `src/app/tags/[tag]/page.tsx` (L1-L114)
- **Purpose**: 특정 태그가 있는 포스트 필터링
- **ISR**: 300초(5분) 재검증 (`revalidate = 300`)
- **Dynamic Params**: `true` (새 태그 런타임 생성)
- **Static Generation**:
  - `generateStaticParams()`: 모든 태그로 정적 경로 생성
  - `generateMetadata()`: 태그별 메타데이터
- **Key Features**:
  - 태그 헤더 (배지, 포스트 수)
  - 다른 태그 추천 (최대 10개)
  - 포스트 그리드 (3열 레이아웃)
- **Dependencies**:
  - `@repo/content` (`getPostsByTag`, `getAllTags`)
- **Evidence**:
  - `src/app/tags/[tag]/page.tsx:14-21`: generateStaticParams로 모든 태그 경로 생성

---

### `/series` - 시리즈 목록 페이지

- **Location**: `src/app/series/page.tsx` (L1-L80)
- **Purpose**: 포스트 시리즈 목록 표시
- **ISR**: 300초(5분) 재검증 (`revalidate = 300`)
- **Key Features**:
  - 시리즈 카드 그리드
  - 시리즈 상태 (완료/진행중)
  - 포스트 수, 최근 업데이트 날짜
- **Dependencies**:
  - `@repo/content` (`getSeriesSummaries`)
- **Evidence**:
  - `src/app/series/page.tsx:18`: getSeriesSummaries로 시리즈 목록 조회

---

### `/series/[slug]` - 시리즈 상세 페이지

- **Location**: `src/app/series/[slug]/page.tsx`
- **Purpose**: 시리즈에 속한 포스트 목록, 네비게이션
- **ISR**: 300초(5분) 재검증
- **Key Features**:
  - 시리즈 소개
  - 포스트 목록 (순서대로)
  - 이전/다음 포스트 네비게이션
- **Dependencies**:
  - `@repo/content` (`getPostSeries`, `getSeriesNavigation`)

---

### `/about` - 소개 페이지

- **Location**: `src/app/about/page.tsx` (L1-L261)
- **Purpose**: 블로그 소개, 작성자 정보, 통계
- **ISR**: 300초(5분) 재검증 (`revalidate = 300`)
- **Key Features**:
  - 프로필 섹션 (이름, 직함, 소개)
  - 블로그 통계 (총 포스트, 조회수, 평균 조회수)
  - 기술 스택 (Frontend, Backend, Tools)
  - 경력 타임라인 (`ExperienceTimeline`)
  - 주요 프로젝트
  - 연락처 (GitHub, LinkedIn, Email, 이력서)
- **Dependencies**:
  - `@/shared/lib/stats` (`getPopularPostsStats`)
  - `@repo/content` (`getAllPosts`)
  - `@/features/navigation/ui/experience-timeline`
- **Evidence**:
  - `src/app/about/page.tsx:27-29`: getPopularPostsStats로 통계 조회

---

### `/newsletter/unsubscribe` - 뉴스레터 구독 취소

- **Location**: `src/app/newsletter/unsubscribe/page.tsx`
- **Purpose**: 뉴스레터 구독 취소 페이지
- **Rendering**: 서버/클라이언트 하이브리드
- **Key Features**:
  - 이메일 입력 폼
  - RPC로 blog-admin에 구독 취소 요청
- **Dependencies**:
  - `@/shared/lib/rpc` (Hono RPC 클라이언트)

---

## API Routes

### `/api/og/[...slug]` - OG 이미지 생성

- **Location**: `src/app/api/og/[...slug]/route.tsx` (L1-L193)
- **Purpose**: 동적 Open Graph 이미지 생성 (Next.js ImageResponse)
- **Method**: GET
- **Output**: PNG 이미지 (1200x630)
- **Key Features**:
  - 포스트 제목, 날짜 표시
  - 그라데이션 배경, 장식 요소
  - 다크모드 미지원 (정적 디자인)
- **Dependencies**:
  - `next/og` (`ImageResponse`)
  - `@repo/content` (`getPostBySlug`)
- **Evidence**:
  - `src/app/api/og/[...slug]/route.tsx:32-187`: ImageResponse로 OG 이미지 생성

---

### `/api/revalidate` - On-Demand ISR 재검증

- **Location**: `src/app/api/revalidate/route.ts` (L1-L69)
- **Purpose**: blog-admin에서 콘텐츠 업데이트 시 ISR 재검증 트리거
- **Method**: POST
- **Query Parameters**:
  - `secret` (required): 재검증 토큰 (`REVALIDATION_SECRET`)
  - `path` (optional): 재검증할 경로
  - `all` (optional): `true`시 전체 블로그 재검증
- **Security**: 시크릿 토큰 검증 (401 if invalid)
- **Revalidation Behavior**:
  - 특정 경로: `revalidatePath(path)` + 홈/블로그 목록도 재검증
  - 전체: `revalidatePath('/', 'layout')` + `/blog` layout
- **Dependencies**:
  - `next/cache` (`revalidatePath`)
  - `@/env` (`REVALIDATION_SECRET`)
- **Evidence**:
  - `src/app/api/revalidate/route.ts:21-23`: 시크릿 토큰 검증
  - `src/app/api/revalidate/route.ts:36-44`: revalidatePath로 ISR 트리거

---

## Special Routes

### `/feed.xml` - RSS Feed

- **Location**: `src/app/feed.xml/route.ts` (L1-L50)
- **Purpose**: RSS 2.0 피드 생성
- **Method**: GET
- **Content-Type**: `application/xml`
- **Cache**: 1시간 (`Cache-Control: public, max-age=3600`)
- **Key Features**:
  - 최신 20개 포스트
  - 제목, 링크, 설명, 날짜, 작성자, 태그
- **Dependencies**:
  - `@repo/content` (`getAllPosts`)
- **Evidence**:
  - `src/app/feed.xml/route.ts:14-15`: 최신 20개 포스트 슬라이스

---

### `/robots.txt` - Robots.txt

- **Location**: `src/app/robots.txt/route.ts`
- **Purpose**: 검색엔진 크롤러 지시
- **Method**: GET
- **Content-Type**: `text/plain`

---

### `/sitemap.xml` - Sitemap

- **Location**: `src/app/sitemap.xml/route.ts`
- **Purpose**: XML 사이트맵 생성
- **Method**: GET
- **Content-Type**: `application/xml`

---

## Layout Components

### Root Layout

- **Location**: `src/app/layout.tsx` (L1-L71)
- **Purpose**: 전역 레이아웃, 폰트, 프로바이더
- **Key Features**:
  - Geist 폰트 (Sans, Mono)
  - ThemeProvider (다크모드)
  - QueryProvider (TanStack Query)
  - NuqsAdapter (URL 파라미터)
  - Header, Footer
  - Vercel Analytics
- **Dependencies**:
  - `next/font/google` (Geist, Geist_Mono)
  - `@/features/navigation` (Header, Footer)
  - `@/features/theme-toggle` (ThemeProvider)
  - `@/shared/providers/query-provider`
  - `@vercel/analytics`
- **Evidence**:
  - `src/app/layout.tsx:40-70`: QueryProvider, ThemeProvider, NuqsAdapter 중첩

---

## 라우팅 패턴 요약

| 경로 | ISR | Dynamic Params | 생성 방식 |
|------|-----|----------------|-----------|
| `/` | 60s | - | Static |
| `/blog` | - | - | Server-rendered |
| `/blog/[...slug]` | 60s | true | Static + ISR |
| `/tags` | - | - | Server-rendered |
| `/tags/[tag]` | 300s | true | Static + ISR |
| `/series` | 300s | - | Static + ISR |
| `/series/[slug]` | 300s | true | Static + ISR |
| `/about` | 300s | - | Static + ISR |
| `/feed.xml` | 3600s | - | Static |
| `/api/og/[...slug]` | - | - | Edge runtime |

---

## 중요 패턴

### 1. React.cache로 중복 호출 방지

`getBlobFiles()`는 `React.cache`로 감싸져 있어 렌더링 컨텍스트 내에서 중복 호출을 방지합니다:

```typescript
// src/shared/lib/blob.ts:1-32
export const getBlobFiles = cache(async (): Promise<BlobFileInfo[]> => {
  // ...
});
```

### 2. 병렬 데이터 페칭

`Promise.all`로 여러 데이터 소스를 병렬로 페칭하여 200~300ms 절약:

```typescript
// src/app/blog/[...slug]/page.tsx:123-127
const [htmlContent, relatedPosts, series] = await Promise.all([
  processMarkdown(content),
  getRelatedPosts(blobFiles, post, 4),
  getPostSeries(blobFiles, slugString),
]);
```

### 3. 동적 경로 생성

`generateStaticParams`로 빌드 타임에 정적 경로 생성:

```typescript
// src/app/blog/[...slug]/page.tsx:35-41
export async function generateStaticParams() {
  const blobFiles = await getBlobFiles();
  const posts = await getAllPosts(blobFiles);
  return posts.map(post => ({
    slug: post.slug.split('/'),
  }));
}
```

### 4. 메타데이터 생성

`generateMetadata`로 동적 OG 이미지 URL 생성:

```typescript
// src/app/blog/[...slug]/page.tsx:52-96
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  // ...
  const ogImageUrl = `${env.NEXT_PUBLIC_SITE_URL}/api/og/${slugString}`;
  // ...
}
```
