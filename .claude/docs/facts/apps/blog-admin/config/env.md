# 환경 변수 설정 (Environment Variables Configuration)

- **Scope**: blog-admin 애플리케이션의 환경 변수 설정 및 t3-env 구성
- **Source of Truth**: `src/env.ts`
- **Last Verified**: 2025-12-22
- **Repo Ref**: main

## 개요

blog-admin 애플리케이션은 `@t3-oss/env-nextjs` 라이브러리를 사용하여 타입-안전한 환경 변수 관리를 구현합니다. Zod 스키마를 통한 런타임 검증과 TypeScript 타입 체크를 지원합니다.

## 서버 전용 환경 변수

### 데이터베이스 설정

#### DATABASE_URL
- **Location**: `src/env.ts` (L10)
- **Purpose**: PostgreSQL 데이터베이스 연결 문자열
- **Key Details**:
  - 필수 항목 (required)
  - Prisma Client에서 사용
  - Vercel Pooled 연결 사용 권장
- **Dependencies**: Prisma, @auth/prisma-adapter
- **Evidence**: `src/env.ts`: `DATABASE_URL: z.string().url()`

#### DIRECT_URL
- **Location**: `src/env.ts` (L11)
- **Purpose**: PostgreSQL 직접 연결 문자열 (마이그레이션용)
- **Key Details**:
  - 선택 사항 (optional)
  - Prisma 마이그레이션 실행 시 필요
  - Pooled 연결이 아닌 직접 연결
- **Dependencies**: Prisma Migrate
- **Evidence**: `src/env.ts`: `DIRECT_URL: z.string().url().optional()`

### 인증 설정

#### AUTH_SECRET
- **Location**: `src/env.ts` (L14)
- **Purpose**: NextAuth.js 세션 암호화 키
- **Key Details**:
  - 필수 항목 (required)
  - 최소 1자 이상
  - `openssl rand -base64 32`로 생성 권장
- **Dependencies**: next-auth
- **Evidence**: `src/env.ts`: `AUTH_SECRET: z.string().min(1)`

#### AUTH_GOOGLE_ID
- **Location**: `src/env.ts` (L15)
- **Purpose**: Google OAuth 클라이언트 ID
- **Key Details**:
  - 필수 항목 (required)
  - Google Cloud Console에서 발급
- **Dependencies**: next-auth Google Provider
- **Evidence**: `src/env.ts`: `AUTH_GOOGLE_ID: z.string().min(1)`

#### AUTH_GOOGLE_SECRET
- **Location**: `src/env.ts` (L16)
- **Purpose**: Google OAuth 클라이언트 시크릿
- **Key Details**:
  - 필수 항목 (required)
  - Google Cloud Console에서 발급
- **Dependencies**: next-auth Google Provider
- **Evidence**: `src/env.ts`: `AUTH_GOOGLE_SECRET: z.string().min(1)`

### Blob Storage 설정

#### BLOB_READ_WRITE_TOKEN
- **Location**: `src/env.ts` (L19)
- **Purpose**: Vercel Blob Storage 읽기/쓰기 토큰
- **Key Details**:
  - 필수 항목 (required)
  - Vercel Blob Store 설정에서 발급
- **Dependencies**: @vercel/blob
- **Evidence**: `src/env.ts`: `BLOB_READ_WRITE_TOKEN: z.string().min(1)`

#### BLOB_STORE_ID
- **Location**: `src/env.ts` (L20)
- **Purpose**: Vercel Blob Store ID
- **Key Details**:
  - 선택 사항 (optional)
  - 특정 Blob Store 지정 시 사용
- **Dependencies**: @vercel/blob
- **Evidence**: `src/env.ts`: `BLOB_STORE_ID: z.string().optional()`

### API 키 설정

#### BACKOFFICE_API_KEY
- **Location**: `src/env.ts` (L23)
- **Purpose**: 백오피스 API 인증 키
- **Key Details**:
  - 필수 항목 (required)
  - 레거시 API용 인증
- **Dependencies**: API routes
- **Evidence**: `src/env.ts`: `BACKOFFICE_API_KEY: z.string().min(1)`

#### JWT_SECRET
- **Location**: `src/env.ts` (L24)
- **Purpose**: JWT 서명 키
- **Key Details**:
  - 필수 항목 (required)
  - `openssl rand -base64 32`로 생성 권장
- **Dependencies**: jose (JWT 라이브러리)
- **Evidence**: `src/env.ts`: `JWT_SECRET: z.string().min(1)`

#### RESEND_API_KEY
- **Location**: `src/env.ts` (L25)
- **Purpose**: Resend 이메일 발송 API 키
- **Key Details**:
  - 선택 사항 (optional)
  - 뉴스레터 발송 기능용
- **Dependencies**: resend
- **Evidence**: `src/env.ts`: `RESEND_API_KEY: z.string().min(1).optional()`

### 블로그 재검증 설정

