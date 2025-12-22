# Validation Schemas (Zod)

- **Scope**: Zod 기반 데이터 유효성 검사 스키마
- **Source of Truth**: src/shared/lib/schemas/, src/features/\*/model/form-schema.ts
- **Last Verified**: 2025-12-22
- **Repo Ref**: main

## 파일 관련 스키마

### frontmatterSchema

- **Location**: `src/shared/lib/schemas/file.schema.ts` (L13-L20)
- **Purpose**: 블로그 포스트 메타데이터 검증
- **Key Details**:
  - `title`: 필수, 최소 1자
  - `description`: 필수, 최소 1자
  - `date`: YYYY-MM-DD 형식 정규식 검증
  - `tags`: 문자열 배열, 최소 1개 태그 required
  - `author`: 필수, 최소 1자
  - `draft`: 선택적 boolean
- **Evidence**:
  - `src/shared/lib/schemas/file.schema.ts`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다")`

### createFileSchema

- **Location**: `src/shared/lib/schemas/file.schema.ts` (L26-L47)
- **Purpose**: 새 마크다운 파일 생성 입력 검증
- **Key Details**:
  - `pathname`: '/'로 시작하거나 끝날 수 없음, 빈 부분 허용 안 함
  - 나머지 필드는 frontmatterSchema와 유사
  - `content`: 필수, 최소 1자
  - `series`, `seriesOrder`: 선택적 (시리즈 기능)
- **Validation Rules**:
  - 경로 파싱 후 모든 부분이 비어있지 않은지 검증
- **Evidence**:
  - `src/shared/lib/schemas/file.schema.ts`: `path.split("/").every((part) => part.trim().length > 0)`

### updateFileSchema

- **Location**: `src/shared/lib/schemas/file.schema.ts` (L53-L64)
- **Purpose**: 기존 마크다운 파일 업데이트 입력 검증
- **Key Details**:
  - createFileSchema와 동일한 구조
  - pathname 수정 불가 (존재하는 파일 경로 사용)
- **Evidence**:
  - `src/shared/lib/schemas/file.schema.ts`: createFileSchema와 동일한 필드 구조

### deleteFileSchema

- **Location**: `src/shared/lib/schemas/file.schema.ts` (L69-L71)
- **Purpose**: 파일 삭제 입력 검증
- **Key Details**:
  - `pathname`: 필수, 삭제할 파일 경로
- **Evidence**:
  - `src/shared/lib/schemas/file.schema.ts`: `z.object({ pathname: z.string().min(1, "경로는 필수입니다") })`

### uploadImageSchema

- **Location**: `src/shared/lib/schemas/file.schema.ts` (L77-L89)
- **Purpose**: 이미지 업로드 FormData 검증
- **Key Details**:
  - `file`: File 인스턴스, MIME 타입 검증
  - 지원 형식: JPEG, PNG, GIF, WEBP
  - 최대 크기: 10MB
  - `pathname`: 선택적 (업로드 경로 지정)
- **Validation Rules**:
  - MIME 타입 화이트리스트 방식
  - 파일 크기 제한
- **Evidence**:
  - `src/shared/lib/schemas/file.schema.ts`: `file.size <= 10 * 1024 * 1024`

## 폼 스키마 (클라이언트 사이드)

### fileCreateFormSchema

- **Location**: `src/features/file-create/model/form-schema.ts` (L13-L25)
- **Purpose**: 파일 생성 폼 클라이언트 사이드 검증
- **Key Details**:
  - 한국어 에러 메시지
  - createFileSchema와 유사한 구조
  - `seriesOrder`: 양수 정수 validation 추가
- **Evidence**:
  - `src/features/file-create/model/form-schema.ts`: `z.number().int().positive().optional()`

### fileEditFormSchema

- **Location**: `src/features/file-edit/model/form-schema.ts` (L13-L23)
- **Purpose**: 파일 편집 폼 클라이언트 사이드 검증
- **Key Details**:
  - fileCreateFormSchema에서 series 관련 필드 제외
  - pathname 필드 없음 (기존 파일 편집이므로)
- **Evidence**:
  - `src/features/file-edit/model/form-schema.ts`: series, seriesOrder 필드 없음

## API 컨트랙트 스키마

### Blob Files 관련

#### blobFilesQuerySchema

- **Location**: `src/shared/api/blob-files.ts` (L3-L7)
- **Purpose**: 공개 Blob 파일 목록 쿼리 파라미터
- **Key Details**:
  - `limit`: 1-1000, 기본값 1000
  - `offset`: 0 이상, 기본값 0
  - `search`: 선택적 검색 문자열
- **Evidence**:
  - `src/shared/api/blob-files.ts`: `z.coerce.number().int().min(1).max(1000).default(1000)`

#### adminBlobFilesQuerySchema

- **Location**: `src/shared/api/blob-files.ts` (L9-L12)
- **Purpose**: 관리자 Blob 파일 목록 쿼리 파라미터
- **Key Details**:
  - blobFilesQuerySchema 확장
  - `limit`: 기본값 100 (관리자용 더 작은 페이지 사이즈)
  - `autoSync`: 기본값 true (자동 동기화)
- **Evidence**:
  - `src/shared/api/blob-files.ts`: `autoSync: z.coerce.boolean().default(true)`

#### blobFileSchema

