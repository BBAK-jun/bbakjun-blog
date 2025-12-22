# 스트리밍 렌더링 구현 문서

TanStack Query를 사용한 스트리밍 렌더링 구현에 대한 설명입니다.

## 개요

Next.js 15와 TanStack Query를 활용하여 블로그의 성능을 향상시키기 위해 스트리밍 렌더링을 구현했습니다. 이를 통해 사용자 경험을 개선하고 페이지 로딩 속도를 최적화했습니다.

## 주요 개선사항

### 1. 홈페이지 스트리밍

**변경 전:**
- 서버 사이드에서 모든 데이터를 가져온 후 렌더링
- 사용자는 모든 데이터 로딩이 완료될 때까지 아무것도 보지 못함

**변경 후:**
- **최신 글**: TanStack Query로 별도 로딩, Suspense로 스켈레톤 표시
- **인기 글**: 독립적으로 로딩, 병렬 처리
- **Error Boundary**: 각 섹션별로 독립적인 에러 처리

### 2. 포스트 페이지 스트리밍

**로딩 우선순위:**
1. **즉시**: 포스트 헤더와 기본 정보 (서버 사이드)
2. **1순위**: 포스트 내용 (서버 사이드 처리 후 클라이언트)
3. **2순위**: 시리즈 네비게이션 (클라이언트 사이드)
4. **3순위**: 뉴스레터 구독 (클라이언트 사이드)
5. **4순위**: 관련 포스트 (클라이언트 사이드)
6. **5순위**: 사이드바 (목차, 인기 글)
7. **최후**: 댓글 섹션

## 구현 상세

### 1. TanStack Query 훅 생성

```typescript
// apps/blog/src/lib/hooks/use-posts.ts
export function useAllPosts(filters?: { limit?: number; offset?: number; category?: string })
export function usePost(slug: string)
export function useAllTags()

// apps/blog/src/lib/hooks/use-popular-posts.ts
export function usePopularPostsStats()
```

- **React Cache**와 함께 사용하여 중복 요청 방지
- **Stale Time** 설정으로 불필요한 리페치 방지
- **Type-safe**한 쿼리 키 관리

### 2. 스트리밍 컴포넌트

**핵심 컴포넌트들:**
- `StreamingPostCard`: 포스트 카드 + 스켈레톤
- `StreamingRecentPosts`: 최신 포스트 목록
- `StreamingPopularPostsGrid`: 인기 포스트 그리드
- `PostContent`: 포스트 본문 + 로딩 상태
- `PostSidebar`: 사이드바 (목차, 인기 글)
- `StreamingRelatedPosts`: 관련 포스트
- `StreamingSeriesNavigation`: 시리즈 네비게이션

### 3. 로딩 상태 처리

**스켈레톤 컴포넌트들:**
- `PostCardSkeleton`: 포스트 카드 스켈레톤
- `PopularPostSkeleton`: 인기 포스트 스켈레톤
- 각 컴포넌트별로 최적화된 스켈레톤 제공

### 4. 에러 핸들링

**Error Boundary:**
- 개별 컴포넌트별 에러 처리
- 사용자 친화적인 에러 메시지
- 재시도 버튼 제공

## 성능 이점

### 1. 사용자 경험 개선
- **渐进式 로딩**: 중요한 콘텐츠부터 표시
- **LCP 개선**: 가장 중요한 콘텐츠가 빠르게 보임
- **인터랙티브**: 로딩 중에도 사용자는 페이지와 상호작용 가능

### 2. 서버 부하 감소
- **병렬 처리**: 여러 데이터 소스를 동시에 로드
- **캐싱**: TanStack Query의 클라이언트 측 캐싱 활용
- **선택적 로딩**: 필요한 데이터만 로드

### 3. 번들 최적화
- **코드 분할**: 각 컴포넌트가 독립적으로 로드
- **Lazy Loading**: 필요할 때만 컴포넌트 로드

## 사용법

### 홈페이지
기존 `/` 경로가 이미 스트리밍으로 업데이트됨:
- 최신 글과 인기 글이 독립적으로 로드됨
- 탭 전환 시 스켈레톤 표시

### 포스트 페이지
새로운 스트리밍 버전은 `/blog/[...slug]/streaming-page`에 구현됨:
- 점진적 콘텐츠 로딩
- 우선순위 기반 렌더링

## TanStack Query 설정

```typescript
// apps/blog/src/components/providers/query-provider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분
      refetchOnWindowFocus: false,
    },
  },
})
```

## 모범 사례

### 1. 쿼리 키 관리
- 계층적 구조 사용: `['posts', 'list', filters]`
- 직렬화 가능한 파라미터만 사용

### 2. 에러 처리
- 각 쿼리별로 에러 상태 관리
- 사용자에게 명확한 피드백 제공

### 3. 로딩 상태
- 실제 콘텐츠와 유사한 스켈레톤 제공
- 로딩 인디케이터의 일관성 유지

### 4. 캐싱 전략
- 데이터의 특성에 맞는 stale time 설정
- 필요한 경우 수동 리페치 기능 제공

## 다음 단계

1. **추가 최적화**:
   - 이미지 로딩 최적화
   - 프리페칭 전략 도입

2. **분석 및 모니터링**:
   - Core Web Vitals 측정
   - 사용자 행동 분석

3. **확장**:
   - 다른 페이지에도 스트리밍 적용
   - 서버 컴포넌트와 더 많이 통합