# Upload History Tracking

- **Scope**: 파일 업로드/수정/삭제 이력 추적 시스템
- **Source of Truth**: `prisma/schema.prisma` (UploadHistory 모델)
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

  deleted_files: []
```

## 개요

파일 업로드, 수정, 삭제 작업의 이력을 추적하고 조회하는 시스템입니다. 작업 유형별 필터링, 페이지네이션, 검색 기능을 제공합니다.

## 데이터 모델

### UploadHistory 모델

- **Location**: `prisma/schema.prisma` (L192-L218)
- **Purpose**: 파일 작업 이력 저장
- **source_exists**: true
- **Migration**: `20250102141000_add_upload_history`
- **Key Details**:
  - `actionType`: ActionType (CREATE, UPDATE, DELETE)
  - `pathname`: 파일 경로
  - `fileUrl`: 파일 URL (삭제 시 null)
  - `fileSize`: 파일 크기 (BigInt, 삭제 시 null)
  - `contentType`: MIME 타입 (삭제 시 null)
  - `uploadedBy`: 작업자 email
  - `createdAt`: 작업 시간
- **Indexes**:
  - `pathname` 인덱스 (파일별 이력 조회)
  - `createdAt` 인덱스 (최신 이력 정렬)
  - `actionType` 인덱스 (작업 유형별 필터링)
- **Evidence**:
  - `prisma/schema.prisma`: L192-L218

### ActionType 열거형

- **Values**:
  - `CREATE`: 파일 생성
  - `UPDATE`: 파일 수정 (URL이 변경됨)
  - `DELETE`: 파일 삭제
- **Evidence**:
  - `prisma/schema.prisma`: L192-L196

## UI 컴포넌트

### History Page

- **Location**: `src/app/dashboard/history/page.tsx` (L1-L27)
- **Purpose**: 업로드 이력 페이지 서버 컴포넌트
- **source_exists**: true
- **Key Details**:
  - Server Component로 초기 데이터 fetch
  - URL 쿼리 파라미터로 페이지네이션 및 필터링
  - `searchParams`: `page`, `search`, `actionType`
- **Props**:
  - `searchParams.page`: 페이지 번호 (default: 1)
  - `searchParams.search`: 검색어 (pathname 기반)
  - `searchParams.actionType`: 작업 유형 필터 (CREATE|UPDATE|DELETE)
- **Data Fetching**:
  ```typescript
  const data = await fetchUploadHistory({
    limit: 50,
    offset: (page - 1) * 50,
    search: searchParams.search,
    actionType: searchParams.actionType,
  });
  ```
- **Evidence**:
  - `src/app/dashboard/history/page.tsx`: L1-L27

### HistoryWidget

- **Location**: `src/app/dashboard/history/history-widget.tsx` (L1-L298)
- **Purpose**: 업로드 이력 위젯 (클라이언트 컴포넌트)
- **source_exists**: true
- **Key Details**:
  1. **검색 및 필터링**:
     - 경로 검색 (`searchTerm`)
     - 작업 유형 필터 (`actionTypeFilter`: ALL, CREATE, UPDATE, DELETE)
     - 필터 초기화 기능
  2. **페이지네이션**:
     - 50개/페이지
     - "더보기" 버튼으로 다음 페이지 로드
  3. **작업 유형 라벨**:
     ```typescript
     const actionTypeLabels = {
       CREATE: { label: '생성', color: 'bg-green-100...' },
       UPDATE: { label: '수정', color: 'bg-blue-100...' },
       DELETE: { label: '삭제', color: 'bg-red-100...' },
     };
     ```
  4. **표시 항목**:
     - 작업 유형 (배지)
     - 파일 경로
     - 파일 크기 (formatFileSize)
     - 작업자
     - 작업 시간 (formatDate)
- **State Management**:
  - `searchTerm`: 검색어
  - `actionTypeFilter`: 작업 유형 필터
  - `page`: 현재 페이지
  - `data`: 이력 데이터
  - `isLoading`: 로딩 상태
  - `error`: 에러 메시지
- **API Calls**:
  - Hono RPC: `client.rpc['upload-history'].$get()`
- **Evidence**:
  - `src/app/dashboard/history/history-widget.tsx`: L1-L298

## API 레이어

### Hono RPC Routes

- **Location**: `src/rpc/routes/upload-history/upload-history.routes.ts` (L1-L52)
- **Purpose**: 업로드 이력 조회 API 엔드포인트
- **source_exists**: true
- **Endpoint**: `GET /rpc/upload-history`
- **Query Parameters**:
  - `limit`: 1~100 (default: 50)
  - `offset`: 0~ (default: 0)
  - `search`: pathname 검색어 (optional)
  - `actionType`: CREATE|UPDATE|DELETE (optional)
- **Response Schema**:
  ```typescript
  {
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
- **OpenAPI Documentation**:
  - Tag: `UploadHistory`
  - Summary: "Get upload history (admin only)"
  - Responses: 200 (OK), 400 (Bad Request), 401 (Unauthorized), 500 (Server Error)
- **Evidence**:
  - `src/rpc/routes/upload-history/upload-history.routes.ts`: L1-L52

### RPC Handlers

- **Location**: `src/rpc/routes/upload-history/upload-history.handlers.ts`
- **Purpose**: 업로드 이력 쿼리 핸들러
- **source_exists**: true
- **Key Functions**:
  1. **필터링 로직**:
     - `search`: pathname LIKE 쿼리 (case-insensitive)
     - `actionType`: 정확히 일치
  2. **페이지네이션**:
     - `limit` + `offset` 기반
     - `hasMore` 계산 (total > offset + limit)
  3. **정렬**:
     - `createdAt DESC` (최신 순)
- **Evidence**:
  - `src/rpc/routes/upload-history/upload-history.handlers.ts`: 전체 파일

### Server Actions

- **Location**: `src/app/actions/upload-history.ts`
- **Purpose**: 업로드 이력 조회 Server Actions
- **source_exists**: true
- **Key Functions**:
  - `fetchUploadHistory({ limit, offset, search, actionType })`: 이력 조회
- **Usage**:
  - History Page에서 초기 데이터 fetch
- **Evidence**:
  - `src/app/actions/upload-history.ts`: 전체 파일

### API Client

- **Location**: `src/shared/api/upload-history.ts`
- **Purpose**: 타입 안전한 업로드 이력 API 클라이언트
- **source_exists**: true
- **Usage Pattern**:
  ```typescript
  import { client } from '@/lib/rpc';

  const response = await client.rpc['upload-history'].$get({
    query: {
      limit: '50',
      offset: '0',
      search: 'posts/',
      actionType: 'CREATE',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  const { history, total, hasMore } = await response.json();
  ```
- **Evidence**:
  - `src/shared/api/upload-history.ts`: 전체 파일

## 자동 기록 메커니즘

### 파일 작업 훅

파일 생성/수정/삭제 시 자동으로 UploadHistory에 기록됩니다:

- **Location**: `src/app/actions/files.ts`
- **source_exists**: true
- **Hook Functions**:
  1. **`onBlobUpload()`**:
     - 파일 생성/수정 시 호출
     - `actionType`: UPDATE (pathname 이미 존재) 또는 CREATE (신규)
     - BlobFile 업데이트와 동시에 UploadHistory 기록
  2. **`onBlobDelete()`**:
     - 파일 삭제 시 호출
     - `actionType`: DELETE
     - `fileUrl`, `fileSize`, `contentType`은 null
- **Evidence**:
  - `src/app/actions/files.ts`: `onBlobUpload()`, `onBlobDelete()` 구현

## 사용자 경험

### 필터링 워크플로우

1. **기본 화면**: 최근 50개 이력 표시 (최신 순)
2. **검색**: 경로 검색어 입력 → 실시간 필터링
3. **작업 유형 필터**: CREATE/UPDATE/DELETE 드롭다운
4. **필터 초기화**: "초기화" 버튼으로 모든 필터 제거
5. **페이지네이션**: "더보기" 버튼으로 다음 50개 로드

### 표시 형식

- **작업 유형**: 컬러 배지 (생성: 초록, 수정: 파랑, 삭제: 빨강)
- **파일 경로**: monospace 폰트로 표시
- **파일 크기**: `formatFileSize()`로 사람이 읽기 쉬운 형식 (KB, MB)
- **작업 시간**: `formatDate()`로 상대적 시간 표시 (예: "2시간 전")

## 빈 상태 처리

- **검색 결과 없음**: "검색 결과가 없습니다" 메시지
- **이력 없음**: "업로드 이력이 없습니다" 메시지
- **로딩 중**: 스피너와 "이력을 불러오는 중..." 메시지
- **에러**: 에러 메시지 표시

## 성능 고려사항

1. **페이지네이션**: 50개/페이지로 대량 데이터 로드 방지
2. **인덱스 활용**: `pathname`, `createdAt`, `actionType` 인덱스로 쿼리 최적화
3. **필터링**: DB 레벨에서 필터링 (클라이언트 필터링 아님)
4. **캐싱**: Redis 캐시 적용 가능 (현재 미구현)

## 관련 파일

- `prisma/schema.prisma`: UploadHistory 모델 정의
- `src/app/dashboard/history/page.tsx`: 이력 페이지
- `src/app/dashboard/history/history-widget.tsx`: 이력 위젯
- `src/rpc/routes/upload-history/upload-history.routes.ts`: RPC 라우트
- `src/rpc/routes/upload-history/upload-history.handlers.ts`: RPC 핸들러
- `src/app/actions/upload-history.ts`: Server Actions
- `src/shared/api/upload-history.ts`: API 클라이언트
- `src/app/actions/files.ts`: 자동 기록 훅
