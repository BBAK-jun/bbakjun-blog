# 경력 관리 시스템 (Experience Management System)

- **App**: apps/blog-admin
- **Status**: As-Is (현재 구현)
- **Scope**: 경력 타임라인 및 성과 관리, Blog About 페이지 표시
- **Last Verified**: 2025-12-31
- **Repo Ref**: c0049e1e70738fbbfaee84f1ebcf7964c7c7d62d

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2025-12-31
- **Verification Results**:
  - `../../facts/apps/blog-admin/features/experience-management.md`: ✅ Verified
  - `../../facts/apps/blog-admin/schemas/db.md`: ✅ Verified
- **Spec Status**: As-Is (모든 사실 검증됨)

## Based on

- Facts: [Experience Management](../../facts/apps/blog-admin/features/experience-management.md)
- Facts: [Database Schema](../../facts/apps/blog-admin/schemas/db.md)
- Insights: [Experience Business Context](../../insights/apps/blog-admin/exec/experience-business-context.md)

---

## 개요 (Overview)

### 목적 (Purpose)

블로그 소유자의 커리어 타임라인과 주요 성과를 체계적으로 관리하고, Blog About 페이지에 시각화하여 방문자에게 저자의 전문성을 투명하게 전달합니다.

### 범위 (Scope)

**In Scope**:
- 경력(Experience) CRUD: 회사, 직책, 팀, 근무 기간, 설명
- 성과(Achievement) CRUD: 제목, 설명, 태그
- 정렬 기능: 드래그앤드롭, sortOrder 필드
- Blog 통합: About 페이지에 ExperienceTimeline 컴포넌트로 표시
- 초기 데이터 시드: 5개 회사 경력 데이터

**Out of Scope**:
- 다국어 지원
- 이미지 업로드 (회사 로고)
- PDF export
- LinkedIn import
- 공개 노출 설정 (현재 모두 공개)

### 비즈니스 가치 (Business Value)

- **신뢰도 구축**: 방문자에게 저자의 실무 경험 시각화
- **개인 브랜딩**: 전문 강사, 개발자로서 포지셔닝
- **네트워킹**: 채용 기회, 협업 제안 증가

---

## 핵심 기능 (Core Features)

### 1. 경력 관리 (Experience Management)

**기능**: 경력(Experience) 생성, 수정, 삭제, 조회

**세부 동작**:
- **조회**: `getExperiences()` Server Action 호출
  - 정렬: `isCurrent DESC`, `sortOrder DESC`, `createdAt DESC`
  - 성과 포함: `achievements` (sortOrder ASC)
- **생성**: `createExperience(data)` Server Action
  - 필수 필드: company, position, period
  - 선택 필드: team, description
  - 기본값: isCurrent=false, sortOrder=0
- **수정**: `updateExperience(id, data)` Server Action
  - 모든 필드 수정 가능
  - 재직중 상태 변경 가능
- **삭제**: `deleteExperience(id)` Server Action
  - Cascade: 관련 Achievement 자동 삭제
  - 확인 모달 표시

**UI**:
- 타임라인 형식 표시
- 드래그앤드롭 정렬 (dnd-kit)
- 실시간 미리보기
- 편집/삭제 버튼

### 2. 성과 관리 (Achievement Management)

**기능**: 각 경력별 성과(Achievement) CRUD

**세부 동작**:
- **조회**: Experience 조회 시 포함
- **생성**: `createAchievement(experienceId, data)`
  - 필수: title, description
  - 선택: tags (JSON 배열 형식)
- **수정**: `updateAchievement(id, data)`
- **삭제**: `deleteAchievement(id)`

**UI**:
- 각 경력 카드 내 성과 리스트
- 모달 폼으로 생성/수정
- 태그 표시 (기술 스택 등)

### 3. 초기 데이터 시드 (Seed Data)

**기능**: 5개 회사 초기 경력 데이터 일괄 생성

**데이터**:
1. 비바리퍼블리카 (토스) - 재직중
2. 데이원컴퍼니
3. 휴톰
4. 세진마인드
5. 무른모 (인턴)

