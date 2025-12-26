# Blog App Facts

- **Scope**: Blog 앱 전체 아키텍처 및 기능
- **Last Verified**: 2025-12-26
- **Repo Ref**: main

---

## 개요

**Blog App**은 DEV_BBAK 블로그의 공개 사용자 facing 앱으로, Next.js 15, TypeScript, MDX 기반의 현대적인 정적/동적 하이브리드 블로그 플랫폼입니다.

---

## 핵심 기능

### 1. 포스트 관리

- **MDX 기반 콘텐츠**: Vercel Blob Storage에서 호스팅
- **CDC 캐시**: Blog-Admin의 PostgreSQL 캐시로 Blob API 호출 최소화
- **ISR**: 60초 간격 자동 재검증 (포스트, 홈)
- **카테고리 & 태그**: DEV, REACT, JS, STUDY, TIL, career
- **시리즈**: 연관 포스트 그룹화

### 2. 사용자 경험

- **검색**: 제목, 설명, 태그, 내용 기반 (서버 사이드 필터링)
- **태그 필터링**: 태그별 포스트 목록
- **시리즈 네비게이션**: 이전/다음 포스트 이동
- **목차 (TOC)**: 헤딩 기반 자동 생성 + 스크롤 추적
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

### 3. 인터랙티브 기능

- **조회수 카운터**: Redis 기반, 세션 기반 중복 방지
- **댓글**: Giscus (GitHub Discussions)
- **뉴스레터**: Resend API 기반 구독 시스템
- **소셜 공유**: 클립보드 복사, 토스트 메시지

### 4. 콘텐츠 강화

- **Mermaid 차트**: 다이어그램 렌더링 (CDN 동적 로드)
- **코드 하이라이팅**: syntax highlighting
- **이미지 최적화**: Next.js Image, WebP/AVIF, lazy loading
- **OG 이미지**: 동적 생성 (1200x630px)

---

## 기술 스택

### 프레임워크 & 런타임

| 기술 | 버전 | 용도 |
|------|------|------|
| **Next.js** | 15.0.8 | React 프레임워크 (App Router) |
| **React** | 19.2.1 | UI 라이브러리 |
| **TypeScript** | 5.x | 타입 안전성 |
| **Node.js** | 18+ | 런타임 |

### 스타일링 & UI

| 기술 | 버전 | 용도 |
|------|------|------|
| **Tailwind CSS** | 4.x | 유틸리티 우선 CSS |
| **Radix UI** | latest | 접근 가능한 컴포넌트 프리미티브 |
| **next-themes** | 0.4.6 | 다크모드 |
| **@tailwindcss/typography** | 0.5.19 | Prose 스타일링 |

### 데이터 & 상태 관리

| 기술 | 버전 | 용도 |
|------|------|------|
| **TanStack Query** | 5.90.12 | 서버 상태 관리 |
| **nuqs** | 2.8.5 | URL 쿼리 파라미터 |
| **Hono RPC** | latest | 타입 안전한 API 통신 |
| **Redis** | (Vercel KV) | 조회수 캐싱 |

### 콘텐츠 처리

| 기술 | 버전 | 용도 |
|------|------|------|
| **@next/mdx** | 16.0.7 | MDX 지원 |
| **remark/rehype** | latest | Markdown 처리 |
| **gray-matter** | latest | 프론트 매터 파싱 |
| **reading-time** | latest | 읽기 시간 계산 |

### 인프라 & 배포

| 기술 | 용도 |
|------|------|
| **Vercel** | 호스팅, 배포 |
| **Vercel Blob Storage** | MDX 파일 저장 |
| **Vercel KV** | Redis 호스팅 (조회수) |

---

## 아키텍처

### Feature-Sliced Design (FSD)

```
src/
├── app/                    # App Router (페이지, 레이아웃)
├── entities/              # 비즈니스 엔티티
│   ├── post/              # 포스트 관련 (PostCard, RelatedPosts)
│   └── view/              # 조회수 관련
├── features/              # 사용자 기능
│   ├── navigation/        # 네비게이션 (Header, Footer)
│   ├── post-search/       # 검색
│   ├── newsletter/        # 뉴스레터
│   └── theme-toggle/      # 다크모드
├── processes/             # 비즈니스 프로세스
│   └── post-reading/      # 포스트 읽기 (TOC, Mermaid, Comments)
├── widgets/               # 컴포지션 UI
│   ├── popular-posts/     # 인기글 위젯
│   └── recent-posts/      # 최신글 위젯
└── shared/                # 공유 코드
    ├── lib/               # 유틸리티 (blob, rpc, stats)
    ├── hooks/             # React 훅 (useViews)
    ├── providers/         # 컨텍스트 프로바이더
    └── ui/                # 기본 UI 컴포넌트
```

