# Authentication System

- **Scope**: blog-admin 애플리케이션의 인증 및 권한 부여 시스템
- **Source of Truth**: NextAuth.js 설정, RPC 미들웨어, API 키 인증
- **Last Verified**: 2025-12-22
- **Repo Ref**: 2c541823391c87ad23934193eddd21e2335f0b09

## NextAuth.js 설정

### 전역 인증 설정

- **Location**: `apps/blog-admin/auth.config.ts` (L1-15)
- **Purpose**: NextAuth.js 프로바이더 및 페이지 설정
- **Key Details**:
  - Google OAuth 제공자 사용
  - 커스텀 로그인 페이지: /login
  - 환경변수로 클라이언트 ID/시크릿 관리
- **Dependencies**:
  - next-auth: 인증 프레임워크
  - Google Provider: OAuth 2.0 인증
- **Evidence**:
  - `<apps/blog-admin/auth.config.ts>`: Google 프로바이더 설정 및 signIn 페이지 커스터마이징

### 데이터베이스 세션 전략

- **Location**: `apps/blog-admin/auth.ts` (L7-45)
- **Purpose**: 영속적 세션 저장 및 관리
- **Key Details**:
  - PrismaAdapter로 데이터베이스 세션 저장
  - 7일 세션 유효기간
  - 세션에 사용자 ID와 역할 포함
- **Dependencies**:
  - @auth/prisma-adapter: Prisma 세션 어댑터
  - Prisma Client: 데이터베이스 연결
- **Evidence**:
  - `<apps/blog-admin/auth.ts>`: session.strategy을 'database'로 설정, maxAge: 7일

### 자동 관리자 지정

- **Location**: `apps/blog-admin/auth.ts` (L23-37)
- **Purpose**: 첫 사용자를 자동으로 SUPER_ADMIN으로 지정
- **Key Details**:
  - createUser 이벤트 핸들러 사용
  - 사용자 수가 1일 경우 역할을 SUPER_ADMIN으로 변경
  - 그 외 사용자는 GUEST 역할 부여
- **Dependencies**:
  - Prisma: 사용자 수 조회 및 역할 업데이트
  - NextAuth events: 생명주기 훅
- **Evidence**:
  - `<apps/blog-admin/auth.ts>`: events.createUser에서 userCount === 1 체크 후 SUPER_ADMIN 지정

## RPC 미들웨어 인증

### 세션 미들웨어

- **Location**: `apps/blog-admin/src/rpc/middleware/session.ts` (L1-27)
- **Purpose**: RPC 엔드포인트에 대한 세션 기반 인증
- **Key Details**:
  - requireSession: 로그인 사용자만 접근
  - requireAdminSession: ADMIN/SUPER_ADMIN 역할 필요
  - 세션 정보를 Hono 컨텍스트에 설정
- **Dependencies**:
  - NextAuth auth(): 세션 조회
  - Hono MiddlewareHandler: 미들웨어 타입
- **Evidence**:
  - `<apps/blog-admin/src/rpc/middleware/session.ts>`: requireAdminSession에서 role 체크

### 역할 기반 접근 제어 (RBAC)

- **Location**: `apps/blog-admin/src/rpc/middleware/session.ts` (L15-26)
- **Purpose**: 사용자 역할에 따른 접근 권한 제어
- **Key Details**:
  - SUPER_ADMIN: 모든 관리 기능 접근
  - ADMIN: 일부 관리 기능 접근
  - GUEST: 기본 기능만 접근
- **Dependencies**:
  - UserRole enum: Prisma에서 정의된 역할 타입
  - NextAuth 세션: user.role 정보
- **Evidence**:
  - `<apps/blog-admin/src/rpc/middleware/session.ts>`: session.user?.role 확인

## API 키 인증

### Bearer 토큰 검증

- **Location**: `apps/blog-admin/src/shared/lib/auth/auth.ts` (L12-38)
- **Purpose**: 서비스 간 통신을 위한 API 키 인증
- **Key Details**:
  - Authorization: Bearer <token> 형식
  - BACKOFFICE_API_KEY 환경변수와 비교
  - 동기/비동기 검증 함수 제공
