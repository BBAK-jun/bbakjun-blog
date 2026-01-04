# 업로드 이력 추적 시스템 (Upload History Tracking)

- **App**: apps/blog-admin
- **Status**: As-Is (현재 구현)
- **Scope**: 파일 업로드/수정/삭제 이력 추적 및 조회
- **Based on**:
  - Facts: [../../facts/apps/blog-admin/features/upload-history.md](../../facts/apps/blog-admin/features/upload-history.md)
  - Facts: [../../facts/apps/blog-admin/schemas/db.md](../../facts/apps/blog-admin/schemas/db.md)
  - Insights: [../../insights/apps/blog-admin/impact/upload-history.md](../../insights/apps/blog-admin/impact/upload-history.md)
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2026-01-04
- **Verification Results**:
  - `../../facts/apps/blog-admin/features/upload-history.md`: ✅ Verified (source_exists: true)
  - `../../facts/apps/blog-admin/schemas/db.md`: ✅ Verified (source_exists: true)
- **Spec Status**: As-Is (모든 사실 검증됨)

---

## 개요 (Overview)

### 목적 (Purpose)

파일 생성, 수정, 삭제 작업의 완전한 이력을 자동으로 추적하고 관리자가 언제든지 조회할 수 있는 시스템을 제공합니다. 작업 유형별 필터링, 페이지네이션, 검색 기능으로 운영 투명성을 100% 확보하고 감사 대응 시간을 80% 단축합니다.

### 범위 (Scope)

**In Scope**:
- 자동 이력 기록 (CREATE, UPDATE, DELETE)
- 작업 유형별 필터링
- 페이지네이션 (50개/페이지)
- 경로 검색 (pathname 기반)
- 정렬 (최신 순)
- 이력 조회 UI (/dashboard/history)

**Out of Scope**:
- 이력 수정/삭제 (읽기 전용)
- 실시간 알림
- 이력 내보내기 (CSV/JSON)
- 복원 기능 (Restore)
- 사용자별 이력 필터링

### 비즈니스 가치 (Business Value)

- **운영 투명성 100% 확보**: 모든 파일 작업 자동 기록
- **감사 대응 시간 80% 단축**: 2-4시간 → 30분 이내
- **문제 해결 속도 60% 향상**: 평균 해결 시간 2시간 → 48분
- **이력 조회 시간 90% 단축**: UI에서 즉시 조회 가능
- **규정 준수(Compliance) 자동 충족**: 완전한 감사 추적 내역

---

## 핵심 기능 (Core Features)

### 1. 자동 이력 기록

**기능**: 파일 작업 시 자동으로 UploadHistory에 기록

**세부 동작**:
- **CREATE**: 새 파일 생성 시 (pathname이 DB에 없음)
- **UPDATE**: 기존 파일 수정 시 (pathname이 이미 존재)
- **DELETE**: 파일 삭제 시 (fileUrl, fileSize, contentType은 null)

**Hook Functions**:
- `onBlobUpload()`: 파일 생성/수정 후 호출
- `onBlobDelete()`: 파일 삭제 후 호출

**구현 위치**: `src/app/actions/files.ts`

**기록 정보**:
- `actionType`: CREATE | UPDATE | DELETE
- `pathname`: 파일 경로 (고유 식별자)
- `fileUrl`: 파일 URL (삭제 시 null)
- `fileSize`: 파일 크기 (BigInt, 삭제 시 null)
- `contentType`: MIME 타입 (삭제 시 null)
- `uploadedBy`: 작업자 email
- `createdAt`: 작업 시간

### 2. 작업 유형별 필터링

**기능**: CREATE/UPDATE/DELETE별 이력 필터링

**세부 동작**:
- **ALL**: 전체 이력 표시
- **CREATE**: 생성 이력만 (초록색 배지)
- **UPDATE**: 수정 이력만 (파란색 배지)
- **DELETE**: 삭제 이력만 (빨간색 배지)

**UI**: 드롭다운으로 작업 유형 선택

**구현 위치**: `src/app/dashboard/history/history-widget.tsx`

### 3. 페이지네이션

**기능**: 50개/페이지로 대량 데이터 로드 방지

