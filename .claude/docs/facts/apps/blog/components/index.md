# Blog App - Components

- **Scope**: Blog 앱의 모든 UI 컴포넌트 및 조직 구조
- **Source of Truth**: Feature-Sliced Design (FSD) 아키텍처
- **Last Verified**: 2025-12-26
- **Repo Ref**: main

## 개요

Blog 앱은 **Feature-Sliced Design (FSD)** 아키텍처를 따라 컴포넌트를 조직합니다:

```
src/
├── app/           # App Router 페이지
├── entities/      # 비즈니스 엔티티 (Post, View)
├── features/      # 사용자 기능 (Navigation, Search, Newsletter)
├── processes/     # 비즈니스 프로세스 (PostReading)
├── widgets/       # 컴포지션 UI (PopularPosts, RecentPosts)
├── shared/        # 공유 UI 및 유틸리티
```

---

## Shared UI (기본 컴포넌트)

### `Button`

- **Location**: `src/shared/ui/button.tsx`
- **Purpose**: 재사용 가능한 버튼 컴포넌트
- **Variants**: default, outline, ghost, destructive, link
- **Sizes**: default, sm, lg, icon
- **Styling**: Tailwind CSS + class-variance-authority
- **Dependencies**: `@radix-ui/react-slot`

**사용 예시**:

```typescript
<Button asChild size="lg">
  <Link href="/blog">모든 포스트 보기</Link>
</Button>
```

---

### `Card`

- **Location**: `src/shared/ui/card.tsx`
- **Purpose**: 카드 컨테이너 컴포넌트
- **하위 컴포넌트**: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Styling**: 배경색, border, rounded corners

**사용 예시**:

```typescript
<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
    <CardDescription>설명</CardDescription>
  </CardHeader>
  <CardContent>내용</CardContent>
</Card>
```

---

### `Badge`

- **Location**: `src/shared/ui/badge.tsx`
- **Purpose**: 태그, 라벨 표시용 배지 컴포넌트
- **Variants**: default, secondary, outline, destructive
- **사용처**: 태그, 상태 표시

**사용 예시**:

```typescript
<Badge variant="secondary">#{tag}</Badge>
```

---

### `Separator`

- **Location**: `src/shared/ui/separator.tsx`
- **Purpose**: 구분선 컴포넌트
- **Dependencies**: `@radix-ui/react-separator`
- **사용처**: 포스트 헤더/푸터 구분

---

### `Tabs`

- **Location**: `src/shared/ui/tabs.tsx`
- **Purpose**: 탭 네비게이션 컴포넌트
- **Dependencies**: `@radix-ui/react-tabs`
- **사용처**: 홈 페이지 최신글/인기글 탭

**사용 예시**:

```typescript
<Tabs defaultValue="recent">
  <TabsList>
    <TabsTrigger value="recent">최신글</TabsTrigger>
    <TabsTrigger value="popular">인기글</TabsTrigger>
  </TabsList>
  <TabsContent value="recent">{/* ... */}</TabsContent>
</Tabs>
```

---

### `ViewCounter`

- **Location**: `src/shared/ui/view-counter.tsx` (L1-L97)
- **Purpose**: 조회수 표시 컴포넌트
- **Type**: Client Component
- **Dependencies**: `@/shared/hooks/useViews` (TanStack Query)

**Props**:

```typescript
interface ViewCounterProps {
  slug: string;           // 포스트 슬러그
  increment?: boolean;    // 조회수 증가 여부 (기본값: false)
  className?: string;
}
```

**특징**:

- 아이콘 + 숫자 형태 (예: "👁 1,234회")
- 로딩 상태: 스피너 표시
- 에러 상태: "조회수 로드 실패" 메시지
- 자동으로 1000단위 콤마 구분

**하위 컴포넌트**:

- `ViewBadge`: 인라인 배지 형태 (사이드바용)

**Evidence**:

- `src/shared/ui/view-counter.tsx:11-53`: ViewCounter 컴포넌트
- `src/shared/ui/view-counter.tsx:61-96`: ViewBadge 컴포넌트

---

## Entities (비즈니스 엔티티)

### `PostCard`

- **Location**: `src/entities/post/ui/post-card.tsx` (L1-L60)
- **Purpose**: 포스트 카드 컴포넌트
- **Type**: Server Component
- **사용처**: 블로그 목록, 태그 페이지, 검색 결과

**Props**:

```typescript
interface PostCardProps {
  post: Post;
}
```

**특징**:

- 호버 시 그림자 + 약간 위로 이동 효과
- 제목 (2줄 말줄임)
- 설명 (3줄 말줄임)
- 날짜 + 읽기 시간
- 태그 (최대 3개, 초과시 "+N" 배지)
- 클릭 시 포스트 상세로 이동

