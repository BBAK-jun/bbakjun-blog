# Image Upload API Documentation

이 문서는 blog-admin의 이미지 업로드 시스템에 대한 기술적 세부사항을 문서화합니다.

## 개요

이미지 업로드 기능은 블로그 포스트에 이미지를 첨부하기 위한 핵심 기능입니다. **2026-01-01**에 안정성과 사용자 경험을 크게 개선하는 업데이트가 적용되었습니다. **2026-01-02**에 다중 파일 업로드, 드래그 앤 드롭, 붙여넣기, 커서 위치 삽입 기능이 추가되어 사용자 경험이 더욱 개선되었습니다.

## 아키텍처

```
User (Browser)
    ↓
ImageUploader Component (Client)
    ↓ FormData
uploadImage Server Action
    ↓ (or)
uploadImage RPC Handler
    ↓ (retry logic)
Vercel Blob Storage
    ↓ (CDC)
PostgreSQL BlobFile Table
```

## 구현 요소

### 1. UI Component

**위치**: `shared/ui/image-uploader/image-uploader.tsx`

**기능**:
- **다중 파일 업로드** (multiple prop)
- **드래그 앤 드롭** 지원
- **붙여넣기** 지원 (clipboard API)
- 파일 선택 버튼
- 업로드 진행 표시 (Loader2)
- 에러 메시지 표시
- 성공/실패 카운트 표시

**Props**:
```tsx
interface ImageUploaderProps {
  onImageUploaded: (url: string, filename: string) => void;
  multiple?: boolean; // 다중 파일 업로드 활성화
}
```

**다중 파일 업로드 구현** (2026-01-02 추가):

```tsx
const uploadImages = async (files: FileList | File[]) => {
  setIsUploading(true);
  setError(null);

  const fileArray = Array.from(files);
  let successCount = 0;
  let failCount = 0;

  for (const file of fileArray) {
    // Client-side validation
    const validationError = validateFile(file);
    if (validationError) {
      setError(`${file.name}: ${validationError}`);
      failCount++;
      continue;
    }

    try {
      // Upload directly to Vercel Blob from client
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/rpc/upload/client-token',
        clientPayload: JSON.stringify({
          size: file.size,
          contentType: file.type,
        }),
      });

      onImageUploaded(blob.url, file.name);
      successCount++;
    } catch (err) {
      console.error(`[Image Upload] Error uploading ${file.name}:`, err);
      failCount++;
    }
  }

  if (failCount > 0) {
    setError(`${successCount}개 성공, ${failCount}개 실패`);
  }
};
```

**드래그 앤 드롭 구현**:

```tsx
const handleDragOver = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(true);
}, []);

const handleDragLeave = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);
}, []);

const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    if (multiple || files.length > 1) {
      uploadImages(files);
    } else {
      uploadImage(files[0]);
    }
  }
}, [multiple]);
```

**Validation**:
```tsx
const validateFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`;
  }
  if (file.size > MAX_SIZE) {
    return `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`;
  }
  return null;
};
```

**주요 코드**:
```tsx
const uploadImage = async (file: File) => {
  setIsUploading(true);
  setError(null);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadImageAction(formData);

    if (!result.success || !result.url) {
      throw new Error(result.error || 'Upload failed');
    }

    onImageUploaded(result.url, file.name);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Upload failed');
  } finally {
    setIsUploading(false);
  }
};
```

### 2. Server Action

**위치**: `app/actions/files.ts` - `uploadImage()`

**개선사항** (2026-01-01):

#### a) 고유한 파일명 보장

**문제**: `Date.now()`만 사용하면 동시에 여러 파일을 업로드할 때 충돌 가능성

**해결**: `crypto.randomUUID()` 사용

```typescript
// 이전 (충돌 가능성)
const pathname = `images/${Date.now()}-${sanitizedName}.${extension}`;

