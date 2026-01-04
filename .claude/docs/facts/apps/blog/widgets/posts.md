# Posts Widgets

- **Scope**: Blog 앱의 위젯 컴포넌트 (인기글, 최신글)
- **Source of Truth**: src/widgets
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
    apps/blog/src/widgets/popular-posts/ui/popular-posts-grid.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/src/widgets/recent-posts/ui/recent-posts-grid.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true

  changed_files:
    - path: apps/blog/src/widgets/popular-posts/ui/popular-posts-grid.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "Refactored to use stats RPC with improved UI"
    - path: apps/blog/src/widgets/recent-posts/ui/recent-posts-grid.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "Refactored to use stats RPC with improved UI"

  deleted_files: []

  extraction_config:
    depth: "standard"
    scope: "widgets"
    stale_detection: true
---
```

---

## PopularPostsGrid Widget

### Component

- **Location**: `apps/blog/src/widgets/popular-posts/ui/popular-posts-grid.tsx` (L1-L87)
- **Purpose**: 인기 포스트 목록 표시 (조회수 기준)
- **Source Exists**: true
- **Rendering**: Server Component
- **Key Details**:
  - **데이터 소스**: `getPopularPostsStats()` RPC 호출
  - **정렬**: 조회수 내림차순
  - **표시 항목**: 제목, 설명, 날짜, 읽기 시간, 태그, 조회수
  - **스타일링**: divide-border/15 구분선, hover 효과
  - **빈 상태**: "아직 인기 글이 없습니다" 메시지
- **Dependencies**:
  - `@/shared/lib/stats`: getPopularPostsStats
  - `next/link`: Link 컴포넌트
- **Props**:
  - `limit?: number` - 표시할 포스트 수 (기본값: 12)
  - `className?: string` - 추가 클래스명
- **Evidence**:
  - `apps/blog/src/widgets/popular-posts/ui/popular-posts-grid.tsx`: `export default async function PopularPostsGrid({ limit = 12, className = '' }: PopularPostsGridProps) { const stats = await getPopularPostsStats(); if (!stats || stats.popularPosts.length === 0) { return ( <div className={`${className}`}><div className="text-center py-12"><p className="text-muted-foreground">아직 인기 글이 없습니다</p></div></div> ); } const displayPosts = stats.popularPosts.slice(0, limit); return ( <div className={`space-y-8 ${className}`}><div className="divide-y divide-border/15">{displayPosts.map((post, index) => ( <Link key={post.slug} href={`/blog/${post.slug}`} className="block py-4 group"><article className="space-y-2"><div className="flex items-start justify-between gap-4"><div className="flex-1 space-y-2"><h3 className="text-lg font-medium text-foreground group-hover:underline decoration-1 underline-offset-2">{post.title}</h3>{post.description && (<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{post.description}</p>)}<div className="flex items-center gap-3 text-xs text-muted-foreground"><time dateTime={post.date}>{formatDate(post.date)}</time>{post.readingTime && (<><span>·</span><span>{post.readingTime}</span></>)}{post.tags && post.tags.length > 0 && (<><span>·</span><span className="font-medium">{post.tags[0]}</span></>)}</div></div><div className="flex-shrink-0 text-right"><div className="text-sm font-medium text-muted-foreground tabular-nums">{post.views.toLocaleString()}</div><div className="text-xs text-muted-foreground">views</div></div></div></article></Link> ))}</div></div> ); }`

### Data Structure

```typescript
interface PostWithViews {
  slug: string;
  title: string;
  description?: string;
  date: string;
  readingTime?: string;
  tags?: string[];
  views: number;
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ 제목 (group-hover:underline)                            │
│ 설명 (line-clamp-2)                                     │
│ 2025년 1월 4일 · 5 min read · nextjs              1,234 │
│                                         views           │
└─────────────────────────────────────────────────────────┘
```

### Styling Details

- **Container**: `divide-y divide-border/15`로 항목 간 구분선
- **Link**: `block py-4 group`으로 클릭 영역 확장
- **Title**: `text-lg font-medium` + `group-hover:underline`
- **Description**: `line-clamp-2`로 최대 2줄 표시
- **Metadata**: `gap-3`로 항목 간 간격, `·`로 구분자
- **Views**: `tabular-nums`로 숫자 정렬, `text-right`로 우측 정렬

---

## RecentPostsGrid Widget

### Component

- **Location**: `apps/blog/src/widgets/recent-posts/ui/recent-posts-grid.tsx` (L1-L70)
- **Purpose**: 최신 포스트 목록 표시 (날짜 기준)
- **Source Exists**: true
- **Rendering**: Server Component
- **Key Details**:
  - **데이터 소스**: `getPopularPostsStats()` RPC 호출
  - **정렬**: 날짜 내림차순 (최신순)
  - **표시 항목**: 제목, 설명, 날짜, 읽기 시간, 태그
  - **스타일링**: divide-border/15 구분선, hover 효과
  - **빈 상태**: "아직 글이 없습니다" 메시지
- **Dependencies**:
  - `@/shared/lib/stats`: getPopularPostsStats
  - `next/link`: Link 컴포넌트
- **Props**:
  - `limit?: number` - 표시할 포스트 수 (기본값: 6)
  - `className?: string` - 추가 클래스명
- **Evidence**:
  - `apps/blog/src/widgets/recent-posts/ui/recent-posts-grid.tsx`: `export default async function RecentPostsGrid({ limit = 6, className = '' }: RecentPostsGridProps) { const stats = await getPopularPostsStats(); if (!stats.recentPosts || stats.recentPosts.length === 0) { return ( <div className={`${className}`}><div className="text-center py-12"><p className="text-muted-foreground">아직 글이 없습니다</p></div></div> ); } const displayPosts = stats.recentPosts.slice(0, limit); return ( <div className={`divide-y divide-border/15 ${className}`}>{displayPosts.map(post => ( <Link key={post.slug} href={`/blog/${post.slug}`} className="block py-4 group"><article className="space-y-2"><h3 className="text-lg font-medium text-foreground group-hover:underline decoration-1 underline-offset-2">{post.title}</h3>{post.description && (<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{post.description}</p>)}<div className="flex items-center gap-3 text-xs text-muted-foreground"><time dateTime={post.date}>{formatDate(post.date)}</time>{post.readingTime && (<><span>·</span><span>{post.readingTime}</span></>)}{post.tags && post.tags.length > 0 && (<><span>·</span><span className="font-medium">{post.tags[0]}</span></>)}</div></article></Link> ))}</div> ); }`

### Data Structure

```typescript
interface PostWithViews {
  slug: string;
  title: string;
  description?: string;
  date: string;
  readingTime?: string;
  tags?: string[];
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ 제목 (group-hover:underline)                            │
│ 설명 (line-clamp-2)                                     │
│ 2025년 1월 4일 · 5 min read · nextjs                   │
└─────────────────────────────────────────────────────────┘
```

### Styling Details

- **Container**: `divide-y divide-border/15`로 항목 간 구분선
- **Link**: `block py-4 group`으로 클릭 영역 확장
- **Title**: `text-lg font-medium` + `group-hover:underline`
- **Description**: `line-clamp-2`로 최대 2줄 표시
- **Metadata**: `gap-3`로 항목 간 간격, `·`로 구분자

---

## getPopularPostsStats Function

### RPC Call

- **Location**: `apps/blog/src/shared/lib/stats.ts`
- **Purpose**: 인기글, 최신글, 통계 데이터 가져오기
- **Source Exists**: true
- **RPC Endpoint**: `GET /rpc/views/stats`
- **Cache**: 5분 (300초)

### Return Type

```typescript
interface Stats {
  popularPosts: PostWithViews[];  // 인기글 (조회수 기준)
  recentPosts: PostWithViews[];   // 최신글 (날짜 기준)
  totalViews: number;             // 총 조회수
  totalPosts: number;             // 총 포스트 수
}
```

### Usage

```typescript
const stats = await getPopularPostsStats();

// 인기글
const popularPosts = stats.popularPosts.slice(0, limit);

// 최신글
const recentPosts = stats.recentPosts.slice(0, limit);
```

---

## 날짜 포맷팅

### formatDate Function

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

### Output

- **Input**: `"2025-01-04"`
- **Output**: `"2025년 1월 4일"`

---

## 공통 스타일링 패턴

### Divide Pattern

```tsx
<div className="divide-y divide-border/15">
  {posts.map(post => (
    <Link key={post.slug} className="block py-4 group">
      {/* Post content */}
    </Link>
  ))}
</div>
```

- **divide-y**: 하위 요소 간 가로 구분선
- **divide-border/15**: 15% 투명도 구분선
- **py-4**: 각 항목의 상하 패딩

### Hover Pattern

```tsx
<Link className="block py-4 group">
  <h3 className="group-hover:underline decoration-1 underline-offset-2">
    {title}
  </h3>
</Link>
```

- **group**: 부모 요소에 그룹 할당
- **group-hover**: 자식 요소에서 부모의 호버 상태 감지
- **decoration-1**: 얇은 밑줄 (1px)
- **underline-offset-2**: 텍스트와 밑줄 간격 2px

### Text Clamp Pattern

```tsx
<p className="line-clamp-2 leading-relaxed">
  {description}
</p>
```

- **line-clamp-2**: 최대 2줄 표시, 초과 시 생략 부호(...)
- **leading-relaxed**: 행간 1.625 (26px)

### Metadata Pattern

```tsx
<div className="flex items-center gap-3 text-xs text-muted-foreground">
  <time dateTime={post.date}>{formatDate(post.date)}</time>
  {post.readingTime && (
    <>
      <span>·</span>
      <span>{post.readingTime}</span>
    </>
  )}
  {post.tags && post.tags.length > 0 && (
    <>
      <span>·</span>
      <span className="font-medium">{post.tags[0]}</span>
    </>
  )}
</div>
```

- **flex items-center**: 수평 정렬
- **gap-3**: 항목 간 간격 0.75rem
- **text-xs**: 작은 폰트 (0.75rem)
- **text-muted-foreground**: 회색 텍스트
- **·**: 구분자 (bullet)

---

## 빈 상태 처리

### PopularPostsGrid

```tsx
if (!stats || stats.popularPosts.length === 0) {
  return (
    <div className={`${className}`}>
      <div className="text-center py-12">
        <p className="text-muted-foreground">아직 인기 글이 없습니다</p>
      </div>
    </div>
  );
}
```

### RecentPostsGrid

```tsx
if (!stats.recentPosts || stats.recentPosts.length === 0) {
  return (
    <div className={`${className}`}>
      <div className="text-center py-12">
        <p className="text-muted-foreground">아직 글이 없습니다</p>
      </div>
    </div>
  );
}
```

- **text-center**: 텍스트 중앙 정렬
- **py-12**: 상하 패딩 3rem
- **text-muted-foreground**: 회색 텍스트

---

## 성능 최적화

### Server Component

- **장점**: 클라이언트 JS 없음
- **장점**: 빌드 시 또는 ISR로 HTML 생성
- **장점**: CDN에서 빠르게 제공

### RPC Caching

```typescript
// Blog-Admin에서 5분 캐싱
const stats = await getPopularPostsStats(); // 5분 캐시
```

### Limit Props

```tsx
<PopularPostsGrid limit={10} />  // 최대 10개만 표시
<RecentPostsGrid limit={6} />    // 최대 6개만 표시
```

---

## 접근성

### Semantic HTML

- `<article>`: 독립적인 컨텐츠
- `<time>`: 날짜 정보
- `<Link>`: 네비게이션 링크

### ARIA Labels

- (현재 없음, 필요 시 추가)

### Keyboard Navigation

- **Tab**: 포스트 간 이동
- **Enter**: 포스트 열기

---

## 사용 예시

### Home Page

```tsx
import { PopularPostsGrid } from '@/widgets/popular-posts';
import { RecentPostsGrid } from '@/widgets/recent-posts';

export default function Home() {
  return (
    <div className="space-y-20">
      <section>
        <h2 className="text-2xl font-bold mb-8">최신 포스트</h2>
        <RecentPostsGrid limit={10} />
      </section>

      <section className="pt-8 border-t border-border/15">
        <h2 className="text-2xl font-bold mb-8">인기 포스트</h2>
        <PopularPostsGrid limit={10} />
      </section>
    </div>
  );
}
```

### Blog Sidebar (향후)

```tsx
<aside>
  <PopularPostsGrid limit={5} className="space-y-4" />
</aside>
```

---

## 변경사항 요약

### Stats RPC Integration

**변경 전**: 각 위젯에서 별도로 포스트 데이터 가져오기
**변경 후**: `getPopularPostsStats()` RPC로 단일 API 호출

**이점**:
- 중복 API 호출 방지
- 일관된 데이터 소스
- 캐싱 효율화

### UI Improvements

**추가된 스타일**:
- `divide-border/15`: 얇은 구분선
- `group-hover:underline`: 자연스러운 호버 효과
- `line-clamp-2`: 설명 2줄 제한
- `tabular-nums`: 조회수 숫자 정렬

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
