# Experience Management Feature

- **Scope**: 경력 타임라인 및 성과 관리 기능
- **Source of Truth**: Server Actions + Prisma Models
- **Last Verified**: 2025-12-31
- **Repo Ref**: c0049e1e70738fbbfaee84f1ebcf7964c7c7d62d

## 메타데이터

```yaml
metadata:
  version: "1.0.0"
  created_at: "2025-12-31T00:00:00Z"
  last_verified: "2025-12-31T00:57:47Z"
  git_commit: "c0049e1e70738fbbfaee84f1ebcf7964c7c7d62d"

  source_files:
    apps/blog-admin/src/app/actions/experience.ts:
      git_hash: "c0049e1"
      last_modified: "2025-12-31T00:00:00Z"
      source_exists: true
    apps/blog-admin/src/app/dashboard/experience/page.tsx:
      git_hash: "c0049e1"
      last_modified: "2025-12-31T00:00:00Z"
      source_exists: true
    apps/blog-admin/prisma/schema.prisma:
      git_hash: "c0049e1"
      source_exists: true
    apps/blog-admin/src/rpc/routes/experience/experience.routes.ts:
      git_hash: "c0049e1"
      source_exists: true
    apps/blog-admin/src/rpc/routes/experience/experience.handlers.ts:
      git_hash: "c0049e1"
      source_exists: true

  deleted_files: []
```

## 개요

경력 관리 시스템은 블로그 소유자의 커리어 타임라인과 주요 성과를 관리하고 블로그 About 페이지에 표시하기 위한 기능입니다.

## 데이터베이스 스키마

### Experience 모델

- **Location**: `prisma/schema.prisma` (L117-L138)
- **Purpose**: 경력 정보 저장
- **Fields**:
  - `id`: CUID primary key
  - `company`: 회사명 (String)
  - `position`: 직책 (String)
  - `team`: 팀명 (String?, optional)
  - `period`: 근무 기간 (String, e.g., "2023.01 ~ 2024.12", "2024.01 ~ 재직중")
  - `isCurrent`: 재직중 여부 (Boolean, default: false)
  - `description`: 회사/직무 설명 (String?, optional)
  - `sortOrder`: 정렬 순서 (Int, 높을수록 최신)
  - `createdAt`, `updatedAt`: Timestamps
- **Indexes**: `isCurrent`, `sortOrder`, `createdAt`
- **Relations**: `achievements` (1:N)

### Achievement 모델

- **Location**: `prisma/schema.prisma` (L140-L160)
- **Purpose**: 성과 정보 저장
- **Fields**:
  - `id`: CUID primary key
  - `title`: 성과 제목 (String)
  - `description`: 성과 상세 설명 (Text)
  - `tags`: 기술 태그 (String?, JSON 배열 형식)
  - `sortOrder`: 정렬 순서 (Int)
  - `experienceId`: Experience FK (String)
  - `createdAt`, `updatedAt`: Timestamps
- **Indexes**: `experienceId`, `sortOrder`
- **Relations**: `experience` (N:1, Cascade delete)

## Server Actions

### Experience CRUD

- **Location**: `src/app/actions/experience.ts`

#### getExperiences()

- **Purpose**: 모든 경력 조회
- **Returns**: `{ success: true, data: Experience[] }`
- **Sorting**:
  1. `isCurrent: 'desc'` (재직중 우선)
  2. `sortOrder: 'desc'` (최신 우선)
  3. `createdAt: 'desc'` (생성일순)
- **Include**: `achievements` (sortOrder asc)

#### createExperience(data)

- **Purpose**: 경력 생성
- **Auth**: Required (session check)
- **Validation**: Zod schema
- **Revalidate**: `/dashboard/experience`

#### updateExperience(id, data)

- **Purpose**: 경력 수정
- **Auth**: Required
- **Returns**: Experience with achievements

#### deleteExperience(id)

- **Purpose**: 경력 삭제
- **Auth**: Required
- **Cascade**: Achievements deleted automatically

### Achievement CRUD

#### createAchievement(experienceId, data)

- **Purpose**: 성과 생성
- **Auth**: Required
- **Validation**: Zod schema

#### updateAchievement(id, data)

