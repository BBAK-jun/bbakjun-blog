# Pages & Routes

- **Scope**: Blog 앱의 페이지 라우팅 구조, ISR 설정, 메타데이터
- **Source of Truth**: App Router 파일 시스템
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## 메타데이터

```yaml
---
metadata:
  version: "2.0.0"
  created_at: "2026-01-04T00:00:00Z"
  last_verified: "2026-01-04T00:00:00Z"
  git_commit: "628174858956a2b1ff3d7c33e4ae03c790ed3208"
  git_branch: "BBAK-jun/vaduz"

  source_files:
    apps/blog/src/app/layout.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/src/app/page.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/src/app/blog/page.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/src/app/blog/[...slug]/page.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/src/app/about/page.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/src/app/tags/page.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/src/app/tags/[tag]/page.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/src/app/series/page.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/src/app/series/[slug]/page.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true

  changed_files: []
  deleted_files: []

  extraction_config:
    depth: "standard"
    scope: "pages"
    stale_detection: true
---
```

---

## 페이지 라우팅 구조

### 루트 레이아웃

#### `/` - Root Layout

- **Location**: `apps/blog/src/app/layout.tsx` (L1-L74)
- **Purpose**: 전체 앱의 공통 레이아웃, 폰트, 프로바이더 설정
- **Source Exists**: true
- **Key Details**:
  - Geist Sans & Geist Mono 폰트 (Google Fonts)
  - QueryProvider (TanStack Query)
  - NuqsAdapter (URL query state)
  - ThemeProvider (next-themes)
  - Analytics (Vercel)
  - Unified container: `max-w-3xl mx-auto px-4 py-12` (commit 40e4015)
  - Flex layout: `min-h-screen flex flex-col`으로 Footer 하단 고정
- **Dependencies**:
  - `@vercel/analytics/react`
  - `nuqs/adapters/next/app`
  - `@/features/navigation` (Header, Footer)
  - `@/features/theme-toggle/ui`
  - `@/shared/providers/query-provider`
- **Evidence**:
  - `apps/blog/src/app/layout.tsx`: `export default function RootLayout({ children }: { children: React.ReactNode }) { return ( <html lang="ko" suppressHydrationWarning> <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}> <QueryProvider><NuqsAdapter><ThemeProvider><div className="min-h-screen flex flex-col"><Header /><main className="grow"><div className="mx-auto max-w-3xl px-4 py-12">{children}</div></main><Footer /></div></ThemeProvider></NuqsAdapter></QueryProvider><Analytics /></body> </html> ); }`

---

### 홈 페이지

#### `/` - Home Page

- **Location**: `apps/blog/src/app/page.tsx` (L1-L69)
- **Purpose**: 블로그 메인 페이지, Hero 섹션, 최신글/인기글 표시
- **Source Exists**: true
- **ISR**: 60초
- **Key Details**:
  - Hero 섹션: 이름, 직업, 설명, 연락처 링크
  - 최신 포스트 섹션 (RecentPostsGrid)
  - 인기 포스트 섹션 (PopularPostsGrid)
  - `space-y-20`으로 섹션 간 간격
  - `border-t border-border/15`로 구분선
- **Dependencies**:
  - `@/widgets/popular-posts`
  - `@/widgets/recent-posts`
- **Evidence**:
  - `apps/blog/src/app/page.tsx`: `export const revalidate = 60; export default function Home() { return ( <div className="space-y-20"><section className="space-y-6 py-8"><h1 className="text-5xl md:text-6xl font-bold">박준형</h1><p className="text-xl md:text-2xl text-muted-foreground">프론트엔드 개발자</p>...</section><section className="space-y-10"><div><h2 className="text-2xl font-bold mb-8">최신 포스트</h2><RecentPostsGrid limit={10} /></div><div className="pt-8 border-t border-border/15"><h2 className="text-2xl font-bold mb-8">인기 포스트</h2><PopularPostsGrid limit={10} /></div></section></div> ); }`

---

### 블로그 페이지

#### `/blog` - Blog List Page

- **Location**: `apps/blog/src/app/blog/page.tsx`
- **Purpose**: 포스트 목록, 검색 기능
- **Source Exists**: true
- **Rendering**: Server Component
- **Key Details**:
  - 검색창 (SearchBarClient with keyboard shortcuts)
  - 포스트 목록 (BlogPostsList)
  - 태그 필터링 지원
- **Dependencies**:
  - `@/features/post-search/ui/search-bar-client`
  - `@/features/posts/ui/blog-posts-list`
  - `@shared/lib/search-params` (nuqs searchParamsCache)

#### `/blog/[...slug]` - Blog Post Detail Page

