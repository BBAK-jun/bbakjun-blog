# Hono RPC Routes

- **Scope**: Hono OpenAPI 기반의 타입 세이프 RPC 엔드포인트
- **Source of Truth**: apps/blog-admin/src/rpc/routes/ 디렉토리
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

## 메타데이터

```yaml
metadata:
  version: "3.0.0"
  created_at: "2025-12-22T00:00:00Z"
  last_verified: "2026-01-04T00:00:00Z"
  git_commit: "628174858956a2b1ff3d7c33e4ae03c790ed3208"

  changed_files:
    - path: apps/blog-admin/src/rpc/routes/upload-history/upload-history.routes.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Hono RPC endpoints for upload history (paginated, filtered)"
      source_exists: true
    - path: apps/blog-admin/src/rpc/routes/upload-history/upload-history.handlers.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Query handlers for upload history with action type filtering"
      source_exists: true

  deleted_files: []
```

## Blob Files RPC

### GET /api/rpc/getBlobFiles

- **Location**: `apps/blog-admin/src/rpc/routes/blob-files/getBlobFiles.ts` (L9-62)
- **Purpose**: CDC 캐시에서 Blob 파일 목록 조회 (공개 접근)
- **Key Details**:
  - Query: limit (기본값 1000), offset (기본값 0), search (검색어)
  - 응답: files[], total, hasMore
  - OpenAPI 스펙 자동 생성
- **Dependencies**:
  - getCachedBlobFiles: CDC 캐시 조회 함수
  - Zod 스키마: 요청/응답 검증
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/blob-files/getBlobFiles.ts>`: createRoute로 OpenAPI 스펙 정의

### GET /api/rpc/getBlobFilesAdmin

- **Location**: `apps/blog-admin/src/rpc/routes/blob-files/getBlobFilesAdmin.ts`
- **Purpose**: 관리자용 Blob 파일 목록 조회 (자동 동기화 포함)
- **Key Details**:
  - 인증 필요 (requireSession 미들웨어)
  - Query: autoSync (기본값 true)로 주기적 동기화
  - 상세 메타데이터 포함
- **Dependencies**:
  - requireSession: 세션 미들웨어
  - syncBlobFiles: 자동 동기화 함수
- **Evidence**:
  - `<apps/blog-admin/src/rpc/index.ts>`: getBlobFilesAdminRoute에 requireSession 적용

### POST /api/rpc/syncBlobFiles

- **Location**: `apps/blog-admin/src/rpc/routes/blob-files/syncBlobFiles.ts`
- **Purpose**: Vercel Blob과 CDC 캐시 수동 동기화
- **Key Details**:
  - 관리자 전용 (requireAdminSession 미들웨어)
  - Vercel Blob API 호출하여 최신 목록 가져오기
  - 추가/업데이트/삭제된 파일 처리
- **Dependencies**:
  - requireAdminSession: 관리자 권한 확인
  - Vercel Blob: 파일 목록 API
  - Prisma: DB 캐시 업데이트
- **Evidence**:
  - `<apps/blog-admin/src/rpc/index.ts>`: syncBlobFilesRoute에 requireAdminSession 적용

## Upload RPC

### POST /api/rpc/uploadMarkdown

- **Location**: `apps/blog-admin/src/rpc/routes/upload/uploadMarkdown.ts`
- **Purpose**: MDX 마크다운 파일 업로드
- **Key Details**:
  - multipart/form-data 처리
  - 파일명 자동 정리 (특수문자 제거)
  - Vercel Blob에 파일 저장
- **Dependencies**:
  - @vercel/blob: 파일 저장소
  - Hono multipart: 파일 업로드 처리
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/upload/index.ts>`: legacyMarkdownUploadRoutes로 POST 처리

### POST /api/rpc/uploadImage

- **Location**: `apps/blog-admin/src/rpc/routes/upload/uploadImage.ts`
- **Purpose**: 이미지 파일 업로드
- **Key Details**:
  - 이미지 포맷 검증 (jpg, png, webp, gif)
  - 썸네일 자동 생성
  - 최적화된 이미지 저장
- **Dependencies**:
  - Sharp: 이미지 처리 및 최적화
  - @vercel/blob: 이미지 저장
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/upload/index.ts>`: legacyImageUploadRoutes로 POST 처리

## Newsletter RPC

### POST /api/rpc/subscribeNewsletter

- **Location**: `apps/blog-admin/src/rpc/routes/newsletter/subscribeNewsletter.ts`
- **Purpose**: 뉴스레터 구독 신청
- **Key Details**:
  - 이메일 유효성 검증
  - 중복 구독 방지
  - Resend로 환영 이메일 발송
- **Dependencies**:
  - Resend: 이메일 발송 서비스
  - Prisma: 구독자 DB 관리
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/newsletter/index.ts>`: subscribeNewsletterRoute 정의

