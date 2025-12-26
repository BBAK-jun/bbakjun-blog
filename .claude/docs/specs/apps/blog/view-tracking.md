# 조회수 추적 시스템 (View Tracking System)

- **App**: apps/blog
- **Status**: As-Is (현재 구현)
- **Scope**: Redis 기반 세션 당 중복 방지 조회수 추적 시스템
- **Based on**:
  - Facts: [../../../facts/apps/blog/index.md](../../../facts/apps/blog/index.md)
  - Facts: [../../../facts/apps/blog/apis/index.md](../../../facts/apps/blog/apis/index.md)
  - Facts: [../../../facts/apps/blog/utils/index.md](../../../facts/apps/blog/utils/index.md)
  - Facts: [../../../facts/apps/blog/components/index.md](../../../facts/apps/blog/components/index.md)
  - Insights: [../../../insights/apps/blog/exec/summary.md](../../../insights/apps/blog/exec/summary.md)
- **Last Verified**: 2025-12-26
- **Repo Ref**: main

---

## 개요 (Overview)

### 목적

DEV_BBAK 블로그의 조회수 추적 시스템은 Redis를 활용하여 포스트별 조회수를 정확하게 측정하고, 세션 기반 중복 방지로 조작을 방지합니다. Blog-Admin의 RPC API를 통해 타입 안전하게 조회수 데이터를 가져오고, TanStack Query로 클라이언트 상태를 관리합니다.

### 비즈니스 가치

- **정확한 측정**: 세션 기반 중복 방지로 정확한 조회수 집계
- **사용자 경험**: 실시간 조회수 표시로 참여도 개선
- **데이터 기반 의사결정**: 인기글 분석으로 콘텐츠 전략 수립
- **성능 최적화**: Redis 캐싱으로 빠른 응답 (1분 TTL)

### 범위

**In-Scope**:
- 포스트별 조회수 조회
- 세션 기반 중복 방지 (24시간 TTL)
- 봇 필터링 (User-Agent)
- 통계 조회 (총 조회수, 인기글)
- TanStack Query로 클라이언트 캐싱

**Out-of-Scope**:
- 사용자별 조회 이력 (개인정보 이슈)
- 실시간 조회수 (WebSocket)
- 지리적 위치 기반 통계

---

## 핵심 기능 (Core Features)

### 1. 조회수 조회 (View Count Query)

포스트별 현재 조회수를 조회

**주요 규칙**:
- Redis 해시에서 조회수 가져오기: `HGET views:{slug} views`
- TanStack Query로 1분 캐싱 (`staleTime: 60 * 1000`)
- 실패 시 0 반환 (앱 계속 동작)

### 2. 조회수 증가 (View Count Increment)

포스트 방문 시 조회수 증가

**주요 규칙**:
- 세션 쿠키로 중복 방지 (24시간 TTL)
- `HSETNX`로 원자적 증가 (경쟁 조건 방지)
- 봇 필터링 (User-Agent로 크롤러 제외)
- Blog-Admin RPC로 증가 요청

### 3. 통계 조회 (View Statistics)

블로그 전체 통계 조회

**주요 규칙**:
- 총 조회수, 총 포스트 수, 평균 조회수
- 인기 포스트 TOP N (조회수 기준)
- 최신 포스트 목록
- Next.js 캐시로 5분 캐싱 (`next: { revalidate: 300 }`)

### 4. 봇 필터링 (Bot Filtering)

크롤러 봇의 조회수 증가 방지

**주요 규칙**:
- User-Agent로 일반적인 크롤러 탐지
- Googlebot, Facebookbot, Twitterbot 등 제외

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

```
Blog App (Client)
    ↓ ViewCounter 컴포넌트
useViews(slug, increment=true)
    ↓ useQuery (조회수 조회)
RPC: GET /rpc/views/[slug]
    ↓ Blog-Admin (Hono)
Redis (views:{slug})
    ↓ 조회수 반환
    ↓ useMutation (조회수 증가)
RPC: POST /rpc/views/[slug]/increment
    ↓ Blog-Admin
세션 확인 → HSETNX (views:{slug}, sessions:{sessionId}, 1)
    ↓
Redis (24시간 TTL)
```

