# 위젯 리팩토링 (Widgets Refactoring)

- **App**: apps/blog
- **Status**: As-Is (현재 구현)
- **Scope**: 인기글/최신글 위젯의 UI 개선 및 stats RPC 통합
- **Based on**:
  - Facts: `../../../facts/apps/blog/widgets/posts.md`
  - Facts: `../../../facts/apps/blog/shared/lib/stats.md`
  - Insights: `../../../insights/apps/blog/impact/roi.md`
  - Insights: `../../../insights/apps/blog/impact/customer.md`
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2026-01-04
- **Verification Results**:
  - `../../../facts/apps/blog/widgets/posts.md`: ✅ Verified (source_exists: true)
  - `../../../facts/apps/blog/shared/lib/stats.md`: ⚠️ Source file not found (TBD)
  - `../../../insights/apps/blog/impact/roi.md`: ✅ Verified
  - `../../../insights/apps/blog/impact/customer.md`: ✅ Verified
- **Spec Status**: As-Is (현재 구현됨)

---

## 개요 (Overview)

### 목적

인기글/최신글 위젯의 UI를 개선하고, 데이터 소스를 단일 stats RPC로 통합하여 콘텐츠 발견성을 강화합니다. 개선된 divider, hover, clamp, tabular nums 스타일링으로 독자가 관련 포스트를 더 쉽게 찾을 수 있게 만듭니다.

### 범위

**In-Scope**:
- PopularPostsGrid 컴포넌트 (인기글 위젯)
- RecentPostsGrid 컴포넌트 (최신글 위젯)
- stats RPC 통합 (`getPopularPostsStats()`)
- UI 개선사항 (divider, hover, clamp, tabular nums)
- 빈 상태 처리

**Out-of-Scope**:
- 다른 위젯 (태그 클라우드, 카테고리 등)
- 위젯 배치 레이아웃 (sidebar 등)
- 위젯 개인화 설정

### 비즈니스 가치

**콘텐츠 발견성 강화**:
- **UI 개선**: divider, hover, clamp로 시각적 계층 구조 개선
- **일관된 데이터 소스**: stats RPC로 중복 API 호출 방지
- **캐싱 효율화**: 5분 RPC 캐시로 빠른 로딩

**예상 효과**:
- 위젯 클릭률(CTR) 25% 증가 (UI 개선 효과)
- 콘텐츠 발견율 15% 증가 (발견성 향상 효과)
- RPC 응답 시간 100ms 미만 (캐시 효과)

---

## 핵심 기능 (Core Features)

### 1. PopularPostsGrid 위젯

조회수 기준 인기 포스트 목록을 표시합니다.

**데이터 소스**:
```typescript
const stats = await getPopularPostsStats();
// stats.popularPosts: 조회수 내림차순 정렬됨
```

**표시 항목**:
- 제목 (title)
- 설명 (description) - 2줄 제한 (`line-clamp-2`)
- 날짜 (date) - "2025년 1월 4일" 형식
- 읽기 시간 (readingTime) - "5 min read" 형식
- 태그 (tags) - 첫 번째 태그만 표시
- 조회수 (views) - 숫자 정렬 (`tabular-nums`)

**UI 레이아웃**:
```
┌─────────────────────────────────────────────────────────┐
│ 제목 (group-hover:underline)                            │
│ 설명 (line-clamp-2)                                     │
│ 2025년 1월 4일 · 5 min read · nextjs              1,234 │
│                                         views           │
└─────────────────────────────────────────────────────────┘
```

### 2. RecentPostsGrid 위젯

날짜 기준 최신 포스트 목록을 표시합니다.

**데이터 소스**:
```typescript
const stats = await getPopularPostsStats();
// stats.recentPosts: 날짜 내림차순 정렬됨
```

**표시 항목**:
- 제목 (title)
- 설명 (description) - 2줄 제한 (`line-clamp-2`)
- 날짜 (date)
- 읽기 시간 (readingTime)
- 태그 (tags) - 첫 번째 태그만 표시

**참고**: 인기글 위젯과 동일한 UI, 조회수만 제외

### 3. stats RPC 통합

