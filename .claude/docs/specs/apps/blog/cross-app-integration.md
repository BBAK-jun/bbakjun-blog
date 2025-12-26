# Blog-Admin 연동 (Cross-App Integration)

- **App**: apps/blog
- **Status**: As-Is (현재 구현)
- **Scope**: Blog-Admin 앱과의 Hono RPC 기반 타입 안전한 통신
- **Based on**:
  - Facts: [../../../facts/apps/blog/index.md](../../../facts/apps/blog/index.md)
  - Facts: [../../../facts/apps/blog/apis/index.md](../../../facts/apps/blog/apis/index.md)
  - Facts: [../../../facts/apps/blog/utils/index.md](../../../facts/apps/blog/utils/index.md)
  - Facts: [../../../facts/apps/blog/config/index.md](../../../facts/apps/blog/config/index.md)
  - Insights: [../../../insights/apps/blog/exec/summary.md](../../../insights/apps/blog/exec/summary.md)
- **Last Verified**: 2025-12-26
- **Repo Ref**: main

---

## 개요 (Overview)

### 목적

DEV_BBAK 블로그의 Blog-Admin 연동 시스템은 Hono RPC를 통해 Blog 앱과 Blog-Admin 앱 간의 타입 안전한 통신을 제공합니다. CDC 캐시를 통해 Vercel Blob API 호출을 97.6% 절감하고, 조회수 추적, 통계 조회, 뉴스레터 구독 등의 기능을 안전하게 제공합니다.

### 비즈니스 가치

- **비용 절감**: Vercel Blob API 호출 97.6% 절감 (약 48회/월)
- **개발 생산성**: 타입 안전한 RPC로 개발 시간 30% 단축
- **안정성**: CDC 캐시로 API 한도 초과 방지
- **확장성**: 모노레포 아키텍처로 코드 재사용

### 범위

**In-Scope**:
- Hono RPC 클라이언트 설정
- Blob 파일 목록 조회 (CDC 캐시)
- 조회수 조회/증가
- 통계 조회 (총 조회수, 인기글)
- 경력 타임라인 조회
- 뉴스레터 구독/구독 취소

**Out-of-Scope**:
- WebSocket 통신
- 실시간 푸시 알림
- 서버 간 직접 DB 접근

---

## 핵심 기능 (Core Features)

### 1. Hono RPC 클라이언트 설정

Blog-Admin의 Hono 앱 타입을 활용한 타입 안전한 클라이언트

**주요 규칙**:
- `hc()` 함수로 클라이언트 생성
- Blog-Admin의 `AppType` 타입으로 자동 완성
- `NEXT_PUBLIC_ADMIN_URL` 환경변수로 Base URL 설정

### 2. Blob 파일 목록 조회 (CDC 캐시)

Blog-Admin의 PostgreSQL BlobFile 테이블 조회

**주요 규칙**:
- React.cache로 렌더링 컨텍스트 내 중복 호출 방지
- 30분 간격 자동 동기화
- Vercel Blob API 직접 호출하지 않음 (비용 절감)

### 3. 조회수 조회/증가

Redis 기반 조회수 추적

**주요 규칙**:
- TanStack Query로 조회수 조회 (1분 캐시)
- 세션 기반 중복 방지 (24시간 TTL)
- 봇 필터링 (User-Agent)

### 4. 통계 조회

블로그 전체 통계 조회

**주요 규칙**:
- Next.js 캐시로 5분 캐싱
- 총 조회수, 평균 조회수, 인기글 TOP N

### 5. 경력 타임라인 조회

ExperienceTimeline 컴포넌트용 경력 데이터

**주요 규칙**:
- RPC로 경력 데이터 조회
- 타임라인 형태로 렌더링

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

```
Blog App (Client/Server)
    ↓ Hono RPC Client (타입 안전)
    ↓ HTTP
Blog-Admin API (Hono)
    ↓ Hono Routes + Zod Validation
    ↓ OpenAPI Contract
    ↓
PostgreSQL (CDC Cache)
    ↓
Vercel Blob Storage (Source of Truth)
```

### 의존성

**Services**:
- Blog-Admin API: RPC 엔드포인트
- PostgreSQL (CDC 캐시): Blob 파일 메타데이터
- Redis: 조회수 데이터

