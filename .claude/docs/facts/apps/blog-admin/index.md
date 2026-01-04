# Blog-Admin App Facts

- **Scope**: Blog-admin 애플리케이션의 전체 구조와 기술 문서
- **Source of Truth**: Feature-Sliced Design (FSD) 아키텍처 기반 파일 구조
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

## 메타데이터

```yaml
metadata:
  version: "4.0.0"
  created_at: "2024-12-22T00:00:00Z"
  last_verified: "2026-01-04T00:00:00Z"
  git_commit: "628174858956a2b1ff3d7c33e4ae03c790ed3208"
  git_branch: "BBAK-jun/vaduz"

  changed_files:
    # Scroll Sync Feature (TDD 완료, 2026-01-04)
    - path: apps/blog-admin/src/shared/hooks/use-scroll-sync.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Scroll synchronization hook for split-view editor/preview"
      source_exists: true
    - path: apps/blog-admin/src/widgets/file-creator/ui/file-creator-widget.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "ENHANCED: Integrated scroll sync in split view mode"
      source_exists: true
    - path: apps/blog-admin/tests/scroll-sync.component.test.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Comprehensive scroll sync component tests (588 lines)"
      source_exists: true
    - path: apps/blog-admin/tests/use-scroll-sync.component.test.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Hook-level unit tests for scroll sync"
      source_exists: true
    - path: apps/blog-admin/tests/file-creator-scroll.component.test.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Integration tests for FileCreator scroll sync"
      source_exists: true

    # Upload History Tracking (2026-01-04)
    - path: apps/blog-admin/prisma/migrations/20250102141000_add_upload_history/migration.sql
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: UploadHistory model migration (CREATE, UPDATE, DELETE tracking)"
      source_exists: true
    - path: apps/blog-admin/src/app/dashboard/history/page.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Upload history listing page with filters"
      source_exists: true
    - path: apps/blog-admin/src/app/dashboard/history/history-widget.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Client-side history widget with pagination and search"
      source_exists: true
    - path: apps/blog-admin/src/rpc/routes/upload-history/upload-history.routes.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Hono RPC endpoints for upload history (paginated, filtered)"
      source_exists: true
    - path: apps/blog-admin/src/rpc/routes/upload-history/upload-history.handlers.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Query handlers for upload history with action type filtering"
      source_exists: true
    - path: apps/blog-admin/src/app/actions/upload-history.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Server actions for upload history CRUD operations"
      source_exists: true
    - path: apps/blog-admin/src/shared/api/upload-history.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Type-safe API client for upload history"
      source_exists: true

    # Settings Management System (2026-01-04)
    - path: apps/blog-admin/prisma/migrations/20260102130251_add_settings_model/migration.sql
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Setting model for system-wide configuration"
      source_exists: true
    - path: apps/blog-admin/src/app/dashboard/settings/page.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Settings page with tabbed interface (system, users, API keys)"
      source_exists: true
    - path: apps/blog-admin/src/app/dashboard/settings/components/system-settings.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: System settings management (blog, system, content configs)"
      source_exists: true
    - path: apps/blog-admin/src/app/dashboard/settings/components/user-management.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: User role management (SUPER_ADMIN, ADMIN, GUEST)"
      source_exists: true
    - path: apps/blog-admin/src/app/dashboard/settings/components/api-keys.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: API keys display and management"
      source_exists: true
    - path: apps/blog-admin/src/app/actions/settings.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Server actions for settings CRUD, user management, seeding"
      source_exists: true

    # RAG Gateway Tests (2026-01-04)
    - path: apps/rag-gateway/src/tests/handlers/rag.test.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: RAG query handler integration tests"
      source_exists: true
    - path: apps/rag-gateway/src/tests/ingestion/pipeline.test.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Document ingestion pipeline tests"
      source_exists: true
    - path: apps/rag-gateway/src/tests/integration/batch-ingest.test.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Batch document ingestion integration tests"
      source_exists: true

    # Test Infrastructure (2026-01-04)
    - path: apps/blog-admin/vitest.component.config.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Component testing configuration for Vitest"
      source_exists: true
    - path: apps/blog-admin/__mocks__/next-themes.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Mock for next-themes in component tests"
      source_exists: true

  deleted_files: []
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

- [Scroll Sync Feature](features/scroll-sync.md) - 스크롤 동기화 (TDD 완료) (NEW)
- [Upload History Tracking](features/upload-history.md) - 업로드 이력 추적 (NEW)
- [Settings Management](features/settings.md) - 시스템 설정 관리 (NEW)
- [Experience Management](features/experience-management.md) - 경력 타임라인 관리
- [RAG Integration](features/rag-integration.md) - RAG Gateway 연동

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

## 새로운 기능 (2026-01-04)

### Scroll Sync Feature (TDD 완료)

- **위치**: `src/shared/hooks/use-scroll-sync.ts`, FileCreator Widget
- **기능**: 에디터와 프리뷰 화면의 스크롤 위치 동기화 (분할 모드)
- **특징**:
  1. **백분율 기반 동기화**: 컨텐츠 길이가 다른 경우에도 정확히 동기화
  2. **양방향 동기화**: 에디터 ↔ 프리뷰 양방향 스크롤 연동
  3. **무한 루프 방지**: `isSyncingRef` 플래그로 순환 참조 방지
  4. **성능 최적화**: 이벤트 리스너 자동 정리, 디바운싱
  5. **활성화 제어**: `enabled` 옵션으로 분할 모드에서만 동작
- **테스트 커버리지**:
  - 단위 테스트: `use-scroll-sync.component.test.ts`
  - 통합 테스트: `scroll-sync.component.test.tsx` (588 lines)
  - 위젯 테스트: `file-creator-scroll.component.test.tsx`
- **상세**: [Scroll Sync Feature](features/scroll-sync.md)

### Upload History Tracking

- **위치**: `/dashboard/history`, UploadHistory 모델
- **기능**: 파일 업로드/수정/삭제 이력 추적 및 조회
- **특징**:
  1. **작업 유형 추적**: CREATE, UPDATE, DELETE 기록
  2. **파일 정보 스냅샷**: URL, 크기, contentType 저장 (삭제 시 null)
  3. **작업자 추적**: 사용자 email 기록
  4. **페이지네이션**: 50개/페이지 기본 설정
  5. **검색 및 필터**: 경로 검색, 작업 유형 필터링
- **API**: Hono RPC 엔드포인트 (`/rpc/upload-history`)
- **상세**: [Upload History](features/upload-history.md)

### Settings Management System

- **위치**: `/dashboard/settings`, Setting 모델
- **기능**: 시스템 전체 설정 관리 (블로그, 시스템, 콘텐츠)
- **특징**:
  1. **카테고리별 설정**: blog, system, content 분류
  2. **타입 지원**: string, number, boolean, json
  3. **사용자 관리**: 역할 기반 권한 (SUPER_ADMIN, ADMIN, GUEST)
  4. **API 키 관리**: 인증 정보 확인 및 관리
  5. **초기 데이터 시딩**: `DEFAULT_SETTINGS` 상수로 기본값 제공
- **Server Actions**: `getSettingsByCategory`, `upsertSetting`, `updateSettings`, `updateUserRole`, `seedDefaultSettings`
- **상세**: [Settings Management](features/settings.md)

### Image Upload Enhancements (2026-01-02)

- **위치**: `ImageUploader` 컴포넌트, Upload 페이지, Edit 페이지
- **개선사항**:
  1. **다중 파일 업로드**: `multiple` prop으로 최대 20개 파일 동시 업로드
  2. **드래그 앤 드롭**: 파일을 에디터로 드래그하여 업로드
  3. **붙여넣기 지원**: 클립보드의 이미지를 Ctrl+V로 바로 업로드
  4. **커서 위치 삽입**: 업로드한 이미지를 CodeMirror 에디터의 현재 커서 위치에 마크다운 형식으로 자동 삽입
  5. **클라이언트 측 직접 업로드**: Vercel Blob Client SDK 사용으로 서버 부하 감소
  6. **성공/실패 카운트**: 다중 파일 업로드 시 개별 결과 표시
- **상세**: [Image Upload System](apis/image-upload.md)

### RAG Gateway Integration (2025-12-31)

- **위치**: `/dashboard/rag`, RAG Gateway 앱
- **기능**: 블로그 콘텐츠 지능형 검색 및 질문 답변
- **연동**: RAG Gateway (Hono RPC)
- **테스트**: 핸들러, 파이프라인, 배치 인제스트 통합 테스트
- **상세**: [RAG Integration](features/rag-integration.md)

## 이전 기능 (2026-01-01)

### Image Upload Reliability Improvements

- **위치**: Server Action `uploadImage()`, RPC Handler `uploadImage`
- **개선사항**:
  1. **고유한 파일명 보장**: `crypto.randomUUID()` 사용으로 동시 업로드 시 충돌 방지
  2. **업로드 재시도 로직**: Vercel Blob 업로드 실패 시 최대 3회 재시도 (지수 백오프: 1초, 2초, 4초)
  3. **구체적인 에러 메시지**: 네트워크 오류, 용량 한도, 인증 오류 등에 따른 한글 에러 메시지
  4. **파일명 sanitization 개선**: 확장자 보존, 특수문자 제거, 길이 제한(50자)

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