// 개선 (고유성 보장)
const uniqueId = crypto.randomUUID().split('-')[0]; // 짧은 ID 사용 (8자)
const pathname = `images/${Date.now()}-${uniqueId}-${sanitizedBaseName}.${extension}`;
```

**파일명 형식**: `images/{timestamp}-{uuid}-{sanitizedName}.{ext}`

**예시**:
- `images/1735689600000-a3f8c9e2-my-photo.jpg`
- `images/1735689600123-b7d2e1f4-screenshot.png`

#### b) 업로드 재시도 로직

**문제**: Vercel Blob 업로드가 일시적으로 실패할 수 있음 (네트워크 오류, 타임아웃 등)

**해결**: 최대 3회 재시도 + 지수 백오프

```typescript
let blob;
let lastError;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    console.log(`[Image Upload] Attempt ${attempt}/3: ${pathname}`);
    blob = await put(pathname, file, {
      access: 'public',
      token: BLOB_TOKEN,
      addRandomSuffix: false,
    });
    break; // 성공 시 루프 탈출
  } catch (putError) {
    lastError = putError;
    console.error(`[Image Upload] Attempt ${attempt} failed:`, putError);

    if (attempt < 3) {
      // 지수 백오프 대기: 1초, 2초, 4초
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

if (!blob) {
  throw lastError || new Error('Failed to upload after 3 attempts');
}
```

**재시도 간격**:
- 1차 시도: 즉시 실행
- 2차 시도: 1초 후 (2^0 × 1000ms)
- 3차 시도: 2초 후 (2^1 × 1000ms)
- 최대 대기 시간: 3초 (1초 + 2초)

#### c) 구체적인 에러 메시지

**문제**: 일반적인 에러 메시지로는 사용자가 대처 방법을 알기 어려움

**해결**: 에러 유형별 한글 메시지 제공

```typescript
let errorMessage = 'Failed to upload image';

if (error instanceof Error) {
  if (error.message.includes('ECONNRESET') || error.message.includes('ETIMEDOUT')) {
    errorMessage = '네트워크 연결이 불안정합니다. 다시 시도해 주세요.';
  } else if (error.message.includes('quota') || error.message.includes('limit')) {
    errorMessage = 'Blob Storage 용량 한도에 도달했습니다.';
  } else if (error.message.includes('auth') || error.message.includes('token')) {
    errorMessage = '인증 오류가 발생했습니다. 관리자에게 문의해 주세요.';
  } else {
    errorMessage = error.message;
  }
}
```

#### d) 파일명 Sanitization 개선

**문제**: 특수문자, 공백, 긴 파일명이 URL 호환성 문제를 일으킬 수 있음

**해결**: 확장자 보존 + 특수문자 제거 + 길이 제한

```typescript
const extension = file.name.split('.').pop() || 'jpg';
const sanitizedBaseName = file.name
  .replace(`.${extension}`, '')  // 확장자 제거
  .replace(/[^a-zA-Z0-9_-]/g, '_')  // 특수문자 → 언더스코어
  .slice(0, 50);  // 길이 제한 (50자)
```

**변환 예시**:
- `My Photo (1).jpg` → `My_Photo__1_` (50자 제한 적용)
- `@#$%^&*().png` → `________.png`
- `very-long-filename-that-exceeds-fifty-characters-limit.jpg` → `very-long-filename-that-exceeds-fifty-char.jpg`

### 3. RPC Handler

**위치**: `rpc/routes/upload/upload.handlers.ts` - `uploadImage`

**인증**: Bearer Token (API Key)

**개선사항**: Server Action과 동일한 재시도 로직 적용

**주요 차이점**:
- Logger 통합 (`c.get('logger')?.info()`)
- API Key 검증 (`requireApiKey()`)
- `pathname` 파라미터 선택적 지원

**코드 예시**:
```typescript
export const uploadImage: AppRouteHandler<typeof routes.uploadImage> = async c => {
  // 인증 검증
  if (!requireApiKey(c.req.header('authorization'))) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  const pathname = formData.get('pathname') as string | null;

  // 파일명 생성 (pathname이 없으면 자동 생성)
  const finalPathname =
    pathname ||
    `images/${Date.now()}-${crypto.randomUUID().split('-')[0]}-${file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 50)}`;

  // 재시도 로직 (Server Action과 동일)
  let blob;
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      c.get('logger')?.info({ attempt, pathname: finalPathname }, 'Image upload attempt');
      blob = await put(finalPathname, file, {
        access: 'public',
        token: BLOB_TOKEN,
        addRandomSuffix: false,
      });
      break;
    } catch (putError) {
      lastError = putError;
      c.get('logger')?.error({ attempt, error: putError }, 'Image upload attempt failed');

      if (attempt < 3) {
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // CDC 동기화 (실패해도 업로드는 성공으로 처리)
  try {
    await onBlobUpload({
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      uploadedAt: new Date(),
      contentType: file.type,
    });
  } catch (cdcError) {
    c.get('logger')?.error({ error: cdcError }, 'CDC sync failed (non-critical)');
  }

  return c.json({
    success: true,
    url: blob.url,
    pathname: blob.pathname,
    size: file.size,
    contentType: file.type,
  });
};
```

## API 스펙

### Request Schema

**Zod Schema** (`shared/api/upload.ts`):

```typescript
export const uploadImageRequestSchema = z.object({
  file: z.instanceof(File),
  pathname: z.string().optional(),  // RPC Handler에서만 사용
});
```

**Validation**:
- `file`: 필수, File 객체
- `pathname`: 선택적, 지정하지 않으면 자동 생성

**File Validation**:
- **Allowed Types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- **Max Size**: 5MB (Server Action), 10MB (RPC Handler)
- **Extensions**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

### Response Schema

```typescript
export const uploadImageResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url(),
  pathname: z.string(),
  size: z.number(),
  contentType: z.string(),
});
```

**성공 응답 예시**:
```json
{
  "success": true,
  "url": "https://blob-url.../images/1735689600000-a3f8c9e2-my-photo.jpg",
  "pathname": "images/1735689600000-a3f8c9e2-my-photo.jpg",
  "size": 245678,
  "contentType": "image/jpeg"
}
```

**에러 응답 예시**:
```json
{
  "success": false,
  "error": "네트워크 연결이 불안정합니다. 다시 시도해 주세요."
}
```

## 엔드포인트

### Server Action

**호출 방법**: React Server Actions

```typescript
import { uploadImage } from '@/app/actions/files';

const formData = new FormData();
formData.append('file', file);

const result = await uploadImage(formData);
```

### RPC Handler

**엔드포인트**: `POST /rpc/uploadImage`

**Headers**:
```
Authorization: Bearer {API_KEY}
Content-Type: multipart/form-data
```

**Request Body**:
```
file: <binary>
pathname: images/custom-path.jpg (optional)
```

**OpenAPI 문서**: [upload.route.ts](../../rpc/routes/upload/upload.routes.ts)

## CDC 통합

### BlobFile Table 저장

업로드 성공 후 CDC 후크를 통해 PostgreSQL에 메타데이터 저장:

```typescript
await onBlobUpload({
  url: blob.url,
  pathname: blob.pathname,
  size: file.size,
  uploadedAt: new Date(),
  contentType: file.type,
});
```

**참고**: CDC 실패는 업로드 실패로 처리하지 않음 (Blob Storage가 source of truth)

## 로깅

### Server Action 로그

```typescript
console.log(`[Image Upload] Attempt ${attempt}/3: ${pathname}`);
console.error(`[Image Upload] Attempt ${attempt} failed:`, putError);
console.log(`[Image Upload] Success: ${blob.url}`);
console.log(`[Image Upload] CDC sync completed: ${blob.pathname}`);
console.error('[Image Upload] CDC sync failed (non-critical):', cdcError);
```

### RPC Handler 로그

```typescript
c.get('logger')?.info({ attempt, pathname: finalPathname }, 'Image upload attempt');
c.get('logger')?.error({ attempt, error: putError }, 'Image upload attempt failed');
c.get('logger')?.error({ error: cdcError }, 'CDC sync failed (non-critical)');
```

## 보안 고려사항

### 1. 파일 타입 검증

**Client-Side** (ImageUploader):
```tsx
if (file && file.type.startsWith('image/')) {
  uploadImage(file);
}
```

**Server-Side** (uploadImage):
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if (!ALLOWED_TYPES.includes(file.type)) {
  return {
    success: false,
    error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
  };
}
```

### 2. 파일 크기 제한

**Server Action**: 5MB
**RPC Handler**: 10MB

```typescript
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

if (file.size > MAX_SIZE) {
  return {
    success: false,
    error: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`,
  };
}
```

### 3. 인증

**Server Action**: NextAuth 세션 자동 검증
**RPC Handler**: Bearer Token (API Key) 검증

```typescript
if (!requireApiKey(c.req.header('authorization'))) {
  return c.json({ error: 'Unauthorized' }, 401);
}
```

## 성능 최적화

### 1. Vercel Blob 최적화

```typescript
const blob = await put(pathname, file, {
  access: 'public',
  token: BLOB_TOKEN,
  addRandomSuffix: false,  // 파일 덮어쓰기 방지
});
```

**`addRandomSuffix: false` 중요성**:
- Vercel Blob 기본 동작은 파일명에 랜덤 접미사 추가
- `false` 설정으로 명시적으로 파일명 제어
- 고유한 파일명은 `crypto.randomUUID()`로 보장

### 2. CDC 비차단 실행

```typescript
try {
  await onBlobUpload({ ... });
} catch (cdcError) {
  console.error('[Image Upload] CDC sync failed (non-critical):', cdcError);
  // 업로드는 성공한 것으로 처리
}
```

## 사용 예시

### 1. React Component에서 사용 (단일 파일)

```tsx
'use client';

import { useState } from 'react';
import { uploadImage } from '@/app/actions/files';

export function MyComponent() {
  const [imageUrl, setImageUrl] = useState('');

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadImage(formData);

    if (result.success && result.url) {
      setImageUrl(result.url);
    } else {
      alert(result.error);
    }
  };

  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }}
    />
  );
}
```

### 2. 다중 파일 업로드 (Upload Page)

**위치**: `app/dashboard/upload/page.tsx`

```tsx
const uploadImagesMutation = useMutation({
  mutationFn: async ({ files, pathname }: { files: File[]; pathname: string }) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    if (pathname.trim()) {
      formData.append('pathname', pathname.trim());
    }

    const result = await uploadMultipleImages(formData);
    if (!result.success && !result.results) {
      throw new Error(result.error || '이미지 업로드 중 오류가 발생했습니다.');
    }
    return result;
  },
  onSuccess: data => {
    queryClient.invalidateQueries({ queryKey: ['files'] });
    if (data.results) {
      setUploadResults(data.results);
    }
  },
});
```

### 3. 커서 위치에 이미지 삽입 (Edit Page)

**위치**: `app/dashboard/files/edit/page.tsx`

**기능**: 업로드한 이미지를 CodeMirror 에디터의 현재 커서 위치에 마크다운 형식으로 삽입

```tsx
const handleImageUploaded = (url: string, filename: string) => {
  // Insert markdown image syntax at cursor position
  const imageMarkdown = `\n![${filename}](${url})\n`;
  const view = editorViewRef.current;

  if (view) {
    // CodeMirror transaction을 사용하여 커서 위치에 삽입
    const transaction = view.state.update({
      changes: {
        from: view.state.selection.main.head,
        to: view.state.selection.main.head,
        insert: imageMarkdown,
      },
      selection: {
        anchor: view.state.selection.main.head + imageMarkdown.length,
        head: view.state.selection.main.head + imageMarkdown.length,
      },
    });
    view.dispatch(transaction);

    // 새로운 content 값으로 state 업데이트
    setFormData({
      ...formData,
      content: view.state.doc.toString(),
    });
  } else {
    // Fallback: 끝에 추가
    setFormData({
      ...formData,
      content: formData.content + imageMarkdown,
    });
  }
  setShowImageUploader(false);
};
```

### 4. 붙여넣기로 이미지 업로드 (Paste Event)

**위치**: `app/dashboard/files/edit/page.tsx`

```tsx
const handlePaste = useCallback(
  async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // 이미지 파일 찾기
    let imageFile: File | null = null;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        imageFile = item.getAsFile();
        break;
      }
    }

    if (!imageFile) return;

    // 기본 붙여넣기 동작 방지 (이미지인 경우만)
    e.preventDefault();

    setIsPastingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const result = await uploadImageAction(formData);

      if (!result.success || !result.url) {
        throw new Error(result.error || '이미지 업로드에 실패했습니다');
      }

      // CodeMirror의 현재 커서 위치에 이미지 마크다운 삽입
      const view = editorViewRef.current;
      const imageMarkdown = `\n![${imageFile.name}](${result.url})\n`;

      if (view) {
        const transaction = view.state.update({
          changes: {
            from: view.state.selection.main.head,
            to: view.state.selection.main.head,
            insert: imageMarkdown,
          },
          selection: {
            anchor: view.state.selection.main.head + imageMarkdown.length,
            head: view.state.selection.main.head + imageMarkdown.length,
          },
        });
        view.dispatch(transaction);

        setFormData({
          ...formData,
          content: view.state.doc.toString(),
        });
      }

      toast.success('이미지가 업로드되었습니다');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다');
    } finally {
      setIsPastingImage(false);
    }
  },
  [formData]
);

// Paste 이벤트 리스너 등록
useEffect(() => {
  const editorElement = editorContainerRef.current;
  if (editorElement) {
    editorElement.addEventListener('paste', handlePaste);
    return () => {
      editorElement.removeEventListener('paste', handlePaste);
    };
  }
}, [handlePaste]);
```

### 2. RPC API로 직접 호출

```typescript
import { hc } from 'hono/client';
import type { AppType } from '@apps/blog-admin/rpc';

const client = hc<AppType>('https://your-admin-url.com');

const formData = new FormData();
formData.append('file', file);
formData.append('pathname', 'images/custom-path.jpg');

const response = await client.api.rpc.uploadImage.$post({
  headers: {
    Authorization: `Bearer ${API_KEY}`,
  },
  body: formData,
});

const result = await response.json();
```

## 테스트

### 수동 테스트 시나리오

1. **정상 업로드**: 5MB 미만 이미지
2. **동시 업로드**: 여러 파일 동시 업로드 (UUID 충돌 테스트)
3. **파일 크기 초과**: 5MB 이상 이미지
4. **잘못된 파일 타입**: PDF, TXT 등
5. **네트워크 오류**: 네트워크 차단 후 재시도 테스트
6. **특수문자 파일명**: `My Photo (1)@#$%.jpg`

### 테스트 명령어

```bash
# 로컬 테스트
pnpm dev:admin

# 빌드 후 테스트
pnpm build:admin
pnpm start:admin
```

## 문제 해결

### 일반적인 문제

1. **업로드 실패 (네트워크)**
   - 자동으로 3회 재시도
   - 사용자에게 "네트워크 연결이 불안정합니다" 메시지

2. **용량 한도 초과**
   - "Blob Storage 용량 한도에 도달했습니다" 메시지
   - Vercel 대시보드에서 Blob Storage 확인

3. **인증 오류**
   - "인증 오류가 발생했습니다. 관리자에게 문의해 주세요." 메시지
   - `BLOB_READ_WRITE_TOKEN` 환경 변수 확인

## 관련 파일

- **Server Action**: [files.ts:386-496](../../../apps/blog-admin/src/app/actions/files.ts#L386-L496)
- **RPC Handler**: [upload.handlers.ts:96-202](../../../apps/blog-admin/src/rpc/routes/upload/upload.handlers.ts#L96-L202)
- **UI Component**: [image-uploader.tsx](../../../apps/blog-admin/src/shared/ui/image-uploader/image-uploader.tsx)
- **API Routes**: [upload.routes.ts](../../../apps/blog-admin/src/rpc/routes/upload/upload.routes.ts)
- **API Schemas**: [upload.ts](../../../apps/blog-admin/src/shared/api/upload.ts)
- **CDC Hook**: [blob-cdc.ts](../../../apps/blog-admin/src/shared/server/blob-cdc.ts)

## 변경사항

### 2026-01-02

- **추가**: 다중 파일 업로드 지원 (multiple prop)
- **추가**: 드래그 앤 드롭 기능
- **추가**: 붙여넣기로 이미지 업로드 (clipboard API)
- **추가**: CodeMirror 에디터 커서 위치에 이미지 삽입
- **추가**: 성공/실패 카운트 표시
- **개선**: 클라이언트 측 직접 업로드 (Vercel Blob client SDK)
- **개선**: 파일별 개별 에러 메시지

### 2026-01-01

- **추가**: `crypto.randomUUID()`를 사용한 고유 파일명 생성
- **추가**: Vercel Blob 업로드 재시도 로직 (최대 3회)
- **추가**: 에러 유형별 한글 메시지
- **개선**: 파일명 sanitization (특수문자 제거, 길이 제한)
- **개선**: 상세한 로깅 (시도 횟수, 성공/실패 로그)

### 이전 버전

- 기본적인 파일 업로드 기능
- 단순 에러 메시지 (영어)
- `Date.now()`만 사용한 파일명 (동시성 문제)
- 재시도 로직 없음