**Evidence**:

- `src/entities/post/ui/post-card.tsx:10-60`: PostCard 컴포넌트

---

### `RelatedPosts`

- **Location**: `src/entities/post/ui/related-posts.tsx`
- **Purpose**: 연관 포스트 추천 컴포넌트
- **Type**: Server Component
- **사용처**: 포스트 하단

**Props**:

```typescript
interface RelatedPostsProps {
  posts: Post[];  // 연관 포스트 목록
}
```

**특징**:

- 그리드 레이아웃 (2열)
- PostCard 재사용
- 제목: "관련 포스트"

**Evidence**:

- 포스트 페이지에서 사용됨

---

### `SeriesNavigation`

- **Location**: `src/entities/post/ui/series-navigation.tsx`
- **Purpose**: 시리즈 내 이전/다음 포스트 네비게이션
- **Type**: Server Component
- **사용처**: 포스트 상단 (시리즈 포스트인 경우)

**Props**:

```typescript
interface SeriesNavigationProps {
  series: Series;
  current: { post: Post; order: number };
  prev?: { post: Post; order: number };
  next?: { post: Post; order: number };
}
```

**특징**:

- 이전/다음 포스트 카드
- 시리즈 진행률 표시 (예: "3/10")
- 링크: 각 포스트로 이동

**Evidence**:

- `src/app/blog/[...slug]/page.tsx:203-210`: 시리즈 네비게이션 렌더링

---

### `ShareButton`

- **Location**: `src/entities/post/ui/share-button.tsx`
- **Purpose**: 소셜 공유 버튼
- **Type**: Client Component
- **사용처**: 포스트 푸터

**Props**:

```typescript
interface ShareButtonProps {
  title: string;       // 포스트 제목
  description: string; // 포스트 설명
}
```

**특징**:

- 클립보드에 URL 복사
- 토스트 메시지 표시
- 아이콘: Share 아이콘

**Evidence**:

- `src/app/blog/[...slug]/page.tsx:234`: ShareButton 사용

---

## Features (사용자 기능)

### `Header`

- **Location**: `src/features/navigation/ui/header.tsx` (L1-L54)
- **Purpose**: 사이트 헤더 네비게이션
- **Type**: Server Component
- **사용처**: Root Layout

**특징**:

- Sticky positioning (스크롤 시 상단 고정)
- 로고: "DEV_BBAK 블로그"
- 네비게이션 링크: 홈, 포스트, 태그, 시리즈
- 데스크톱: 가로 링크 + 테마 토글
- 모바일: 햄버거 메뉴 + 테마 토글
- 배경: 반투명 블러 효과 (`backdrop-blur`)

**네비게이션 링크**:

```typescript
const navLinks = [
  { href: '/', label: '홈' },
  { href: '/blog', label: '포스트' },
  { href: '/tags', label: '태그' },
  { href: '/series', label: '시리즈' },
];
```

**Evidence**:

- `src/features/navigation/ui/header.tsx:6-54`: Header 컴포넌트

---

### `Footer`

- **Location**: `src/features/navigation/ui/footer.tsx`
- **Purpose**: 사이트 푸터
- **Type**: Server Component
- **사용처**: Root Layout

**특징**:

- 저작권 정보
- 소셜 링크 (GitHub, LinkedIn)
- 다크모드 지원

---

### `MobileMenu`

- **Location**: `src/features/navigation/ui/mobile-menu.tsx`
- **Purpose**: 모바일 햄버거 메뉴
- **Type**: Client Component
- **사용처**: Header (모바일)

**특징**:

- 햄버거 아이콘 (lucide-react)
- 드롭다운 메뉴
- 링크 클릭 시 메뉴 닫힘

---

### `ExperienceTimeline`

- **Location**: `src/features/navigation/ui/experience-timeline.tsx`
- **Purpose**: 경력 타임라인 컴포넌트
- **Type**: Client Component (RPC 통신)
- **사용처**: About 페이지

**특징**:

- Blog-Admin RPC로 경력 데이터 조회
- 타임라인 형태로 표시
- 회사, 직책, 기간, 현재 여부

**Evidence**:

- `src/app/about/page.tsx:172`: ExperienceTimeline 사용

---

### `SearchBarClient`

- **Location**: `src/features/post-search/ui/search-bar-client.tsx`
- **Purpose**: 검색 바 클라이언트 컴포넌트
- **Type**: Client Component
- **사용처**: 블로그 목록 페이지

**특징**:

