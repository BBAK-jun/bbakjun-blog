# Settings Management System

- **Scope**: 시스템 전체 설정 관리 (블로그, 시스템, 콘텐츠)
- **Source of Truth**: `prisma/schema.prisma` (Setting 모델)
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

## 메타데이터

```yaml
metadata:
  version: "1.0.0"
  created_at: "2026-01-04T00:00:00Z"
  last_verified: "2026-01-04T00:00:00Z"
  git_commit: "628174858956a2b1ff3d7c33e4ae03c790ed3208"

  changed_files:
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

  deleted_files: []
```

## 개요

블로그, 시스템, 콘텐츠 설정을 중앙에서 관리하는 시스템입니다. 카테고리별 설정 분류, 사용자 역할 관리, API 키 관리 기능을 포함합니다.

## 데이터 모델

### Setting 모델

- **Location**: `prisma/schema.prisma` (L224-L237)
- **Purpose**: 시스템 전체 설정 저장
- **source_exists**: true
- **Migration**: `20260102130251_add_settings_model`
- **Key Details**:
  - `key`: 설정 키 (고유, e.g., "blog.title", "blog.author")
  - `value`: 설정 값 (Text, JSON 지원)
  - `category`: 카테고리 (blog, system, content)
  - `type`: 데이터 타입 (string, number, boolean, json)
  - `label`: 사람이 읽을 수 있는 라벨
  - `updatedBy`: 마지막 수정자 email
  - `updatedAt`: 마지막 수정 시간
- **Indexes**:
  - `category` 인덱스 (카테고리별 설정 조회)
  - `key` 인덱스 (키로 빠른 조회)
- **Constraints**:
  - `key` 유니크 제약조건
- **Evidence**:
  - `prisma/schema.prisma`: L224-L237

### 기본 설정 데이터

- **Location**: `src/app/actions/settings.ts` (L19-L79)
- **Purpose**: 초기 설정 데이터 시딩
- **source_exists**: true
- **Default Settings**:
  ```typescript
  const DEFAULT_SETTINGS = [
    // 블로그 설정
    { key: 'blog.title', value: 'DEV_BBAK 블로그', category: 'blog', type: 'string', label: '블로그 제목' },
    { key: 'blog.description', value: '기술 블로그', category: 'blog', type: 'string', label: '블로그 설명' },
    { key: 'blog.author', value: 'bbakjun', category: 'blog', type: 'string', label: '기본 작성자' },
    { key: 'blog.url', value: 'https://your-blog.com', category: 'blog', type: 'string', label: '블로그 URL' },

    // 시스템 설정
    { key: 'system.blobSyncInterval', value: '30', category: 'system', type: 'number', label: 'Blob 동기화 간격 (분)' },
    { key: 'system.cacheTTL', value: '300', category: 'system', type: 'number', label: '캐시 유효시간 (초)' },

    // 콘텐츠 설정
    { key: 'content.defaultStatus', value: 'draft', category: 'content', type: 'string', label: '기본 게시 상태' },
    { key: 'content.relatedPostsCount', value: '4', category: 'content', type: 'number', label: '관련 게시글 표시 개수' },
  ];
  ```
- **Evidence**:
  - `src/app/actions/settings.ts`: L19-L79

## UI 컴포넌트

### Settings Page

- **Location**: `src/app/dashboard/settings/page.tsx` (L1-L88)
- **Purpose**: 설정 페이지 메인 컴포넌트
- **source_exists**: true
- **Key Details**:
  1. **탭 인터페이스**:
     - 시스템 설정 (SystemSettings)
     - 사용자 관리 (UserManagement)
     - API 키 (ApiKeys)
  2. **탭 네비게이션**:
     ```typescript
     const TABS = [
       { id: 'system', name: '시스템 설정', icon: Globe, description: '블로그 및 시스템 동작 설정' },
       { id: 'users', name: '사용자 관리', icon: Users, description: '사용자 역할 및 권한 관리' },
       { id: 'api-keys', name: 'API 키', icon: Key, description: 'API 키 및 인증 정보 확인' },
     ];
     ```
  3. **상태 관리**: `activeTab` state로 활성 탭 관리
- **Evidence**:
  - `src/app/dashboard/settings/page.tsx`: L1-L88

### SystemSettings Component

