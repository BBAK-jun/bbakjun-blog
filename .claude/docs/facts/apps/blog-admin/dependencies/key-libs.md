# Blog-Admin 핵심 라이브러리 의존성

- **Scope**: blog-admin 앱의 모든 프로덕션 및 개발 의존성
- **Source of Truth**: package.json, 실제 코드 사용 패턴
- **Last Verified**: 2025-12-22
- **Repo Ref**: main (2c54182)

## 1. Core Framework (Next.js, React)

### Next.js
- **Location**: `package.json` (L53)
- **Purpose**: React 기반 풀스택 프레임워크
- **Key Details**:
  - 버전: 16.0.8 (최신)
  - App Router 사용 (페이지 확장자: js, jsx, ts, tsx)
  - ISR 및 서버 컴포넌트 지원
  - `reactStrictMode: true` 활성화
- **Dependencies**:
  - React 19.2.1, React DOM 19.2.1
- **Evidence**:
  - `next.config.ts`: Next.js 설정 파일 (CORS 헤더, 트랜스파일 패키지)
  - `src/app/`: App Router 기반 페이지 구조

### React
- **Location**: `package.json` (L58-59)
- **Purpose**: UI 라이브러리
- **Key Details**:
  - 버전: 19.2.1 (Next.js와 동기화)
  - 서버/클라이언트 컴포넌트 분리 사용
- **Evidence**:
  - `src/app/layout.tsx`: 루트 레이아웃 (서버 컴포넌트)
  - `src/shared/ui/`: 클라이언트 UI 컴포넌트들

## 2. Authentication (NextAuth.js)

### NextAuth.js
- **Location**: `package.json` (L54)
- **Purpose**: 인증/인가 솔루션
- **Key Details**:
  - 버전: 5.0.0-beta.30 (최신 v5)
  - Google OAuth 제공자 사용
  - Prisma 어댑터 연동
  - 역할 기반 접근 제어 (RBAC)
- **Dependencies**:
  - `@auth/prisma-adapter`: Prisma 연동
  - `jose`: JWT 처리
  - `bcryptjs`: 비밀번호 해싱 (레거시)
- **Evidence**:
  - `src/lib/auth.ts`: NextAuth 설정
  - `prisma/schema.prisma`: User, Account, Session 모델

### @auth/prisma-adapter
- **Location**: `package.json` (L25)
- **Purpose**: NextAuth.js ↔ Prisma 연결
- **Key Details**:
  - 버전: 2.11.1
  - 세션/사용자 데이터 PostgreSQL 저장
  - Auth.js v5 호환
- **Evidence**:
  - `src/lib/auth.ts`: adapter 설정
  - `prisma/schema.prisma`: Auth.js 필요 모델들

## 3. Database & ORM (Prisma)

### Prisma
- **Location**: `package.json` (L79, L32-33)
- **Purpose**: 데이터베이스 ORM 및 클라이언트
- **Key Details**:
  - 버전: 7.1.0 (최신)
  - PostgreSQL 데이터소스 (Neon 사용)
  - DB 마이그레이션 자동화
  - 타입 세이프 쿼리 빌더
- **Dependencies**:
  - `@prisma/adapter-pg`: PostgreSQL 직접 연결
  - `pg`: PostgreSQL 드라이버
- **Evidence**:
  - `prisma/schema.prisma`: 전체 스키마 정의
  - `src/lib/prisma.ts`: Prisma 클라이언트 설정
  - `postinstall` 스크립트: `prisma generate`

### @prisma/adapter-pg
- **Location**: `package.json` (L31)
- **Purpose**: Prisma PostgreSQL 어댑터
- **Key Details**:
  - 버전: 7.1.0 (Prisma와 동기화)
  - 직접 DB 연결 (DIRECT_URL 사용)
  - 커넥션 풀링 최적화
- **Evidence**:
  - `env.ts`: DATABASE_URL, DIRECT_URL 설정

## 4. UI & Styling (Tailwind, Radix)

### Tailwind CSS v4
- **Location**: `package.json` (L80)
- **Purpose**: 유틸리티 퍼스트 CSS 프레임워크
- **Key Details**:
  - 버전: 4 (최신)
  - PostCSS 플러그인으로 통합
  - 다크 모드 지원