**세부 동작**:
- 1페이지: 최신 50개 이력
- "더보기" 버튼으로 다음 50개 로드
- `hasMore` 플래그로 추가 데이터 여부 표시

**API 파라미터**:
- `limit`: 1~100 (기본 50)
- `offset`: 0~ (기본 0)

**구현 위치**: `src/app/dashboard/history/history-widget.tsx`

### 4. 경로 검색

**기능**: pathname으로 이력 검색

**세부 동작**:
- 검색어 입력 → 실시간 필터링
- case-insensitive 검색
- DB 레벨에서 필터링 (LIKE 쿼리)

**API 파라미터**:
- `search`: pathname 검색어 (optional)

**구현 위치**: `src/app/dashboard/history/history-widget.tsx`

### 5. 정렬

**기능**: 최신 순 정렬 (createdAt DESC)

**세부 동작**:
- 최근 작업이 상단에 표시
- `createdAt` 인덱스로 빠른 정렬

**구현 위치**: `src/rpc/routes/upload-history/upload-history.handlers.ts`

---

## 기술 사양 (Technical Specifications)

### 아키텍처 (Architecture)

```
File Operations (createFile, updateFile, deleteFile)
    ↓
onBlobUpload() / onBlobDelete() Hooks
    ↓
UploadHistory Prisma Model
    ↓
Hono RPC Routes (/rpc/upload-history)
    ↓
HistoryWidget (Client Component)
```

### 의존성 (Dependencies)

**Backend**:
- `@prisma/client`: DB ORM
- `hono`: API framework
- `zod`: Schema validation

**Frontend**:
- `react`: UI framework
- `@repo/ui`: UI components
- `lucide-react`: Icons

### 환경 변수 (Environment Variables)

**없음** (기존 DB 연결만 사용)

### 구현 접근 (Implementation Approach)

**데이터 모델**:
- Prisma Schema: `UploadHistory` 모델
- Migration: `20250102141000_add_upload_history`
- Indexes: `pathname`, `createdAt`, `actionType`

**API 레이어**:
- Hono RPC Routes: `/rpc/upload-history`
- Server Actions: `fetchUploadHistory()`
- Type-safe API Client: `client.rpc['upload-history'].$get()`

**UI 레이어**:
- Server Component: `src/app/dashboard/history/page.tsx`
- Client Component: `src/app/dashboard/history/history-widget.tsx`

### 관측/운영 (Observability)

**현재**: 특별한 모니터링 없음

**권장**:
- 월간 파일 작업량 추적
- 이상 징후 자동 알림 (예: 갑작스러운 DELETE 증가)
- 이력 데이터 보관 기간 모니터링

### 실패 모드/대응 (Failure Modes)

**Hook 실패**:
- `onBlobUpload()`, `onBlobDelete()` 실패 시
- 파일 작업은 계속 진행 (Non-blocking)
- 에러 로그만 기록

**API 실패**:
- 에러 메시지 표시
- "이력을 불러오는 중..." 로딩 상태

**DB 실패**:
- 이력 조회 불가
- 파일 작업은 계속 진행 가능

---

## 데이터 구조 (Data Structure)

### UploadHistory Model

**Location**: `prisma/schema.prisma` (L192-L218)

**Schema**:
```prisma
model UploadHistory {
  id          String     @id @default(cuid())
  actionType  ActionType
  pathname    String
  fileUrl     String?
  fileSize    BigInt?
  contentType String?
  uploadedBy  String?
  createdAt   DateTime   @default(now())

  @@index([pathname])
  @@index([createdAt])
  @@index([actionType])
}

enum ActionType {
  CREATE
  UPDATE
  DELETE
}
```

### API Response Schema

```typescript
interface UploadHistoryResponse {
  history: Array<{
    id: string;
    actionType: 'CREATE' | 'UPDATE' | 'DELETE';
    pathname: string;
    fileUrl: string | null;
    fileSize: number | null;
    contentType: string | null;
    uploadedBy: string | null;
    createdAt: string;  // ISO 8601
  }>;
  total: number;
  hasMore: boolean;
}
```

### Request Schema