**제약**:
- 기존 데이터 있으면 실패
- 슈퍼 관리자만 실행 가능
- 재시드 방지 (1회성)

### 4. Blog 통합 (Blog Integration)

**기능**: About 페이지에 경력 타임라인 표시

**구현**:
- RPC: `GET /api/rpc/getExperiences`
- Blog 컴포넌트: `ExperienceTimeline`
- 데이터 소스: Blog-Admin PostgreSQL (via RPC)

**스타일링**:
- Tailwind CSS
- 타임라인 시각화
- 다크 모드 지원

---

## 기술 사양 (Technical Specifications)

### 아키텍처 (Architecture)

```
Blog-Admin UI (/dashboard/experience)
    ↓ (Server Actions)
Prisma ORM (PostgreSQL)
    ↓ (Hono RPC)
Blog App (About Page)
    ↓
ExperienceTimeline Component
```

### 의존성 (Dependencies)

**Backend**:
- `@prisma/client`: ORM
- `next`: App Router, Server Actions
- `@auth/core`: NextAuth.js (session check)
- `zod`: Schema validation

**Frontend**:
- `react-hook-form`: Form state
- `@hookform/resolvers`: Zod integration
- `@dnd-kit/core`: 드래그앤드롭
- `@repo/ui`: UI components (Card, Button, Badge, Dialog)
- `lucide-react`: Icons
- `sonner`: Toast notifications

**Shared**:
- `@repo/types`: TypeScript types

### 구현 접근 (Implementation Approach)

**데이터베이스**:
- Prisma migrations
- Experience, Achievement 모델
- Index: isCurrent, sortOrder, createdAt

**Server Actions**:
- `'use server'` 지시어
- Auth.js 세션 확인
- Zod validation
- Revalidation: `/dashboard/experience`

**RPC**:
- Hono with OpenAPI
- `GET /api/rpc/getExperiences`
- Type-safe client (hc)

---

## 데이터 구조 (Data Structure)

### Prisma Schema

```prisma
model Experience {
  id            String   @id @default(cuid())
  company       String
  position      String
  team          String?
  period        String
  isCurrent     Boolean  @default(false)
  description   String?
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  achievements  Achievement[]

  @@index([isCurrent])
  @@index([sortOrder])
  @@index([createdAt])
}

model Achievement {
  id            String   @id @default(cuid())
  title         String
  description   String   @db.Text
  tags          String?
  sortOrder     Int      @default(0)
  experienceId  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  experience    Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)

  @@index([experienceId])
  @@index([sortOrder])
}
```

### Zod Schema

```typescript
const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, '회사명을 입력해주세요'),
  position: z.string().min(1, '직책을 입력해주세요'),
  team: z.string().optional(),
  period: z.string().min(1, '근무 기간을 입력해주세요'),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  sortOrder: z.number().default(0),
});

const achievementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, '성과 제목을 입력해주세요'),
  description: z.string().min(1, '성과 설명을 입력해주세요'),
  tags: z.string().optional(),
  sortOrder: z.number().default(0),
});
```

---

## API 명세 (API Specifications)

### Server Actions

| Action | Input | Output | Auth |
|--------|-------|--------|------|
| `getExperiences()` | - | `{ success: true, data: Experience[] }` | Required |
| `createExperience(data)` | `experienceSchema` | `{ success: true, data: Experience }` | Required |
| `updateExperience(id, data)` | id, `experienceSchema` | `{ success: true, data: Experience }` | Required |
| `deleteExperience(id)` | id | `{ success: true }` | Required |
| `createAchievement(expId, data)` | expId, `achievementSchema` | `{ success: true, data: Achievement }` | Required |
| `updateAchievement(id, data)` | id, `achievementSchema` | `{ success: true, data: Achievement }` | Required |
| `deleteAchievement(id)` | id | `{ success: true }` | Required |
| `seedExperiences()` | - | `{ success: true, data: Experience[] }` | Required (Super Admin) |

### Hono RPC (Blog App)