### 의존성

**Services**:
- Blog-Admin RPC API: 조회수 조회/증가, 통계
- Redis (Vercel KV): 조회수 저장

**Packages**:
- `@tanstack/react-query`: 클라이언트 상태 관리
- `hono/client`: Hono RPC 클라이언트

**Libraries**:
- React 19: UI 렌더링

**Env Vars**:
- `NEXT_PUBLIC_ADMIN_URL`: Blog-Admin URL (필수)

### 구현 접근

#### 1. useViews 훅

```typescript
// src/shared/hooks/useViews.ts
export function useViews(slug: string, increment: boolean = false): ViewData {
  const queryClient = useQueryClient();

  // 조회수 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['views', slug],
    queryFn: async () => {
      const response = await client.rpc.getViewsBySlug.$get({
        query: { slug },
      });
      if (!response.ok) throw new Error('Failed to fetch views');
      return response.json();
    },
    staleTime: 60 * 1000, // 1분 캐시
  });

  // 조회수 증가 mutation
  const incrementMutation = useMutation({
    mutationFn: async () => {
      const response = await client.rpc.incrementViewsBySlug.$post({
        query: { slug },
        json: {},
      });
      if (!response.ok) throw new Error('Failed to increment views');
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

#### 2. ViewCounter 컴포넌트

```typescript
// src/shared/ui/view-counter.tsx
export function ViewCounter({ slug, increment = false }: ViewCounterProps) {
  const { views, loading } = useViews(slug, increment);

  if (loading) {
    return <span className="animate-pulse">로딩중...</span>;
  }

  return (
    <span className="flex items-center gap-1">
      <EyeIcon className="w-4 h-4" />
      <span>{views.toLocaleString()}회</span>
    </span>
  );
}
```

#### 3. 통계 조회

```typescript
// src/shared/lib/stats.ts
export async function getPopularPostsStats(): Promise<ViewStats> {
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

  return response.json();
}
```

### 관측/운영 (Observability)

**모니터링**:
- Redis Commands: Vercel KV 대시보드
- 조회수 증가 추이: About 페이지 통계
- RPC 응답 시간: Vercel Analytics

**로깅**:
```typescript
// 조회수 증가 로그
console.log(`[Increment] slug: ${slug}, views: ${newViews}`);
```

### 실패 모드/대응 (Failure Modes)

**RPC 실패**:
- 조회수 0 반환 (fallback)
- 에러 메시지 표시

**Redis 장애**:
- Blog-Admin에서 폴백 처리
- 앱 계속 동작

**세션 쿠키 없음**:
- 첫 방문으로 간주
- 정상적으로 조회수 증가

---

## 데이터 구조 (Data Structure)

### 모델/스키마

**Redis 해시 구조**:
```
views:{slug}
  ├─ views: 1234              # 총 조회수
  ├─ sessions:{sessionId1}: 1 # 세션 마커 (24시간 TTL)
  ├─ sessions:{sessionId2}: 1
  └─ ...