- 입력 필드 + 검색 버튼
- nuqs로 URL 쿼리 파라미터 동기화
- 디바운스 (300ms)
- 플레이스홀더: "제목, 내용, 태그로 검색..."

**Evidence**:

- `src/app/blog/page.tsx:72-74`: SearchBarClient 사용

---

### `NewsletterSubscribe`

- **Location**: `src/features/newsletter/ui/newsletter-subscribe.tsx`
- **Purpose**: 뉴스레터 구독 폼
- **Type**: Client Component
- **사용처**: 포스트 하단, About 페이지

**Props**:

```typescript
interface NewsletterSubscribeProps {
  source?: string;  // 구독 출처 (예: "blog-post")
}
```

**특징**:

- 이메일 입력 필드
- Blog-Admin RPC로 구독 요청
- 성공/실패 메시지 표시
- Resend API로 확인 이메일 발송 (Blog-Admin)

**Evidence**:

- `src/app/blog/[...slug]/page.tsx:239-241`: NewsletterSubscribe 사용

---

### `ThemeToggle`

- **Location**: `src/features/theme-toggle/ui/theme-toggle.tsx`
- **Purpose**: 다크모드 토글 버튼
- **Type**: Client Component
- **사용처**: Header, 모바일 메뉴

**특징**:

- `next-themes`로 테마 관리
- 시스템 설정 감지
- 아이콘: Sun (라이트), Moon (다크)
- 부드러운 전환 효과 (200ms)

**Evidence**:

- `src/features/navigation/ui/header.tsx:42, 47`: ThemeToggle 사용

---

## Processes (비즈니스 프로세스)

### `TableOfContents`

- **Location**: `src/processes/post-reading/ui/table-of-contents.tsx` (L1-L127)
- **Purpose**: 포스트 목차 (TOC) 컴포넌트
- **Type**: Client Component
- **사용처**: 포스트 페이지 (사이드바, 모바일)

**Props**:

```typescript
interface TableOfContentsProps {
  className?: string;
}
```

**특징**:

- DOM에서 h1-h6 헤딩 자동 추출
- Intersection Observer로 현재 헤딩 하이라이트
- 클릭 시 부드러운 스크롤
- 헤딩 레벨별 들여쓰기 (h1: 0.5rem, h2: 1.25rem, h3: 2rem, ...)
- 루트 마진: -80px (헤더 높이 고려)

**하이라이트 스타일**:

- 활성: 파란색 텍스트 + 배경 + 왼쪽 보더
- 비활성: 회색 텍스트 + 호버 효과

**Evidence**:

- `src/processes/post-reading/ui/table-of-contents.tsx:19-77`: 헤딩 추출 및 Observer

---

### `MermaidRenderer`

- **Location**: `src/processes/post-reading/ui/mermaid-renderer.tsx` (L1-L169)
- **Purpose**: Mermaid 차트 렌더링 컴포넌트
- **Type**: Client Component (side effect only)
- **사용처**: 포스트 페이지

**Props**:

```typescript
interface MermaidRendererProps {
  content: string;  // 렌더링된 HTML 콘텐츠
}
```

**특징**:

- DOM에서 `.mermaid-container` 요소 찾기
- CDN에서 Mermaid v10.9.1 동적 로드
- 다크모드 감지 후 테마 자동 설정
- 초기화 설정:
  - `startOnLoad: false`
  - `securityLevel: 'loose'`
  - 커스텀 색상 (라이트/다크 테마별)
- 지원 다이어그램: flowchart, sequence, gantt, pie, git, class
- 에러 시 친절한 에러 메시지 표시

**CDN URL**:

```
https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js
```

**Evidence**:

- `src/processes/post-reading/ui/mermaid-renderer.tsx:38-142`: Mermaid 로드 및 렌더링

---

### `Comments`

- **Location**: `src/processes/post-reading/ui/comments.tsx`
- **Purpose**: Giscus 댓글 컴포넌트
- **Type**: Client Component
- **Dependencies**: `@giscus/react`
- **사용처**: 포스트 하단

**Props**:

```typescript
interface CommentsProps {
  identifier: string;  // 포스트 슬러그 (고유 식별자)
  title: string;       // 포스트 제목
}
```

**특징**:

- GitHub Discussions 기반 댓글 시스템
- 다크모드 자동 지원
- 로딩 중: 스피너 표시

**환경변수**:

- `NEXT_PUBLIC_GISCUS_REPO`: 리포지토리 (예: "BBAK-jun/bbakjun-blog")
- `NEXT_PUBLIC_GISCUS_REPO_ID`: 리포지토리 ID
- `NEXT_PUBLIC_GISCUS_CATEGORY`: 카테고리명
- `NEXT_PUBLIC_GISCUS_CATEGORY_ID`: 카테고리 ID

