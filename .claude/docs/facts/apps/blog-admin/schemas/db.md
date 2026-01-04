# Database Schema (Prisma Models)

- **Scope**: Prisma 데이터베이스 모델 및 관계 정의
- **Source of Truth**: `prisma/schema.prisma`
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

## 메타데이터

```yaml
metadata:
  version: "3.0.0"
  created_at: "2024-12-22T00:00:00Z"
  last_verified: "2026-01-04T00:00:00Z"
  git_commit: "628174858956a2b1ff3d7c33e4ae03c790ed3208"

  changed_files:
    - path: apps/blog-admin/prisma/schema.prisma
      changed_at: "2026-01-04T00:00:00Z"
      reason: "ADDED: UploadHistory, Setting models for tracking and configuration"
      source_exists: true
    - path: apps/blog-admin/prisma/migrations/20250102141000_add_upload_history/migration.sql
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: UploadHistory model migration (CREATE, UPDATE, DELETE tracking)"
      source_exists: true
    - path: apps/blog-admin/prisma/migrations/20260102130251_add_settings_model/migration.sql
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Setting model for system-wide configuration"
      source_exists: true

  deleted_files: []
```

## User 모델

- **Location**: `prisma/schema.prisma` (L25-L47)
- **Purpose**: Auth.js v5 인증 시스템의 사용자 정보 저장
- **source_exists**: true
- **Key Details**:
  - `id`: CUID 기반 고유 식별자
  - `email`: 고유 이메일 주소 (로그인용)
  - `role`: 사용자 권한 레벨 (SUPER_ADMIN, ADMIN, GUEST)
  - `username`: 레거시 호환성을 위한 고유 사용자명 (선택사항)
  - Auth.js 요구 필드: name, emailVerified, image
- **Relationships**:
  - `accounts`: OAuth 계정 연결 정보 (1:N)
  - `sessions`: 사용자 세션 정보 (1:N)
- **Indexes**:
  - `email` 인덱스 (로그인 최적화)
  - `role` 인덱스 (권한 기반 쿼리 최적화)
- **Evidence**:
  - `prisma/schema.prisma`: `model User { id String @id @default(cuid()); email String @unique; role UserRole @default(GUEST) }`

## Account 모델

- **Location**: `prisma/schema.prisma` (L49-L68)
- **Purpose**: OAuth 제공자별 계정 연결 정보 저장
- **source_exists**: true
- **Key Details**:
  - `provider`: OAuth 제공자 (예: "google")
  - `providerAccountId`: 제공자별 계정 ID
  - `refresh_token`, `access_token`: OAuth 토큰 저장
  - `expires_at`: 토큰 만료 시간 (Unix 타임스탬프)
- **Constraints**:
  - 복합 유니크 제약조건: `[provider, providerAccountId]`
- **Relationships**:
  - `user`: User 모델과 N:1 관계 (onDelete: Cascade)
- **Evidence**:
  - `prisma/schema.prisma`: `@@unique([provider, providerAccountId])`

## Session 모델

- **Location**: `prisma/schema.prisma` (L70-L80)
- **Purpose**: 사용자 로그인 세션 관리
- **source_exists**: true
- **Key Details**:
  - `sessionToken`: 고유 세션 토큰
  - `expires`: 세션 만료 시간
- **Constraints**:
  - `sessionToken` 유니크 제약조건
- **Relationships**:
  - `user`: User 모델과 N:1 관계 (onDelete: Cascade)
- **Evidence**:
  - `prisma/schema.prisma`: `sessionToken String @unique`

## VerificationToken 모델

- **Location**: `prisma/schema.prisma` (L82-L89)
- **Purpose**: 이메일 인증 토큰 관리
- **source_exists**: true
- **Key Details**:
  - `identifier`: 인증 대상 이메일
  - `token`: 인증 토큰
  - `expires`: 토큰 만료 시간
- **Constraints**:
  - 복합 유니크 제약조건: `[identifier, token]`
- **Evidence**:
  - `prisma/schema.prisma`: `@@unique([identifier, token])`

## Subscriber 모델

- **Location**: `prisma/schema.prisma` (L95-L111)
- **Purpose**: 뉴스레터 구독자 관리
- **source_exists**: true
- **Key Details**:
  - `email`: 고유 구독자 이메일
  - `isActive`: 구독 상태 (활성/비활성)
  - `unsubscribeToken`: 안전한 구독 취소를 위한 고유 토큰
  - `source`: 구독 경로 추적 (footer, popup, blog-post 등)
- **Timestamps**:
  - `subscribedAt`: 구독 시작 시간
  - `unsubscribedAt`: 구독 취소 시간 (선택사항)
- **Indexes**:
  - `email` 인덱스 (중복 확인 최적화)
  - `isActive` 인덱스 (활성 구독자 필터링 최적화)
- **Evidence**:
  - `prisma/schema.prisma`: `model Subscriber { email String @unique; isActive Boolean @default(true) }`

## Experience 모델 (NEW)