- **Dependencies**:
  - `@tailwindcss/postcss`: PostCSS 통합
  - `@tailwindcss/typography`: 프로스 스타일
  - `@tailwindcss/line-clamp`: 텍스트 클램프
  - `tailwindcss-animate`: 애니메이션 유틸리티
- **Evidence**:
  - `tailwind.config.ts`: Tailwind 설정
  - `src/app/globals.css`: 글로벌 스타일

### Radix UI
- **Location**: `package.json` (L33-35)
- **Purpose**: 접근 가능한 UI 프리미티브
- **Key Details**:
  - 버전: 1.x (안정화)
  - 완전 커스터마이징 가능
  - Headless 컴포넌트 제공
- **Components Used**:
  - `@radix-ui/react-avatar`: 프로필 이미지
  - `@radix-ui/react-separator`: 구분선
  - `@radix-ui/react-slot`: 컴포지션 헬퍼
- **Evidence**:
  - `src/shared/ui/`: Radix 기반 UI 컴포넌트들

### class-variance-authority
- **Location**: `package.json` (L47)
- **Purpose**: 컴포넌트 변형 관리
- **Key Details**:
  - 버전: 0.7.1
  - CVA 패턴으로 스타일 변형 정의
  - shadcn/ui 패턴 사용
- **Evidence**:
  - `src/shared/ui/`: CVA 패턴 적용된 컴포넌트들

### clsx & tailwind-merge
- **Location**: `package.json` (L48, L63)
- **Purpose**: 조건부 클래스 결합
- **Key Details**:
  - clsx 2.1.1: 조건부 클래스
  - tailwind-merge 3.4.0: Tailwind 클래스 병합
- **Evidence**:
  - `src/lib/utils.ts`: cn() 헬퍼 함수

## 5. State Management (React Query)

### @tanstack/react-query
- **Location**: `package.json` (L43)
- **Purpose**: 서버 상태 관리
- **Key Details**:
  - 버전: 5.90.12 (v5)
  - 데이터 페칭, 캐싱, 동기화
  - 서버 컴포넌트와 통합
- **Evidence**:
  - `src/shared/lib/react-query/query-provider.tsx`: QueryClient 설정
  - `src/entities/file/api/queries.ts`: 파일 관련 쿼리들
  - `src/features/`: React Query 훅 사용

## 6. File Storage (Vercel Blob)

### @vercel/blob
- **Location**: `package.json` (L45)
- **Purpose**: 파일 저장소 서비스
- **Key Details**:
  - 버전: 0.23.4
  - 이미지/마크다운 파일 저장
  - CDN 자동 최적화
  - CDC 패턴으로 API 호출 감소
- **Evidence**:
  - `src/lib/blob-cdc.ts`: Change Data Capture 구현
  - `src/app/actions/files.ts`: 파일 CRUD 액션들

## 7. API & Validation (Hono, Zod)

### Hono
- **Location**: `package.json` (L78 - devDependency)
- **Purpose**: 경량 웹 프레임워크
- **Key Details**:
  - 버전: 4.11.1
  - 타입 세이프 RPC 구현
  - OpenAPI 자동 생성
  - 미들웨어 지원
- **Dependencies**:
  - `@hono/node-server`: Node.js 런타임
  - `@hono/zod-openapi`: Zod 통합 및 OpenAPI
- **Evidence**:
  - `src/rpc/`: Hono 기반 RPC 엔드포인트들
  - `tsup.config.ts`: RPC 빌드 설정

### Zod
- **Location**: `package.json` (L66)
- **Purpose**: 타입 세이프 밸리데이션
- **Key Details**:
  - 버전: 4.1.13
  - 런타임 타입 체크
  - API 스키마 정의
  - 환경변수 밸리데이션
- **Evidence**:
  - `src/contract/schemas/`: Zod 스키마들
  - `src/env.ts`: 환경변수 밸리데이션

## 8. Code Editing (CodeMirror)