- **Location**: `apps/blog/src/app/blog/[...slug]/page.tsx` (L1-L180+)
- **Purpose**: 개별 포스트 상세 페이지
- **Source Exists**: true
- **ISR**: 60초
- **Static Generation**: `generateStaticParams()`로 모든 포스트 경로 사전 생성
- **Dynamic Params**: `dynamicParams: true`로 새 포스트 on-demand 생성
- **Key Details**:
  - 메타데이터: OG 이미지 동적 생성
  - 포스트 컨텐츠: processMarkdown으로 HTML 렌더링
  - 시리즈 네비게이션: 이전/다음 포스트
  - 연관 포스트: 태그 기반 추천
  - 목차 (TableOfContents): 헤딩 자동 추출
  - Mermaid 차트 렌더링
  - 조회수 카운터 (ViewCounter)
  - 댓글 (Comments - Giscus)
  - 공유 버튼 (ShareButton)
  - 인기 포스트 위젯 (PopularPosts)
- **Dependencies**:
  - `@repo/content` (getAllPosts, getPostBySlug, processMarkdown, getRelatedPosts, getPostSeries, getSeriesNavigation)
  - `@/shared/lib/blob` (getBlobFiles)
  - `@/entities/post/ui` (RelatedPosts, SeriesNavigation, ShareButton)
  - `@/processes/post-reading/ui` (TableOfContents, MermaidRenderer, Comments)
  - `@/widgets/popular-posts`
  - `@/shared/ui` (ViewCounter, CodeBlockWrapper)
- **Evidence**:
  - `apps/blog/src/app/blog/[...slug]/page.tsx`: `export const revalidate = 60; export const dynamicParams = true; export async function generateStaticParams() { const blobFiles = await getBlobFiles(); const posts = await getAllPosts(blobFiles); return posts.map(post => ({ slug: post.slug.split('/') })); }`

---

### 태그 페이지

#### `/tags` - Tags List Page

- **Location**: `apps/blog/src/app/tags/page.tsx`
- **Purpose**: 모든 태그 목록 표시
- **Source Exists**: true
- **Rendering**: Server Component

#### `/tags/[tag]` - Tag Detail Page

- **Location**: `apps/blog/src/app/tags/[tag]/page.tsx`
- **Purpose**: 특정 태그의 포스트 목록
- **Source Exists**: true
- **ISR**: 300초 (5분)
- **Dynamic Params**: `dynamicParams: true`로 새 태그 on-demand 생성

---

### 시리즈 페이지

#### `/series` - Series List Page

- **Location**: `apps/blog/src/app/series/page.tsx`
- **Purpose**: 모든 시리즈 목록 표시
- **Source Exists**: true
- **ISR**: 300초 (5분)

#### `/series/[slug]` - Series Detail Page

- **Location**: `apps/blog/src/app/series/[slug]/page.tsx`
- **Purpose**: 특정 시리즈의 포스트 목록 (순서대로)
- **Source Exists**: true
- **ISR**: 300초 (5분)

---

### 소개 페이지

#### `/about` - About Page

- **Location**: `apps/blog/src/app/about/page.tsx` (L1-L120+)
- **Purpose**: 블로그 소개, 통계, 경력 타임라인
- **Source Exists**: true
- **ISR**: 300초 (5분)
- **Key Details**:
  - Hero 섹션: 이름, 직업, 설명, 연락처
  - 통계 섹션: 총 포스트 수, 총 조회수
  - 기술 스택: Frontend, Backend, Tools
  - 경력 타임라인 (ExperienceTimeline)
- **Dependencies**:
  - `@/shared/lib/stats` (getPopularPostsStats)
  - `@/shared/lib/blob` (getBlobFiles)
  - `@repo/content` (getAllPosts)
  - `@/features/navigation/ui/experience-timeline`
- **Evidence**:
  - `apps/blog/src/app/about/page.tsx`: `export const revalidate = 300; export default async function AboutPage() { const stats = await getPopularPostsStats(); const blobFiles = await getBlobFiles(); const posts = await getAllPosts(blobFiles); const techStack = { frontend: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Zustand', 'TanStack Query'], backend: ['Node.js', 'Hono', 'Prisma', 'PostgreSQL', 'Redis'], tools: ['Git', 'Vercel', 'Turbo', 'pnpm', 'VSCode'] }; return ( <div className="space-y-16"><section className="space-y-6 py-8">...</section></div> ); }`

---

### API Routes

#### `/api/og/[...slug]` - OG Image Generation

- **Location**: `apps/blog/src/app/api/og/[...slug]/route.tsx`
- **Purpose**: 동적 OG 이미지 생성 (1200x630px)
- **Source Exists**: true
- **Runtime**: Edge Runtime
- **Key Details**:
  - 포스트 제목, 설명, 작성자 표시
  - ImageResponse로 빠른 이미지 생성
  - 캐시 헤더 설정

#### `/api/revalidate` - On-Demand ISR Revalidation

- **Location**: `apps/blog/src/app/api/revalidate/route.ts`
- **Purpose**: 수동 ISR 재검증 트리거
- **Source Exists**: true
- **Method**: POST
- **Key Details**:
  - `REVALIDATION_SECRET` 검증
  - path 쿼리 파라미터로 재검증할 페이지 지정
  - Blog-Admin에서 호출하여 포스트 업데이트 후 즉시 반영

#### `/feed.xml` - RSS Feed