```

**ViewData 스키마**:
```typescript
interface ViewData {
  views: number;        // 조회수
  loading: boolean;     // 로딩 상태
  error: string | null; // 에러 메시지
}
```

**PopularPost 스키마**:
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

**ViewStats 스키마**:
```typescript
interface ViewStats {
  popularPosts: PopularPost[];
  totalViews: number;
  totalPosts: number;
  averageViews?: number;
  recentPosts?: PopularPost[];
}
```

### 데이터 흐름

1. **조회수 조회**:
   - TanStack Query로 캐시 확인 (1분)
   - 캐시 Miss 시 RPC 호출
   - Redis에서 조회수 가져오기
   - 클라이언트 캐시 업데이트

2. **조회수 증가**:
   - 세션 쿠키 확인
   - RPC 호출로 증가 요청
   - Blog-Admin에서 세션 확인
   - `HSETNX`로 중복 방지
   - Redis에 저장 (24시간 TTL)

3. **통계 조회**:
   - Next.js 캐시 확인 (5분)
   - 캐시 Miss 시 RPC 호출
   - Redis에서 집계
   - 캐시 업데이트

### 검증/제약 (Validation/Constraints)

**세션 기반 중복 방지**:
- 동일 세션에서 24시간 내 재방문 시 카운트하지 않음
- `HSETNX`로 원자적 증가 보장

**봇 필터링**:
- User-Agent로 크롤러 탐지
- Googlebot, Facebookbot, Twitterbot 등 제외

**TTL**:
- 세션 마커: 24시간
- 조회수 데이터: 영구

---

## API 명세 (API Specifications)

### `GET /rpc/views/[slug]` - 조회수 조회

**Auth**: 없음 (공개)

**Request**:
```typescript
const response = await client.rpc.getViewsBySlug.$get({
  query: { slug: 'DEV/my-post' },
});
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `slug` | string | ✅ | 포스트 슬러그 |

**Response** (200):
```json
{
  "views": 1234
}
```

**Cache**: TanStack Query 1분 (`staleTime: 60 * 1000`)

### `POST /rpc/views/[slug]/increment` - 조회수 증가

**Auth**: 세션 쿠키 (Blog-Admin에서 관리)