- **Location**: `prisma/schema.prisma` (L117-L138)
- **Purpose**: 경력 타임라인 관리
- **source_exists**: true
- **git_hash**: "c0049e1"
- **last_modified**: "2025-12-31T00:00:00Z"
- **Key Details**:
  - `company`: 회사명 (String, required)
  - `position`: 직책 (String, required)
  - `team`: 팀명 (String?, optional)
  - `period`: 근무 기간 (String, e.g., "2023.01 ~ 2024.12", "2024.01 ~ 재직중")
  - `isCurrent`: 재직중 여부 (Boolean, default: false)
  - `description`: 회사/직무 설명 (String?, optional)
  - `sortOrder`: 정렬 순서 (Int, 높을수록 최신)
- **Relationships**:
  - `achievements`: Achievement (1:N, Cascade delete)
- **Indexes**:
  - `isCurrent`: 재직중 필터링
  - `sortOrder`: 정렬 최적화
  - `createdAt`: 생성일순 정렬
- **Evidence**:
  - `prisma/schema.prisma`: L117-L138
  - `src/app/actions/experience.ts`: CRUD Server Actions
  - `src/app/dashboard/experience/page.tsx`: UI

## Achievement 모델 (NEW)

- **Location**: `prisma/schema.prisma` (L140-L160)
- **Purpose**: 경력별 성과 관리
- **source_exists**: true
- **git_hash**: "c0049e1"
- **last_modified**: "2025-12-31T00:00:00Z"
- **Key Details**:
  - `title`: 성과 제목 (String, required)
  - `description`: 성과 상세 설명 (Text, required)
  - `tags`: 기술 태그 (String?, JSON 배열 형식)
  - `sortOrder`: 정렬 순서 (Int)
  - `experienceId`: Experience FK (String, required)
- **Relationships**:
  - `experience`: Experience (N:1, onDelete: Cascade)
- **Indexes**:
  - `experienceId`: Experience별 쿼리
  - `sortOrder`: 정렬 최적화
- **Evidence**:
  - `prisma/schema.prisma`: L140-L160
  - `src/app/actions/experience.ts`: Achievement CRUD

## BlobFile 모델

- **Location**: `prisma/schema.prisma` (L166-L186)
- **Purpose**: Vercel Blob Storage CDC (Change Data Capture) 캐시
- **source_exists**: true
- **Key Details**:
  - `pathname`: 파일 경로 (고유 식별자, NOT url)
  - `url`: Blob URL (재업로드 시 변경됨)
  - `size`: 파일 크기 (bytes)
  - `isDeleted`: 소프트 삭제 플래그
- **CDC 메타데이터**:
  - `syncedAt`: DB 동기화 시간
  - `lastChecked`: 마지막 확인 시간
  - `uploadedBy`: 업로드 사용자 추적 (선택사항)
- **Constraints**:
  - `pathname` 유니크 제약조건 (Migration: 20251219112111)
- **Indexes**:
  - `uploadedAt` 인덱스 (최신 파일 정렬)
  - `isDeleted` 인덱스 (삭제된 파일 필터링)
  - `lastChecked` 인덱스 (동기화 필요 파일 확인)
- **Evidence**:
  - `prisma/schema.prisma`: `pathname String @unique // File path (unique identifier)`

## UploadHistory 모델 (NEW)

- **Location**: `prisma/schema.prisma` (L192-L218)
- **Purpose**: 파일 업로드/수정/삭제 이력 추적
- **source_exists**: true
- **git_hash**: "6281748"
- **last_modified**: "2026-01-04T00:00:00Z"
- **Migration**: `20250102141000_add_upload_history`
- **Key Details**:
  - `actionType`: 작업 유형 (CREATE, UPDATE, DELETE)
  - `pathname`: 파일 경로
  - `fileUrl`: 파일 URL (삭제 시 null)
  - `fileSize`: 파일 크기 (삭제 시 null)
  - `contentType`: MIME 타입 (삭제 시 null)
  - `uploadedBy`: 작업자 email
- **Indexes**:
  - `pathname` 인덱스 (파일별 이력 조회)
  - `createdAt` 인덱스 (최신 이력 정렬)
  - `actionType` 인덱스 (작업 유형별 필터링)
- **Usage Pattern**:
  - 파일 생성/수정/삭제 시 자동 기록 (Server Actions)
  - 관리자 대시보드에서 이력 조회 및 필터링
- **Evidence**:
  - `prisma/schema.prisma`: L192-L218
  - `src/app/actions/files.ts`: `onBlobUpload()`, `onBlobDelete()` 훅에서 기록
  - `src/app/actions/upload-history.ts`: 이력 조회 Server Actions
  - `src/rpc/routes/upload-history/upload-history.routes.ts`: Hono RPC 엔드포인트

## Setting 모델 (NEW)

- **Location**: `prisma/schema.prisma` (L224-L237)
- **Purpose**: 시스템 전체 설정 관리 (블로그, 시스템, 콘텐츠)
- **source_exists**: true
- **git_hash**: "6281748"
- **last_modified**: "2026-01-04T00:00:00Z"
- **Migration**: `20260102130251_add_settings_model`
- **Key Details**:
  - `key`: 설정 키 (고유, e.g., "blog.title", "blog.author")
  - `value`: 설정 값 (Text, JSON 지원)
  - `category`: 카테고리 (blog, system, content)
  - `type`: 데이터 타입 (string, number, boolean, json)
  - `label`: 사람이 읽을 수 있는 라벨
  - `updatedBy`: 마지막 수정자 email
