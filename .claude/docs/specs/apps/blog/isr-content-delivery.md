# ISR 기반 콘텐츠 전달 (ISR-Based Content Delivery)

- **App**: apps/blog
- **Status**: As-Is (현재 구현)
- **Scope**: ISR(Incremental Static Regeneration)을 활용한 정적/동적 하이브리드 콘텐츠 전달 시스템
- **Based on**:
  - Facts: [../../../facts/apps/blog/index.md](../../../facts/apps/blog/index.md)
  - Facts: [../../../facts/apps/blog/pages/index.md](../../../facts/apps/blog/pages/index.md)
  - Facts: [../../../facts/apps/blog/apis/index.md](../../../facts/apps/blog/apis/index.md)
  - Insights: [../../../insights/apps/blog/exec/summary.md](../../../insights/apps/blog/exec/summary.md)
  - Insights: [../../../insights/apps/blog/impact/roi.md](../../../insights/apps/blog/impact/roi.md)
- **Last Verified**: 2025-12-26
- **Repo Ref**: main

---

## 개요 (Overview)

### 목적

DEV_BBAK 블로그의 ISR(Incremental Static Regeneration) 기반 콘텐츠 전달 시스템은 정적 생성의 성능과 동적 콘텐츠의 신선도를 동시에 제공합니다. 사용자에게 초고속 로딩 경험을 제공하는 동시에, 콘텐츠 업데이트를 60초 내에 반영하여 운영 효율성을 극대화합니다.

### 비즈니스 가치

- **사용자 경험 개선**: 정적 HTML로 초고속 로딩 (Core Web Vitals 최적화)
- **비용 절감**: Serverless Functions 실행 시간 감소로 Vercel 요금 비용 절감
- **운영 효율**: 콘텐츠 업데이트 자동화로 수동 배포 제거
- **SEO 최적화**: 정적 페이지로 검색 엔진 크롤링 최적화

### 범위

**In-Scope**:
- ISR 페이지 생성 (포스트, 홈, 태그, 시리즈)
- On-demand 재검증 API
- 동적 경로 생성 (`generateStaticParams`)
- 메타데이터 생성 (`generateMetadata`)
- OG 이미지 생성

**Out-of-Scope**:
- 실시간 콘텐츠 (WebSocket, Server-Sent Events)
- 사용자별 개인화 콘텐츠 (A/B 테스트 등)
- Edge Functions (현재 Node.js runtime 사용)

---

## 핵심 기능 (Core Features)

### 1. 자동 ISR 재검증 (Automatic ISR Revalidation)

정적 페이지를 주기적으로 자동 재검증하여 콘텐츠 신선도 유지

**주요 규칙**:
- 포스트 페이지: 60초마다 재검증
- 홈 페이지: 60초마다 재검증
- 태그/시리즈 페이지: 300초(5분)마다 재검증
- 재검증 간격 동안 정적 캐시 제공

**구현 위치**:
- `src/app/blog/[...slug]/page.tsx`: `export const revalidate = 60`
- `src/app/page.tsx`: `export const revalidate = 60`
- `src/app/tags/[tag]/page.tsx`: `export const revalidate = 300`

### 2. On-Demand 재검증 (On-Demand Revalidation)

Blog-Admin에서 콘텐츠 업데이트 시 즉시 ISR 캐시 무효화

**주요 규칙**:
- `REVALIDATION_SECRET` 토큰으로 인증
- 특정 경로 또는 전체 블로그 재검증 지원
- 재검증 후 홈/블로그 목록도 갱신

**API 엔드포인트**: `POST /api/revalidate`

### 3. 정적 경로 생성 (Static Path Generation)

빌드 타임에 모든 포스트, 태그, 시리즈 경로 생성

**주요 규칙**:
- `generateStaticParams()`로 정적 경로 생성
- Blob 파일 목록으로 경로 목록 생성
- `dynamicParams: true`로 런타임 경로 지원

### 4. 동적 메타데이터 생성 (Dynamic Metadata Generation)

각 포스트별로 고유한 OG 이미지, 메타데이터 생성

**주요 규칙**:
- `generateMetadata()`로 동적 메타데이터 생성
- OG 이미지 URL 동적 생성
- 포스트 제목, 설명, 태그 포함