- **Location**: `apps/blog/src/app/feed.xml/route.ts`
- **Purpose**: RSS 피드 생성
- **Source Exists**: true
- **Cache**: 3600초 (1시간)
- **Key Details**:
  - 최신 포스트 20개 포함
  - 제목, 설명, 링크, 작성일, 태그

---

## ISR 설정 요약

| 경로 | ISR 간격 | Dynamic Params | 용도 |
|------|---------|----------------|------|
| `/` | 60s | - | 홈 페이지 자동 업데이트 |
| `/blog` | - | - | 서버 사이드 렌더링 (검색) |
| `/blog/[...slug]` | 60s | true | 포스트 자동 업데이트 + 새 포스트 on-demand |
| `/tags` | - | - | 서버 사이드 렌더링 |
| `/tags/[tag]` | 300s | true | 태그 페이지 5분 간격 업데이트 |
| `/series` | 300s | - | 시리즈 목록 5분 간격 업데이트 |
| `/series/[slug]` | 300s | true | 시리즈 상세 5분 간격 업데이트 |
| `/about` | 300s | - | 소개 페이지 5분 간격 업데이트 |
| `/feed.xml` | 3600s | - | RSS 피드 1시간 캐싱 |

---

## 메타데이터 설정

### Root Layout Metadata

- **Title**: "박준형 - 프론트엔드 개발자"
- **Description**: "프론트엔드 개발자 박준형의 블로그"
- **OG Locale**: ko_KR
- **RSS Feed**: `/feed.xml`

### Blog Post Metadata

- **Dynamic OG Image**: `/api/og/[slug]`
- **Twitter Card**: summary_large_image
- **Authors**: frontMatter.author 또는 "bbakjun"
- **Tags**: frontMatter.tags
- **Published Time**: frontMatter.date

---

## 정적 생성 전략

### generateStaticParams

**Blog Post Pages** (`/blog/[...slug]/page.tsx`):

```typescript
export async function generateStaticParams() {
  const blobFiles = await getBlobFiles();
  const posts = await getAllPosts(blobFiles);
  return posts.map(post => ({
    slug: post.slug.split('/'),
  }));
}
```

- 빌드 시 모든 포스트 경로 생성
- `dynamicParams: true`로 새 포스트 on-demand 생성
- Catch-all routes으로 중첩 경로 지원 (예: `DEV/my-post`)

---

## 라우팅 패턴

### Catch-All Routes

**`[...slug]`**:
- 단일 경로: `/blog/my-post` → `slug: ['my-post']`
- 중첩 경로: `/blog/DEV/my-post` → `slug: ['DEV', 'my-post']`
- slug 배열을 `join('/')`으로 단일 문자열 변환

### Dynamic Routes

**`[tag]`**, **`[slug]`**:
- 정적 생성: `generateStaticParams()`에 정의된 경로만
- 동적 생성: `dynamicParams: true`로 정의되지 않은 경로도 on-demand 생성

---

## 캐싱 전략

### React.cache

**Blob Files** (`getBlobFiles`):
- 렌더링 컨텍스트 내에서 중복 호출 방지
- 한 번의 RPC 호출로 모든 페이지에서 재사용

### ISR Revalidation

**자동 재검증**:
- 60s: 포스트, 홈 (자주 업데이트되는 컨텐츠)
- 300s: 태그, 시리즈, 소개 (덜 자주 업데이트되는 컨텐츠)
- 3600s: RSS 피드 (오래된 컨텐츠)

**On-Demand 재검증**:
- Blog-Admin에서 포스트 업로드/수정/삭제 후 자동 호출
- `REVALIDATION_SECRET`으로 보안

---

## 성능 최적화

### Parallel Data Fetching

**Blog Post Page**:
```typescript
const [htmlContent, relatedPosts, series] = await Promise.all([
  processMarkdown(content),
  getRelatedPosts(blobFiles, post, 4),
  getPostSeries(blobFiles, slugString),
]);
```

### Static Generation

- 빌드 시 모든 포스트 HTML 생성
- CDN에서 빠르게 제공
- ISR로 백그라운드 업데이트

---

## 접근성

### Semantic HTML

- `<main>`: 주요 컨텐츠 영역
- `<header>`: 페이지 헤더
- `<footer>`: 페이지 푸터
- `<article>`: 개별 포스트
- `<section>`: 콘텐츠 섹션
- `<time>`: 날짜 정보

### Keyboard Navigation

- Tab 키로 포스트 간 이동
- Enter 키로 링크 이동
- Cmd+K로 검색창 포커스
- ESC로 검색창 닫기

---

## 검색 엔진 최적화 (SEO)

### Meta Tags

- Title: 페이지별 동적 생성
- Description: 프론트 매터 description
- Keywords: 프론트 매터 tags
- Canonical URLs: 기본 경로 사용
- Open Graph: 카드 형태 미리보기
- Twitter Card: 트위터 공유 최적화

### Sitemap & Robots

- `sitemap.xml`: 모든 포스트 URL 포함
- `robots.txt`: 크롤러 허용

### Structured Data

- JSON-LD: 포스트 메타데이터
- Article: 블로그 포스트 구조화 데이터

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
