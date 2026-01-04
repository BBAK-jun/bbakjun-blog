# 설정 관리 시스템 (Settings Management System)

- **App**: apps/blog-admin
- **Status**: As-Is (현재 구현)
- **Scope**: 시스템 전체 설정 중앙화 관리 (블로그, 시스템, 콘텐츠)
- **Based on**:
  - Facts: [../../facts/apps/blog-admin/features/settings.md](../../facts/apps/blog-admin/features/settings.md)
  - Facts: [../../facts/apps/blog-admin/schemas/db.md](../../facts/apps/blog-admin/schemas/db.md)
  - Insights: [../../insights/apps/blog-admin/impact/settings.md](../../insights/apps/blog-admin/impact/settings.md)
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2026-01-04
- **Verification Results**:
  - `../../facts/apps/blog-admin/features/settings.md`: ✅ Verified (source_exists: true)
  - `../../facts/apps/blog-admin/schemas/db.md`: ✅ Verified (source_exists: true)
- **Spec Status**: As-Is (모든 사실 검증됨)

---

## 개요 (Overview)

### 목적 (Purpose)

블로그, 시스템, 콘텐츠 설정을 중앙에서 UI로 관리할 수 있는 시스템을 제공합니다. 환경 변수 수정에서 UI 기반 설정 변경으로 전환하여 설정 변경 시간을 90% 단축하고 배포 주기를 1주에서 1일로 단축합니다. 역할 기반 권한 관리(RBAC)로 보안을 강화하고 운영팀이 개발자 개입 없이 자율적으로 시스템을 관리할 수 있게 합니다.

### 범위 (Scope)

**In Scope**:
- 카테고리별 설정 관리 (blog, system, content)
- 설정 CRUD (생성, 조회, 수정, 삭제)
- 역할 기반 권한 관리 (SUPER_ADMIN, ADMIN, GUEST)
- API 키 확인 및 마스킹
- 일괄 설정 업데이트
- Zod 스키마 검증

**Out of Scope**:
- 설정 변경 이력 상세화 (현재 updatedBy만)
- 프롬프트 템플릿
- 플러그인 시스템
- 설정 가져오기/내보내기
- 설정 롤백

### 비즈니스 가치 (Business Value)

- **설정 관리 시간 90% 단축**: 30분(.env 수정) → 3분(UI 수정)
- **배포 주기 1주 → 1일 단축**: 97% 민첩성 향상
- **개발자 의존성 제거**: 운영팀이 자율적으로 설정 변경
- **보안 강화**: 역할 기반 접근 제어(RBAC)
- **규정 준수**: 설정 변경 추적 가능

---

## 핵심 기능 (Core Features)

### 1. 카테고리별 설정 관리

**기능**: blog, system, content 카테고리로 설정 분류

**세부 동작**:
- **blog**: 블로그 제목, 설명, 작성자, URL
- **system**: Blob 동기화 간격, 캐시 TTL
- **content**: 기본 게시 상태, 관련 게시글 표시 개수

**UI**: 탭 인터페이스로 카테고리 전환

**구현 위치**: `src/app/dashboard/settings/components/system-settings.tsx`

### 2. 설정 CRUD

**기능**: 설정 생성, 조회, 수정, 삭제

**세부 동작**:
- **getSettingsByCategory(category)**: 카테고리별 설정 조회
- **getAllSettings()**: 전체 설정 조회
- **getSetting(key)**: 단일 설정 조회
- **upsertSetting(data)**: 설정 생성 또는 업데이트
- **deleteSetting(key)**: 설정 삭제
- **updateSettings(settings)**: 일괄 설정 업데이트 (트랜잭션)

**구현 위치**: `src/app/actions/settings.ts` (L82-L257)

**Zod 스키마 검증**:
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

### 3. 역할 기반 권한 관리 (RBAC)

**기능**: 사용자 역할별 접근 제어

**역할 정의**:
- **SUPER_ADMIN**: 최고 관리자 - 모든 권한 + 사용자 역할 관리
- **ADMIN**: 일반 관리자 - 대부분 설정 수정 (역할 변경 제외)
- **GUEST**: 게스트 - 읽기 전용