### 5. OG 이미지 생성 (OG Image Generation)

Next.js ImageResponse로 동적 OG 이미지 생성 (1200x630px)

**주요 규칙**:
- 포스트 제목, 날짜 표시
- 그라데이션 배경, 장식 요소
- Edge Runtime 사용

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

```
User Request
    ↓
Next.js ISR Cache (Static HTML)
    ↓ (Cache Miss)
Server-Side Rendering (getServerSideProxy)
    ↓
Blob Files (CDC Cache)
    ↓
Vercel Blob Storage (MDX Files)
    ↓
Markdown Processing (@repo/content)
    ↓
Static HTML Generation + ISR Revalidation
```

### 의존성

**Services**:
- Blog-Admin API: Blob 파일 목록 (CDC 캐시)
- Vercel Blob Storage: MDX 원본 파일

**Packages**:
- `@repo/content`: MDX 처리, 포스트 관련 함수
- `next/og`: OG 이미지 생성
- `@next/mdx`: MDX 지원

**Libraries**:
- React 19: UI 렌더링
- Next.js 15: 프레임워크
- `gray-matter`: 프론트 매터 파싱

**Env Vars**:
- `REVALIDATION_SECRET`: ISR 재검증 토큰 (선택사항)
- `NEXT_PUBLIC_SITE_URL`: 사이트 기본 URL (OG 이미지용, 선택사항)
- `NEXT_PUBLIC_ADMIN_URL`: Blog-Admin URL (필수)

### 구현 접근

#### 1. ISR 페이지 구현

```typescript
// src/app/blog/[...slug]/page.tsx
export const revalidate = 60; // 60초마다 재검증
export const dynamicParams = true; // 런타임 경로 지원

export async function generateStaticParams() {
  const blobFiles = await getBlobFiles();
  const posts = await getAllPosts(blobFiles);
  return posts.map(post => ({
    slug: post.slug.split('/'),
  }));
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostBySlug(blobFiles, slugString);
  // ...
}
```

#### 2. On-Demand 재검증 API

```typescript
// src/app/api/revalidate/route.ts
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const path = searchParams.get('path');
  const all = searchParams.get('all');

  if (secret !== env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  if (all === 'true') {
    revalidatePath('/', 'layout');
    revalidatePath('/blog', 'layout');
  } else if (path) {
    revalidatePath(path);
    revalidatePath('/');
    revalidatePath('/blog');
  }

  return NextResponse.json({ revalidated: true });
}
```

#### 3. OG 이미지 생성

```typescript
// src/app/api/og/[...slug]/route.tsx
export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: { slug: string[] } }
) {
  const slug = params.slug.join('/');
  const post = await getPostBySlug(blobFiles, slug);

  return new ImageResponse(
    (
      <div style={{ ... }}>
        <h1>{post.frontMatter.title}</h1>
        <p>{post.frontMatter.date}</p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

### 관측/운영 (Observability)

**모니터링**:
- Vercel Analytics: 페이지 뷰, Core Web Vitals
- ISR Cache Hit Rate: Vercel Edge Cache 통계
- 재검증 빈도: 콘솔 로그

**로깅**:
```typescript
// On-Demand 재검증 로그
console.log(`[Revalidate] path: ${path}, timestamp: ${new Date().toISOString()}`);
```

### 실패 모드/대응 (Failure Modes)

**ISR 재검증 실패**:
- 정적 캐시 계속 제공 (fallback)
- 다음 재검증 사이클에서 재시도

**OG 이미지 생성 실패**:
- 기본 OG 이미지 사용
- 에러 로그 기록

**Blob 파일 조회 실패**:
- 빈 배열 반환 (앱 계속 동작)
- 에러 로그 기록

---

## 데이터 구조 (Data Structure)

### 모델/스키마

**Post 스키마**:
```typescript
interface Post {
  slug: string;           // 포스트 슬러그
  frontMatter: {
    title: string;
    date: string;
    description: string;
    tags: string[];
    author?: string;
    draft?: boolean;
  };
  content: string;        // MDX 원본
  readingTime: string;    // "5 min read"
}
```

**BlobFileInfo 스키마**:
```typescript
interface BlobFileInfo {
  url: string;          // Blob URL
  pathname: string;     // 파일 경로 (고유 식별자)
  contentType?: string; // MIME 타입
}
```

### 데이터 흐름

1. **빌드 타임**:
   - `generateStaticParams()`로 Blob 파일 목록 조회
   - 모든 포스트 경로로 정적 HTML 생성
   - `generateMetadata()`로 메타데이터 생성

2. **런타임 (캐시 Miss)**:
   - Blob 파일 목록 조회 (CDC 캐시)
   - MDX 다운로드 및 파싱
   - 정적 HTML 생성 + 캐싱 (60초)

3. **On-Demand 재검증**:
   - Blog-Admin에서 재검증 API 호출
   - 해당 경로의 캐시 무효화
   - 다음 요청 시 최신 콘텐츠 생성

### 검증/제약 (Validation/Constraints)

**프론트 매터 필수 필드**:
- `title`: string
- `date`: ISO 8601 형식
- `description`: string
- `tags`: string[]

**초안 필터링**:
- `draft: true`인 포스트는 빌드에서 제외

---

## API 명세 (API Specifications)

### `POST /api/revalidate` - On-Demand ISR 재검증

**Auth**: `REVALIDATION_SECRET` 쿼리 파라미터

**Request**:
```bash
curl -X POST "https://your-blog.com/api/revalidate?secret=YOUR_SECRET&path=/blog/my-post"
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `secret` | string | ✅ | 재검증 시크릿 토큰 |
| `path` | string | ❌ | 재검증할 경로 |
| `all` | boolean | ❌ | `true`시 전체 재검증 |