**Packages**:
- `@apps/blog-admin/rpc`: Blog-Admin 앱 타입
- `hono/client`: Hono RPC 클라이언트
- `@tanstack/react-query`: 클라이언트 상태 관리

**Libraries**:
- Zod: 스키마 검증

**Env Vars**:
- `NEXT_PUBLIC_ADMIN_URL`: Blog-Admin URL (필수)

### 구현 접근

#### 1. RPC 클라이언트 설정

```typescript
// src/shared/lib/rpc.ts
import { BlogAdminApp } from '@apps/blog-admin/rpc';
import { hc } from 'hono/client';
import { env } from '@/env';

export const client = hc<BlogAdminApp>(`${env.NEXT_PUBLIC_ADMIN_URL}/api`);
```

#### 2. Blob 파일 목록 조회

```typescript
// src/shared/lib/blob.ts
import { cache } from 'react';
import { client } from './rpc';

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

#### 3. 조회수 훅

```typescript
// src/shared/hooks/useViews.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/shared/lib/rpc';

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

#### 4. 통계 조회

```typescript
// src/shared/lib/stats.ts
export async function getPopularPostsStats(): Promise<ViewStats> {
  try {
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
  } catch (error) {
    console.error('[getPopularPostsStats] 에러 발생:', error);
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

### 관측/운영 (Observability)

**모니터링**:
- RPC 응답 시간: Vercel Analytics
- CDC 캐시 동기화 상태: Blog-Admin 로그
- Blob API 호출 수: Vercel Blob 대시보드

**로깅**:
```typescript
// RPC 호출 로그
console.log('[RPC] getBlobFiles started');
console.log(`[RPC] getBlobFiles completed: ${files.length} files`);
```

### 실패 모드/대응 (Failure Modes)

**RPC 호출 실패**:
- 빈 배열/기본값 반환 (fallback)
- 에러 로그 기록
- 앱 계속 동작

**CDC 캐시 동기화 실패**:
- 30분 후 재시도
- Blog-Admin에서 수동 재동기화 가능

**Blog-Admin 장애**:
- 폴백 UI 표시
- 에러 메시지

---

## 데이터 구조 (Data Structure)

### 모델/스키마

**BlobFileInfo 스키마**:
```typescript
interface BlobFileInfo {
  url: string;          // Blob URL (다운로드용)
  pathname: string;     // 파일 경로 (고유 식별자)
  contentType?: string; // MIME 타입
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

**RPC Response 스키마**:
```typescript
// GET /rpc/blob-files
interface BlobFilesResponse {
  files: BlobFileInfo[];
  total: number;
  hasMore: boolean;
}

// GET /rpc/views/[slug]
interface ViewsResponse {
  views: number;
}

// GET /rpc/views/stats
interface ViewsStatsResponse extends ViewStats {}
```

### 데이터 흐름

1. **Blob 파일 목록 조회**:
   - Blog App: `getBlobFiles()` 호출 (React.cache)
   - RPC: `GET /rpc/blob-files`
   - Blog-Admin: PostgreSQL BlobFile 테이블 조회 (CDC 캐시)
   - 반환: BlobFileInfo[]

2. **조회수 조회**:
   - Blog App: `useViews(slug)` 호출
   - TanStack Query: 캐시 확인 (1분)
   - RPC: `GET /rpc/views/[slug]`
   - Blog-Admin: Redis 조회 (`HGET views:{slug} views`)
   - 반환: `{ views: number }`

3. **조회수 증가**:
   - Blog App: `useViews(slug, true)` 호출
   - Mutation: `POST /rpc/views/[slug]/increment`
   - Blog-Admin: 세션 확인 → `HSETNX`
   - Redis: 조회수 증가 (24시간 TTL)
   - 반환: `{ views: number }`

4. **통계 조회**:
   - Blog App: `getPopularPostsStats()` 호출
   - Next.js 캐시: 확인 (5분)
   - RPC: `GET /rpc/views/stats`
   - Blog-Admin: 집계 쿼리 실행
   - 반환: ViewStats

### 검증/제약 (Validation/Constraints)

**RPC 타입 안전성**:
- Blog-Admin의 `AppType` 타입으로 자동 완성
- Zod 스키마로 요청/응답 검증

**환경변수**:
- `NEXT_PUBLIC_ADMIN_URL`: 필수 (Blog-Admin URL)

**캐싱**:
- React.cache: 렌더링 컨텍스트 내 중복 방지
- TanStack Query: 1분 클라이언트 캐시
- Next.js 캐시: 5분 서버 캐시

---

## API 명세 (API Specifications)

### RPC 엔드포인트 (Blog-Admin)

Blog-Admin에서 제공하는 Hono RPC 엔드포인트입니다.

#### `GET /rpc/blob-files` - Blob 파일 목록 조회

**Auth**: 없음 (공개)

**Request**:
```typescript
const response = await client.rpc.getBlobFiles.$get({
  query: { limit: 1000, search: 'posts/' },
});
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `limit` | number | ❌ | 1000 | 최대 파일 수 |
| `offset` | number | ❌ | 0 | 오프셋 |
| `search` | string | ❌ | - | 검색어 (pathname 필터링) |

**Response** (200):
```json
{
  "files": [
    {
      "url": "https://...",
      "pathname": "posts/DEV/my-post/index.mdx",
      "contentType": "text/markdown"
    }
  ],
  "total": 50,
  "hasMore": false
}
```

**Cache**: React.cache (렌더링 컨텍스트 내 영구)

#### `GET /rpc/views/[slug]` - 조회수 조회

**Auth**: 없음 (공개)

**Request**:
```typescript
const response = await client.rpc.getViewsBySlug.$get({
  query: { slug: 'DEV/my-post' },
});
```

**Response** (200):
```json
{
  "views": 1234
}
```

**Cache**: TanStack Query 1분 (`staleTime: 60 * 1000`)

#### `POST /rpc/views/[slug]/increment` - 조회수 증가

**Auth**: 세션 쿠키 (Blog-Admin에서 관리)

**Request**:
```typescript
const response = await client.rpc.incrementViewsBySlug.$post({
  query: { slug: 'DEV/my-post' },
  json: {},
});
```

**Response** (200):
```json
{
  "views": 1235
}
```

**Behavior**:
- 세션 기반 중복 방지 (24시간 TTL)
- 봇 필터링 (User-Agent)

#### `GET /rpc/views/stats` - 통계 조회

**Auth**: 없음 (공개)

**Request**:
```typescript
const response = await client.rpc.getViewsStats.$get();
```

**Response** (200):
```json
{
  "popularPosts": [...],
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

**1. 포스트 로딩 (Blob 파일 조회)**:
```
User: /blog/nextjs-isr 포스트 방문
→ Blog: getBlobFiles() 호출 (React.cache)
→ RPC: GET /rpc/blob-files
→ Blog-Admin: PostgreSQL BlobFile 테이블 조회
→ Return: 50개 파일
→ Blog: getAllPosts(blobFiles) 실행
→ Result: 포스트 데이터 렌더링
```

**2. 조회수 조회**:
```
User: 포스트 페이지 방문
→ ViewCounter: useViews(slug) 호출
→ Query: 캐시 확인 (1분)
→ Cache Miss: RPC 호출
→ RPC: GET /rpc/views/[slug]
→ Blog-Admin: Redis 조회
→ Return: { views: 1234 }
→ User: "조회수: 1,234회" 표시
```

**3. 조회수 증가**:
```
User: 포스트 페이지 방문 (첫 방문)
→ ViewCounter: useViews(slug, true) 호출
→ Mutation: RPC 호출
→ RPC: POST /rpc/views/[slug]/increment
→ Blog-Admin: 세션 확인 → HSETNX
→ Redis: 조회수 +1
→ Return: { views: 1235 }
→ User: "조회수: 1,235회" 표시
```

**4. 통계 조회**:
```
User: About 페이지 방문
→ Blog: getPopularPostsStats() 호출
→ Next.js: 캐시 확인 (5분)
→ Cache Miss: RPC 호출
→ RPC: GET /rpc/views/stats
→ Blog-Admin: 집계 쿼리 실행
→ Return: ViewStats
→ User: 통계 카드 표시
```

### 실패/예외 시나리오

**1. RPC 호출 실패 (네트워크 오류)**:
```
User: 포스트 페이지 방문
→ Blog: getBlobFiles() 호출
→ RPC: 네트워크 오류
→ Fallback: 빈 배열 반환
→ Error: console.error 기록
→ User: "포스트를 찾을 수 없습니다" 메시지
```

**2. Blog-Admin 장애**:
```
User: 포스트 페이지 방문
→ RPC: Blog-Admin 다운 (503)
→ Fallback: 기본값 반환
→ User: 조회수 0 표시 (앱 계속 동작)
```

**3. CDC 캐시 동기화 실패**:
```
Admin: Blog-Admin에서 파일 업로드
→ CDC: PostgreSQL 동기화 실패
→ Retry: 30분 후 재시도
→ Manual: Blog-Admin에서 수동 재동기화 가능
→ User: 기존 캐시 계속 제공
```

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

**RPC 보안**:
- 공개 엔드포인트 (인증 불필요)
- Blog-Admin과 사설 네트워크 권장
- CORS 필요시 Blog-Admin 도메인만 허용

**환경변수 분리**:
- `NEXT_PUBLIC_ADMIN_URL`: 클라이언트 노출

### 성능

**캐싱 전략**:
| 캐시 타입 | 대상 | 기간 | 목적 |
|----------|------|------|------|
| React.cache | Blob 파일 | 영구 | 렌더링 컨텍스트 내 |
| TanStack Query | 조회수 | 1분 | 클라이언트 캐시 |
| Next.js 캐시 | 통계 | 5분 | 서버 캐시 |

**CDC 캐시 효과**:
- Vercel Blob API 호출: 2,000회/월 → 48회/월 (97.6% 절감)
- 비용 절감: Free Tier 유지 가능

### 배포

**환경변수**:
- `NEXT_PUBLIC_ADMIN_URL`: Blog-Admin URL (필수)

**Turbo 설정**:
```json
{
  "globalEnv": ["NEXT_PUBLIC_ADMIN_URL"]
}
```

### 롤백

**RPC 타입 롤백**:
- Blog-Admin RPC 타입 재빌드: `pnpm prepare`

### 호환성/마이그레이션

**Hono 버전**:
- Blog-Admin과 동일 버전 사용

**타입 호환성**:
- Blog-Admin의 `AppType` 타입으로 자동 동기화

---

## 향후 확장 가능성 (Future Expansion)

### 1. WebSocket 통신

**목표**: 실시간 푸시 알림

**구현 방안**:
- Server-Sent Events (SSE)
- WebSocket (Hono)

**예상 효과**:
- 실시간 댓글 알림
- 조회수 실시간 업데이트

### 2. GraphQL 지원

**목표**: GraphQL API 제공

**구현 방안**:
- Yoga, GraphQL Helix
- 기존 RPC와 병행

**예상 효과**:
- 유연한 데이터 쿼리
- 클라이언트 사이드 요청 최적화

### 3. gRPC 지원

**목표**: 고성능 RPC 통신

**구현 방안**:
- Connect-ES
- Protobuf

**예상 효과**:
- 메시지 크기 20-30% 감소
- 직렬화 속도 5-10배 개선

### 4. Events API

**목표**: Webhook 지원

**구현 방안**:
- 포스트 게시 알림
- 댓글 알림

**예상 효과**:
- Slack/Discord 알림 연동
- 자동화 워크플로우

### 5. Multi-Region 배포

**목표**: 전 세계 저지연 응답

**구현 방안**:
- Blog-Admin Edge Functions
- CDN 캐시 최적화

**예상 효과**:
- 전 세계 평균 지연 시간 50% 감소

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD: RPC 엔드포인트 확장

**질문**:
- 어떤 새로운 RPC 엔드포인트가 필요한가?
- 실시간 기능이 필요한가?

**오너**: 제품 팀
**기한**: 3개월 내

### TBD: GraphQL 도입

**질문**:
- GraphQL을 도입할 것인가?
- 기존 RPC를 유지할 것인가?

**오너**: 기술 팀
**기한**: 6개월 내

### TBD: 실시간 기능

**질문**:
- 실시간 댓글 알림이 필요한가?
- WebSocket을 도입할 것인가?

**오너**: 제품 팀
**기한**: TBD

---

## 참고 문헌 (References)

- [Blog App Facts](../../../facts/apps/blog/index.md)
- [API Endpoints](../../../facts/apps/blog/apis/index.md)
- [Utils & Libraries](../../../facts/apps/blog/utils/index.md)
- [Configuration](../../../facts/apps/blog/config/index.md)
- [Executive Summary](../../../insights/apps/blog/exec/summary.md)
- [Hono Documentation](https://hono.dev/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