- **Indexes**:
  - `category` 인덱스 (카테고리별 설정 조회)
  - `key` 인덱스 (키로 빠른 조회)
- **Default Settings**:
  ```typescript
  DEFAULT_SETTINGS = [
    { key: 'blog.title', value: 'DEV_BBAK 블로그', category: 'blog', type: 'string' },
    { key: 'blog.description', value: '기술 블로그', category: 'blog', type: 'string' },
    { key: 'blog.author', value: 'bbakjun', category: 'blog', type: 'string' },
    { key: 'blog.url', value: 'https://your-blog.com', category: 'blog', type: 'string' },
    { key: 'system.blobSyncInterval', value: '30', category: 'system', type: 'number' },
    { key: 'system.cacheTTL', value: '300', category: 'system', type: 'number' },
    { key: 'content.defaultStatus', value: 'draft', category: 'content', type: 'string' },
    { key: 'content.relatedPostsCount', value: '4', category: 'content', type: 'number' },
  ]
  ```
- **Server Actions**:
  - `getSettingsByCategory()`: 카테고리별 설정 조회
  - `getAllSettings()`: 전체 설정 조회
  - `getSetting()`: 단일 설정 조회
  - `upsertSetting()`: 설정 생성/업데이트
  - `deleteSetting()`: 설정 삭제
  - `updateSettings()`: 일괄 업데이트
  - `seedDefaultSettings()`: 초기 데이터 시딩
- **Evidence**:
  - `prisma/schema.prisma`: L224-L237
  - `src/app/actions/settings.ts`: 전체 Server Actions 구현
  - `src/app/dashboard/settings/page.tsx`: 설정 관리 UI

## ActionType 열거형 (NEW)

- **Location**: `prisma/schema.prisma` (L192-L196)
- **Purpose**: 파일 작업 유형 정의
- **source_exists**: true
- **Values**:
  - `CREATE`: 파일 생성
  - `UPDATE`: 파일 수정 (URL이 변경됨)
  - `DELETE`: 파일 삭제
- **Evidence**:
  - `prisma/schema.prisma`: `enum ActionType { CREATE; UPDATE; DELETE }`

## UserRole 열거형

- **Location**: `prisma/schema.prisma` (L15-L19)
- **Purpose**: 역할 기반 접근 제어 (RBAC)
- **source_exists**: true
- **Values**:
  - `SUPER_ADMIN`: 최고 관리자 - 모든 권한 + 사용자 역할 관리
  - `ADMIN`: 일반 관리자 - 콘텐츠 관리 (CRUD)
  - `GUEST`: 게스트 - 읽기 전용
- **Evidence**:
  - `prisma/schema.prisma`: `enum UserRole { SUPER_ADMIN; ADMIN; GUEST }`

## 데이터베이스 제약조건

### 유니크 제약조건

1. `users.email`: 이메일 중복 방지
2. `users.username`: 사용자명 중복 방지 (레거시)
3. `accounts.provider_providerAccountId`: OAuth 계정 중복 방지
4. `sessions.sessionToken`: 세션 토큰 중복 방지
5. `subscribers.email`: 구독자 이메일 중복 방지
6. `subscribers.unsubscribeToken`: 구독 취소 토큰 중복 방지
7. `blob_files.pathname`: 파일 경로 중복 방지

### 복합 유니크 제약조건

1. `verification_tokens.identifier_token`: 이메일+토큰 조합 유니크
2. `accounts.provider_providerAccountId`: 제공자+계정ID 조합 유니크

### 인덱스

- 성능 최적화를 위한 인덱스가 주요 컬럼에 설정됨
- 쿼리 패턴에 따라 정렬, 필터링, 조인 최적화

## 마이그레이션 히스토리

1. **20251215063239_init**: 초기 테이블 생성 (User, Account, Session, VerificationToken)
2. **20251216122249_add_newsletter_subscriber**: Subscriber 모델 추가
3. **20251217004025_add_newsletter_and_blob_cdc**: BlobFile 모델 추가 (CDC 구현)
4. **20251219015706_add_lastchecked_index**: BlobFile.lastChecked 인덱스 추가
5. **20251219112111_change_pathname_to_unique**:
   - BlobFile pathname을 유니크로 변경
   - 중복 pathname 정리 (최신 파일 유지)
   - url 유니크 제약조건 제거
6. **20250102141000_add_upload_history**: UploadHistory 모델 추가 (이력 추적)
7. **20260102130251_add_settings_model**: Setting 모델 추가 (시스템 설정)

## 관계 다이어그램

```
User (1) ←→ (N) Account
User (1) ←→ (N) Session
Subscriber (독립)
Experience (1) ←→ (N) Achievement
BlobFile (독립, CDC 캐시)
UploadHistory (독립, 이력 추적) (NEW)
Setting (독립, 시스템 설정) (NEW)
VerificationToken (독립)
```