**Response** (200):
```json
{
  "revalidated": true,
  "paths": ["/blog/my-post", "/", "/blog"],
  "timestamp": "2025-12-26T10:30:00.000Z"
}
```

**Errors**:
- 401: 시크릿 토큰 불일치
- 400: 파라미터 누락
- 500: 재검증 실패

### `GET /api/og/[...slug]` - OG 이미지 생성

**Response**: PNG 이미지 (1200x630px)

**Features**:
- 포스트 제목, 날짜 표시
- 그라데이션 배경
- 다크모드 미지원

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**1. 포스트 조회 (캐시 Hit)**:
```
User: /blog/nextjs-isr 포스트 방문
→ Next.js: 정적 HTML 제공 (60초 내 생성)
→ User: 초고속 로딩 경험 (< 100ms)
```

**2. 포스트 조회 (캐시 Miss)**:
```
User: /blog/new-post 방문 (처음 접근)
→ Next.js: SSR로 HTML 생성
→ Blob: MDX 파일 다운로드
→ Next.js: 정적 HTML 생성 + 60초 캐싱
→ User: 로딩 후 콘텐츠 표시 (200-500ms)
```

**3. 콘텐츠 업데이트 (On-Demand 재검증)**:
```
Author: Blog-Admin에서 포스트 수정
→ Blog-Admin: 재검증 API 호출
→ Next.js: ISR 캐시 무효화
→ User: 다음 요청 시 최신 콘텐츠 제공
```

### 실패/예외 시나리오

**1. 재검증 API 인증 실패**:
```
Author: 유효하지 않은 토큰으로 재검증 요청
→ API: 401 Unauthorized 반환
→ Blog-Admin: 에러 메시지 표시
→ User: 기존 캐시 계속 제공
```

**2. Blob 파일 조회 실패**:
```
User: 포스트 방문
→ Next.js: Blob 파일 목록 조회 실패
→ Blog: 빈 배열 반환 (fallback)
→ User: "포스트를 찾을 수 없습니다" 메시지
```

**3. OG 이미지 생성 실패**:
```
User: 소셜 미디어에 링크 공유
→ API: OG 이미지 생성 실패
→ Fallback: 기본 OG 이미지 사용
→ User: 기본 이미지 표시
```

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

**시크릿 토큰 관리**:
- `REVALIDATION_SECRET`은 환경변수로 관리
- OpenSSL로 강력한 토큰 생성: `openssl rand -base64 32`
- Blog-Admin에서만 호출 가능하도록 제어

**환경변수 분리**:
- 서버 전용: `REVALIDATION_SECRET` (클라이언트 노출 안됨)

### 성능