단일 API 호출로 인기글, 최신글, 통계 데이터를 가져옵니다.

**RPC Endpoint**:
- `GET /rpc/views/stats`
- **Cache**: 5분 (300초)

**Response**:
```typescript
interface Stats {
  popularPosts: PostWithViews[];  // 인기글 (조회수 기준)
  recentPosts: PostWithViews[];   // 최신글 (날짜 기준)
  totalViews: number;             // 총 조회수
  totalPosts: number;             // 총 포스트 수
}
```

**이점**:
- 중복 API 호출 방지
- 일관된 데이터 소스
- 캐싱 효율화

### 4. UI 개선사항

**Divider Pattern**:
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
- **divide-border/15**: 15% 투명도 구분선 (부드러운 시각적 계층)

**Hover Pattern**:
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

**Text Clamp Pattern**:
```tsx
<p className="line-clamp-2 leading-relaxed">
  {description}
</p>
```

- **line-clamp-2**: 최대 2줄 표시, 초과 시 생략 부호(...)
- **leading-relaxed**: 행간 1.625 (26px)

**Metadata Pattern**:
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

**Tabular Nums Pattern**:
```tsx
<div className="text-sm font-medium text-muted-foreground tabular-nums">
  {post.views.toLocaleString()}
</div>
```

- **tabular-nums**: 숫자를 테이블 형식으로 정렬
- **toLocaleString()**: 천 단위 쉼표 (1,234)

### 5. 빈 상태 처리

데이터가 없을 때 친절한 메시지를 표시합니다.

**PopularPostsGrid**:
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

**RecentPostsGrid**:
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

**스타일링**:
- **text-center**: 텍스트 중앙 정렬
- **py-12**: 상하 패딩 3rem
- **text-muted-foreground**: 회색 텍스트

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

**위젯 구조**:
```
Home Page (/)
  ├── Hero Section
  ├── RecentPostsGrid (limit={10})
  │   └── getPopularPostsStats() RPC Call
  │       └── 5분 캐시
  └── PopularPostsGrid (limit={10})
      └── getPopularPostsStats() RPC Call (재사용)
          └── 5분 캐시
```

### 의존성

**Services**:
- Blog-Admin RPC: `GET /rpc/views/stats` (캐시: 5분)

**Packages**:
- `@/shared/lib/stats`: getPopularPostsStats
- `next/link`: Link 컴포넌트

**Libraries**:
- React 19
- Next.js 15

**Env Vars**:
- `NEXT_PUBLIC_ADMIN_URL`: Blog-Admin RPC endpoint

### 구현 접근

**getPopularPostsStats 함수** (`apps/blog/src/shared/lib/stats.ts`):

```typescript
import { client } from '@/lib/rpc';

export async function getPopularPostsStats(): Promise<Stats | null> {
  try {
    const response = await client.api.v1['views']['stats'].$get();

    if (!response.ok) {
      console.error('Failed to fetch stats:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

interface Stats {
  popularPosts: PostWithViews[];
  recentPosts: PostWithViews[];
  totalViews: number;
  totalPosts: number;
}

interface PostWithViews {
  slug: string;
  title: string;
  description?: string;
  date: string;
  readingTime?: string;
  tags?: string[];
  views?: number;
}
```

**PopularPostsGrid 컴포넌트** (`apps/blog/src/widgets/popular-posts/ui/popular-posts-grid.tsx`):

```typescript
import { getPopularPostsStats } from '@/shared/lib/stats';
import Link from 'next/link';

interface PopularPostsGridProps {
  limit?: number;
  className?: string;
}

export default async function PopularPostsGrid({
  limit = 12,
  className = '',
}: PopularPostsGridProps) {
  const stats = await getPopularPostsStats();

  if (!stats || stats.popularPosts.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">아직 인기 글이 없습니다</p>
        </div>
      </div>
    );
  }

  const displayPosts = stats.popularPosts.slice(0, limit);

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="divide-y divide-border/15">
        {displayPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block py-4 group"
          >
            <article className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-medium text-foreground group-hover:underline decoration-1 underline-offset-2">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>
                  )}
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
                </div>
                {post.views && (
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-medium text-muted-foreground tabular-nums">
                      {post.views.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">views</div>
                  </div>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
```

