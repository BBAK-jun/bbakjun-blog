# Data Transform Utilities (blog-admin)

- **Scope**: 데이터 변환 유틸리티 함수 상세 설명
- **Source of Truth**: FSD 아키텍처의 데이터 처리 계층
- **Last Verified**: 2025-12-22
- **Repo Ref**: main

## 날짜 포매팅 유틸리티

### formatDate

- **Location**: `src/shared/lib/format/date.ts` (L5-L14)
- **Purpose**: 한국어 형식으로 날짜를 간결하게 포맷팅
- **Key Details**:
  - `YYYY-MM-DD HH:mm` 형식으로 변환
  - `Intl.DateTimeFormat` API 사용 (로케일: ko-KR)
  - 서버/클라이언트 모두에서 동작
- **Usage**: 목록, 테이블 등에서 날짜 표시
- **Evidence**:
  - `<src/shared/lib/format/date.ts>`: Intl.DateTimeFormat을 사용한 날짜 포맷팅

### formatDateLong

- **Location**: `src/shared/lib/format/date.ts` (L16-L25)
- **Purpose**: 한국어 상세 형식으로 날짜 포맷팅
- **Key Details**:
  - `YYYY년 MM월 DD일 HH:mm` 형식으로 변환
  - `month: "long"` 옵션으로 월 이름 표시
- **Usage**: 상세보기 페이지, 로그 기록 등
- **Evidence**:
  - `<src/shared/lib/format/date.ts>`: month: "long" 옵션 사용

## 파일 크기 포매팅 유틸리티

### formatFileSize

- **Location**: `src/shared/lib/format/file-size.ts` (L5-L11)
- **Purpose**: 바이트 단위를 사람이 읽기 쉬운 형태로 변환
- **Key Details**:
  - 지원 단위: Bytes, KB, MB
  - 1024 기준 계산 (이진 접두어)
  - 소수점 2자리까지 반올림
  - 0 바이트 예외 처리
- **Dependencies**: 순수 함수 (외부 의존성 없음)
- **Evidence**:
  - `<src/shared/lib/format/file-size.ts>`: Math.log와 Math.pow를 이용한 단위 계산

## MDX 프론트매터 처리

### parseFrontMatter

- **Location**: `src/entities/frontmatter/lib/frontmatter.ts` (L24-L41)
- **Purpose**: Markdown 파일의 YAML 프론트매터 파싱
- **Key Details**:
  - `gray-matter` 라이브러리 사용
  - 멀티라인 문자열, 배열 등 복잡한 YAML 지원
  - 파싱 실패 시 전체를 body로 반환
  - 프론트매터가 없는 경우 null 반환
- **Dependencies**: gray-matter
- **Interface**: `FrontMatter` 인터페이스 정의
- **Evidence**:
  - `<src/entities/frontmatter/lib/frontmatter.ts>`: gray-matter를 사용한 안전한 파싱

### serializeFrontMatter

- **Location**: `src/entities/frontmatter/lib/frontmatter.ts` (L46-L60)
- **Purpose**: 자바스크립트 객체를 YAML 문자열로 직렬화
- **Key Details**:
  - undefined/null 값 자동 필터링
  - `gray-matter.stringify`로 정상적인 YAML 생성
  - `---` 마커 사이의 내용만 추출
- **Dependencies**: gray-matter
- **Evidence**:
  - `<src/entities/frontmatter/lib/frontmatter.ts>`: 정규표현식으로 YAML 부분 추출

### combineContent

- **Location**: `src/entities/frontmatter/lib/frontmatter.ts` (L65-L76)
- **Purpose**: 프론트매터와 본문을 결합하여 완전한 Markdown 생성
- **Key Details**:
  - undefined/null 값 필터링
  - `gray-matter.stringify`로 마크다운 생성
  - 새 파일 생성 및 기존 파일 업데이트에 사용
- **Dependencies**: gray-matter
- **Evidence**:
  - `<src/entities/frontmatter/lib/frontmatter.ts>`: matter.stringify 사용

## 데이터 직렬화/역직렬화

### BigInt → Number 변환

- **Location**: `src/entities/file/lib/blob-cdc.ts` (L118)
- **Purpose**: 데이터베이스 BigInt를 JSON 호환 가능한 Number로 변환
- **Key Details**:
  - Vercel Blob 파일 크기는 BigInt로 저장
  - API 응답을 위해 Number로 변환
  - 파일 크기가 Number.MAX_SAFE_INTEGER를 초과하지 않음을 가정
- **Dependencies**: 없음 (내장 타입 변환)
- **Evidence**:
  - `<src/entities/file/lib/blob-cdc.ts>`: getCachedBlobFiles 함수 내부 변환

### 경로 → 슬러그 변환