- **Location**: `src/app/dashboard/settings/components/system-settings.tsx`
- **Purpose**: 시스템 설정 관리 (블로그, 시스템, 콘텐츠)
- **source_exists**: true
- **Key Features**:
  1. **카테고리별 그룹화**:
     - 블로그 설정 (blog.*)
     - 시스템 설정 (system.*)
     - 콘텐츠 설정 (content.*)
  2. **설정 편집**:
     - 인라인 편집 또는 모달 폼
     - 타입별 입력 필드 (string, number, boolean, json)
  3. **일괄 업데이트**:
     - 여러 설정을 동시에 수정
     - `updateSettings()` Server Action 호출
- **Evidence**:
  - `src/app/dashboard/settings/components/system-settings.tsx`: 전체 파일

### UserManagement Component

- **Location**: `src/app/dashboard/settings/components/user-management.tsx`
- **Purpose**: 사용자 역할 관리
- **source_exists**: true
- **Key Features**:
  1. **사용자 목록 표시**:
     - 이름, 이메일, 역할, 가입일
     - 역할 배지 컬러 (SUPER_ADMIN: 보라, ADMIN: 파랑, GUEST: 회색)
  2. **역할 변경**:
     - 드롭다운으로 역할 선택
     - `updateUserRole()` Server Action 호출
     - SUPER_ADMIN만 역할 변경 가능
  3. **권한 제한**:
     - 자신의 역할은 변경 불가
     - GUEST는 역할 변경 불가
- **User Roles**:
  - `SUPER_ADMIN`: 최고 관리자 - 모든 권한 + 사용자 역할 관리
  - `ADMIN`: 일반 관리자 - 콘텐츠 관리 (CRUD)
  - `GUEST`: 게스트 - 읽기 전용
- **Evidence**:
  - `src/app/dashboard/settings/components/user-management.tsx`: 전체 파일

### ApiKeys Component

- **Location**: `src/app/dashboard/settings/components/api-keys.tsx`
- **Purpose**: API 키 및 인증 정보 확인
- **source_exists**: true
- **Key Features**:
  1. **환경 변수 표시**:
     - `NEXT_PUBLIC_BLOG_URL`: 블로그 공개 URL
     - `BLOB_READ_WRITE_TOKEN`: Vercel Blob 토큰 (마스킹)
     - `BACKOFFICE_API_KEY`: 백오피스 API 키 (마스킹)
     - `RESEND_API_KEY`: Resend 이메일 API 키 (마스킹)
  2. **보안**:
     - 민감 키는 마스킹 표시 (예: `sk_••••••••••••••`)
     - 복사 버튼 제공
  3. **설정 안내**:
     - 각 키의 용도 설명
     - 설정 방법 안내
- **Evidence**:
  - `src/app/dashboard/settings/components/api-keys.tsx`: 전체 파일

## Server Actions

### Settings CRUD

- **Location**: `src/app/actions/settings.ts` (L1-L346)
- **Purpose**: 설정 관리 Server Actions
- **source_exists**: true
- **Key Functions**:

  1. **`getSettingsByCategory(category: string)`**:
     - 카테고리별 설정 조회
     - Returns: `{ success: boolean, data?: Setting[], error?: string }`

  2. **`getAllSettings()`**:
     - 전체 설정 조회
     - 카테고리, 키 순으로 정렬
     - Returns: `{ success: boolean, data?: Setting[], error?: string }`

  3. **`getSetting(key: string)`**:
     - 단일 설정 조회
     - Returns: `{ success: boolean, data?: Setting, error?: string }`

  4. **`upsertSetting(data)`**:
     - 설정 생성 또는 업데이트
     - Zod 스키마 검증
     - `revalidatePath('/dashboard/settings')` 호출
     - Returns: `{ success: boolean, data?: Setting, error?: string }`

  5. **`deleteSetting(key: string)`**:
     - 설정 삭제
     - `revalidatePath('/dashboard/settings')` 호출
     - Returns: `{ success: boolean, error?: string }`

  6. **`updateSettings(settings: { key, value }[])`**:
     - 일괄 설정 업데이트
     - 트랜잭션으로 원자성 보장
     - `revalidatePath('/dashboard/settings')` 호출
     - Returns: `{ success: boolean, error?: string }`

  7. **`seedDefaultSettings()`**:
     - 초기 설정 데이터 시딩
     - 기존 데이터 있으면 실패
     - Returns: `{ success: boolean, data?: Setting[], error?: string }`