- **Dependencies**:
  - Next.js headers: 요청 헤더 접근
  - 환경변수: API 키 안전 저장
- **Evidence**:
  - `<apps/blog-admin/src/shared/lib/auth/auth.ts>`: authHeader.replace("Bearer ", "")로 토큰 추출

### API 키 검증 흐름

```typescript
// 1. 요청 헤더에서 토큰 추출
const authHeader = headersList.get("authorization");
const token = authHeader.replace("Bearer ", "");

// 2. 환경변수와 비교
const API_KEY = env.BACKOFFICE_API_KEY;
return token === API_KEY;
```

## OAuth 2.0 흐름

### Google OAuth 통합

- **Location**: `apps/blog-admin/auth.config.ts` (L5-9)
- **Purpose**: Google 계정으로 소셜 로그인
- **Key Details**:
  - Authorization Code Flow 사용
  - 이메일 및 기본 프로필 정보 요청
  - 자동 사용자 생성
- **Dependencies**:
  - Google OAuth 2.0 API
  - NextAuth.js Google Provider
- **Evidence**:
  - `<apps/blog-admin/auth.config.ts>`: Google({ clientId, clientSecret }) 설정

### 인증 콜백 처리

- **Location**: `apps/blog-admin/auth.ts` (L14-22)
- **Purpose**: 세션에 추가 정보 저장
- **Key Details**:
  - 세션에 사용자 ID 포함
  - 데이터베이스 역할 정보 세션에 추가
  - 타입 안전한 세션 확장
- **Dependencies**:
  - Prisma User 모델: role 정보
  - NextAuth session 콜백
- **Evidence**:
  - `<apps/blog-admin/auth.ts>`: session.user.id와 session.user.role 설정

## 세션 관리

### 세션 저장소

- **Location**: 데이터베이스 (Prisma)
- **Purpose**: 영속적이고 안전한 세션 저장
- **Key Details**:
  - Session, Account, User, VerificationToken 테이블
  - 자동 세션 정리 (만료된 세션)
  - 다중 인스턴스 지원
- **Dependencies**:
  - Prisma Adapter: 세션 데이터 모델
  - PostgreSQL: 세션 데이터 저장
- **Evidence**:
  - `<apps/blog-admin/prisma/schema.prisma>`: Session, Account, User 모델 정의

### 세션 라이프사이클

1. **로그인**: Google OAuth → 사용자 생성/조회 → 세션 생성
2. **API 요청**: 세션 쿠키 → 데이터베이스 조회 → 유효성 검증
3. **권한 확인**: 세션.role → RBAC 미들웨어 → 접근 허용/거부
4. **로그아웃**: 세션 삭제 → 쿠키 만료

## 보안 구성

### 환경변수

- **AUTH_SECRET**: JWT 토큰 서명 (openssl rand -base64 32)
- **AUTH_GOOGLE_ID**: Google OAuth 클라이언트 ID
- **AUTH_GOOGLE_SECRET**: Google OAuth 클라이언트 시크릿
- **BACKOFFICE_API_KEY**: API 키 인증용

### 보안 모범 사례

- **HTTPS 필수**: 모든 인증 통신은 HTTPS를 통해
- **Secure 쿠키**: 프로덕션에서 secure 플래그 설정
- **CSRF 보호**: NextAuth.js 기본 CSRF 보호
- **세션 타임아웃**: 7일 후 자동 만료
- **최소 권한**: GUEST > ADMIN > SUPER_ADMIN 단계적 권한

## 인증 엔드포인트

### NextAuth.js 경로

- **GET /api/auth/signin**: 로그인 페이지 리다이렉트
- **POST /api/auth/signin**: Google OAuth 시작
- **GET /api/auth/callback/google**: OAuth 콜백 처리
- **GET /api/auth/signout**: 로그아웃 처리
- **GET /api/auth/session**: 현재 세션 정보 조회
- **GET /api/auth/providers**: 사용 가능한 제공자 목록

### 커스텀 페이지

- **/login**: 커스텀 로그인 페이지
- **/dashboard**: 인증 필요한 대시보드
- **미들웨어 보호**: 관리자 라우트 자동 보호