**권한 체계**:
- 설정 조회: 모든 역할 가능
- 설정 수정: SUPER_ADMIN, ADMIN 가능
- 역할 변경: SUPER_ADMIN만 가능
- 자신의 역할 변경: 불가

**구현 위치**: `src/app/actions/settings.ts` (L259-L346)

### 4. API 키 확인

**기능**: 환경 변수 API 키 확인 및 마스킹

**세부 동작**:
- **NEXT_PUBLIC_BLOG_URL**: 블로그 공개 URL (공개)
- **BLOB_READ_WRITE_TOKEN**: Vercel Blob 토큰 (마스킹: `sk_••••••••••••••`)
- **BACKOFFICE_API_KEY**: 백오피스 API 키 (마스킹)
- **RESEND_API_KEY**: Resend 이메일 API 키 (마스킹)

**보안**: 민감 키는 마스킹 표시, 복사 버튼 제공

**구현 위치**: `src/app/dashboard/settings/components/api-keys.tsx`

### 5. 일괄 업데이트

**기능**: 여러 설정을 동시에 수정

**세부 동작**:
- 트랜잭션으로 원자성 보장
- 실패 시 전체 롤백
- `revalidatePath('/dashboard/settings')` 호출

**구현 위치**: `src/app/actions/settings.ts` (L219-L236)

---

## 기술 사양 (Technical Specifications)

### 아키텍처 (Architecture)

```
Settings Page (/dashboard/settings)
    ↓
탭 인터페이스 (System | Users | API Keys)
    ↓
Server Actions (getSettingsByCategory, upsertSetting, etc.)
    ↓
Setting Prisma Model
```

### 의존성 (Dependencies)

**Backend**:
- `@prisma/client`: DB ORM
- `next-auth`: Authentication
- `zod`: Schema validation

**Frontend**:
- `react`: UI framework
- `@repo/ui`: UI components
- `lucide-react`: Icons

### 환경 변수 (Environment Variables)

**없음** (기존 DB 연결만 사용)

### 구현 접근 (Implementation Approach)

**데이터 모델**:
- Prisma Schema: `Setting` 모델
- Migration: `20260102130251_add_settings_model`
- Indexes: `category`, `key`

**API 레이어**:
- Server Actions: `getSettingsByCategory()`, `upsertSetting()`, `updateSettings()`
- Zod 스키마 검증

**UI 레이어**:
- Server Component: `src/app/dashboard/settings/page.tsx`
- Client Components:
  - `src/app/dashboard/settings/components/system-settings.tsx`
  - `src/app/dashboard/settings/components/user-management.tsx`
  - `src/app/dashboard/settings/components/api-keys.tsx`

### 관측/운영 (Observability)

**현재**: 특별한 모니터링 없음

**권장**:
- 설정 변경 로그 저장
- 변경 이력 대시보드
- 이상 징후 알림

### 실패 모드/대응 (Failure Modes)

**Zod 검증 실패**:
- 에러 메시지 표시
- 설정 저장 불가

**DB 실패**:
- 에러 메시지 표시
- 트랜잭션 롤백

**권한 없음**:
- 401 Unauthorized 또는 403 Forbidden
- 에러 메시지 표시

---

## 데이터 구조 (Data Structure)

### Setting Model

**Location**: `prisma/schema.prisma` (L224-L237)

**Schema**:
```prisma
model Setting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  category  String
  type      String
  label     String
  updatedBy String?
  updatedAt DateTime @updatedAt

  @@index([category])
  @@index([key])
}
```

### 기본 설정 데이터

**Location**: `src/app/actions/settings.ts` (L19-L79)

**Default Settings**:
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

### Zod Schemas

**Setting Schema**:
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

**UserRole Schema**:
```typescript
const userRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'GUEST']),
});
```

---

## API 명세 (API Specifications)

### Server Actions

#### getSettingsByCategory(category: string)

**Purpose**: 카테고리별 설정 조회

**Auth**: `auth()`로 세션 확인

**Returns**:
```typescript
{
  success: boolean;
  data?: Setting[];
  error?: string;
}
```

**Example**:
```typescript
const result = await getSettingsByCategory('blog');
// { success: true, data: [{ id, key: 'blog.title', value: 'DEV_BBAK 블로그', ... }] }
```

#### getAllSettings()