- **Location**: `src/shared/api/blob-files.ts` (L14-L25)
- **Purpose**: 개별 Blob 파일 데이터 구조
- **Key Details**:
  - Prisma BlobFile 모델과 매핑
  - `size`: number 타입 (BigInt 변환됨)
  - `contentType`: nullable string
- **Evidence**:
  - `src/shared/api/blob-files.ts`: `contentType: z.string().nullable()`

### Newsletter 관련

#### newsletterSubscribeBodySchema

- **Location**: `src/shared/api/newsletter.ts` (L4-L7)
- **Purpose**: 뉴스레터 구독 요청 본문
- **Key Details**:
  - `email`: 유효한 이메일 형식
  - `source`: 선택적 구독 경로
- **Evidence**:
  - `src/shared/api/newsletter.ts`: `email: z.string().email()`

#### newsletterUnsubscribeBodySchema

- **Location**: `src/shared/api/newsletter.ts` (L9-L11)
- **Purpose**: 뉴스레터 구독 취소 요청
- **Key Details**:
  - `token`: 최소 1자 (unsubscribeToken)
- **Evidence**:
  - `src/shared/api/newsletter.ts`: `token: z.string().min(1)`

#### newsletterSubscriberSchema

- **Location**: `src/shared/api/newsletter.ts` (L32-L39)
- **Purpose**: 구독자 정보 응답
- **Key Details**:
  - Prisma Subscriber 모델과 매핑
  - 날짜 필드: coerce.date() (문자열→Date 변환)
- **Evidence**:
  - `src/shared/api/newsletter.ts`: `subscribedAt: z.coerce.date()`

### Upload 관련

#### uploadMarkdownRequestSchema

- **Location**: `src/shared/api/upload.ts` (L4-L7)
- **Purpose**: 마크다운 파일 업로드 요청
- **Key Details**:
  - `file`: File 인스턴스
  - `path`: 필수 업로드 경로
- **Evidence**:
  - `src/shared/api/upload.ts`: `path: z.string().min(1)`

#### uploadImageRequestSchema

- **Location**: `src/shared/api/upload.ts` (L9-L12)
- **Purpose**: 이미지 파일 업로드 요청
- **Key Details**:
  - `file`: File 인스턴스
  - `pathname`: 선택적 파일 경로
- **Evidence**:
  - `src/shared/api/upload.ts`: `pathname: z.string().optional()`

### Views 관련

#### viewsSlugParamSchema

- **Location**: `src/shared/api/views.ts` (L4-L6)
- **Purpose**: 경로 파라미터 slug 검증
- **Key Details**:
  - `slug`: 최소 1자
- **Evidence**:
  - `src/shared/api/views.ts`: `slug: z.string().min(1)`

#### viewsIncrementBodySchema

- **Location**: `src/shared/api/views.ts` (L19-L22)
- **Purpose**: 조회수 증가 요청 본문
- **Key Details**:
  - `sessionId`: 선택적 (세션 기반 중복 방지)
  - `userAgent`: 기본값 'unknown'
- **Evidence**:
  - `src/shared/api/views.ts`: `userAgent: z.string().default('unknown')`

#### popularPostSchema

- **Location**: `src/shared/api/views.ts` (L31-L39)
- **Purpose**: 인기 포스트 정보 구조
- **Key Details**:
  - 필수: slug, title, views, date
  - 선택적: description, tags, readingTime
- **Evidence**:
  - `src/shared/api/views.ts`: `readingTime: z.string().optional()`

## 공통 스키마

### errorResponseSchema

- **Location**: `src/shared/api/contracts.ts` (L10-L12)
- **Purpose**: 표준 에러 응답
- **Key Details**:
  - `error`: 에러 메시지 문자열
- **Evidence**:
  - `src/shared/api/contracts.ts`: `z.object({ error: z.string() })`

## 타입 추출

Zod 스키마에서 자동으로 TypeScript 타입 추출:

```typescript
// 예시: file.schema.ts
export type Frontmatter = z.infer<typeof frontmatterSchema>;
export type CreateFileInput = z.infer<typeof createFileInputSchema>;
export type UpdateFileInput = z.infer<typeof updateFileInputSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileInputSchema>;
export type UploadImageInput = z.infer<typeof uploadImageInputSchema>;
```

## 유효성 검사 패턴

### 1. 경로 검증 패턴

```typescript
// '/'로 시작하거나 끝나지 않음
.refine(
  (path) => !path.startsWith('/') && !path.endsWith('/'),
  { message: "경로는 '/'로 시작하거나 끝날 수 없습니다" }
)
```

### 2. 날짜 형식 검증 패턴

```typescript
// YYYY-MM-DD 형식
.regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다")
```

### 3. 파일 타입 검증 패턴

```typescript
.refine(
  (file) => {
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    return validTypes.includes(file.type);
  },
  { message: "이미지 파일만 업로드 가능합니다" }
)
```

### 4. 배열 최소 요소 검증 패턴

```typescript
.array(z.string().min(1))
.min(1, "최소 1개의 태그가 필요합니다")
```

## 에러 메시지 전략

- 한국어 에러 메시지 사용 (프로젝트 언어 일관성)
- 필드별 명확한 에러 메시지
- 형식 요구사항 포함 (예: YYYY-MM-DD)
- 최소/최대 요구사항 명시