---

## 데이터 흐름

### 1. 포스트 로딩

```
User Request
    ↓
getBlobFiles() (React.cache)
    ↓ Hono RPC
Blog-Admin API (/rpc/blob-files)
    ↓ PostgreSQL (CDC 캐시)
BlobFile 테이블
    ↓
getAllPosts(blobFiles)
    ↓ 병렬 다운로드
Vercel Blob Storage (MDX files)
    ↓ gray-matter
프론트 매터 파싱
    ↓ reading-time
읽기 시간 계산
    ↓
Post 객체 반환
```

### 2. 조회수 추적

```
User visits post
    ↓ ViewCounter 컴포넌트
useViews(slug, increment=true)
    ↓ useQuery (조회수 조회)
RPC: GET /rpc/views/[slug]
    ↓ Blog-Admin
Redis (views:{slug})
    ↓ 조회수 반환
    ↓ useMutation (조회수 증가)
RPC: POST /rpc/views/[slug]/increment
    ↓ Blog-Admin
세션 확인 → Redis HSETNX
    ↓
조회수 +1 (중복 방지)
```

### 3. 검색

```
User types query
    ↓ nuqs (URL state)
?q=nextjs
    ↓ 서버 컴포넌트
searchParamsCache.parse()
    ↓ filterPosts()
제목, 설명, 태그, 내용 필터링
    ↓ BlogPostsList
필터링된 포스트 목록 렌더링
```

---

## 페이지 라우팅

| 경로 | 타입 | ISR | 주요 기능 |
|------|------|-----|----------|
| `/` | Static | 60s | 홈, 최신글/인기글 탭 |
| `/blog` | Server | - | 포스트 목록, 검색 |
| `/blog/[...slug]` | Static + ISR | 60s | 개별 포스트 |
| `/tags` | Server | - | 태그 목록 |
| `/tags/[tag]` | Static + ISR | 300s | 태그별 포스트 |
| `/series` | Static + ISR | 300s | 시리즈 목록 |
| `/series/[slug]` | Static + ISR | 300s | 시리즈 상세 |
| `/about` | Static + ISR | 300s | 소개, 통계, 경력 |
| `/feed.xml` | Static | 3600s | RSS 피드 |
| `/api/og/[...slug]` | Edge | - | OG 이미지 생성 |
| `/api/revalidate` | API | - | On-demand ISR |

---

## API 통신

### Hono RPC (Blog-Admin ↔ Blog)

| 엔드포인트 | 메서드 | 용도 | 캐시 |
|------------|--------|------|------|
| `/rpc/blob-files` | GET | Blob 파일 목록 | React.cache |
| `/rpc/views/[slug]` | GET | 조회수 조회 | 1분 |
| `/rpc/views/[slug]/increment` | POST | 조회수 증가 | - |
| `/rpc/views/stats` | GET | 통계 조회 | 5분 |
| `/rpc/experience` | GET | 경력 조회 | 5분 |

### App Router API Routes

| 경로 | 메서드 | 용도 |
|------|--------|------|
| `/api/og/[...slug]` | GET | OG 이미지 생성 |
| `/api/revalidate` | POST | ISR 재검증 트리거 |
| `/feed.xml` | GET | RSS 피드 |

---

## 환경변수

### 서버 사이드 (필수 ❌ 선택사항)

| 변수 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `REDIS_URL` | string (URL) | ❌ | Redis 연결 URL |
| `REVALIDATION_SECRET` | string | ❌ | ISR 재검증 토큰 |

### 클라이언트 사이드

| 변수 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `NEXT_PUBLIC_ADMIN_URL` | string (URL) | ✅ | Blog-Admin URL (RPC) |
| `NEXT_PUBLIC_SITE_URL` | string (URL) | ❌ | 사이트 기본 URL (OG) |
| `NEXT_PUBLIC_GISCUS_REPO` | string | ❌ | Giscus 리포지토리 |
| `NEXT_PUBLIC_GISCUS_REPO_ID` | string | ❌ | Giscus 리포지토리 ID |
| `NEXT_PUBLIC_GISCUS_CATEGORY` | string | ❌ | Giscus 카테고리 |
| `NEXT_PUBLIC_GISCUS_CATEGORY_ID` | string | ❌ | Giscus 카테고리 ID |

---

## 성능 최적화

### 1. ISR (Incremental Static Regeneration)