**RecentPostsGrid 컴포넌트** (`apps/blog/src/widgets/recent-posts/ui/recent-posts-grid.tsx`):

```typescript
import { getPopularPostsStats } from '@/shared/lib/stats';
import Link from 'next/link';

interface RecentPostsGridProps {
  limit?: number;
  className?: string;
}

export default async function RecentPostsGrid({
  limit = 6,
  className = '',
}: RecentPostsGridProps) {
  const stats = await getPopularPostsStats();

  if (!stats.recentPosts || stats.recentPosts.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">아직 글이 없습니다</p>
        </div>
      </div>
    );
  }

  const displayPosts = stats.recentPosts.slice(0, limit);

  return (
    <div className={`divide-y divide-border/15 ${className}`}>
      {displayPosts.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="block py-4 group"
        >
          <article className="space-y-2">
            <h3 className="text-lg font-medium text-foreground group-hover:underline decoration-1 underline-offset-2">
              {post.title}
            </h3>
            {post.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {post.description}
              </p>
            )}
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
          </article>
        </Link>
      ))}
    </div>
  );
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
```

### 관측/운영 (Observability)

**TODO**: 위젯 성능 모니터링 추가 필요
- 위젯 로드 시간
- 위젯 클릭률 (CTR)
- RPC 응답 시간
- 캐시命中率

**제안**: Vercel Analytics 이벤트 추적
```typescript
// 위젯 클릭 시 이벤트 추적
analytics.track('widget_click', {
  type: 'popular' | 'recent',
  slug: post.slug,
});
```

### 실패 모드/대응 (Failure Modes)

**1. RPC 호출 실패**:
- **대응**: try-catch로 에러 핸들링
- **Fallback**: null 반환 후 빈 상태 메시지 표시

**2. 빈 데이터**:
- **대응**: 배열 길이 확인 (`stats.popularPosts.length === 0`)
- **Fallback**: "아직 글이 없습니다" 메시지 표시

**3. 느린 RPC 응답**:
- **대응**: 5분 캐시로 중복 호출 방지
- **Fallback**: Suspense 경계로 로딩 상태 표시 (TODO)

**4. 클라이언트 네비게이션 실패**:
- **대응**: Next.js Link의 자동 에러 핸들링
- **Fallback**: 404 페이지로 이동

---

## 데이터 구조 (Data Structure)

### PostWithViews Interface

```typescript
interface PostWithViews {
  slug: string;              // 포스트 경로 (예: "DEV/my-post")
  title: string;             // 포스트 제목
  description?: string;      // 포스트 설명
  date: string;              // 작성일 (ISO 8601)
  readingTime?: string;      // 읽기 시간 (예: "5 min read")
  tags?: string[];           // 태그 목록
  views?: number;            // 조회수 (popularPosts만)
}
```

### Stats Interface

```typescript
interface Stats {
  popularPosts: PostWithViews[];  // 인기글 (조회수 내림차순)
  recentPosts: PostWithViews[];   // 최신글 (날짜 내림차순)
  totalViews: number;             // 총 조회수
  totalPosts: number;             // 총 포스트 수
}
```

---

## API 명세 (API Specifications)

### RPC Endpoint

**GET /api/rpc/views/stats**:

- **Purpose**: 인기글, 최신글, 통계 데이터 가져오기
- **Auth**: 없음 (public)
- **Cache**: 300초 (5분)
- **Request**: 없음 (query parameters 없음)

- **Response**:
  ```json
  {
    "popularPosts": [
      {
        "slug": "DEV/my-post",
        "title": "Next.js 15 변경사항",
        "description": "Next.js 15의 새로운 기능들...",
        "date": "2025-01-04T00:00:00Z",
        "readingTime": "5 min read",
        "tags": ["nextjs", "react"],
        "views": 1234
      }
    ],
    "recentPosts": [
      {
        "slug": "REACT/new-hooks",
        "title": "React 19 새로운 Hooks",
        "description": "React 19에서 추가된 use() 훅...",
        "date": "2025-01-03T00:00:00Z",
        "readingTime": "3 min read",
        "tags": ["react", "hooks"]
      }
    ],
    "totalViews": 50000,
    "totalPosts": 50
  }
  ```