- **Location**: `src/shared/lib/revalidate-blog.ts` (L124-L128)
- **Purpose**: 파일 경로에서 블로그 포스트 슬러그 추출
- **Key Details**:
  - `DEV/my-post/index.mdx` → `DEV/my-post`
  - 정규표현식으로 파일 확장자 및 index 제거
  - ISR 무효화 API 호출 시 사용
- **Dependencies**: 없음 (순수 문자열 처리)
- **Evidence**:
  - `<src/shared/lib/revalidate-blog.ts>`: extractSlugFromPathname 함수

## 타입 변환 유틸리티

### 파일 콘텐츠 변환

- **Location**: `src/entities/file/api/queries.ts` (L54-L67)
- **Purpose**: Shared API 응답을 Entity 타입으로 변환
- **Key Details**:
  - 공유 서비스 응답과 Entity 인터페이스 간 매핑
  - 파일 메타데이터 구조 변환
  - TanStack Query와의 통합을 위한 변환
- **Dependencies**: Entity 타입 정의
- **Evidence**:
  - `<src/entities/file/api/queries.ts>`: useFileQuery 내부 변환 로직

### Zod 타입 추론

- **Location**: `src/shared/lib/schemas/file.schema.ts` (L92-L99)
- **Purpose**: Zod 스키마에서 TypeScript 타입 자동 생성
- **Key Details**:
  - `z.infer<T>` 제네릭 사용
  - 런타임과 컴파일타임 타입 일치 보장
  - API 입력/출력 타입으로 재사용
- **Dependencies**: zod
- **Types**:
  - `Frontmatter`: 프론트매터 타입
  - `CreateFileInput`: 파일 생성 입력 타입
  - `UpdateFileInput`: 파일 수정 입력 타입
- **Evidence**:
  - `<src/shared/lib/schemas/file.schema.ts>`: z.infer를 통한 타입 생성

## 데이터 검증 및 변환

### 날짜 문자열 검증

- **Location**: `src/shared/lib/schemas/file.schema.ts` (L16, L40, L57)
- **Purpose**: YYYY-MM-DD 형식 날짜 문자열 검증
- **Key Details**:
  - 정규표현식 `^\d{4}-\d{2}-\d{2}$` 사용
  - 잘못된 형식시 한글 에러 메시지 제공
- **Dependencies**: zod
- **Evidence**:
  - `<src/shared/lib/schemas/file.schema.ts>`: 날짜 필드 검증 규칙

### 파일 경로 검증

- **Location**: `src/shared/lib/schemas/file.schema.ts` (L27-L37)
- **Purpose**: 파일 경로 형식 및 유효성 검증
- **Key Details**:
  - 슬래시로 시작/끝나지 않음 검증
  - 빈 경로 세그먼트 검증
  - 공백 제거 검증
- **Dependencies**: zod
- **Evidence**:
  - `<src/shared/lib/schemas/file.schema.ts>`: pathname 필드 검증 로직

### 태그 배열 검증

- **Location**: `src/shared/lib/schemas/file.schema.ts` (L17, L41, L58)
- **Purpose**: 블로그 포스트 태그 배열 검증
- **Key Details**:
  - 최소 1개 태그 필수
  - 각 태그는 빈 문자열 불가
  - `z.array(z.string().min(1))` 패턴
- **Dependencies**: zod
- **Evidence**:
  - `<src/shared/lib/schemas/file.schema.ts>`: tags 필드 검증 규칙

## 사용 패턴 및 모범 사례

### 데이터 변환 체이닝

```typescript
// 1. API 응답 수신
const apiResponse = await fetch('/api/files');

// 2. Zod로 데이터 검증
const validatedData = blobFilesResponseSchema.parse(await apiResponse.json());

// 3. Entity 타입으로 변환
const files = validatedData.files.map(transformToFileEntity);

// 4. UI에 맞게 포맷팅
const formattedFiles = files.map(file => ({
  ...file,
  size: formatFileSize(file.size),
  uploadedAt: formatDate(file.uploadedAt)
}));
```

### 에러 처리 패턴

```typescript
// parseFrontMatter 안전한 사용
const { frontMatter, body } = parseFrontMatter(content);

if (!frontMatter) {
  // 프론트매터 없음 처리
  console.warn('No frontmatter found');
}

// Zod 스키마 검증 시 에러 핸들링
try {
  const validated = createFileSchema.parse(input);
  // 성공 처리
} catch (error) {
  if (error instanceof z.ZodError) {
    // 검증 에러 메시지 사용
    return { error: error.errors[0].message };
  }
}
```

### 성능 최적화 팁

1. **메모이제이션**: formatDate, formatFileSize 같은 순수 함수는 React.memo로 감싸기
2. **지연 변환**: 필요할 때까지 변환 지연 (ex: 테이블 스크롤 시)
3. **배치 처리**: 대용량 데이터는 일괄 변환 처리
4. **캐싱**: 변환 결과를 React Query 캐시에 저장