**Request**:
```typescript
const response = await client.rpc.incrementViewsBySlug.$post({
  query: { slug: 'DEV/my-post' },
  json: {},
});
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `slug` | string | ✅ | 포스트 슬러그 |

**Response** (200):
```json
{
  "views": 1235
}
```

**Behavior**:
- 세션 기반 중복 방지 (24시간 TTL)
- 봇 필터링 (User-Agent)

### `GET /rpc/views/stats` - 통계 조회

**Auth**: 없음 (공개)

**Request**:
```typescript
const response = await client.rpc.getViewsStats.$get(
  {},
  {
    init: {
      next: { revalidate: 300 }, // 5분 캐시
    },
  }
);
```

**Response** (200):
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

**Cache**: Next.js 캐시 5분 (`next: { revalidate: 300 }`)

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**1. 첫 방문 (조회수 증가)**:
```
User: /blog/nextjs-isr 포스트 방문
→ ViewCounter: useViews(slug, increment=true)
→ Query: 조회수 조회 (RPC)
→ Mutation: 조회수 증가 (RPC)
→ Blog-Admin: 세션 확인 → HSETNX
→ Redis: 조회수 +1 (sessions:{sessionId}: 1)
→ User: "조회수: 1,235회" 표시
```

**2. 재방문 (24시간 내, 중복 방지)**:
```
User: 동일 포스트 재방문 (1시간 후)
→ ViewCounter: useViews(slug, increment=true)
→ Mutation: 조회수 증가 시도
→ Blog-Admin: 세션 확인 → 기존 세션 발견
→ Redis: HSETNX 실패 (이미 존재)
→ User: "조회수: 1,235회" (변화 없음)
```

**3. 재방문 (24시간 후, 카운트)**:
```
User: 동일 포스트 재방문 (25시간 후)
→ ViewCounter: useViews(slug, increment=true)
→ Mutation: 조회수 증가 시도
→ Blog-Admin: 세션 확인 → 만료된 세션
→ Redis: HSETNX 성공 (새 세션)
→ User: "조회수: 1,236회" (+1)
```

### 실패/예외 시나리오

**1. RPC 실패**:
```
User: 포스트 방문
→ ViewCounter: useViews 호출
→ Query: RPC 실패 (네트워크 오류)
→ Fallback: 0 반환
→ User: "조회수 로드 실패" 메시지
```

**2. Redis 장애**:
```
User: 포스트 방문
→ Blog-Admin: Redis 연결 실패
→ Fallback: 0 반환
→ User: 조회수 0 표시 (앱 계속 동작)
```

**3. 봇 방문**:
```
Bot: Googlebot 크롤링
→ Blog-Admin: User-Agent 확인
→ Filter: 봇으로 판별
→ Redis: 조회수 증가 안 함
→ User: 조회수 변화 없음
```

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

**RPC 보안**:
- 공개 엔드포인트 (인증 불필요)
- Blog-Admin과 사설 네트워크 권장

**세션 쿠키**:
- Blog-Admin에서 관리
- HttpOnly, Secure 설정

### 성능

**캐싱 전략**:
| 캐시 타입 | 대상 | 기간 | 목적 |
|----------|------|------|------|
| TanStack Query | 조회수 | 1분 | 클라이언트 캐시 |
| Next.js 캐시 | 통계 | 5분 | 서버 캐시 |

**Redis Commands**:
- 조회수 조회: 1회/방문
- 조회수 증가: 1회/세션/24시간

### 배포

**환경변수**:
- `NEXT_PUBLIC_ADMIN_URL`: Blog-Admin URL (필수)

### 롤백

**Redis 데이터 롤백**:
- Vercel KV 백업 기능 사용
- 주기적으로 스냅샷 저장

### 호환성/마이그레이션

**Redis 버전**:
- Vercel KV (Redis 7+)

**클라이언트 호환성**:
- TanStack Query v5+
- Hono RPC 클라이언트

---

## 향후 확장 가능성 (Future Expansion)

### 1. 지리적 위치 기반 통계

**목표**: 국가/도시별 조회수 통계

**구현 방안**:
- IP 주소로 지리적 위치 추정
- Redis Geo 데이터 구조 활용

**예상 효과**:
- 타겟 독자 분석
- 지역별 콘텐츠 전략

### 2. 실시간 조회수

**목표**: WebSocket으로 실시간 조회수 업데이트

**구현 방안**:
- Server-Sent Events (SSE)
- Redis Pub/Sub

**예상 효과**:
- 참여도 개선
- 라이브 경험

### 3. 조회수 이력

**목표**: 일별/월별 조회수 추이

**구현 방안**:
- Redis Time Series
- Aggregation Query

**예상 효과**:
- 콘텐츠 성과 분석
- 트렌드 파악

### 4. A/B 테스트 통계

**목표**: 포스트별 A/B 테스트 결과 추적

**구현 방안**:
- 버전별 조회수 분리
- 통계적 유의성 검정

**예상 효과**:
- 헤드라인 최적화
- 참여도 개선

### 5. 조회수 fraud 탐지

**목표**: 비정상적인 조회수 증가 탐지

**구현 방안**:
- Rate Limiting
- 이상 탐지 알고리즘

**예상 효과**:
- 데이터 정확성 개선
- 조작 방지

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD: 조회수 Fraud 탐지

**질문**:
- 현재 조회수 증가 패턴이 정상적인가?
- 비정상적인 증가 탐지가 필요한가?

**오너**: 데이터 팀
**기한**: 3개월 내

### TBD: 세션 TTL 최적화

**질문**:
- 24시간 TTL이 최적인가?
- 재방문율에 따라 TTL 조정할 것인가?

**오너**: 제품 팀
**기한**: 6개월 내

### TBD: 통계 대시보드

**질문**:
- 조회수 통계 대시보드가 필요한가?
- 어떤 지표를 표시할 것인가?

**오너**: 제품 팀
**기한**: 3개월 내

---

## 참고 문헌 (References)

- [Blog App Facts](../../../facts/apps/blog/index.md)
- [API Endpoints](../../../facts/apps/blog/apis/index.md)
- [Utils & Libraries](../../../facts/apps/blog/utils/index.md)
- [Components](../../../facts/apps/blog/components/index.md)
- [Executive Summary](../../../insights/apps/blog/exec/summary.md)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
