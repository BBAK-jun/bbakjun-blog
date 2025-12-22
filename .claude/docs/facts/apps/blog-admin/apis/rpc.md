# Hono RPC Routes

- **Scope**: Hono OpenAPI 기반의 타입 세이프 RPC 엔드포인트
- **Source of Truth**: apps/blog-admin/src/rpc/routes/ 디렉토리
- **Last Verified**: 2025-12-22
- **Repo Ref**: 2c541823391c87ad23934193eddd21e2335f0b09

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
