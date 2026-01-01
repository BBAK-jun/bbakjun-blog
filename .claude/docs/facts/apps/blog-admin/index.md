# Blog-Admin App Facts

- **Scope**: Blog-admin 애플리케이션의 전체 구조와 기술 문서
- **Source of Truth**: Feature-Sliced Design (FSD) 아키텍처 기반 파일 구조
- **Last Verified**: 2025-12-31
- **Repo Ref**: c0049e1e70738fbbfaee84f1ebcf7964c7c7d62d

## 메타데이터

```yaml
metadata:
  version: "2.0.0"
  created_at: "2024-12-22T00:00:00Z"
  last_verified: "2025-12-31T00:57:47Z"
  git_commit: "c0049e1e70738fbbfaee84f1ebcf7964c7c7d62d"
  git_branch: "BBAK-jun/pattaya"

  changed_files:
    - path: apps/blog-admin/src/app/actions/files.ts
      changed_at: "2026-01-01T00:00:00Z"
      reason: "IMPROVED: Image upload with retry logic, unique filename, better error messages"
    - path: apps/blog-admin/src/rpc/routes/upload/upload.handlers.ts
      changed_at: "2026-01-01T00:00:00Z"
      reason: "IMPROVED: RPC uploadImage handler with retry logic and unique filename"
    - path: apps/blog-admin/src/shared/ui/image-uploader/image-uploader.tsx
      changed_at: "2026-01-01T00:00:00Z"
      reason: "EXISTING: Image uploader UI component (referenced for documentation)"
    - path: apps/blog-admin/src/rpc/routes/upload/upload.routes.ts
      changed_at: "2026-01-01T00:00:00Z"
      reason: "EXISTING: Upload API routes (referenced for documentation)"
    - path: apps/blog-admin/src/shared/api/upload.ts
      changed_at: "2026-01-01T00:00:00Z"
      reason: "EXISTING: Upload API schemas (referenced for documentation)"
    - path: apps/blog-admin/src/app/actions/experience.ts
      changed_at: "2025-12-31T00:00:00Z"
      reason: "NEW: Experience management server actions"
    - path: apps/blog-admin/src/app/actions/rag.ts
      changed_at: "2025-12-31T00:00:00Z"
      reason: "NEW: RAG integration server actions"
    - path: apps/blog-admin/src/app/dashboard/experience/page.tsx
      changed_at: "2025-12-31T00:00:00Z"
      reason: "NEW: Experience management UI"
    - path: apps/blog-admin/src/app/dashboard/rag/page.tsx
      changed_at: "2025-12-31T00:00:00Z"
      reason: "NEW: RAG query interface"
    - path: apps/blog-admin/src/lib/rag.rpc.ts
      changed_at: "2025-12-31T00:00:00Z"
      reason: "NEW: RAG Gateway Hono client"
    - path: apps/blog-admin/prisma/schema.prisma
      changed_at: "2025-12-31T00:00:00Z"
      reason: "ADDED: Experience and Achievement models"

  deleted_files:
    - path: apps/blog-admin/src/rpc/routes/blob-files/getBlobFiles.ts
      deleted_at: "2025-12-31T00:00:00Z"
      reason: "RPC route restructuring - moved to blob-files.routes.ts"
    - path: apps/blog-admin/src/rpc/routes/blob-files/getBlobFilesAdmin.ts
      deleted_at: "2025-12-31T00:00:00Z"
      reason: "RPC route restructuring - moved to blob-files.routes.ts"
    - path: apps/blog-admin/src/rpc/routes/blob-files/syncBlobFiles.ts
      deleted_at: "2025-12-31T00:00:00Z"
      reason: "RPC route restructuring - moved to blob-files.routes.ts"
    - path: apps/blog-admin/src/entities/file/api/blob-client.ts
      deleted_at: "2025-12-31T00:00:00Z"
      reason: "Removed direct Blob client, using CDC cache instead"
```

## 개요

Blog-Admin은 DEV_BBAK 블로그의 관리자 대시보드 애플리케이션으로, 블로그 포스트 관리, 파일 업로드, Vercel Blob CDC 동기화, 뉴스레터 구독자 관리, 경력 관리, RAG 쿼리 등의 기능을 제공합니다.

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

- [Routes](pages/routes.md) - 페이지 라우팅 구조 (UPDATED: New Experience, RAG pages)
- [Layouts](pages/layouts.md) - 레이아웃 구성
- [Rendering](pages/rendering.md) - 렌더링 전략

### APIs

- [API Overview](apis/index.md) - API 아키텍처
- [HTTP Routes](apis/http.md) - HTTP API 라우트
- [RPC Routes](apis/rpc.md) - Hono RPC 라우트
- [Authentication](apis/auth.md) - 인증 시스템
- [Error Handling](apis/errors.md) - 에러 처리

### Schemas

- [Database](schemas/db.md) - 데이터베이스 스키마 (UPDATED: New Experience, Achievement models)
- [Validation](schemas/validation.md) - 유효성 검사
- [Types](schemas/types.md) - 타입 정의

### Components

- [Component Architecture](components/index.md) - 컴포넌트 구조
- [UI Components](components/ui.md) - 공용 UI 컴포넌트
- [Patterns](components/patterns.md) - 컴포넌트 패턴

### Features (NEW)

- [Experience Management](features/experience-management.md) - 경력 타임라인 관리 (NEW)
- [RAG Integration](features/rag-integration.md) - RAG Gateway 연동 (NEW)

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
- **RAG Gateway**: 지능형 콘텐츠 검색 (NEW)
- **경력 관리**: Experience/Achievement 모델 (NEW)
- **테스트**: `pnpm --filter=blog-admin test`
- **빌드**: `pnpm --filter=blog-admin build`
- **개발 서버**: `pnpm --filter=blog-admin dev`

## 새로운 기능 (2026-01-01)

### Image Upload Reliability Improvements

- **위치**: Server Action `uploadImage()`, RPC Handler `uploadImage`
- **개선사항**:
  1. **고유한 파일명 보장**: `crypto.randomUUID()` 사용으로 동시 업로드 시 충돌 방지
  2. **업로드 재시도 로직**: Vercel Blob 업로드 실패 시 최대 3회 재시도 (지수 백오프: 1초, 2초, 4초)
  3. **구체적인 에러 메시지**: 네트워크 오류, 용량 한도, 인증 오류 등에 따른 한글 에러 메시지
  4. **파일명 sanitization 개선**: 확장자 보존, 특수문자 제거, 길이 제한(50자)
- **상세**: [Image Upload System](apis/image-upload.md)

## 이전 기능 (2025-12-31)

### Experience Management System

- **위치**: `/dashboard/experience`
- **기능**: 경력 타임라인 및 성과 CRUD
- **데이터 모델**: Experience, Achievement
- **상세**: [Experience Management](features/experience-management.md)

### RAG Integration

- **위치**: `/dashboard/rag`
- **기능**: 블로그 콘텐츠 지능형 검색 및 질문 답변
- **연동**: RAG Gateway (Hono RPC)
- **상세**: [RAG Integration](features/rag-integration.md)

### RPC Routes Restructuring

- **변경**: 단일 파일 → 모듈화된 구조
- **패턴**: `<route>/<route>.routes.ts`, `<route>/<route>.handlers.ts`
- **적용 대상**: blob-files, newsletter, upload, views, experience
