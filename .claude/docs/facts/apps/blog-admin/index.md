# Blog-Admin App Facts

- **Scope**: Blog-admin 애플리케이션의 전체 구조와 기술 문서
- **Source of Truth**: Feature-Sliced Design (FSD) 아키텍처 기반 파일 구조
- **Last Verified**: 2025-12-22
- **Repo Ref**: 2c54182

## 개요

Blog-Admin은 DEV_BBAK 블로그의 관리자 대시보드 애플리케이션으로, 블로그 포스트 관리, 파일 업로드, Vercel Blob CDC 동기화, 뉴스레터 구독자 관리 등의 기능을 제공합니다.

## 아키텍처

FSD (Feature-Sliced Design) 기반의 계층형 아키텍처 구조:

- **app/**: Next.js 앱 라우터 및 페이지
- **entities/**: 비즈니스 엔티티와 데이터 모델
- **features/**: 기능별 컴포넌트와 로직
- **processes/**: 비즈니스 프로세스
- **shared/**: 공용 컴포넌트와 유틸리티
- **widgets/**: UI 위젯 컴포넌트

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **데이터베이스**: PostgreSQL (Neon)
- **ORM**: Prisma
- **스토리지**: Vercel Blob
- **인증**: NextAuth.js v5 (Google OAuth)
- **API**: Hono RPC + Next.js App Router
- **스타일링**: Tailwind CSS v4
- **상태 관리**: React Server Actions
- **폼**: React Hook Form + Zod
- **테스트**: Vitest

## 문서 구조

### Pages
- [Routes](pages/routes.md) - 페이지 라우팅 구조
- [Layouts](pages/layouts.md) - 레이아웃 구성
- [Rendering](pages/rendering.md) - 렌더링 전략

### APIs
- [API Overview](apis/index.md) - API 아키텍처
- [HTTP Routes](apis/http.md) - HTTP API 라우트
- [RPC Routes](apis/rpc.md) - Hono RPC 라우트
- [Authentication](apis/auth.md) - 인증 시스템
- [Error Handling](apis/errors.md) - 에러 처리

### Schemas
- [Database](schemas/db.md) - 데이터베이스 스키마
- [Validation](schemas/validation.md) - 유효성 검사
- [Types](schemas/types.md) - 타입 정의

### Components
- [Component Architecture](components/index.md) - 컴포넌트 구조
- [UI Components](components/ui.md) - 공용 UI 컴포넌트
- [Patterns](components/patterns.md) - 컴포넌트 패턴

### Config
- [Environment](config/env.md) - 환경 변수
- [Next.js](config/next.md) - Next.js 설정
- [Deployment](config/deployment.md) - 배포 설정
- [Observability](config/observability.md) - 모니터링

### Utils
- [Utilities Overview](utils/index.md) - 유틸리티 함수
- [Data Transform](utils/data-transform.md) - 데이터 변환
- [Caching](utils/caching.md) - 캐싱 전략

### Dependencies
- [Key Libraries](dependencies/key-libs.md) - 핵심 라이브러리

## 빠른 참조

- **패키지 위치**: `apps/blog-admin`
- **포트**: 3001 (개발)
- **데이터베이스**: PostgreSQL (Neon)
- **스토리지**: Vercel Blob
- **인증**: NextAuth.js v5 (Google OAuth)
- **API**: Hono RPC + Next.js App Router
- **CDC 동기화**: Vercel Blob → PostgreSQL (30분 간격)
- **테스트**: `pnpm --filter=blog-admin test`
- **빌드**: `pnpm --filter=blog-admin build`
- **개발 서버**: `pnpm --filter=blog-admin dev`