### POST /api/rpc/unsubscribeNewsletter

- **Location**: `apps/blog-admin/src/rpc/routes/newsletter/unsubscribeNewsletter.ts`
- **Purpose**: 뉴스레터 구독 취소
- **Key Details**:
  - 이메일로 구독자 찾기
  - 소프트 삭제 처리
  - 확인 이메일 발송 옵션
- **Dependencies**:
  - Prisma: 구독자 상태 업데이트
  - Resend: 확인 이메일 발송
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/newsletter/index.ts>`: unsubscribeNewsletterRoute 정의

### GET /api/rpc/getNewsletterSubscribers

- **Location**: `apps/blog-admin/src/rpc/routes/newsletter/getNewsletterSubscribers.ts`
- **Purpose**: 구독자 목록 조회 (관리자 전용)
- **Key Details**:
  - 관리자 인증 필요 (requireAdminSession)
  - 페이지네이션 지원
  - 구독 상태 필터링
- **Dependencies**:
  - requireAdminSession: 관리자 권한
  - Prisma: 구독자 데이터 조회
- **Evidence**:
  - `<apps/blog-admin/src/rpc/index.ts>`: getNewsletterSubscribersRoute에 requireAdminSession 적용

## Views RPC

### GET /api/rpc/getViewsBySlug/:slug

- **Location**: `apps/blog-admin/src/rpc/routes/views/getViewsBySlug.ts`
- **Purpose**: 특정 포스트의 조회수 조회
- **Key Details**:
  - 동적 경로 파라미터: slug
  - Redis에서 조회수 가져오기
  - 60초 캐시 적용
- **Dependencies**:
  - Redis: 조회수 저장소
  - Hono 경로 파라미터: slug 추출
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/views/index.ts>`: :slug 동적 경로 정의

## Upload History RPC (NEW)

### GET /api/rpc/upload-history

- **Location**: `apps/blog-admin/src/rpc/routes/upload-history/upload-history.routes.ts` (L36-L51)
- **Purpose**: 업로드 이력 조회 (관리자 전용)
- **source_exists**: true
- **git_hash**: "6281748"
- **Key Details**:
  - **Query Parameters**:
    - `limit`: 1~100 (기본값: 50)
    - `offset`: 0~ (기본값: 0)
    - `search`: pathname 검색어 (선택사항, case-insensitive)
    - `actionType`: CREATE|UPDATE|DELETE (선택사항)
  - **Response Schema**:
    ```typescript
    {
      history: Array<{
        id: string;
        actionType: 'CREATE' | 'UPDATE' | 'DELETE';
        pathname: string;
        fileUrl: string | null;
        fileSize: number | null;
        contentType: string | null;
        uploadedBy: string | null;
        createdAt: string;  // ISO 8601
      }>;
      total: number;
      hasMore: boolean;
    }
    ```
  - **OpenAPI Documentation**:
    - Tag: `UploadHistory`
    - Summary: "Get upload history (admin only)"
    - Description: "Retrieve upload history with pagination and filters"
    - Responses: 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Server Error)
- **Authentication**: RequireSession middleware
- **Features**:
  - 페이지네이션 (limit + offset)
  - pathname 검색 (LIKE 쿼리)
  - 작업 유형 필터링 (정확히 일치)
  - 최신 순 정렬 (createdAt DESC)
- **Dependencies**:
  - uploadHistoryQuerySchema: Zod 스키마 검증
  - uploadHistoryResponseSchema: 응답 스키마
  - getUploadHistoryHandler: 쿼리 핸들러
- **Evidence**:
  - `src/rpc/routes/upload-history/upload-history.routes.ts`: L36-L51
  - `src/rpc/routes/upload-history/upload-history.handlers.ts`: 쿼리 로직
  - `src/app/actions/upload-history.ts`: Server Actions

### Upload History Query Schema

- **Location**: `apps/blog-admin/src/rpc/routes/upload-history/upload-history.routes.ts` (L12-L17)
- **Purpose**: 요청 쿼리 파라미터 검증
- **source_exists**: true
- **Schema**:
  ```typescript
  export const uploadHistoryQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    search: z.string().min(1).optional(),
    actionType: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
  });
  ```