**하위 컴포넌트**:

- `CommentsConfig`: Giscus 설정 안내 (환경변수 없을 때)

**Evidence**:

- `src/app/blog/[...slug]/page.tsx:263-267`: Comments 사용

---

### `CodeBlockWrapper`

- **Location**: `src/shared/ui/code-block-wrapper.tsx`
- **Purpose**: 코드 블록 복사 버튼 추가
- **Type**: Client Component
- **사용처**: 포스트 페이지

**특징**:

- `<pre><code>` 요소 찾기
- 각 코드 블록 상단에 복사 버튼 추가
- 클릭 시 클립보드에 복사
- 토스트 메시지: "코드가 복사되었습니다."

**Evidence**:

- `src/app/blog/[...slug]/page.tsx:222`: CodeBlockWrapper 사용

---

## Widgets (컴포지션 UI)

### `PopularPosts`

- **Location**: `src/widgets/popular-posts/ui/popular-posts.tsx`
- **Purpose**: 인기 포스트 위젯
- **Type**: Server Component
- **사용처**: 홈 페이지, 포스트 사이드바

**Props**:

```typescript
interface PopularPostsProps {
  limit?: number;     // 표시할 포스트 수 (기본값: 5)
  compact?: boolean;  // compact 모드 (기본값: false)
}
```

**특징**:

- Blog-Admin RPC로 인기글 조회 (조회수 기준)
- 리스트 형태 (compact: 간단한 리스트)
- 제목 + 조회수 표시

**Evidence**:

- `src/app/page.tsx:66`: PopularPostsGrid (홈)
- `src/app/blog/[...slug]/page.tsx:282-284`: PopularPosts (사이드바)

---

### `PopularPostsGrid`

- **Location**: `src/widgets/popular-posts/ui/popular-posts-grid.tsx`
- **Purpose**: 인기 포스트 그리드 위젯
- **Type**: Server Component
- **사용처**: 홈 페이지

**Props**:

```typescript
interface PopularPostsGridProps {
  limit?: number;  // 표시할 포스트 수 (기본값: 12)
}
```

**특징**:

- 그리드 레이아웃 (3열)
- PostCard 재사용

**Evidence**:

- `src/app/page.tsx:66`: PopularPostsGrid 사용

---

### `RecentPosts`

- **Location**: `src/widgets/recent-posts/ui/recent-posts.tsx`
- **Purpose**: 최신 포스트 위젯
- **Type**: Server Component
- **사용처**: 포스트 사이드바

**Props**:

```typescript
interface RecentPostsProps {
  limit?: number;  // 표시할 포스트 수 (기본값: 5)
  compact?: boolean;
}
```

**특징**:

- 최신 포스트 5개
- 리스트 형태

**Evidence**:

- 포스트 사이드바에서 사용됨

---

### `RecentPostsGrid`

- **Location**: `src/widgets/recent-posts/ui/recent-posts-grid.tsx`
- **Purpose**: 최신 포스트 그리드 위젯
- **Type**: Server Component
- **사용처**: 홈 페이지

**Props**:

```typescript
interface RecentPostsGridProps {
  limit?: number;  // 표시할 포스트 수 (기본값: 6)
}
```

**특징**:

- 그리드 레이아웃 (3열)
- PostCard 재사용

**Evidence**:

- `src/app/page.tsx:53`: RecentPostsGrid 사용

---

### `BlogPostsList`

- **Location**: `src/features/posts/ui/blog-posts-list.tsx` (L1-L62)
- **Purpose**: 블로그 포스트 목록 컴포넌트
- **Type**: Client Component
- **사용처**: 블로그 목록 페이지

**Props**:

```typescript
interface BlogPostsListProps {
  posts: Post[];        // 포스트 목록
  searchQuery: string;  // 검색어
}
```

**특징**:

- 포스트 있음: PostCard 그리드 (3열)
- 검색 결과 없음: "검색 결과가 없습니다" 메시지
- 포스트 없음: "아직 포스트가 없습니다" 메시지

**Evidence**:

- `src/app/blog/page.tsx:103`: BlogPostsList 사용

---

## Providers

### `QueryProvider`

- **Location**: `src/shared/providers/query-provider.tsx`
- **Purpose**: TanStack Query 프로바이더
- **Type**: Client Component
- **사용처**: Root Layout

**특징**:

- QueryClient, QueryClientProvider 설정
- 기본 옵션:
  - `staleTime: 60 * 1000` (1분)
  - `retry: 1`