| Endpoint | Method | Response | Auth |
|----------|--------|----------|------|
| `/api/rpc/getExperiences` | GET | `{ success: true, data: Experience[] }` | Public |

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**시나리오 1: 경력 추가**
1. 관리자가 `/dashboard/experience` 접속
2. "경력 추가" 버튼 클릭
3. 회사명, 직책, 근무 기간 입력
4. 저장 → DB에 저장, Revalidation
5. 실시간 미리보기에 표시
6. Blog About 페이지에서 확인

**시나리오 2: 성과 추가**
1. 기존 경력 카드 클릭
2. "성과 추가" 버튼 클릭
3. 제목, 설명, 태그 입력
4. 저장 → 경력에 성과 추가

**시나리오 3: 정렬 변경**
1. 드래그앤드롭으로 경력 순서 변경
2. sortOrder 자동 업데이트
3. DB에 저장

**시나리오 4: Blog 표시**
1. 방문자가 `/about` 접속
2. RPC `/api/rpc/getExperiences` 호출
3. ExperienceTimeline 컴포넌트 렌더링
4. 타임라인 표시

### 실패 시나리오

**시나리오 1: 인증 실패**
- 미인증 사용자가 접속 → 로그인 페이지로 리디렉션

**시나리오 2: Validation 실패**
- 필수 필드 누락 → Zod error + Toast

**시나리오 3: 중복 시드**
- 이미 데이터 있으면 시드 실패 → Toast

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안 (Security)

- **인증**: 모든 Server Actions에 세션 확인
- **권한**: 슈퍼 관리자만 시드 가능
- **SQL Injection**: Prisma ORM으로 방지

### 성능 (Performance)

- **조회**: Index 사용 (isCurrent, sortOrder, createdAt)
- **Revalidation**: 변경 경로만 무효화
- **RPC**: 공개 접근 (캐시 가능)

### 데이터 무결성 (Data Integrity)

- **Cascade 삭제**: Experience 삭제 시 Achievement 자동 삭제
- **Unique 제약조건**: 현재 없음 (중복 허용)
- **sortOrder**: 정렬 시 충돌 가능성 (현재 비관리)

### 운영 (Operational)

- **백업**: PostgreSQL 자동 백업 (Neon)
- **마이그레이션**: Prisma migrations
- **롤백**: Migration rollback 가능

### 배포 (Deployment)

- **환경 변수**: 없음 (Prisma만 사용)
- **데이터베이스**: Neon PostgreSQL (프로비저닝 필요)
- **마이그레이션**: 배포 시 자동 실행 (`postinstall`)

---

## 향후 확장 가능성 (Future Expansion)

### Phase 2 (1-2 months)

1. **이미지 업로드**
   - 회사 로고
   - 프로젝트 썸네일
   - Vercel Blob 저장

2. **다국어 지원**
   - 영문/국문 이중 지원
   - locale 필드 추가

3. **SEO 최적화**
   - JSON-LD Structured Data
   - About 페이지 메타데이터

### Phase 3 (3+ months)

1. **LinkedIn Import**
   - LinkedIn API 연동
   - 프로필 자동 가져오기

2. **PDF Export**
   - 경력 이력서 다운로드
   - 포트폴리오 PDF

3. **공개/비공개 설정**
   - 특정 경력 숨기기
   - 공개 범위 설정

4. **스킬 태그 시스템**
   - 경력별 스킬 추출
   - 스킬 클라우드 표시

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD Items

1. **중복 경력 정책**
   - 같은 회사에서 여러 직책?
   - 재입력 경력 처리?

2. **sortOrder 자동 관리**
   - 드래그앤드롭 시 충돌 방지?
   - 간격 두기 (10, 20, 30)?

3. **성과 태그 형식**
   - JSON 배열 파싱 로직
   - 태그 추천 시스템?

### Data Needed

1. **사용자 피드백**
   - 드래그앤드롭 직관성
   - 폼 필드 충분성
   - 미리보어 정확도

2. **Analytics**
   - About 페이지 방문율
   - 경력 클릭률
   - 체류 시간