- **Evidence**:
  - `src/rpc/routes/upload-history/upload-history.routes.ts`: L12-L17

### Upload History Response Schema

- **Location**: `apps/blog-admin/src/rpc/routes/upload-history/upload-history.routes.ts` (L19-L34)
- **Purpose**: 응답 데이터 스키마 정의
- **source_exists**: true
- **Schema**:
  ```typescript
  export const uploadHistoryItemSchema = z.object({
    id: z.string(),
    actionType: z.enum(['CREATE', 'UPDATE', 'DELETE']),
    pathname: z.string(),
    fileUrl: z.string().nullable(),
    fileSize: z.number().nullable(),
    contentType: z.string().nullable(),
    uploadedBy: z.string().nullable(),
    createdAt: z.string(),
  });

  export const uploadHistoryResponseSchema = z.object({
    history: z.array(uploadHistoryItemSchema),
    total: z.number(),
    hasMore: z.boolean(),
  });
  ```
- **Evidence**:
  - `src/rpc/routes/upload-history/upload-history.routes.ts`: L19-L34

### Upload History Handlers

- **Location**: `apps/blog-admin/src/rpc/routes/upload-history/upload-history.handlers.ts`
- **Purpose**: 업로드 이력 쿼리 핸들러
- **source_exists**: true
- **Key Functions**:
  1. **필터링 로직**:
     - `search`: pathname LIKE 쿼리 (case-insensitive)
     - `actionType`: 정확히 일치
  2. **페이지네이션**:
     - `limit` + `offset` 기반
     - `hasMore` 계산 (total > offset + limit)
  3. **정렬**:
     - `createdAt DESC` (최신 순)
- **Evidence**:
  - `src/rpc/routes/upload-history/upload-history.handlers.ts`: 전체 파일

### POST /api/rpc/incrementViewsBySlug/:slug

- **Location**: `apps/blog-admin/src/rpc/routes/views/incrementViewsBySlug.ts`
- **Purpose**: 포스트 조회수 증가
- **Key Details**:
  - 세션 기반 중복 방지 (24시간)
  - 봇 필터링
  - 원자적 증가 연산
- **Dependencies**:
  - Redis: 해시 기반 조회수 관리
  - 봇 필터: User-Agent 검증
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/views/index.ts>`: POST :slug 라우트 정의

### GET /api/rpc/getViewsStats

- **Location**: `apps/blog-admin/src/rpc/routes/views/getViewsStats.ts`
- **Purpose**: 전체 조회수 통계 조회
- **Key Details**:
  - 총 조회수
  - 인기 포스트 Top 10
  - 실시간 통계
- **Dependencies**:
  - Redis: 통계 데이터 집계
  - Z-SET: 인기 포스트 순위
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/views/index.ts>`: /stats 라우트 정의

## RPC 타입 시스템

### Zod 스키마

- **Location**: `apps/blog-admin/src/shared/api/`
- **Purpose**: 모든 RPC 요청/응답의 타입 정의
- **Key Details**:
  - 자동 타입 추론
  - 런타임 검증
  - OpenAPI 스펙 생성
- **Dependencies**:
  - zod: 스키마 정의
  - @hono/zod-openapi: API 문서화
- **Evidence**:
  - `<apps/blog-admin/src/shared/api/contracts.ts>`: 공통 스키마 및 에러 형식

### RPC 환경 타입

- **Location**: `apps/blog-admin/src/rpc/env.ts`
- **Purpose**: Hono 앱의 타입 환경 정의
- **Key Details**:
  - Variables: 세션 정보, Prisma 클라이언트
  - Bindings: Cloudflare Workers 변수
- **Dependencies**:
  - Hono 타입 시스템
  - Prisma Client 타입
- **Evidence**:
  - `<apps/blog-admin/src/rpc/env.ts>`: RpcEnv 인터페이스 정의

## 레거시 호환성

### v1 API 라우팅

- **Location**: `apps/blog-admin/src/rpc/index.ts` (L82-87)
- **Purpose**: 기존 클라이언트 지원을 위한 레거시 경로 유지
- **Key Details**:
  - /api/v1/public/\*: 공개 엔드포인트
  - /api/v1/admin/\*: 관리자 엔드포인트
  - 동일한 핸들러 재사용
- **Dependencies**:
  - Hono 라우팅: 중첩 라우트 지원
- **Evidence**:
  - `<apps/blog-admin/src/rpc/index.ts>`: app.route로 레거시 라우트 연결
