# TypeScript Types and Interfaces

- **Scope**: TypeScript 타입 정의 및 인터페이스
- **Source of Truth**: src/entities/*/model/types.ts, src/shared/types/
- **Last Verified**: 2025-12-22
- **Repo Ref**: main

## Entity Types

### File Entity Types

#### BlobFile

- **Location**: `src/entities/file/model/types.ts` (L5-L14)
- **Purpose**: Vercel Blob Storage 파일 정보 표현
- **Key Details**:
  - `filename`: 파일 이름
  - `pathname`: 파일 경로 (고유 식별자)
  - `size`: 파일 크기 (bytes)
  - `uploadedAt`: 업로드 타임스탬프 (ISO 문자열)
  - `url`: Blob 접근 URL
  - `title`, `description`, `date`: 마크다운 frontmatter에서 추출
- **Evidence**:
  - `src/entities/file/model/types.ts`: `interface BlobFile { pathname: string; size: number; }`

#### FileMetadata

- **Location**: `src/entities/file/model/types.ts` (L16-L21)
- **Purpose**: 파일 메타데이터 최소한의 정보
- **Key Details**:
  - 파일 식별에 필요한 최소 필드만 포함
  - path, size, uploadedAt, url
- **Evidence**:
  - `src/entities/file/model/types.ts`: `interface FileMetadata { pathname: string; size: number; }`

#### FileContent

- **Location**: `src/entities/file/model/types.ts` (L23-L28)
- **Purpose**: 파일 전체 내용과 메타데이터
- **Key Details**:
  - `rawContent`: 원본 마크다운 내용
  - `htmlContent`: 처리된 HTML 내용
  - `frontMatter`: YAML frontmatter 객체
  - `metadata`: FileMetadata 인스턴스
- **Evidence**:
  - `src/entities/file/model/types.ts`: `frontMatter: Record<string, any> | null`

### Frontmatter Entity Types

#### FrontMatter

- **Location**: `src/entities/frontmatter/model/types.ts` (L5-L14)
- **Purpose**: 블로그 포스트 메타데이터 표준 구조
- **Key Details**:
  - 필수: title, description, date, tags, author
  - 선택적: draft, series, seriesOrder
  - `date`: ISO 날짜 문자열
  - `tags`: 문자열 배열
- **Evidence**:
  - `src/entities/frontmatter/model/types.ts`: `interface FrontMatter { title: string; tags: string[]; }`

#### EditorFormData

- **Location**: `src/entities/frontmatter/model/types.ts` (L19-L29)
- **Purpose**: 폼 데이터 전송용 타입
- **Key Details**:
  - FrontMatter + content 조합
  - content: 마크다운 본문
- **Evidence**:
  - `src/entities/frontmatter/model/types.ts`: `content: string;` 추가됨

### Session Entity Types

#### Session

- **Location**: `src/entities/session/model/types.ts` (L5-L8)
- **Purpose**: API 인증 세션 정보
- **Key Details**:
  - `authenticated`: 인증 상태
  - `apiKey`: API 키 (레거시)
- **Note**: Auth.js v5로 마이그레이션되면서 사용되지 않을 수 있음
- **Evidence**:
  - `src/entities/session/model/types.ts`: `interface Session { authenticated: boolean; apiKey: string; }`

## Shared Types

### User Types

#### User

- **Location**: `src/shared/types/user.ts` (L4-L11)
- **Purpose**: 사용자 계정 정보 (레거시)
- **Key Details**:
  - `passwordHash`: 해시된 비밀번호
  - Auth.js 사용 전 방식
- **Evidence**:
  - `src/shared/types/user.ts`: `passwordHash: string;`

#### LoginCredentials

- **Location**: `src/shared/types/user.ts` (L16-L19)
- **Purpose**: 로그인 요청 데이터
- **Key Details**:
  - username, password 기반 인증
- **Evidence**:
  - `src/shared/types/user.ts`: `{ username: string; password: string; }`

#### SessionPayload

- **Location**: `src/shared/types/user.ts` (L24-L28)
- **Purpose**: JWT에 저장될 세션 데이터
- **Key Details**:
  - 최소한의 사용자 정보만 포함
- **Evidence**:
  - `src/shared/types/user.ts`: `{ userId: string; username: string; email: string; }`

#### Session

- **Location**: `src/shared/types/user.ts` (L33-L35)
- **Purpose**: 전체 세션 정보
- **Key Details**:
  - SessionPayload + 만료 시간
- **Evidence**:
  - `src/shared/types/user.ts`: `expiresAt: Date;` 추가됨

### NextAuth Types

- **Location**: `src/shared/types/next-auth.d.ts`
- **Purpose**: Auth.js v5 타입 확장
- **Key Details**:
  - DefaultSession 확장
  - 사용자 정의 세션 속성 추가
- **Evidence**:
  - `src/shared/types/next-auth.d.ts`: Auth.js 타입 확장

## Feature Types

### File Filter Types

#### SortOption

- **Location**: `src/features/file-filter/model/types.ts` (L5-L11)
- **Purpose**: 파일 목록 정렬 옵션
- **Values**:
  - `name-asc`, `name-desc`: 파일명 정렬
  - `date-asc`, `date-desc`: 날짜 정렬
  - `size-asc`, `size-desc`: 크기 정렬
- **Evidence**:
  - `src/features/file-filter/model/types.ts`: `type SortOption = "name-asc" | "name-desc" | ...`

## API 타입 (Contract로부터 추출)

### Blob Files API

```typescript
// Request/Response 타입 (contracts.ts로부터 추출)
type BlobFilesQuery = {
  limit?: number;
  offset?: number;
  search?: string;
};

type AdminBlobFilesQuery = BlobFilesQuery & {
  limit?: number;  // default: 100
  autoSync?: boolean;  // default: true
};

type BlobFile = {
  id: string;
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  contentType: string | null;
  syncedAt: Date;
  lastChecked: Date;
  isDeleted: boolean;
  uploadedBy: string | null;
};

type BlobFilesResponse = {
  files: BlobFile[];
  total: number;
  hasMore: boolean;
};
```

### Newsletter API

```typescript
// Request/Response 타입
type NewsletterSubscribeBody = {
  email: string;
  source?: string;
};

type NewsletterUnsubscribeBody = {
  token: string;
};

type NewsletterSubscriber = {
  id: string;
  email: string;
  subscribedAt: Date;
  unsubscribedAt: Date | null;
  isActive: boolean;
  source: string | null;
};

type NewsletterStats = {
  total: number;
  active: number;
  inactive: number;
};

type NewsletterSubscribersResponse = {
  subscribers: NewsletterSubscriber[];
  stats: NewsletterStats;
};
```

### Upload API

```typescript
// Request/Response 타입
type UploadMarkdownRequest = {
  file: File;
  path: string;
};

type UploadImageRequest = {
  file: File;
  pathname?: string;
};

type UploadMarkdownResponse = {
  success: boolean;
  path: string;
  url: string;
  size: number;
};

type UploadImageResponse = {
  success: boolean;
  url: string;
  pathname: string;
  size: number;
  contentType: string;
};
```

### Views API

```typescript
// Request/Response 타입
type ViewsSlugParam = {
  slug: string;
};

type ViewsGetQuery = {
  slug: string;
};

type ViewsGetResponse = {
  slug: string;
  views: number;
};

type ViewsIncrementBody = {
  sessionId?: string;
  userAgent?: string;  // default: 'unknown'
};

type ViewsIncrementResponse = {
  slug: string;
  views: number;
  incremented: boolean;
};

type PopularPost = {
  slug: string;
  title: string;
  views: number;
  date: string;
  description?: string;
  tags?: string[];
  readingTime?: string;
};

type ViewsStatsResponse = {
  totalViews: number;
  totalPosts: number;
  averageViews: number;
  popularPosts: PopularPost[];
  recentPosts: PopularPost[];
};
```

## Prisma 생성 타입

Prisma Client에서 생성되는 타입들:

```typescript
// 자동 생성됨 (사용 예시)
import { Prisma } from '@prisma/client';

type UserWithAccounts = Prisma.UserGetPayload<{
  include: { accounts: true };
}>;

type BlobFileCreateInput = Prisma.BlobFileCreateInput;

type SubscriberWhereUniqueInput = Prisma.SubscriberWhereUniqueInput;
```

## 내비게이션 관련 타입 (추론)

레이아웃 컴포넌트에서 사용되는 타입들:

```typescript
// 탭 네비게이션
type DashboardTab =
  | 'create'
  | 'files'
  | 'upload'
  | 'history'
  | 'settings'
  | 'newsletter';

// 정렬 상태
type SortState = {
  option: SortOption;
  direction: 'asc' | 'desc';
};

// 필터 상태
type FilterState = {
  searchTerm: string;
  contentType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
};
```

## 컴포넌트 Props 타입 (추론)

주요 컴포넌트 Props 타입들:

```typescript
// 파일 테이블
type FileTableProps = {
  files: BlobFile[];
  loading?: boolean;
  onSort: (option: SortOption) => void;
  onDelete: (pathname: string) => void;
};

// 파일 에디터
type FileEditorProps = {
  file?: FileContent;
  pathname?: string;
  onSave: (data: EditorFormData) => void;
  onCancel: () => void;
};

// 모달
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
};
```

## 타입 유틸리티

```typescript
// 선택적 필드 만들기
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 필수 필드 만들기
type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ID 타입
type ID = string;

// 타임스탬프 타입
type Timestamp = string; // ISO 8601

// 파일 크기 타입
type FileSize = number; // bytes
```

## 타입 안전성 패턴

### 1. 브랜디드 타입
```typescript
type Pathname = string & { readonly __brand: unique symbol };
type Email = string & { readonly __brand: unique symbol };
```

### 2. Discriminated Unions
```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### 3. 타입 가드
```typescript
function isBlobFile(obj: unknown): obj is BlobFile {
  return typeof obj === 'object' &&
         obj !== null &&
         'pathname' in obj &&
         'size' in obj;
}
```