### @uiw/react-codemirror
- **Location**: `package.json` (L44)
- **Purpose**: React CodeMirror 컴포넌트
- **Key Details**:
  - 버전: 4.25.4
  - MDX 편집기 구현
  - 문법 하이라이팅
- **Dependencies**:
  - `@codemirror/lang-markdown`: 마크다운 지원
  - `@codemirror/theme-one-dark`: 다크 테마
- **Evidence**:
  - `src/shared/ui/markdown-editor/`: MDX 편집기 컴포넌트
  - `src/app/dashboard/files/edit/page.tsx`: 파일 편집 페이지

## 9. Testing (Vitest)

### Vitest
- **Location**: `package.json` (L82, L75)
- **Purpose**: 단위/통합 테스트 프레임워크
- **Key Details**:
  - 버전: 4.0.16
  - Node 환경 테스팅
  - Vite 기반 빠른 실행
  - 실제 DB 연동 통합 테스트
- **Dependencies**:
  - `@vitest/ui`: 시각적 테스트 UI
- **Evidence**:
  - `vitest.config.ts`: 테스트 설정
  - `tests/`: 테스트 파일들 (blob-cdc.test.ts 등)

## 10. Build Tools (tsup, Turbo)

### tsup
- **Location**: `package.json` - devDependency (설치됨)
- **Purpose**: TypeScript 번들러
- **Key Details**:
  - RPC API 라이브러리 빌드
  - ESM 포맷으로 출력
  - 타입 정의 파일 자동 생성
- **Evidence**:
  - `tsup.config.ts`: RPC 빌드 설정
  - `package.json` exports: `./rpc` 경로

### Turbo
- **Location**: `turbo.json` (root)
- **Purpose**: 모노레포 빌드 시스템
- **Key Details**:
  - 캐싱으로 빌드 속도 최적화
  - 워크스페이스 의존성 관리
  - 전역 환경변수 공유
- **Evidence**:
  - `turbo.json`: 빌드 파이프라인 정의
  - `package.json`: `"workspace:*"` 의존성들

## 11. Workspace Dependencies (Monorepo)

### @repo/packages
- **Location**: `package.json` (L36-39)
- **Purpose**: 모노레포 공유 패키지들
- **Key Details**:
  - `@repo/analytics`: Redis 기반 뷰 트래킹
  - `@repo/content`: MDX 처리 파이프라인
  - `@repo/types`: 공용 TypeScript 타입들
  - `@repo/ui`: 공유 UI 컴포넌트들
- **Evidence**:
  - `src/`: 각 패키지 import 사용
  - `turbo.json`: 워크스페이스 빌드 순서

## 12. Form Handling

### react-hook-form
- **Location**: `package.json` (L60)
- **Purpose**: 폼 상태 관리
- **Key Details**:
  - 버전: 7.68.0
  - 성능 최적화된 리렌더링
  - Zod 스키마 통합
- **Dependencies**:
  - `@hookform/resolvers`: Zod 리졸버
- **Evidence**:
  - 파일 업로드/편집 폼들

## 13. Utility Libraries

### @t3-oss/env-nextjs
- **Location**: `package.json` (L40)
- **Purpose**: 타입 세이프 환경변수
- **Key Details**:
  - 버전: 0.13.10
  - 런타임 밸리데이션
  - 서버/클라이언트 분리
- **Evidence**:
  - `src/env.ts`: 환경변수 스키마 정의

### gray-matter
- **Location**: `package.json` (L50)
- **Purpose**: 프론트매터 파서
- **Key Details**:
  - 버전: 4.0.3
  - MDX YAML 메타데이터 파싱
- **Evidence**:
  - `src/lib/markdown.ts`: 마크다운 처리

### nuqs
- **Location**: `package.json` (L55)
- **Purpose**: URL 상태 관리
- **Key Details**:
  - 버전: 2.8.5
  - 타입 세이프 쿼리 파라미터
- **Evidence**:
  - 파일 필터링/검색 상태

### overlay-kit
- **Location**: `package.json` (L56)
- **Purpose**: 오버레이 상태 관리
- **Key Details**:
  - 버전: 1.8.6
  - 모달/드로워 상태 관리