**Purpose**: 전체 설정 조회

**Auth**: `auth()`로 세션 확인

**Returns**:
```typescript
{
  success: boolean;
  data?: Setting[];
  error?: string;
}
```

#### upsertSetting(data)

**Purpose**: 설정 생성 또는 업데이트

**Auth**: `auth()`로 세션 확인

**Validation**: `settingSchema` (Zod)

**Returns**:
```typescript
{
  success: boolean;
  data?: Setting;
  error?: string;
}
```

**Side Effects**: `revalidatePath('/dashboard/settings')`

#### deleteSetting(key: string)

**Purpose**: 설정 삭제

**Auth**: `auth()`로 세션 확인

**Returns**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**Side Effects**: `revalidatePath('/dashboard/settings')`

#### updateSettings(settings: { key, value }[])

**Purpose**: 일괄 설정 업데이트

**Auth**: `auth()`로 세션 확인

**Transaction**: 원자성 보장

**Returns**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**Side Effects**: `revalidatePath('/dashboard/settings')`

#### updateUserRole(data)

**Purpose**: 사용자 역할 변경

**Auth**: `session.user.role === 'SUPER_ADMIN'` 확인

**Validation**: `userRoleSchema` (Zod)

**Constraints**:
- 자신의 역할 변경 불가
- SUPER_ADMIN만 호출 가능

**Returns**:
```typescript
{
  success: boolean;
  data?: User;
  error?: string;
}
```

**Side Effects**: `revalidatePath('/dashboard/settings')`

#### seedDefaultSettings()

**Purpose**: 초기 설정 데이터 시딩

**Auth**: `auth()`로 세션 확인

**Constraints**: 기존 데이터 있으면 실패

**Returns**:
```typescript
{
  success: boolean;
  data?: Setting[];
  error?: string;
}
```

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**시나리오 1: 블로그 제목 변경**
1. 관리자가 `/dashboard/settings` 접속
2. "시스템 설정" 탭 선택
3. "블로그" 카테고리 확장
4. "블로그 제목" 필드 수정
5. "저장" 버튼 클릭
6. `upsertSetting()` Server Action 호출
7. 재검증으로 페이지 갱신
8. 변경된 제목 즉시 반영

**시나리오 2: 일괄 설정 업데이트**
1. 여러 설정을 동시에 수정
2. "모두 저장" 버튼 클릭
3. `updateSettings()` Server Action 호출
4. 트랜잭션으로 원자성 보장
5. 실패 시 전체 롤백

**시나리오 3: 사용자 역할 변경**
1. SUPER_ADMIN이 `/dashboard/settings` 접속
2. "사용자 관리" 탭 선택
3. 사용자 목록에서 역할 드롭다운 클릭
4. "ADMIN" → "SUPER_ADMIN" 선택
5. `updateUserRole()` Server Action 호출
6. 성공 메시지 표시

**시나리오 4: 초기 설정 시딩**
1. 처음 배포 후
2. `seedDefaultSettings()` Server Action 호출
3. 기본 설정 데이터 생성
4. 블로그 제목, 설명, 작성자 등 초기값 설정

### 실패 시나리오

**시나리오 1: Zod 검증 실패**
1. 빈 키로 설정 생성 시도
2. "키를 입력해주세요" 에러 메시지
3. 설정 저장 불가

**시나리오 2: 권한 없음**
1. GUEST가 설정 수정 시도
2. 권한 부족 에러 메시지
3. 읽기 전용 모드

**시나리오 3: 자신의 역할 변경**
1. SUPER_ADMIN이 자신의 역할을 GUEST로 변경 시도
2. "자신의 역할은 변경할 수 없습니다" 에러 메시지
3. 역할 변경 불가

**시나리오 4: 중복 키**
1. 이미 존재하는 키로 설정 생성 시도
2. DB unique 제약조건 위반
3. 에러 메시지 표시

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안 (Security)

- **인증**: 모든 Server Actions에서 `auth()`로 세션 확인
- **권한**: RBAC로 최소 권한 원칙 적용
- **데이터 검증**: Zod 스키마로 런타임 검증
- **감사**: `updatedBy` 필드로 수정자 추적
- **API 키 마스킹**: 민감 키는 마스킹 표시

