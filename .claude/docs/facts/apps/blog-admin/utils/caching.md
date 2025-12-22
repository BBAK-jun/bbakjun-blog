# Caching Strategies (blog-admin)

- **Scope**: 캐싱 전략 및 구현 상세 설명
- **Source of Truth**: FSD 아키텍처의 캐싱 계층
- **Last Verified**: 2025-12-22
- **Repo Ref**: main

## React Query 캐싱

### QueryProvider 설정

- **Location**: `src/shared/lib/react-query/query-provider.tsx` (L6-L23)
- **Purpose**: 애플리케이션 전반의 React Query 기본 설정
- **Key Details**:
  - `staleTime`: 5분 (데이터 신선도 유지)
  - `gcTime`: 30분 (가비지 컬렉션 방지)
  - `retry`: 1 (에러 시 재시도 횟수)
  - `refetchOnWindowFocus`: false (불필요한 재조회 방지)
- **Dependencies**: @tanstack/react-query
- **Evidence**:
  - `<src/shared/lib/react-query/query-provider.tsx>`: 기본 옵션 설정

### 파일 목록 캐싱

- **Location**: `src/entities/file/api/queries.ts` (L23-L35)
- **Purpose**: 파일 목록 조회 캐시 전략
- **Key Details**:
  - `staleTime: 0`: 항상 최신 데이터 요청 (Blob URL 변경 대응)
  - Query Key 구조: `["files", "list", limit]`
  - 실패 시 에러 메시지 제공
- **Invalidation Strategy**:
  - 파일 삭제 후 `fileKeys.lists()` 무효화
  - 생성/수정 후 자동 갱신 (staleTime: 0)
- **Evidence**:
  - `<src/entities/file/api/queries.ts>`: useFilesQuery 구현

### 단일 파일 캐싱

- **Location**: `src/entities/file/api/queries.ts` (L40-L72)
- **Purpose**: 개별 파일 콘텐츠 캐싱
- **Key Details**:
  - `enabled: !!pathname`: 경로 있을 때만 쿼리 실행
  - `staleTime: 0`: 항상 최신 데이터 유지
  - Query Key 구조: `["files", "detail", pathname]`
  - API 응답을 Entity 타입으로 변환
- **Dependencies**: @tanstack/react-query
- **Evidence**:
  - `<src/entities/file/api/queries.ts>`: useFileQuery와 타입 변환

### 캐시 무효화 전략

- **Location**: `src/entities/file/api/queries.ts` (L88-L95)
- **Purpose**: 파일 삭제 후 캐시 정리
- **Key Details**:
  - `setQueryData`: 즉시 캐시에서 삭제
  - `invalidateQueries`: 목록 쿼리 재조회 트리거
  - 낙관적 업데이트 지원
- **Mutation Hook**: `useDeleteFileMutation`
- **Evidence**:
  - `<src/entities/file/api/queries.ts>`: onSuccess 콜백 구현

## Blob CDC (Change Data Capture) 캐싱

### CDC 아키텍처

- **Location**: `src/entities/file/lib/blob-cdc.ts` (L1-L4)
- **Purpose**: Vercel Blob API 호출 최소화를 위한 캐싱 레이어
- **Key Details**:
  - PostgreSQL에 Blob 메타데이터 캐싱
  - 주기적 동기화 (기본 30분 간격)
  - Soft Delete 패턴으로 이력 관리
- **Cost Reduction**: ~97.6% API 호출 감소
- **Dependencies**: @vercel/blob, Prisma
- **Evidence**:
  - `<src/entities/file/lib/blob-cdc.ts>`: CDC 주석 설명

### 동기화 함수 (syncBlobToDatabase)

- **Location**: `src/entities/file/lib/blob-cdc.ts` (L16-L85)
- **Purpose**: Vercel Blob과 DB 간 데이터 동기화
- **Key Details**:
  - 새 파일: DB에 추가 (createMany)
  - 삭제된 파일: `isDeleted: true` 표시 (updateMany)
  - 기존 파일: `lastChecked` 타임스탬프 업데이트
  - 반환값: 통계 정보 (total, added, deleted, existing)
- **Sync Pattern**:
  1. Vercel Blob에서 전체 파일 목록 조회
  2. DB에 저장된 파일 목록과 비교
  3. 변경사항 감지 및 DB 업데이트
- **Evidence**:
  - `<src/entities/file/lib/blob-cdc.ts>`: 3단계 동기화 로직

### 캐시 조회 함수 (getCachedBlobFiles)

- **Location**: `src/entities/file/lib/blob-cdc.ts` (L91-L123)
- **Purpose**: DB에서 캐시된 파일 목록 조회
- **Key Details**:
  - 페이지네이션 지원 (limit, offset)
  - 검색 기능 (pathname contains)
  - `isDeleted: false` 필터링
  - BigInt → Number 변환
  - `hasMore` 플래그로 추가 데이터 존재 여부 표시
- **Performance**: 병렬 실행 (files, total)
- **Evidence**:
  - `<src/entities/file/lib/blob-cdc.ts>`: Promise.all 병렬 조회

### 실시간 훅 (onBlobUpload, onBlobDelete)