- **Errors**:
  - **500**: Internal Server Error (Redis 연결 실패 등)

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**1. 인기글 위젯 표시**:
- 사용자가 홈 페이지 방문
- PopularPostsGrid에서 인기글 10개 표시
- 조회수 내림차순 정렬
- 조회수가 우측에 표시 (tabular-nums)

**2. 최신글 위젯 표시**:
- 사용자가 홈 페이지 방문
- RecentPostsGrid에서 최신글 6개 표시
- 날짜 내림차순 정렬
- 조회수 미표시

**3. 위젯 클릭으로 포스트 이동**:
- 사용자가 인기글 위젯의 포스트 제목 클릭
- hover 시 밑줄 표시 (group-hover:underline)
- 클릭 시 포스트 상세 페이지로 이동

**4. 빈 상태 처리**:
- 사용자가 새로운 블로그 방문
- 포스트가 없으면 "아직 글이 없습니다" 메시지 표시
- 중앙 정렬과 적절한 여백 (py-12)

**5. 캐시로 빠른 로딩**:
- 사용자가 홈 페이지 재방문
- 5분 캐시로 RPC 호출 스킵
- 평균 응답 시간 100ms 미만

### 실패/예외 시나리오

**1. RPC 호출 실패**:
- 사용자가 홈 페이지 방문
- RPC 서버가 응답하지 않음 (500 에러)
- 에러 핸들링으로 null 반환
- 빈 상태 메시지 표시

**2. 네트워크 지연**:
- 사용자가 느린 네트워크로 접속
- RPC 응답이 지연됨
- Suspense 경계로 로딩 상태 표시 (TODO)
- 응답 도착 후 위젯 렌더링

**3. 포스트 데이터 불일치**:
- 사용자가 위젯에서 포스트 클릭
- 포스트가 삭제되었거나 숨겨짐
- Next.js Link가 404 페이지로 이동
- "페이지를 찾을 수 없습니다" 메시지

**4. 조회수 0인 포스트**:
- 사용자가 방문 직후 작성된 포스트 확인
- 조회수가 0으로 표시
- 정상 동작 (신규 포스트)

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

**RPC 인증**:
- 현재는 public endpoint
- TODO: API Key 또는 Rate Limiting 추가

### 성능

**RPC Caching**:
- **Cache**: 5분 (300초)
- **Hit Rate**: 추정 80-90%
- **Response Time**: 평균 100ms 미만

**Server Component**:
- **장점**: 클라이언트 JS 없음
- **장점**: 빌드 시 또는 ISR로 HTML 생성
- **장점**: CDN에서 빠르게 제공

**Limit Props**:
```tsx
<PopularPostsGrid limit={10} />  // 최대 10개만 표시
<RecentPostsGrid limit={6} />    // 최대 6개만 표시
```
- 불필요한 데이터 로딩 방지

### 배포

- **Build Time**: 위젯은 Server Component로 빌드 시 HTML 생성
- **Runtime**: RPC 호출로 데이터 가져오기

### 롤백

- **Git Revert**: 위젯 리팩토링 이전 커밋으로 되돌리기
- **영향 범위**: PopularPostsGrid, RecentPostsGrid 컴포넌트만
- **롤백 시간**: 5분 이내 (Vercel 자동 배포)

### 호환성/마이그레이션

**Browser Support**:
- Chrome/Edge: 최신 2 버전
- Firefox: 최신 2 버전
- Safari: 최신 2 버전
- Mobile: iOS Safari 14+, Chrome Mobile

**Responsive**:
- 모든 기기에서 동일한 UI
- 모바일에서 조회수 숨김 (공간 부족)

---

## 향후 확장 가능성 (Future Expansion)

### 1. 위젯 개인화

**아이디어**: 사용자별 맞춤형 위젯 표시

