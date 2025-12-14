# Server Actions Migration Guide

블로그 어드민 앱의 API 라우트를 서버 액션으로 마이그레이션한 내역을 정리한 문서입니다.

## 📋 목차

- [개요](#개요)
- [마이그레이션 배경](#마이그레이션-배경)
- [변경 사항](#변경-사항)
- [서버 액션 목록](#서버-액션-목록)
- [캐시 무효화](#캐시-무효화)
- [환경 변수](#환경-변수)
- [배포 가이드](#배포-가이드)

## 개요

**날짜**: 2025-12-14
**목적**: Next.js 서버 액션을 사용하여 API 라우트를 제거하고 코드 간소화
**영향 범위**: `apps/blog-admin` 전체

## 마이그레이션 배경

### 기존 문제점

1. **복잡한 인증 로직**
   - 매 API 호출마다 `/api/admin/session`을 호출하여 API 키 확인
   - 클라이언트에서 수동으로 세션 관리 필요
   - 인증 실패 시 에러 처리 중복

2. **보일러플레이트 코드**
   - `fetch()` 호출, 헤더 설정, 에러 처리 반복
   - API 라우트와 클라이언트 코드 간 타입 불일치 가능성

3. **유지보수 어려움**
   - API 라우트 파일과 클라이언트 코드 분리로 인한 관리 부담
   - 변경 시 여러 파일 수정 필요

### 서버 액션의 장점

1. **간소화된 코드**
   - 서버 함수를 직접 호출하는 간단한 인터페이스
   - 자동 직렬화/역직렬화
   - TypeScript 타입 안전성 보장

2. **자동 인증**
   - Next.js가 세션 자동 관리
   - 별도의 인증 로직 불필요

3. **개발 생산성**
   - 파일 수 감소
   - 에러 처리 단순화
   - 빠른 피드백 루프

## 변경 사항

### 제거된 API 라우트

다음 API 엔드포인트가 서버 액션으로 대체되었습니다:

| API 엔드포인트 | 메서드 | 대체 서버 액션 |
|---|---|---|
| `/api/admin/session` | GET | _(제거됨 - 자동 인증)_ |
| `/api/admin/upload` | POST | `uploadMarkdown()` |
| `/api/admin/files` | GET | `listFiles()` |
| `/api/admin/file` | DELETE | `deleteFile()` |
| `/api/admin/file/content` | GET | `getFileContent()` |

### 업데이트된 페이지

#### 1. Upload Page (`src/app/dashboard/upload/page.tsx`)

**Before:**
```typescript
// 세션 확인
const sessionResponse = await fetch("/api/admin/session");
const { apiKey } = await sessionResponse.json();

// 파일 업로드
const response = await fetch("/api/admin/upload", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}` },
  body: formData,
});
```

**After:**
```typescript
import { uploadMarkdown } from "@/app/actions/files";

const result = await uploadMarkdown(formData);
```

#### 2. Files Page (`src/app/dashboard/files/page.tsx`)

**Before:**
```typescript
// 세션 확인 후 파일 목록 조회
const sessionResponse = await fetch("/api/admin/session");
const { apiKey } = await sessionResponse.json();

const response = await fetch("/api/admin/files?limit=100", {
  headers: { Authorization: `Bearer ${apiKey}` },
});
```

**After:**
```typescript
import { listFiles, deleteFile } from "@/app/actions/files";

const result = await listFiles(100);
```

#### 3. File View Page (`src/app/dashboard/files/view/page.tsx`)

**Before:**
```typescript
const sessionResponse = await fetch("/api/admin/session");
const { apiKey } = await sessionResponse.json();

const response = await fetch(
  `/api/admin/file/content?pathname=${pathname}`,
  { headers: { Authorization: `Bearer ${apiKey}` } }
);
```

**After:**
```typescript
import { getFileContent } from "@/app/actions/files";

const result = await getFileContent(pathname);
```

## 서버 액션 목록

모든 서버 액션은 `src/app/actions/files.ts`에 정의되어 있습니다.

### `getFileContent(pathname: string)`

파일 내용과 메타데이터를 Blob Storage에서 가져옵니다.

**반환값:**
```typescript
{
  success: boolean;
  rawContent?: string;          // 원본 마크다운
  htmlContent?: string;         // 렌더링된 HTML
  frontMatter?: object | null;  // YAML front matter
  metadata?: {
    pathname: string;
    size: number;
    uploadedAt: string;
    url: string;
  };
  error?: string;
}
```

**특징:**
- gray-matter로 front matter 파싱
- @repo/content로 마크다운 HTML 변환
- Vercel Blob에서 파일 URL 자동 조회

### `listFiles(limit?: number)`

모든 마크다운 파일 목록을 front matter 정보와 함께 반환합니다.

**매개변수:**
- `limit` (optional): 반환할 최대 파일 수 (기본값: 100)

**반환값:**
```typescript
{
  success: boolean;
  files: Array<{
    filename: string;
    pathname: string;
    size: number;
    uploadedAt: string;
    url: string;
    title: string | null;        // front matter에서 추출
    description: string | null;  // front matter에서 추출
  }>;
  total: number;
  error?: string;
}
```

**특징:**
- 모든 파일의 front matter를 병렬로 파싱 (`Promise.all`)
- 파싱 실패 시에도 기본 정보 반환
- 제목과 설명으로 검색 가능

### `uploadMarkdown(formData: FormData)`

마크다운 파일을 Blob Storage에 업로드합니다.

**FormData 필드:**
- `file`: File - 업로드할 마크다운 파일
- `path`: string - 저장 경로 (예: "DEV/my-post")

**반환값:**
```typescript
{
  success: boolean;
  path?: string;    // 저장된 경로
  url?: string;     // 공개 URL
  size?: number;    // 파일 크기
  error?: string;
}
```

**유효성 검사:**
- 파일 확장자: `.md`, `.mdx`만 허용
- 최대 크기: 10MB
- 경로 새니타이제이션: 앞뒤 슬래시 제거

### `updateFile(pathname: string, content: string)`

기존 파일의 내용을 업데이트합니다.

**매개변수:**
- `pathname`: 업데이트할 파일 경로
- `content`: 새로운 파일 내용 (front matter 포함)

**반환값:**
```typescript
{
  success: boolean;
  message?: string;
  error?: string;
}
```

**부가 기능:**
- 블로그 앱 캐시 자동 무효화
- `/dashboard/files` 경로 재검증
- 실패 시에도 파일 저장은 완료

### `deleteFile(pathname: string)`

Blob Storage에서 파일을 삭제합니다.

**반환값:**
```typescript
{
  success: boolean;
  message?: string;
  error?: string;
}
```

### `uploadImage(formData: FormData)`

이미지를 Blob Storage에 업로드합니다.

**FormData 필드:**
- `file`: File - 이미지 파일

**유효성 검사:**
- 파일 형식: JPEG, PNG, GIF, WebP
- 최대 크기: 5MB
- 파일명 새니타이제이션

### `listImages(limit?: number)`

업로드된 이미지 목록을 반환합니다.

**매개변수:**
- `limit` (optional): 반환할 최대 이미지 수 (기본값: 50)

### `previewMarkdown(content: string)`

마크다운 내용을 HTML로 변환하여 미리보기를 제공합니다.

## 캐시 무효화

### 동작 방식

파일 편집 시 블로그 앱의 캐시를 자동으로 무효화하여 변경사항이 즉시 반영되도록 합니다.

```typescript
// apps/blog-admin/src/app/actions/files.ts
export async function updateFile(pathname: string, content: string) {
  // 1. Blob Storage에 저장
  await put(pathname, content, {
    access: "public",
    token: BLOB_TOKEN,
  });

  // 2. 어드민 캐시 무효화
  revalidatePath("/dashboard/files");

  // 3. 블로그 캐시 무효화
  const slug = pathname.replace(/\/(index\.)?(md|mdx)$/, "");
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;

  await fetch(`${blogUrl}/api/revalidate?path=/blog/${slug}`, {
    method: "POST",
  });
}
```

### 블로그 Revalidation API

**엔드포인트**: `apps/blog/src/app/api/revalidate/route.ts`

**요청:**
```http
POST /api/revalidate?path=/blog/DEV/my-post
```

**응답:**
```json
{
  "revalidated": true,
  "path": "/blog/DEV/my-post",
  "timestamp": "2025-12-14T10:30:00.000Z"
}
```

**무효화되는 경로:**
1. 특정 포스트 페이지: `/blog/{slug}`
2. 홈페이지: `/` (포스트 목록 업데이트)

## 환경 변수

### 개발 환경 (`apps/blog-admin/.env.local`)

```env
# Vercel Blob 토큰
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_***

# 백오피스 API 키
BACKOFFICE_API_KEY=***

# Blob Storage ID
BLOB_STORE_ID=***

# 블로그 앱 URL (캐시 무효화용)
NEXT_PUBLIC_BLOG_URL=http://localhost:3000
```

### 프로덕션 환경 (Vercel)

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

| 변수명 | 값 | 설명 |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | (Vercel Blob 토큰) | Blob Storage 접근 권한 |
| `BACKOFFICE_API_KEY` | (생성된 키) | 백오피스 인증 |
| `BLOB_STORE_ID` | (Blob Store ID) | Blob Storage 식별자 |
| `NEXT_PUBLIC_BLOG_URL` | `https://your-blog.com` | 프로덕션 블로그 URL |

## 배포 가이드

### 1. 환경 변수 설정

Vercel 프로젝트 설정에서:

1. **blog-admin** 프로젝트:
   - `NEXT_PUBLIC_BLOG_URL` = 블로그 프로덕션 URL
   - 기존 환경 변수 유지

2. **blog** 프로젝트:
   - 추가 설정 불필요 (revalidate API는 공개)

### 2. 배포 순서

```bash
# 1. 블로그 앱 먼저 배포 (revalidate API 포함)
cd apps/blog
vercel --prod

# 2. 블로그 어드민 배포 (블로그 URL 확인 후)
cd apps/blog-admin
vercel --prod
```

### 3. 확인 사항

배포 후 다음을 확인하세요:

1. ✅ 파일 목록이 제목과 함께 표시되는지
2. ✅ 파일 업로드가 정상 작동하는지
3. ✅ 파일 편집 후 블로그에 즉시 반영되는지
4. ✅ 파일 삭제가 정상 작동하는지

### 4. 롤백 절차

문제 발생 시:

```bash
# 이전 배포로 롤백
vercel rollback [deployment-url]
```

## 성능 개선

### Before vs After

| 항목 | Before (API Routes) | After (Server Actions) |
|---|---|---|
| 파일 목록 로딩 | 2 requests (session + files) | 1 request |
| 파일 업로드 | 2 requests (session + upload) | 1 request |
| 파일 삭제 | 2 requests (session + delete) | 1 request |
| 클라이언트 코드 | ~150 LOC | ~80 LOC |
| 타입 안전성 | 수동 타입 정의 | 자동 추론 |

### 병렬 처리

`listFiles()` 함수는 모든 파일의 front matter를 병렬로 파싱합니다:

```typescript
const filesWithMetadata = await Promise.all(
  markdownBlobs.map(async (blob) => {
    const response = await fetch(blob.url);
    const content = await response.text();
    const { data: frontMatter } = matter(content);
    return { ...blob, title: frontMatter.title };
  })
);
```

## 트러블슈팅

### 문제: "File not found in Blob Storage"

**원인**: Vercel Blob의 prefix 검색이 랜덤 suffix로 인해 작동하지 않음

**해결**: 전체 blob 목록을 가져온 후 pathname으로 필터링

```typescript
const { blobs } = await list({ token: BLOB_TOKEN });
const blob = blobs.find((b) => b.pathname === pathname);
```

### 문제: 블로그 캐시가 무효화되지 않음

**확인사항:**
1. `NEXT_PUBLIC_BLOG_URL`이 올바르게 설정되었는지
2. 블로그 앱에 `/api/revalidate` 엔드포인트가 배포되었는지
3. 네트워크 에러 로그 확인

**디버깅:**
```typescript
console.log(`Revalidated blog post: /blog/${slug}`);
```

### 문제: Front matter 파싱 실패

**원인**: 잘못된 YAML 형식 또는 인코딩 문제

**해결**: 에러를 catch하고 기본값 반환

```typescript
try {
  const { data: frontMatter } = matter(content);
  return { title: frontMatter.title };
} catch (error) {
  console.error(`Failed to parse front matter:`, error);
  return { title: null };
}
```

## 참고 자료

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [gray-matter](https://github.com/jonschlinkert/gray-matter)
- [Revalidation](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data)

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|---|---|---|
| 2025-12-14 | 1.0.0 | 초기 마이그레이션 완료 |
| 2025-12-14 | 1.1.0 | 파일 목록에 제목/설명 추가 |
| 2025-12-14 | 1.2.0 | 블로그 캐시 무효화 추가 |

---

**작성자**: Claude Sonnet 4.5
**최종 수정**: 2025-12-14