- **인증 검사**: 모든 함수에서 `auth()`로 세션 확인
- **Evidence**:
  - `src/app/actions/settings.ts`: L82-L257

### User Management Actions

- **Location**: `src/app/actions/settings.ts` (L259-L346)
- **Purpose**: 사용자 관리 Server Actions
- **source_exists**: true
- **Key Functions**:

  1. **`getUsers()`**:
     - 전체 사용자 목록 조회
     - Returns: `{ success: boolean, data?: User[], error?: string }`

  2. **`getCurrentUser()`**:
     - 현재 로그인한 사용자 정보
     - Returns: `{ success: boolean, data?: User, error?: string }`

  3. **`updateUserRole(data)`**:
     - 사용자 역할 변경
     - Zod 스키마 검증
     - SUPER_ADMIN만 호출 가능
     - 자신의 역할 변경 불가
     - `revalidatePath('/dashboard/settings')` 호출
     - Returns: `{ success: boolean, data?: User, error?: string }`

- **권한 검사**: `session.user.role === 'SUPER_ADMIN'` 확인
- **Evidence**:
  - `src/app/actions/settings.ts`: L259-L346

## Zod 스키마

### Setting Schema

- **Location**: `src/app/actions/settings.ts` (L8-L16)
- **Purpose**: 설정 데이터 검증
- **source_exists**: true
- **Schema**:
  ```typescript
  const settingSchema = z.object({
    id: z.string().optional(),
    key: z.string().min(1, '키를 입력해주세요'),
    value: z.string(),
    category: z.enum(['blog', 'system', 'content']),
    type: z.enum(['string', 'number', 'boolean', 'json']),
    label: z.string().min(1, '라벨을 입력해주세요'),
  });
  ```
- **Evidence**:
  - `src/app/actions/settings.ts`: L8-L16

### UserRole Schema

- **Location**: `src/app/actions/settings.ts` (L310-L313)
- **Purpose**: 사용자 역할 변경 데이터 검증
- **source_exists**: true
- **Schema**:
  ```typescript
  const userRoleSchema = z.object({
    userId: z.string().min(1),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'GUEST']),
  });
  ```
- **Evidence**:
  - `src/app/actions/settings.ts`: L310-L313

## 사용자 경험

### 시스템 설정 워크플로우

1. **설정 페이지 진입**: `/dashboard/settings`
2. **카테고리 선택**: 블로그 / 시스템 / 콘텐츠 탭
3. **설정 수정**: 인라인 편집 또는 모달 폼
4. **저장**: 단일 설정은 `upsertSetting()`, 복수는 `updateSettings()`
5. **재검증**: `revalidatePath()`로 페이지 갱신

### 사용자 관리 워크플로우

1. **사용자 탭 진입**: `/dashboard/settings` → "사용자 관리" 탭
2. **사용자 목록 확인**: 모든 사용자 표시
3. **역할 변경**: 드롭다운으로 역할 선택
4. **저장 확인**: `updateUserRole()` 호출 후 성공 메시지

### 권한 체계

- **SUPER_ADMIN**:
  - 모든 설정 수정
  - 사용자 역할 변경 (자신 제외)
  - API 키 확인
- **ADMIN**:
  - 대부분 설정 수정
  - 사용자 목록 조회 (역할 변경 불가)
  - API 키 확인
- **GUEST**:
  - 설정 읽기 전용
  - 사용자 목록 조회

## 보안 고려사항

1. **인증**: 모든 Server Actions에서 `auth()`로 세션 확인
2. **권한**: SUPER_ADMIN만 사용자 역할 변경 가능
3. **데이터 검증**: Zod 스키마로 입력 검증
4. **재검증**: `revalidatePath()`로 페이지 갱신
5. **트랜잭션**: `updateSettings()`는 트랜잭션으로 원자성 보장

## 관련 파일

- `prisma/schema.prisma`: Setting 모델 정의
- `src/app/dashboard/settings/page.tsx`: 설정 페이지 메인
- `src/app/dashboard/settings/components/system-settings.tsx`: 시스템 설정
- `src/app/dashboard/settings/components/user-management.tsx`: 사용자 관리
- `src/app/dashboard/settings/components/api-keys.tsx`: API 키
- `src/app/actions/settings.ts`: Server Actions