### 성능 (Performance)

**쿼리 최적화**:
- 인덱스 활용: `category`, `key`
- 카테고리별 조회로 필요한 데이터만 로드

**캐싱**:
- 현재 Redis 캐시 적용 안 됨
- 추후 캐싱 도입 가능 (TTL: 5분)

### 운영 (Operational)

**재검증**:
- `revalidatePath('/dashboard/settings')`로 페이지 갱신
- 변경 즉시 반영

**트랜잭션**:
- `updateSettings()`는 트랜잭션으로 원자성 보장
- 실패 시 전체 롤백

### 배포 (Deployment)

**Migration**:
- `20260102130251_add_settings_model` 실행 필요
- Prisma Migrate로 자동 적용

**데이터 시딩**:
- `seedDefaultSettings()`로 초기 데이터 생성
- 처음 배포 후 실행 필요

### 롤백 (Rollback)

- **문제 발생 시**: DB에서 해당 설정 레코드 삭제
- **영향 범위**: UI에서만 사용, 환경 변수 영향 없음
- **대안**: .env 파일로 직접 설정

### 호환성/마이그레이션 (Compatibility)

**기존 설정**:
- 환경 변수(.env)에서 UI로 마이그레이션 필요
- 양방향 동기화 아님 (UI or .env 선택)

**Prisma 버전**:
- Prisma 5.x 이상 필요

---

## 향후 확장 가능성 (Future Expansion)

### Phase 2 (1-2 months)

1. **더 많은 카테고리**
   - SEO 설정 (메타 태그, OG 이미지)
   - Analytics 설정 (Google Analytics, Plausible)
   - Notifications 설정 (이메일, Slack)

2. **변경 이력 강화**
   - 설정 변경 이력 상세화
   - 이전 값, 새 값, 변경 시간, 변경자
   - 롤백 기능

3. **설정 가져오기/내보내기**
   - JSON 형식으로 설정 내보내기
   - 설정 가져오기 (검증 포함)

### Phase 3 (3+ months)

4. **플러그인 시스템**
   - 설정 확장 가능한 플러그인 아키텍처
   - 커스텀 카테고리/키 추가

5. **설정 롤백**
   - 특정 시점으로 롤백
   - 변경 이력에서 선택

6. **환경 변수 동기화**
   - UI 변경 시 .env 파일도 자동 업데이트
   - 양방향 동기화

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD Items

1. **SEO 설정**
   - 메타 태그, OG 이미지 설정 필요 여부
   - 카테고리 추가 여부

2. **변경 이력**
   - 상세한 변경 이력 저장 필요 여부
   - 보관 기간

3. **환경 변수 동기화**
   - UI와 .env 양방향 동기화 필요 여부
   - 우선순위 (UI or .env)

### Data Needed

1. **사용량 데이터**
   - 설정 변경 빈도
   - 카테고리별 사용률
   - 환경 변수 vs UI 사용 비율

2. **성능 데이터**
   - 설정 조회 응답 시간
   - DB 쿼리 성능

3. **사용자 피드백**
   - UI/UX 개선점
   - 필요한 추가 설정

---

## 관련 파일 (Related Files)

### Database
- `prisma/schema.prisma`: Setting 모델 정의
- `prisma/migrations/20260102130251_add_settings_model/migration.sql`: Migration SQL

### Backend
- `src/app/actions/settings.ts`: Server Actions (CRUD, User Management)
- `src/env.ts`: 환경 변수 스키마

### Frontend
- `src/app/dashboard/settings/page.tsx`: 설정 페이지 메인
- `src/app/dashboard/settings/components/system-settings.tsx`: 시스템 설정
- `src/app/dashboard/settings/components/user-management.tsx`: 사용자 관리
- `src/app/dashboard/settings/components/api-keys.tsx`: API 키

---

## 참고 문헌 (References)

- [Facts: Settings Management](../../facts/apps/blog-admin/features/settings.md)
- [Facts: Database Schema](../../facts/apps/blog-admin/schemas/db.md)
- [Insights: Settings Business Impact](../../insights/apps/blog-admin/impact/settings.md)
- [CLAUDE.md: Type-Safe Environment Variables](../../../CLAUDE.md#type-safe-environment-variables)