#### BLOG_REVALIDATION_SECRET
- **Location**: `src/env.ts` (L28)
- **Purpose**: 블로그 ISR 재검증 시크릿 토큰
- **Key Details**:
  - 선택 사항 (optional)
  - blog 앱의 on-demand revalidation용
- **Dependencies**: ISR revalidation API
- **Evidence**: `src/env.ts`: `BLOG_REVALIDATION_SECRET: z.string().min(1).optional()`

### CDC 동기화 설정

#### BLOB_SYNC_INTERVAL_MINUTES
- **Location**: `src/env.ts` (L31)
- **Purpose**: Vercel Blob CDC 동기화 간격 (분)
- **Key Details**:
  - 선택 사항 (optional)
  - 기본값: 30분
  - 최소 1분 이상
- **Dependencies**: CDC sync scheduler
- **Evidence**: `src/env.ts`: `BLOB_SYNC_INTERVAL_MINUTES: z.coerce.number().min(1).optional().default(30)`

### 관리자 초기 설정 (선택 사항)

#### ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL
- **Location**: `src/env.ts` (L34-36)
- **Purpose**: 초기 관리자 계정 설정 (개발/초기 설치용)
- **Key Details**:
  - 모두 선택 사항 (optional)
  - ADMIN_EMAIL은 이메일 형식 검증
- **Dependencies**: Initial setup scripts
- **Evidence**: `src/env.ts`: `ADMIN_USERNAME/ADMIN_PASSWORD: z.string().optional(), ADMIN_EMAIL: z.string().email().optional()`

## 클라이언트 환경 변수

### NEXT_PUBLIC_BLOG_URL
- **Location**: `src/env.ts` (L46)
- **Purpose**: 공개 블로그 앱 URL
- **Key Details**:
  - 필수 항목 (required)
  - NEXT_PUBLIC_ 접두사 필수
  - CORS 헤더 설정에 사용
- **Dependencies**: API CORS, OG 이미지 생성
- **Evidence**: `src/env.ts`: `NEXT_PUBLIC_BLOG_URL: z.string().url()`

## 시스템 환경 변수

### NODE_ENV
- **Location**: `src/env.ts` (L38)
- **Purpose**: Node.js 실행 환경
- **Key Details**:
  - 기본값: "development"
  - 허용 값: "development", "test", "production"
- **Dependencies**: Next.js 빌드 및 런타임
- **Evidence**: `src/env.ts`: `NODE_ENV: z.enum(["development", "test", "production"]).default("development")`

## 보안 고려사항

### 서버 전용 변수 보장
- t3-env는 서버 전용 변수가 클라이언트에 노출되는 것을 방지
- `server` 객체에 선언된 변수는 절대 클라이언트 번들에 포함되지 않음

### 런타임 검증
- 애플리케이션 시작 시 모든 환경 변수 검증
- 누락되거나 잘못된 값이 있으면 즉시 오류 발생
- `SKIP_ENV_VALIDATION=true` 설정 시 빌드 시 검증 건너뛰기 가능 (Docker 빌드용)

### 타입 안전성
- 모든 환경 변수 접근 시 타입 체크 및 자동 완성 지원
- 오타로 인한 런타임 오류 방지

## 사용 패턴

### 잘못된 사용 (Unsafe)
```typescript
// ❌ 타입 없음, 오타 가능성, 런타임 오류
const dbUrl = process.env.DATABASE_URL || 'fallback'
```

### 올바른 사용 (Type-safe)
```typescript
// ✅ 타입 안전, 자동 완성, 런타임 검증
import { env } from '@/env'
const dbUrl = env.DATABASE_URL
```

## 빌드 환경 변수 (Turborepo)

### turbo.json 설정
- **Location**: `../../turbo.json` (L4-24)
- **Purpose**: 모노레포 빌드 시 필요한 환경 변수 선언
- **Key Details**:
  - `globalEnv`: 모든 빌드에 전달되는 변수
  - `tasks.build.env`: build 태스크에만 전달되는 변수
- **Dependencies**: Turborepo
- **Evidence**: `../../turbo.json`: 모든 blog-admin 환경 변수 선언

## 환경 변수 추가 방법

1. **Zod 스키마에 추가** (`src/env.ts`):
```typescript
server: {
  NEW_API_KEY: z.string().min(1),
}
```

2. **runtimeEnv에 매핑**:
```typescript
runtimeEnv: {
  NEW_API_KEY: process.env.NEW_API_KEY,
}
```

3. **turbo.json에 추가** (필요시):
```json
{
  "globalEnv": ["NEW_API_KEY"]
}
```

4. **.env.local에 설정**:
```
NEW_API_KEY=your-api-key-here
```

## 중요 참고사항

- Vercel 환경 변수 값은 절대 따옴표로 감싸지 않음
- 클라이언트 변수는 반드시 NEXT_PUBLIC_ 접두사 사용
- 모든 변수는 스키마와 runtimeEnv 양쪽에 선언해야 함
- 선택적 변수는 .optional() 사용, 필수 변수는 검증 실패 시 오류 발생