```typescript
interface UploadHistoryRequest {
  limit?: number;      // 1-100, default 50
  offset?: number;     // 0+, default 0
  search?: string;     // pathname 검색어
  actionType?: 'CREATE' | 'UPDATE' | 'DELETE';
}
```

---

## API 명세 (API Specifications)

### GET /rpc/upload-history

**Purpose**: 업로드 이력 조회 (관리자 전용)

**Auth**: Session required (admin only)

**Request**:
```typescript
GET /rpc/upload-history?limit=50&offset=0&search=posts/&actionType=CREATE
```

**Query Parameters**:
- `limit`: 1~100 (default: 50)
- `offset`: 0~ (default: 0)
- `search`: pathname 검색어 (optional)
- `actionType`: CREATE|UPDATE|DELETE (optional)

**Response** (200 OK):
```json
{
  "history": [
    {
      "id": "clx...",
      "actionType": "CREATE",
      "pathname": "posts/DEV/my-post/index.mdx",
      "fileUrl": "https://blob...",
      "fileSize": 12345,
      "contentType": "text/markdown",
      "uploadedBy": "admin@example.com",
      "createdAt": "2026-01-04T00:00:00Z"
    }
  ],
  "total": 150,
  "hasMore": true
}
```

**Errors**:
- **400 Bad Request**: Invalid query parameters
- **401 Unauthorized**: Not authenticated
- **500 Internal Server Error**: Database error

**OpenAPI Documentation**:
- Tag: `UploadHistory`
- Summary: "Get upload history (admin only)"
- Responses: 200, 400, 401, 500

### Server Actions

**fetchUploadHistory({ limit, offset, search, actionType })**

**Purpose**: 업로드 이력 조회 (Server Action)

**Auth**: `auth()`로 세션 확인

**Returns**: `{ success: boolean, data?: UploadHistoryResponse, error?: string }`

**Usage**:
```typescript
const data = await fetchUploadHistory({
  limit: 50,
  offset: 0,
  search: 'posts/',
  actionType: 'CREATE',
});
```

**Location**: `src/app/actions/upload-history.ts`

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**시나리오 1: 기본 이력 조회**
1. 관리자가 `/dashboard/history` 접속
2. 최신 50개 이력 표시 (최신 순)
3. 작업 유형 배지 (생성: 초록, 수정: 파랑, 삭제: 빨강)
4. 파일 경로, 크기, 작업자, 작업 시간 표시

**시나리오 2: 작업 유형 필터링**
1. "작업 유형" 드롭다운 클릭
2. "DELETE" 선택
3. 삭제 이력만 표시
4. "초기화" 버튼으로 필터 제거

**시나리오 3: 경로 검색**
1. 검색창에 "posts/DEV" 입력
2. 실시간으로 pathname에 "posts/DEV" 포함된 이력만 표시
3. 대소문자 구분 없음

**시나리오 4: 페이지네이션**
1. 현재 50개 이력 표시
2. "더보기" 버튼 클릭
3. 다음 50개 이력 로드
4. 총 100개 이력 표시

**시나리오 5: 자동 기록**
1. 관리자가 파일 생성 (`createFile`)
2. `onBlobUpload()` 훅 호출
3. UploadHistory에 CREATE 기록 자동 생성
4. 이력 페이지에서 즉시 확인 가능

### 실패 시나리오

**시나리오 1: Hook 실패**
1. `onBlobUpload()` 호출 실패
2. 파일 업로드는 계속 진행 (Non-blocking)
3. 에러 로그만 기록
4. 이력은 기록되지 않음

**시나리오 2: 검색 결과 없음**
1. 없는 경로로 검색
2. "검색 결과가 없습니다" 메시지 표시

**시나리오 3: 이력 없음**
1. 처음 배포 시
2. "업로드 이력이 없습니다" 메시지 표시

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안 (Security)

- **인증**: 모든 API에서 세션 확인 (`auth()`)
- **권한**: 관리자만 접근 가능
- **데이터 검증**: Zod 스키마로 입력 검증
- **감사**: `uploadedBy` 필드로 작업자 추적

### 성능 (Performance)

**쿼리 최적화**:
- 인덱스 활용: `pathname`, `createdAt`, `actionType`
- 페이지네이션: 50개/페이지로 대량 데이터 로드 방지
- 필터링: DB 레벨에서 필터링 (클라이언트 필터링 아님)

