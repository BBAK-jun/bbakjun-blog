# Utils Overview (blog-admin)

- **Scope**: 유틸리티 함수 조직 및 구조 개요
- **Source of Truth**: FSD 아키텍처 기반 유틸리티 조직
- **Last Verified**: 2025-12-22
- **Repo Ref**: main

## FSD 레이어별 유틸리티 조직

### Shared Layer 유틸리티

**Location**: `src/shared/lib/`

- **Purpose**: 애플리케이션 전반에서 공통으로 사용되는 유틸리티 모음
- **Key Details**:
  - 인증 관련 기능 (JWT 기반 세션, 비밀번호 해싱)
  - 데이터 포매팅 (날짜, 파일 크기)
  - React Query 설정 및 프로바이더
  - 데이터베이스 연결 관리
  - Zod 스키마 정의
- **Dependencies**:
  - bcryptjs: 비밀번호 해싱
  - @tanstack/react-query: 서버 상태 관리
  - zod: 런타임 타입 검증
- **Evidence**:
  - `<src/shared/lib/index.ts>`: 공통 유틸리티 재내보내기
  - `<src/shared/lib/react-query/index.ts>`: QueryProvider 재내보내기

### Entity Layer 유틸리티

**Location**: `src/entities/*/lib/`

- **Purpose**: 각 도메인 엔티티별 비즈니스 로직 및 데이터 처리
- **Key Details**:
  - File 엔티티: Blob CDC 캐싱 구현
  - Frontmatter 엔티티: MDX 프론트매터 파싱
  - Session 엔티티: 세션 관련 로직
- **Dependencies**:
  - @vercel/blob: Vercel Blob Storage API
  - gray-matter: Markdown 프론트매터 파싱
  - Prisma: 데이터베이스 ORM
- **Evidence**:
  - `<src/entities/file/lib/blob-cdc.ts>`: Blob Storage CDC 캐싱
  - `<src/entities/frontmatter/lib/frontmatter.ts>`: 프론트매터 처리

## 유틸리티 카테고리

### 1. 인증 (Authentication)

**Location**: `src/shared/lib/auth/`

- **Purpose**: JWT 기반 인증 및 세션 관리
- **Functions**:
  - `hashPassword()`: bcrypt를 이용한 비밀번호 해싱
  - `verifyPassword()`: 비밀번호 검증
  - `createSession()`: JWT 세션 생성
  - `deleteSession()`: 세션 삭제
  - `verifyApiKey()`: 레거시 API 키 검증
- **Evidence**:
  - `<src/shared/lib/auth/password.ts>`: 비밀번호 해싱 유틸리티
  - `<src/shared/lib/auth/index.ts>`: 인증 관련 함수 재내보내기

### 2. 데이터 포매팅 (Data Formatting)

**Location**: `src/shared/lib/format/`

- **Purpose**: 다양한 데이터 형식 변환 및 포매팅
- **Functions**:
  - `formatDate()`: 한국어 형식 날짜 포맷팅
  - `formatDateLong()`: 상세 날짜 포맷팅
  - `formatFileSize()`: 파일 크기 단위 변환
- **Evidence**:
  - `<src/shared/lib/format/date.ts>`: 날짜 포매팅 함수
  - `<src/shared/lib/format/file-size.ts>`: 파일 크기 포매팅

### 3. 캐싱 (Caching)

**Location**: 여러 레이어에 분산

- **Purpose**: 데이터 조회 성능 최적화
- **Components**:
  - React Query: 클라이언트 캐싱
  - Blob CDC: 서버 측 파일 메타데이터 캐싱
  - ISR 무효화: 블로그 콘텐츠 캐시 관리
- **Evidence**:
  - `<src/shared/lib/react-query/query-provider.tsx>`: React Query 설정
  - `<src/entities/file/lib/blob-cdc.ts>`: CDC 캐싱 구현

### 4. API 서비스 (API Services)

**Location**: `src/shared/api/`

- **Purpose**: 외부 API 호출 및 응답 처리
- **Services**:
  - Blob Files API: 파일 목록 조회
  - Newsletter API: 뉴스레터 구독 관리
  - Upload API: 파일 업로드 처리
  - Views API: 조회수 통계
- **Evidence**:
  - `<src/shared/api/index.ts>`: API 서비스 재내보내기
  - `<src/shared/api/blob-files.ts>`: Blob Files API 스키마

### 5. 검증 (Validation)

**Location**: `src/shared/lib/schemas/`

- **Purpose**: 입력 데이터 검증 및 타입 안전성 보장
- **Schemas**:
  - Frontmatter 스키마: 블로그 포스트 메타데이터
  - File 생성/수정/삭제 스키마
  - 이미지 업로드 스키마
- **Evidence**:
  - `<src/shared/lib/schemas/file.schema.ts>`: 파일 관련 Zod 스키마

## 임포트 패턴 및 사용 규칙

### 권장 임포트 패턴

1. **Shared 유틸리티**:

```typescript
import { formatFileSize, formatDate } from '@/shared/lib';
import { frontmatterSchema } from '@/shared/lib/schemas';
```

2. **Entity 유틸리티**:

```typescript
import { parseFrontMatter } from '@/entities/frontmatter/lib/frontmatter';
import { syncBlobToDatabase } from '@/entities/file/lib/blob-cdc';
```

3. **API 서비스**:

```typescript
import { listFiles } from '@/shared/api';
import { blobFilesQuerySchema } from '@/shared/api/blob-files';
```

### 사용 규칙

1. **FSD 경계 준수**:
   - Shared는 모든 레이어에서 임포트 가능
   - Entity는 다른 Entity에서 직접 임포트 금지
   - Process, Feature에서는 Entity 유틸리티 임포트 가능

2. **타입 안전성**:
   - 모든 입력 데이터는 Zod 스키마로 검증
   - API 응답은 타입으로 정의된 구조 따름

3. **에러 처리**:
   - 유틸리티 함수는 에러를 던지거나 Result 객체 반환
   - API 호출은 공통 에러 핸들러 사용

## 의존성 관계

```
┌─────────────────┐
│    Features     │
└─────────┬───────┘
          │
┌─────────▼───────┐
│    Processes    │
└─────────┬───────┘
          │
┌─────────▼───────┐     ┌─────────────────┐
│    Entities     │◄────│     Shared      │
└─────────┬───────┘     └─────────────────┘
          │
┌─────────▼───────┐
│      Pages      │
└─────────────────┘
```

- **Shared**: 가장 낮은 레벨, 모든 레이어에서 의존
- **Entity**: 공유 유틸리티에 의존
- **Process/Feature**: Shared와 Entity에 의존
- **Pages**: 모든 레이어에 의존 가능