- **포스트**: 60초마다 자동 재검증
- **태그/시리즈**: 300초마다 자동 재검증
- **On-demand**: Blog-Admin에서 수동 재검증 가능

### 2. 이미지 최적화

- **형식**: WebP, AVIF (자동 변환)
- **Lazy loading**: `loading="lazy"`
- **반응형**: deviceSizes (640px ~ 3840px)

### 3. 캐싱 전략

| 캐시 타입 | 대상 | 기간 | 목적 |
|----------|------|------|------|
| **ISR** | 포스트, 홈 | 60s | 자동 업데이트 |
| **TanStack Query** | 조회수 | 1분 | 클라이언트 캐시 |
| **React.cache** | Blob 파일 | 영구 | 렌더링 컨텍스트 |
| **RPC** | 통계 | 5분 | 서버 캐시 |
| **RSS** | 피드 | 1시간 | HTTP 캐시 |

### 4. 병렬 데이터 페칭

```typescript
const [htmlContent, relatedPosts, series] = await Promise.all([
  processMarkdown(content),
  getRelatedPosts(blobFiles, post, 4),
  getPostSeries(blobFiles, slugString),
]);
```

**효과**: 200~300ms 절약

---

## 보안

### 1. 시크릿 토큰

- `REVALIDATION_SECRET`: OpenSSL로 생성
  ```bash
  openssl rand -base64 32
  ```

### 2. 환경변수 분리

- **서버 전용**: `REDIS_URL`, `REVALIDATION_SECRET` (클라이언트 노출 안됨)
- **클라이언트**: `NEXT_PUBLIC_*` 프리픽스 (공개됨)

### 3. RPC 보안

- **공개 엔드포인트**: 조회수, 통계 (인증 불필요)
- **내부 통신**: Blog-Admin과 사설 네트워크 권장

### 4. 봇 필터링

- Blog-Admin에서 User-Agent로 크롤러 제외
- 조회수 증가 API에서 봇 차단

---

## 모니터링

### 1. Vercel Analytics

- Root Layout에서 자동 로드
- 페이지 뷰, 성능 메트릭 수집

### 2. 콘솔 로그

```typescript
// src/shared/lib/stats.ts
console.log('[getPopularPostsStats] RPC 통계 조회 시작');
console.log(`[getPopularPostsStats] RPC 통계 조회 완료: ${count}개 포스트`);
```

### 3. 에러 로그

```typescript
// src/shared/lib/blob.ts
console.error('Failed to fetch blob files:', response.status);
console.error('Error fetching blob files:', error);
```

---

## 문서

### 상세 문서

- **[Pages & Routes](./pages/index.md)**: 페이지 구조, 라우팅, ISR 설정
- **[API Endpoints](./apis/index.md)**: API 엔드포인트, RPC 클라이언트
- **[Schemas & Types](./schemas/index.md)**: 데이터 스키마, 타입 정의
- **[Components](./components/index.md)**: UI 컴포넌트, FSD 아키텍처
- **[Configuration](./config/index.md)**: 환경변수, 설정 파일
- **[Utils & Libraries](./utils/index.md)**: 유틸리티 함수, 헬퍼 라이브러리

---

## 개발

### 시작하기

```bash
# 의존성 설치
pnpm install

# 개발 서버 시작
pnpm dev

# 빌드
pnpm build

# 타입 검증
pnpm type-check
```

### 포스트 추가

1. `content/posts/{category}/{slug}/index.mdx` 생성
2. 프론트 매터 작성 (title, date, description, tags, author)
3. 빌드 시 자동으로 경로 생성

---

## 배포

### Vercel

1. **환경변수 설정**:
   - `NEXT_PUBLIC_ADMIN_URL` (필수)
   - `REDIS_URL` (선택)
   - `REVALIDATION_SECRET` (선택)

2. **자동 배포**:
   - Git push 시 자동으로 빌드 및 배포
   - Preview 배포: PR마다 자동 생성

3. **빌드 명령**:
   ```bash
   pnpm build
   ```

---

## 의존성

### Workspace 패키지

- `@repo/content`: MDX 처리, 포스트 관련 함수
- `@repo/analytics`: Redis 기반 조회수 추적
- `@repo/types`: 공유 타입 정의
- `@repo/ui`: 공유 UI 컴포넌트
- `@apps/blog-admin`: RPC 타입 (Blog-Admin 앱)

### 외부 의존성

- **Next.js**: 프레임워크
- **React**: UI 라이브러리
- **Tailwind CSS**: 스타일링
- **TanStack Query**: 상태 관리
- **Hono**: RPC 클라이언트
- **Zod**: 스키마 검증
- **Radix UI**: UI 프리미티브

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
