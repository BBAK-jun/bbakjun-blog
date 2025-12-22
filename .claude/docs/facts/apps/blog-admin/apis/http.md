# HTTP API Routes

- **Scope**: Next.js App Router 기반의 HTTP API 엔드포인트
- **Source of Truth**: apps/blog-admin/src/app/api/ 디렉토리
- **Last Verified**: 2025-12-22
- **Repo Ref**: 2c541823391c87ad23934193eddd21e2335f0b09

## /api/auth/[...nextauth]

### NextAuth.js 핸들러

- **Location**: `apps/blog-admin/src/app/api/auth/[...nextauth]/route.ts` (L1-4)
- **Purpose**: NextAuth.js 인증 시스템의 모든 HTTP 요청 처리
- **Key Details**:
  - GET/POST 메서드 모두 지원
  - 동적 라우팅으로 모든 auth 하위 경로 처리
  - 세션 관리, OAuth 콜백, 로그인/로그아웃 처리
- **Dependencies**:
  - NextAuth.js: 인증 프레임워크
  - Prisma Adapter: 데이터베이스 세션 저장
  - Google OAuth: 소셜 로그인 제공자
- **Evidence**:
  - `<apps/blog-admin/src/app/api/auth/[...nextauth]/route.ts>`: NextAuth 핸들러의 GET, POST 내보내기

### 인증 설정

- **Location**: `apps/blog-admin/auth.ts` (L1-45)
- **Purpose**: NextAuth.js 전역 설정 및 콜백 정의
- **Key Details**:
  - 데이터베이스 세션 전략 (7일 유효기간)
  - 첫 사용자 자동 SUPER_ADMIN 지정
  - 세션에 사용자 ID와 역할 포함
- **Dependencies**:
  - @auth/prisma-adapter: Prisma 세션 어댑터
  - auth.config.ts: 제공자 및 설정 정의
- **Evidence**:
  - `<apps/blog-admin/auth.ts>`: PrismaAdapter 사용, createUser 이벤트로 첫 사용자 승격

## /api/[...routes]

### 캐치 올 라우트 핸들러

- **Location**: `apps/blog-admin/src/app/api/[...routes]/route.ts`
- **Purpose**: 정의되지 않은 모든 API 경로에 대한 폴백 처리
- **Key Details**:
  - 동적 세그먼트로 모든 경로 캡처
  - 레거시 API 엔드포인트 호환성 유지
  - RPC 라우트로의 프록시 기능
- **Dependencies**:
  - Next.js App Router: 동적 라우팅
  - Hono: RPC 라우트 처리
- **Evidence**:
  - `<apps/blog-admin/src/app/api/[...routes]/route.ts>`: 캐치 올 라우트 구현

## 레거시 API 라우트

### v1 공개 엔드포인트

- **Location**: `apps/blog-admin/src/rpc/index.ts` (L83)
- **Purpose**: 블로그 앱과의 호환성을 위한 공개 API
- **Key Details**:
  - `/api/v1/public/blob-files`: Blob 파일 목록 조회
  - 인증 불필요
  - CDC 캐시 데이터 반환
- **Dependencies**:
  - Hono 라우팅: 레거시 라우트 처리
  - Blob CDC: 캐시된 파일 목록
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/blob-files/index.ts>`: legacyPublicBlobFilesRoutes 정의

### v1 관리자 엔드포인트

- **Location**: `apps/blog-admin/src/rpc/index.ts` (L84-87)
- **Purpose**: 관리자 기능을 위한 인증 필요 API
- **Key Details**:
  - `/api/v1/admin/blob-files`: Blob 파일 관리 (GET/POST)
  - `/api/v1/admin/upload`: 마크다운 파일 업로드
  - `/api/v1/admin/upload-image`: 이미지 파일 업로드
  - `/api/v1/newsletter`: 뉴스레터 구독 관리
- **Dependencies**:
  - 세션 미들웨어: 인증 확인
  - Vercel Blob: 파일 저장소
  - Resend: 이메일 발송
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/index.ts>`: 각 기능별 레거시 라우트 내보내기

## API 키 인증 엔드포인트

### Bearer 토큰 검증

- **Location**: `apps/blog-admin/src/shared/lib/auth/auth.ts` (L12-38)
- **Purpose**: API 키 기반의 서비스 간 인증
- **Key Details**:
  - Authorization 헤더에서 Bearer 토큰 추출
  - 환경변수 BACKOFFICE_API_KEY와 비교
  - 동기/비동기 검증 함수 제공
- **Dependencies**:
  - Next.js headers: 요청 헤더 접근
  - 환경변수: API 키 저장
- **Evidence**:
  - `<apps/blog-admin/src/shared/lib/auth/auth.ts>`: verifyApiKey 함수에서 헤더 검증

## HTTP 상태 코드 표준

### 성공 응답

- **200 OK**: 요청 성공적으로 처리
- **201 Created**: 리소스 성공적으로 생성
- **204 No Content**: 요청 성공 but 반환할 내용 없음

### 클라이언트 에러

- **400 Bad Request**: 잘못된 요청 파라미터
- **401 Unauthorized**: 인증 실패
- **403 Forbidden**: 권한 부족
- **404 Not Found**: 리소스 없음
- **422 Unprocessable Entity**: 검증 실패

### 서버 에러

- **500 Internal Server Error**: 내부 서버 오류
- **502 Bad Gateway**: 외부 서비스 연결 실패
- **503 Service Unavailable**: 서비스 일시 중단

## CORS 설정

- **Location**: `apps/blog-admin/src/rpc/middleware/cors.ts`
- **Purpose**: 교차 출처 리소스 공유 정책 설정
- **Key Details**:
  - 블로그 앱 도메인 허용
  - 필요한 HTTP 메서드 및 헤더 설정
  - 자격 증명 포함 옵션
- **Dependencies**:
  - Hono CORS 미들웨어
  - 환경변수: 허용 도메인 목록
- **Evidence**:
  - `<apps/blog-admin/src/rpc/middleware/cors.ts>`: cors 미들웨어 설정