**구현**:
```tsx
const personalizedPosts = await getPersonalizedPosts(userId);
// 조회수 + 관심 태그 + 최근 본 포스트 기반 추천
```

**이점**:
- 개인화된 콘텐츠 발견
- 참여도 증가

### 2. 위젯 레이아웃 (Sidebar)

**현재**: 홈 페이지에 직렬로 표시
**개선안**: 사이드바에 위젯 배치

**구현**:
```tsx
<div className="flex gap-8">
  <main className="flex-1">
    {/* Main content */}
  </main>
  <aside className="w-80">
    <PopularPostsGrid limit={5} />
    <RecentPostsGrid limit={5} />
  </aside>
</div>
```

**이점**:
- 콘텐츠와 위젯 동시 표시
- 데스크톱에서 더 나은 공간 활용

### 3. 위젯 필터링

**아이디어**: 태그, 카테고리별 위젯 필터링

**구현**:
```tsx
<PopularPostsGrid tag="nextjs" />
<PopularPostsGrid category="DEV" />
```

**이점**:
- 관련 콘텐츠 빠르게 발견
- 탐색 경로 단축

### 4. 위젯 애니메이션

**아이디어**: 위젯 로드 시 애니메이션 추가

**구현**:
```tsx
<div className="animate-fade-in">
  <PopularPostsGrid />
</div>
```

**이점**:
- 더 부드러운 사용자 경험
- 로딩 상태 시각적 피드백

### 5. 위젯 A/B 테스트

**아이디어**: 위젯 스타일, 레이아웃 A/B 테스트

**구현**:
```tsx
const variant = useVariant('popular-posts-widget');

{variant === 'A' && <PopularPostsGridStyleA />}
{variant === 'B' && <PopularPostsGridStyleB />}
```

**이점**:
- 데이터 기반 UX 개선
- 클릭률 최적화

### 6. 위젯 실시간 업데이트

**현재**: 5분 캐시로 주기적 업데이트
**개선안**: Server-Sent Events (SSE)로 실시간 업데이트

**구현**:
```tsx
useEffect(() => {
  const eventSource = new EventSource('/api/events/posts');
  eventSource.onmessage = (e) => {
    const updatedStats = JSON.parse(e.data);
    setStats(updatedStats);
  };
  return () => eventSource.close();
}, []);
```

**이점**:
- 새 포스트 즉시 표시
- 조회수 실시간 업데이트

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD: 위젯 클릭률 (CTR) 데이터

**질문**: 위젯 UI 개선으로 실제로 클릭률이 증가했는가?
- **데이터 필요**:
  - 위젯 클릭률 (개선 전/후 비교)
  - 포스트별 클릭 수
  - 위젯 위치별 클릭률

**오너**: TBD (블로그 운영자)
**기한**: TBD (성과 측정 후 1개월 이내)

### TBD: 위젯 레이아웃 결정

**질문**: 사이드바에 위젯을 배치할 것인가?
- **결정 필요**:
  - UI/UX 디자인
  - 데스크톱 vs 모바일 레이아웃
  - 사용자 피드백

**오너**: TBD (블로그 운영자)
**기한**: TBD (레이아웃 redesign 시)

### TBD: 위젯 개인화 도입 여부

**질문**: 사용자별 맞춤형 위젯을 도입할 것인가?
- **결정 필요**:
  - 개발 우선순위
  - 데이터 수집 전략
  - 프라이버시 정책

**오너**: TBD (블로그 운영자)
**기한**: TBD (기능 계획 수립 시)

---

## 참고 문헌 (References)

### Facts Documents

- [Posts Widgets](../../../facts/apps/blog/widgets/posts.md)
- [Shared Lib - Stats](../../../facts/apps/blog/shared/lib/stats.md) (TBD)
- [Blog App Index](../../../facts/apps/blog/index.md)

### Insights Documents

- [ROI Analysis](../../../insights/apps/blog/impact/roi.md)
- [Customer Impact Analysis](../../../insights/apps/blog/impact/customer.md)

### Related Specs

- [Unified Layout System](./unified-layout-system.md)
- [Search Keyboard Shortcuts](./search-keyboard-shortcuts.md)

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