**ISR 재검증 간격**:
| 페이지 | 재검증 | 이유 |
|--------|--------|------|
| 포스트 | 60s | 자주 업데이트 |
| 홈 | 60s | 최신글 반영 |
| 태그/시리즈 | 300s | 업데이트 적음 |

**캐시 전략**:
- 정적 HTML: 60~300초
- OG 이미지: 캐시 없음 (항상 생성)
- RPC 통계: 5분

**Parallel Fetching**:
```typescript
const [htmlContent, relatedPosts, series] = await Promise.all([
  processMarkdown(content),
  getRelatedPosts(blobFiles, post, 4),
  getPostSeries(blobFiles, slugString),
]);
// 200~300ms 절약
```

### 배포

**Vercel 자동 배포**:
- Git push 시 자동으로 빌드 및 배포
- Preview 배포: PR마다 자동 생성

**빌드 명령**:
```bash
pnpm build
```

### 롤백

**ISR 캐시 롤백**:
- Vercel Deployments에서 이전 배포로 롤백
- 캐시는 자동으로 무효화됨

### 호환성/마이그레이션

**Next.js 버전**:
- 현재: Next.js 15.0.8
- ISR은 Next.js 12+에서 지원

**MDX 지원**:
- `@next/mdx`로 MDX 파일 import

---

## 향후 확장 가능성 (Future Expansion)

### 1. Edge Runtime 도입

**목표**: 전 세계 저지연 콘텐츠 전달

**구현 방안**:
- OG 이미지 생성을 Edge Runtime으로 이동
- 정적 페이지 Edge Functions 배포

**예상 효과**:
- 전 세계 평균 지연 시간 50% 감소
- Vercel Edge Network 활용

### 2. ISR 재검증 간격 동적 최적화

**목표**: 콘텐츠 업데이트 빈도에 따른 재검증 간격 조정

**구현 방안**:
- 최근 업데이트 빈도 분석
- 인기 포스트는 더 자주 재검증
- 비인기 포스트는 더 길게 재검증

**예상 효과**:
- 불필요한 재검증 감소
- 인프라 비용 절감

### 3. Stale-While-Revalidate 도입

**목표**: 캐시 만료 시 백그라운드 재검증

**구현 방안**:
- Next.js 15의 `fetch` with `revalidate` 옵션
- 사용자에게 항상 빠른 응답 제공

**예상 효과**:
- 사용자 경험 개선 (항상 캐시 Hit)
- 콘텐츠 신선도 유지

### 4. A/B 테스트 지원

**목표**: 포스트별 A/B 테스트

**구현 방안**:
- ISR 여러 버전 생성
- 사용자별로 다른 버전 제공

**예상 효과**:
- 헤드라인, 썸네일 테스트
- 참여도 최적화

### 5. CDN 캐시 전략 고도화

**목표**: Vercel Edge Cache 최적화

**구현 방안**:
- `stale-while-revalidate` 헤더 활용
- 지리적 위치 기반 캐싱

**예상 � 效果**:
- 원서버 요청 감소
- 전 세계 로딩 속도 개선

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD: 재검증 간격 최적화

**질문**:
- 현재 60초 재검증이 최적인가?
- 포스트별로 다른 재검증 간격을 사용할 것인가?

**오너**: 콘텐츠 팀
**기한**: 3개월 내

### TBD: ISR Cache Hit Rate

**질문**:
- 현재 ISR 캐시命中率은 얼마인가?
- 캐시 Miss가 발생하는 주요 원인은?

**오너**: DevOps 팀
**기한**: 1개월 내

### TBD: Edge Runtime 전환

**질문**:
- OG 이미지 생성을 Edge Runtime으로 전환할 것인가?
- 전체 ISR 페이지를 Edge로 이동할 것인가?

**오너**: 기술 팀
**기한**: 6개월 내

---

## 참고 문헌 (References)

- [Blog App Facts](../../../facts/apps/blog/index.md)
- [Pages & Routes](../../../facts/apps/blog/pages/index.md)
- [API Endpoints](../../../facts/apps/blog/apis/index.md)
- [Executive Summary](../../../insights/apps/blog/exec/summary.md)
- [ROI Analysis](../../../insights/apps/blog/impact/roi.md)
- [Next.js ISR Documentation](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration)
- [Vercel OG Image](https://nextjs.org/docs/app/api-reference/next-config-js/og)