- DevTools: 개발 환경에서만 활성화

**Evidence**:

- `src/app/layout.tsx:50`: QueryProvider 사용

---

### `ThemeProvider`

- **Location**: `src/features/theme-toggle/ui/theme-toggle.tsx`
- **Purpose**: next-themes 프로바이더
- **Type**: Client Component
- **사용처**: Root Layout

**특징**:

- `attribute="class"`: `.dark` 클래스로 다크모드
- `defaultTheme="system"`: 시스템 설정 따름
- `enableSystem`: 시스템 설정 감지
- `disableTransitionOnChange`: 테마 변경 시 전환 효과 비활성화

**Evidence**:

- `src/app/layout.tsx:52-57`: ThemeProvider 사용

---

## 컴포넌트 계층 구조

```
Root Layout
├── QueryProvider (TanStack Query)
│   └── NuqsAdapter (URL params)
│       └── ThemeProvider (Dark mode)
│           ├── Header
│           │   ├── Logo
│           │   ├── NavLinks
│           │   ├── ThemeToggle
│           │   └── MobileMenu
│           ├── Main Content
│           │   ├── HomePage
│           │   │   ├── Tabs (Recent/Popular)
│           │   │   ├── RecentPostsGrid
│           │   │   └── PopularPostsGrid
│           │   ├── BlogPage
│           │   │   ├── SearchBarClient
│           │   │   └── BlogPostsList
│           │   │       └── PostCard[]
│           │   ├── PostPage
│           │   │   ├── SeriesNavigation
│           │   │   ├── PostContent
│           │   │   ├── TableOfContents
│           │   │   ├── MermaidRenderer
│           │   │   ├── CodeBlockWrapper
│           │   │   ├── NewsletterSubscribe
│           │   │   ├── RelatedPosts
│           │   │   └── Comments
│           │   ├── TagPage
│           │   │   └── PostCard[]
│           │   ├── AboutPage
│           │   │   ├── ExperienceTimeline
│           │   │   └── StatsCards
│           │   └── SeriesPage
│           └── Footer
└── Analytics (Vercel)
```

---

## 스타일링 패턴

### 1. Tailwind CSS

- 유틸리티 우선 CSS
- 다크모드: `dark:` 프리픽스
- 반응형: `sm:`, `md:`, `lg:`, `xl:` 프리픽스

### 2. class-variance-authority (cva)

- 버튼, 배지 등의 variants 관리
- 예: `default`, `outline`, `ghost` variants

### 3. clsx + tailwind-merge

- 조건부 클래스 병합
- 중복 클래스 제거

### 4. CSS 변수

- 색상: `--primary`, `--secondary`, etc.
- 폰트: `--font-geist-sans`, `--font-geist-mono`
- 반경: `--radius`

---

## 상태 관리

### 1. 서버 상태 (TanStack Query)

- 조회수 데이터 (`useViews`)
- 통계 데이터 (`getPopularPostsStats`)
- 자동 리패치, 캐싱

### 2. URL 상태 (nuqs)

- 검색어 (`q` 파라미터)
- 타입 안전한 파싱

### 3. 로컬 상태 (useState)

- 목차 활성 헤딩 (`TableOfContents`)
- 모바일 메뉴 열림/닫힘
- 테마 (next-themes)

---

## 성능 최적화

### 1. Code Splitting

- 동적 import로 불필요한 코드 지연 로드

### 2. 이미지 최적화

- Next.js Image 컴포넌트
- WebP/AVIF 형식
- lazy loading

### 3. ISR 캐싱

- 정적 페이지: 60~300초 재검증
- API 응답: 5분 캐시

### 4. React.cache

- `getBlobFiles()` 중복 호출 방지

---

## 접근성

### 1. 시맨틱 HTML

- `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`
- `<h1>`~`<h6>` 계층 구조

### 2. ARIA 속성

- `aria-label`, `aria-current`
- 역할 명시

### 3. 키보드 내비게이션

- Tab, Enter 키 지원
- 포커스 스타일

### 4. 다크모드

- 시스템 설정 감지
- 사용자 선택 저장

---

## 국제화

### 1. 한국어 기본

- 모든 텍스트 한국어
- 날짜 형식: `ko-KR` 로케일

### 2. 숫자 형식

- `toLocaleString('ko-KR')`으로 천 단위 콤마

---

## 에러 처리

### 1. 폴백 UI

- 조회수 로드 실패: "조회수 로드 실패"
- 포스트 없음: 404 페이지

### 2. 에러 메시지

- 친절한 설명
- 해결책 제시

### 3. 로깅

- 콘솔 에러 로그
- RPC 에러 로그