- **Location**: `src/entities/file/lib/blob-cdc.ts` (L128-L168)
- **Purpose**: 파일 업로드/삭제 시 실시간 DB 업데이트
- **Key Details**:
  - `onBlobUpload`: `upsert`로 중복 방지
  - `pathname`을 고유 식별자로 사용 (URL은 변경 가능)
  - Soft Delete 복구 기능
  - 실패해도 업로드/삭제는 계속 진행
- **Non-blocking**: 실패 로깅만, 작업 중단 없음
- **Evidence**:
  - `<src/entities/file/lib/blob-cdc.ts>`: upsert와 soft delete 구현

### 동기화 간격 관리

- **Location**: `src/entities/file/lib/blob-cdc.ts` (L185-L192)
- **Purpose**: 동기화 필요 여부 결정
- **Key Details**:
  - `BLOB_SYNC_INTERVAL_MINUTES` 환경변수 사용
  - 마지막 동기화 시간 기준으로 판단
  - 기본값: 30분
- **Environment Variable**: `BLOB_SYNC_INTERVAL_MINUTES`
- **Evidence**:
  - `<src/entities/file/lib/blob-cdc.ts>`: needsSync 함수

## ISR 캐시 무효화

### 블로그 경로 무효화

- **Location**: `src/shared/lib/revalidate-blog.ts` (L22-L71)
- **Purpose**: 특정 블로그 페이지 ISR 캐시 무효화
- **Key Details**:
  - NEXT_PUBLIC_BLOG_URL에 POST 요청
  - `REVALIDATION_SECRET`으로 인증
  - 성공/실패 로깅
  - 에러 시 상세 메시지 반환
- **Environment Variables**:
  - `NEXT_PUBLIC_BLOG_URL`: 블로그 URL
  - `BLOG_REVALIDATION_SECRET`: 인증 토큰
- **Evidence**:
  - `<src/shared/lib/revalidate-blog.ts>`: fetch API 호출 구현

### 전체 페이지 무효화

- **Location**: `src/shared/lib/revalidate-blog.ts` (L77-L118)
- **Purpose**: 모든 블로그 페이지 ISR 캐시 무효화
- **Key Details**:
  - `?all=true` 파라미터 사용
  - 전역 변경 시 유용 (레이아웃, 스타일 등)
  - 동일한 인증 메커니즘 사용
- **Use Case**: 디자인 변경, 전역 설정 수정
- **Evidence**:
  - `<src/shared/lib/revalidate-blog.ts>`: revalidateAllBlogPages 함수

## API 응답 캐싱

### Hono RPC 캐싱

- **Location**: `src/shared/api/blob-files.ts`
- **Purpose**: RPC API 응답 데이터 구조 정의
- **Key Details**:
  - Zod 스키마로 응답 구조 정의
  - 타입 안전한 API 호출
  - 런타임 검증 포함
- **Schemas**:
  - `blobFilesQuerySchema`: 쿼리 파라미터
  - `blobFilesResponseSchema`: 응답 데이터
  - `blobFilesErrorSchema`: 에러 응답
- **Evidence**:
  - `<src/shared/api/blob-files.ts>`: 전체 스키마 정의

### 쿼리 파라미터 최적화

- **Location**: `src/shared/api/blob-files.ts` (L3-L12)
- **Purpose**: API 쿼리 파라미터 표준화
- **Key Details**:
  - 기본값 설정 (limit: 100/1000)
  - 타입 강제 변환 (coerce)
  - 최대/최소값 검증
- **Performance**: 불필요한 API 호출 방지
- **Evidence**:
  - `<src/shared/api/blob-files.ts>`: zod 기본값과 검증

## 캐싱 모범 사례

### 1. 계층별 캐싱 전략

```
Client (React Query)
    ↓
    Server (Blob CDC)
    ↓
    CDN (ISR)
    ↓
    Origin (Vercel Blob)
```

### 2. 캐시 키 설계 원칙

- **계층 구조**: `["entity", "type", "id", "params"]`
- **일관성**: 모든 쿼리에서 동일한 패턴 사용
- **유일성**: 중복 없는 고유 키 생성

### 3. 무효화 타이밍

- **즉시**: 데이터 변경 직후
- **예측 가능**: 일정 간격 자동 갱신
- **필요 시**: 사용자 요청에 따라

### 4. 에러 처리

- **Graceful Degradation**: 캐시 실패 시 폴백
- **Retry Logic**: 일시적 오류 재시도
- **Stale-While-Revalidate**: 오래된 데이터 보여주며 갱신

## 성능 최적화 팁

### React Query

1. **select 옵션**: 필요한 데이터만 변환
2. **initialData**: 즉시 표시할 초기 데이터
3. **placeholderData**: 로딩 중 표시할 데이터
4. **prefetching**: 예상되는 데이터 미리 로드

### Blob CDC

1. **인덱싱**: uploadedAt, isDeleted, lastChecked
2. **배치 처리**: 한 번에 여러 레코드 처리
3. **동기화 간격 조정**: 트래픽에 따라 최적화

### ISR

1. **선택적 무효화**: 변경된 페이지만 갱신
2. **revalidate 비활성화**: 자동 갱신이 필요 없는 페이지
3. **on-demand**: 중요 변경 즉시 반영
