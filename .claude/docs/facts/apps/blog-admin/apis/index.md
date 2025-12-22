# API 개요

- **Scope**: blog-admin 애플리케이션의 전체 API 아키텍처
- **Source of Truth**: RPC routes, NextAuth.js, API routes
- **Last Verified**: 2025-12-22
- **Repo Ref**: 2c541823391c87ad23934193eddd21e2335f0b09

## 아키텍처 개요

### 하이브리드 API 설계

- **Location**: `apps/blog-admin/src/rpc/index.ts` (L1-99)
- **Purpose**: Hono RPC와 Next.js App Router API를 통합한 하이브리드 아키텍처 제공
- **Key Details**:
  - Hono OpenAPI 기반의 타입 세이프 RPC 엔드포인트
  - NextAuth.js를 위한 Next.js App Router API routes
  - 레거시 호환성을 위한 v1 엔드포인트 유지
- **Dependencies**:
  - @hono/zod-openapi: OpenAPI 스펙 자동 생성
  - next-auth: 인증 세션 관리
  - Zod: 요청/응답 스키마 검증
- **Evidence**:
  - `<apps/blog-admin/src/rpc/index.ts>`: OpenAPIHono 기반 RPC 앱 구현, 레거시 라우트 포함

### API 레이어 구조

#### 1. RPC Layer (Hono)

- **Location**: `apps/blog-admin/src/rpc/`
- **Purpose**: 타입 세이프한 API 엔드포인트 제공
- **Key Details**:
  - 함수 기반 네이밍 컨벤션 (`/api/rpc/getBlobFiles`)
  - 자동 타입 추론 및 검증
  - 미들웨어 기반 인증 처리
- **Dependencies**:
  - Hono: 웹 프레임워크
  - Zod: 스키마 정의 및 검증
  - OpenAPI: API 문서 자동화
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/index.ts>`: 모든 RPC 라우트 및 핸들러 내보내기

#### 2. HTTP Layer (Next.js App Router)

- **Location**: `apps/blog-admin/src/app/api/`
- **Purpose**: NextAuth.js 및 표준 HTTP API 제공
- **Key Details**:
  - NextAuth.js 인증 라우트 (`/api/auth/[...nextauth]`)
  - 레거시 API 호환성 유지
  - 표준 HTTP 상태 코드 처리
- **Dependencies**:
  - next-auth: 인증 시스템
  - Next.js App Router: 라우팅
- **Evidence**:
  - `<apps/blog-admin/src/app/api/auth/[...nextauth]/route.ts>`: NextAuth 핸들러 연동

### 인증 전략

#### 세션 기반 인증

- **Location**: `apps/blog-admin/src/rpc/middleware/session.ts` (L1-27)
- **Purpose**: RPC 엔드포인트에 대한 세션 기반 접근 제어
- **Key Details**:
  - `requireSession`: 일반 사용자 인증 필요
  - `requireAdminSession`: ADMIN/SUPER_ADMIN 역할 필요
  - 데이터베이스 세션 전략 (7일 유효기간)
- **Dependencies**:
  - NextAuth.js: 세션 관리
  - Prisma Adapter: 데이터베이스 세션 저장
- **Evidence**:
  - `<apps/blog-admin/src/auth.ts>`: PrismaAdapter와 데이터베이스 세션 설정

#### API 키 인증

- **Location**: `apps/blog-admin/src/shared/lib/auth/auth.ts` (L30-38)
- **Purpose**: 레거시 API 및 서비스 간 통신을 위한 API 키 인증
- **Key Details**:
  - Bearer 토큰 방식
  - 환경변수 `BACKOFFICE_API_KEY` 사용
  - 동기/비동기 검증 함수 제공
- **Dependencies**:
  - 환경변수: API 키 저장
  - Next.js Headers: 요청 헤더 추출
- **Evidence**:
  - `<apps/blog-admin/src/shared/lib/auth/auth.ts>`: verifyApiKey/verifyApiKeySync 함수 구현

### 타입 시스템

#### Zod 스키마

- **Location**: `apps/blog-admin/src/shared/api/`
- **Purpose**: API 요청/응답의 타입 안정성 보장
- **Key Details**:
  - 자동 타입 생성
  - 런타임 검증
  - OpenAPI 스펙 연동
- **Dependencies**:
  - zod: 스키마 정의
  - @hono/zod-openapi: OpenAPI 변환
- **Evidence**:
  - `<apps/blog-admin/src/shared/api/contracts.ts>`: 공통 에러 스키마 정의

### 버전 관리 및 호환성

#### 레거시 v1 API

- **Location**: `apps/blog-admin/src/rpc/index.ts` (L82-87)
- **Purpose**: 기존 클라이언트와의 호환성 유지
- **Key Details**:
  - `/api/v1/public/*`: 공개 엔드포인트
  - `/api/v1/admin/*`: 관리자 전용 엔드포인트
  - 점진적 마이그레이션 지원
- **Dependencies**:
  - Hono 라우팅: 중첩 라우트 지원
- **Evidence**:
  - `<apps/blog-admin/src/rpc/index.ts>`: legacy\*Routes 가져와 app.route로 연결

### 글로벌 에러 핸들링

- **Location**: `apps/blog-admin/src/rpc/index.ts` (L89-94)
- **Purpose**: RPC 앱 전체의 에러 일관성 보장
- **Key Details**:
  - 404: "Not Found" 표준 응답
  - 500: "Internal Server Error" 로깅 포함 -统一된 에러 형식
- **Dependencies**:
  - Hono 에러 핸들러: 글로벌 에러 캐치
- **Evidence**:
  - `<apps/blog-admin/src/rpc/index.ts>`: app.notFound 및 app.onError 핸들러