- **Evidence**:
  - 파일 편집 모달

### sonner
- **Location**: `package.json` (L62)
- **Purpose**: 토스트 알림
- **Key Details**:
  - 버전: 2.0.7
  - 간단한 API로 알림 표시
- **Evidence**:
  - 액션 성공/실패 알림

### jose
- **Location**: `package.json` (L51)
- **Purpose**: JWT 처리 라이브러리
- **Key Details**:
  - 버전: 6.1.3
  - NextAuth.js 내부 JWT 처리
- **Evidence**:
  - 인증 미들웨어에서 사용

### bcryptjs
- **Location**: `package.json` (L46)
- **Purpose**: 비밀번호 해싱
- **Key Details**:
  - 버전: 3.0.3
  - 레거시 관리자 계정 생성용
- **Dependencies**:
  - `@types/bcryptjs`: TypeScript 타입
- **Evidence**:
  - 초기 관리자 설정 스크립트

### resend
- **Location**: `package.json` (L61)
- **Purpose**: 이메일 발송 서비스
- **Key Details**:
  - 버전: 6.6.0
  - 뉴스레터 구독/해지 이메일
- **Evidence**:
  - `src/actions/newsletter.ts`: 뉴스레터 액션

### uuid
- **Location**: `package.json` (L65)
- **Purpose**: 고유 ID 생성
- **Key Details**:
  - 버전: 13.0.0
  - 파일 업로드 ID 생성
- **Evidence**:
  - 파일 업로드 핸들러

### lucide-react
- **Location**: `package.json` (L52)
- **Purpose**: 아이콘 라이브러리
- **Key Details**:
  - 버전: 0.553.0
  - Tree-shakeable 아이콘들
- **Evidence**:
  - UI 컴포넌트들에서 아이콘 사용

### dotenv
- **Location**: `package.json` (L49)
- **Purpose**: 환경변수 로딩
- **Key Details**:
  - 버전: 17.2.3
  - .env 파일 로드
- **Evidence**:
  - 빌드/배포 스크립트

## 버전 제약 조건

### React 19 호환성
- Next.js 16.0.8 ↔ React 19.2.1 정식 호환
- `@types/react` 19.x 타입 호환

### Prisma 7 업그레이드
- `@prisma/client` 7.1.0 최신
- `@prisma/adapter-pg` 7.x 동기화
- `prisma` CLI 7.1.0 동기화

### NextAuth.js v5 Beta
- 5.0.0-beta.30 사용 (최신 v5)
- Auth.js v5 패턴 준수

### 빌드 시점
- `postinstall`: Prisma generate + RPC 빌드
- `build`: Prisma generate → Next.js 빌드 순서

## 상호 의존성

### 1. 인증 흐름
```
NextAuth.js → @auth/prisma-adapter → Prisma Client → PostgreSQL
      ↓
   jose (JWT)
```

### 2. 파일 관리 흐름
```
Vercel Blob → CDC Sync → PostgreSQL → Prisma → Hono RPC → Blog App
```

### 3. 상태 관리 흐름
```
Server State: React Query → Prisma/External APIs
Client State: React State + URL State (nuqs)
```

### 4. 빌드 흐름
```
TypeScript → tsup (RPC) + Next.js (App) → Turbo (Monorepo)
```

### 5. 폼 처리 흐름
```
react-hook-form → @hookform/resolvers → zod → API Validation
```

## 특수 설정

### 1. 환경변수 유효성 검사
- 모든 env 변수는 Zod 스키마로 검증
- `SKIP_ENV_VALIDATION`으로 빌드 시 건너뛰기 가능

### 2. CORS 설정
- Next.js 헤더 설정으로 blog-app 접근 허용
- `NEXT_PUBLIC_BLOG_URL` 환경변수 사용

### 3. 라이브러리 빌드
- RPC API 별도 빌드 (tsup)
- ESM 포맷 + 타입 정의
- 외부 의존성 번들 제외

### 4. 테스트 환경
- 실제 PostgreSQL DB 연동
- 환경변수 공유 (turbo.json)
- Node.js 환경에서만 실행