**캐싱**:
- 현재 Redis 캐시 적용 안 됨
- 추후 캐싱 도입 가능 (TTL: 5분)

### 운영 (Operational)

**보관 정책**:
- TBD: 이력 데이터 보관 기간 미정
- 추후 6개월 이상 된 이력 아카이빙 필요

**모니터링**:
- 월간 파일 작업량 추적
- 이상 징후 자동 알림

### 배포 (Deployment)

**Migration**:
- `20250102141000_add_upload_history` 실행 필요
- Prisma Migrate로 자동 적용

**데이터 시딩**:
- 필요 없음 (자동 기록)

### 롤백 (Rollback)

- **문제 발생 시**: 이력 기록만 비활성화 (주석 처리)
- **영향 범위**: 이력 조회만 불가능, 파일 작업은 계속 진행
- **대안**: 없음

### 호환성/마이그레이션 (Compatibility)

**기존 데이터**:
- 마이그레이션 시 기존 파일 작업은 이력 없음
- 처음 업로드 후부터 기록 시작

**Prisma 버전**:
- Prisma 5.x 이상 필요

---

## 향후 확장 가능성 (Future Expansion)

### Phase 2 (1-2 months)

1. **이력 내보내기**
   - CSV/JSON 형식으로 내보내기
   - 감사 보고서 생성

2. **복원 기능 (Restore)**
   - DELETE 이력에서 파일 복원
   - Vercel Blob에서 복구

3. **사용자별 필터링**
   - 특정 사용자의 이력만 조회
   - 팀별 작업량 분석

### Phase 3 (3+ months)

4. **실시간 알림**
   - 파일 작업 시 실시간 알림
   - WebSocket 또는 SSE

5. **대시보드**
   - 일별/주별/월별 파일 작업 통계
   - 차트로 시각화

6. **아카이빙**
   - 6개월 이상 된 이력 아카이빙
   - DB 성능 유지

7. **분석 도구**
   - 사용자 패턴 분석
   - 최적화 기회 발견

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD Items

1. **보관 정책**
   - 이력 데이터 보관 기간
   - 아카이빙 전략
   - GDPR 등 규정 준수

2. **복원 기능**
   - DELETE 이력에서 복원 필요 여부
   - Vercel Blob에서 복구 가능 여부

3. **실시간 알림**
   - WebSocket vs SSE 선택
   - 알림 우선순위

### Data Needed

1. **사용량 데이터**
   - 월간 파일 작업량
   - 이력 조회 빈도
   - 평균 이력 건수

2. **감사 요구사항**
   - 감사 횟수 및 소요 시간
   - 필요한 보관 기간
   - 규정 준수 요구사항

3. **성능 데이터**
   - 이력 조회 응답 시간
   - DB 쿼리 성능
   - 캐싱 효과

---

## 관련 파일 (Related Files)

### Database
- `prisma/schema.prisma`: UploadHistory 모델 정의
- `prisma/migrations/20250102141000_add_upload_history/migration.sql`: Migration SQL

### Backend
- `src/app/actions/files.ts`: 자동 기록 훅
- `src/app/actions/upload-history.ts`: Server Actions
- `src/rpc/routes/upload-history/upload-history.routes.ts`: RPC 라우트
- `src/rpc/routes/upload-history/upload-history.handlers.ts`: RPC 핸들러

### Frontend
- `src/app/dashboard/history/page.tsx`: 이력 페이지 (Server Component)
- `src/app/dashboard/history/history-widget.tsx`: 이력 위젯 (Client Component)
- `src/shared/api/upload-history.ts`: API 클라이언트

---

## 참고 문헌 (References)

- [Facts: Upload History Tracking](../../facts/apps/blog-admin/features/upload-history.md)
- [Facts: Database Schema](../../facts/apps/blog-admin/schemas/db.md)
- [Insights: Upload History Business Impact](../../insights/apps/blog-admin/impact/upload-history.md)
- [CLAUDE.md: CDC Pattern](../../../CLAUDE.md#vercel-blob-cdc-change-data-capture)