- **Purpose**: 성과 수정
- **Auth**: Required

#### deleteAchievement(id)

- **Purpose**: 성과 삭제
- **Auth**: Required

### seedExperiences()

- **Purpose**: 초기 경력 데이터 시드
- **Auth**: Required (Super Admin)
- **Data**: 5개 회사 초기 데이터
  - 비바리퍼블리카 (토스) - 재직중
  - 데이원컴퍼니
  - 휴톰
  - 세진마인드
  - 무른모 (인턴)
- **Guard**: 기존 데이터 있으면 실패

## UI Components

### Experience 관리 페이지

- **Location**: `src/app/dashboard/experience/page.tsx`
- **Type**: Client Component
- **Features**:
  - 경력 목록 표시 (타임라인 형식)
  - 드래그앤드롭 정렬
  - CRUD 폼 모달
  - 성과 관리 (각 경력별)
  - 실시간 미리보기
  - 초기 데이터 시드 버튼

### 폼 스키마

#### Experience 스키마

```typescript
{
  id?: string;
  company: string; // required, min 1
  position: string; // required, min 1
  team?: string;
  period: string; // required, min 1
  isCurrent?: boolean; // default false
  description?: string;
  sortOrder?: number; // default 0
}
```

#### Achievement 스키마

```typescript
{
  id?: string;
  title: string; // required, min 1
  description: string; // required, min 1
  tags?: string;
  sortOrder?: number; // default 0
}
```

## Hono RPC Routes

### GET /api/rpc/getExperiences

- **Location**: `src/rpc/routes/experience/experience.routes.ts`
- **Purpose**: 경력 목록 조회 (공개)
- **Tags**: ['Experience']
- **Response**: `{ success: true, data: Experience[] }`
- **Schema**: `experienceSchema` with `achievements[]`

### POST /api/rpc/createExperience

- **Purpose**: 경력 생성 (관리자)
- **Auth**: Required (session middleware)
- **Request**: `experienceSchema`
- **Response**: Created Experience

### PUT /api/rpc/updateExperience

- **Purpose**: 경력 수정 (관리자)
- **Auth**: Required
- **Request**: `experienceSchema` with `id`
- **Response**: Updated Experience with achievements

### DELETE /api/rpc/deleteExperience

- **Purpose**: 경력 삭제 (관리자)
- **Auth**: Required
- **Request**: `{ id: string }`
- **Response**: Success message

## Blog Integration

### ExperienceTimeline 컴포넌트

- **Location**: `apps/blog/src/features/navigation/ui/experience-timeline.tsx`
- **Purpose**: About 페이지에 경력 타임라인 표시
- **Data Source**: RPC `/api/rpc/getExperiences`
- **Styling**: Tailwind CSS

### Server-Side Data Fetching

```typescript
// apps/blog/src/lib/experience.ts
export async function getExperiences() {
  const response = await client.api.v1.getExperiences.$get();
  if (!response.ok) throw new Error('Failed to fetch experiences');
  return response.json();
}
```

## Dependencies

- **Prisma**: ORM, database access
- **Zod**: Schema validation
- **NextAuth.js**: Authentication (session check)
- **@repo/ui**: UI components (Card, Button, Badge, Dialog)
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Zod integration
- **sonner**: Toast notifications

## Usage Flow

1. **관리자 접속**: `/dashboard/experience`
2. **데이터 조회**: `getExperiences()` Server Action 호출
3. **CRUD 작업**:
   - 생성: `createExperience(data)`
   - 수정: `updateExperience(id, data)`
   - 삭제: `deleteExperience(id)`
   - 정렬: `sortOrder` 필드 수정
4. **성과 관리**: 각 경력별 `Achievement` CRUD
5. **Blog 표시**: About 페이지에서 RPC 호출로 데이터 표시

## Error Handling

- **Auth 실패**: `{ success: false, error: '인증이 필요합니다' }`
- **Validation 실패**: Zod error messages
- **Database 오류**: Generic error message + console.error
- **중복 시드**: `{ success: false, error: '이미 경력 데이터가 있습니다' }`

## Future Enhancements

- 이미지 업로드 (회사 로고)
- 다국어 지원
- PDF export 기능
- LinkedIn import
