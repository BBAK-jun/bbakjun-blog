# Blog-Admin API 문서

## 개요

Blog-Admin의 API는 Vercel Blob Storage를 통해 마크다운 파일을 관리하는 RESTful API입니다.

**Base URL**: `http://localhost:3001/api/admin` (개발) 또는 `https://your-domain/api/admin` (프로덕션)

**인증**: 모든 요청에 Bearer Token 필수
```
Authorization: Bearer YOUR_BACKOFFICE_API_KEY
```

---

## 엔드포인트

### 1. 파일 업로드

**POST** `/api/admin/upload`

마크다운 파일을 Vercel Blob Storage에 업로드합니다.

#### Request

**Headers**:
```
Authorization: Bearer your-secret-key
Content-Type: multipart/form-data
```

**Body (multipart/form-data)**:
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `file` | File | ✅ | 마크다운 파일 (.md, .mdx) |
| `path` | string | ✅ | 저장 경로 (예: `DEV/my-post`) |
| `tags` | string | ❌ | 태그 (쉼표로 구분, 예: `nextjs,react`) |
| `status` | string | ❌ | 상태: `draft` 또는 `published` (기본값: `draft`) |

#### Example Request

```bash
curl -X POST http://localhost:3001/api/admin/upload \
  -H "Authorization: Bearer your-secret-key" \
  -F "file=@my-post.mdx" \
  -F "path=DEV/my-post" \
  -F "tags=nextjs,typescript,react" \
  -F "status=draft"
```

#### Response (Success - 200)

```json
{
  "success": true,
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "version": 1,
  "message": "파일이 업로드되었습니다",
  "metadata": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "my-post.mdx",
    "path": "DEV/my-post",
    "size": 2584,
    "contentType": "text/markdown",
    "uploadedAt": "2025-12-12T10:30:00.000Z",
    "hash": "sha256:abc123def456...",
    "version": 1,
    "tags": ["nextjs", "typescript", "react"],
    "status": "draft",
    "url": "https://blob.vercelusercontent.com/..."
  }
}
```

#### Response (Errors)

**400 - Bad Request**:
```json
{
  "success": false,
  "error": "Only .md and .mdx files are allowed",
  "code": "INVALID_FILE_TYPE"
}
```

**400 - File Too Large**:
```json
{
  "success": false,
  "error": "File size exceeds 10MB limit",
  "code": "FILE_TOO_LARGE"
}
```

**401 - Unauthorized**:
```json
{
  "success": false,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

**500 - Server Error**:
```json
{
  "success": false,
  "error": "Error message",
  "code": "INTERNAL_ERROR"
}
```

#### Validation Rules

- **파일 형식**: `.md` 또는 `.mdx`만 허용
- **파일 크기**: 최대 10MB
- **경로 형식**: `CATEGORY/filename` (예: `DEV/my-post`)
- **태그**: 쉼표로 구분된 문자열 (최대 길이 제한 없음)

---

### 2. 파일 목록 조회

**GET** `/api/admin/files`

저장된 마크다운 파일 목록을 조회합니다.

#### Request

**Headers**:
```
Authorization: Bearer your-secret-key
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `category` | string | ❌ | 카테고리로 필터링 (예: `DEV`, `REACT`) |
| `limit` | number | ❌ | 결과 최대 개수 (기본값: 50) |

#### Example Request

```bash
# 모든 파일 조회
curl http://localhost:3001/api/admin/files \
  -H "Authorization: Bearer your-secret-key"

# DEV 카테고리 파일만 조회
curl "http://localhost:3001/api/admin/files?category=DEV&limit=20" \
  -H "Authorization: Bearer your-secret-key"
```

#### Response (Success - 200)

```json
{
  "files": [
    {
      "filename": "my-post.mdx",
      "pathname": "DEV/my-post.mdx",
      "path": "DEV/my-post",
      "size": 2584,
      "uploadedAt": "2025-12-12T10:30:00.000Z",
      "version": 1,
      "status": "published",
      "url": "https://blob.vercelusercontent.com/..."
    },
    {
      "filename": "another-post.md",
      "pathname": "REACT/another-post.md",
      "path": "REACT/another-post",
      "size": 1892,
      "uploadedAt": "2025-12-12T09:15:00.000Z",
      "version": 1,
      "status": "draft",
      "url": "https://blob.vercelusercontent.com/..."
    }
  ],
  "total": 2
}
```

#### Response (Errors)

**401 - Unauthorized**:
```json
{
  "success": false,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

---

## 인증

### Bearer Token 설정

모든 API 요청은 `Authorization` 헤더에 Bearer Token을 포함해야 합니다:

```
Authorization: Bearer your-backoffice-api-key
```

**예시**:
```bash
curl -H "Authorization: Bearer abc123xyz789" \
  http://localhost:3001/api/admin/files
```

### 토큰 생성

환경 변수 `BACKOFFICE_API_KEY`에서 토큰을 설정합니다:

```env
BACKOFFICE_API_KEY=your-secret-key-here
```

> ⚠️ **보안 주의**:
> - 토큰을 절대 GitHub에 커밋하지 마세요
> - 프로덕션 환경에서는 강력한 토큰을 사용하세요
> - 토큰을 정기적으로 변경하세요

---

## 상태 코드

| 코드 | 설명 |
|------|------|
| `200` | 요청 성공 |
| `400` | 잘못된 요청 (파일 형식, 크기 등) |
| `401` | 인증 실패 (토큰 없음 또는 잘못됨) |
| `500` | 서버 오류 |

---

## 에러 코드

| 코드 | 설명 |
|------|------|
| `UNAUTHORIZED` | 인증 토큰 없음 또는 잘못됨 |
| `NO_FILE` | 파일이 제공되지 않음 |
| `NO_PATH` | 경로가 제공되지 않음 |
| `INVALID_FILE_TYPE` | 지원하지 않는 파일 형식 |
| `FILE_TOO_LARGE` | 파일 크기 초과 (10MB 제한) |
| `INTERNAL_ERROR` | 내부 서버 오류 |

---

## 요청/응답 형식

### 공통 응답 형식

모든 응답은 JSON 형식입니다:

```json
{
  "success": boolean,
  "message": "string (optional)",
  "data": object,
  "error": "string (optional)",
  "code": "string (optional)"
}
```

### 콘텐츠 타입

- **요청**: `multipart/form-data` (파일 업로드) 또는 기본 form data
- **응답**: `application/json`

---

## 레이트 리미팅

현재 레이트 리미팅이 구현되지 않았습니다.

향후 업데이트에서 다음과 같이 구현될 예정입니다:
- IP 기반 요청 제한
- 사용자 기반 쿼터 설정

---

## 타임아웃

- **업로드**: 30초
- **목록 조회**: 10초

---

## 파일 경로 규칙

### 권장 경로 구조

마크다운 파일은 다음과 같은 계층 구조로 저장되는 것을 권장합니다:

```
CATEGORY/filename
```

**예시**:
- `DEV/my-first-post` (DEV 카테고리)
- `REACT/hooks-guide` (REACT 카테고리)
- `JS/closure-explained` (JS 카테고리)

### 지원하는 카테고리 (권장)

- `DEV` - 일반 개발
- `REACT` - React 관련
- `JS` - JavaScript 관련
- `STUDY` - 학습 자료
- `TIL` - Today I Learned
- `CAREER` - 경력 관련

> 💡 **팁**: 카테고리는 블로그 화면의 "Related Posts" 기능에서 같은 카테고리 내 포스트를 추천할 때 사용됩니다.

---

## 메타데이터

업로드된 각 파일은 다음 메타데이터를 포함합니다:

```json
{
  "id": "UUID",
  "filename": "string",
  "path": "string",
  "size": "number (bytes)",
  "contentType": "text/markdown",
  "uploadedAt": "ISO 8601 datetime",
  "hash": "sha256:hex",
  "version": "number",
  "tags": ["string"],
  "status": "draft | published",
  "url": "string (Vercel Blob URL)"
}
```

### 메타데이터 조회

메타데이터는 별도의 `.metadata.json` 파일로 저장됩니다:

```
DEV/my-post/.metadata.json
```

---

## 사용 예시

### JavaScript/TypeScript

```typescript
// 파일 업로드
const uploadFile = async (file: File, path: string, apiKey: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);
  formData.append('status', 'draft');

  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  return response.json();
};

// 파일 목록 조회
const getFiles = async (category?: string, apiKey?: string) => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  params.append('limit', '50');

  const response = await fetch(`/api/admin/files?${params}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  return response.json();
};
```

### cURL

```bash
# 파일 업로드
curl -X POST http://localhost:3001/api/admin/upload \
  -H "Authorization: Bearer your-api-key" \
  -F "file=@post.md" \
  -F "path=DEV/my-post" \
  -F "tags=nextjs,typescript"

# 파일 목록
curl "http://localhost:3001/api/admin/files?category=DEV" \
  -H "Authorization: Bearer your-api-key"
```

---

## 향후 계획

다음 기능들이 향후 버전에서 추가될 예정입니다:

- [ ] DELETE `/api/admin/file/:fileId` - 파일 삭제
- [ ] GET `/api/admin/history` - 업로드 이력 조회
- [ ] POST `/api/admin/restore` - 특정 버전으로 복원
- [ ] PATCH `/api/admin/file/:fileId` - 메타데이터 업데이트
- [ ] GET `/api/admin/file/:fileId` - 파일 상세 조회

---

## 지원

문제가 발생하면:
1. [이슈 생성](https://github.com/your-repo/issues)
2. 에러 코드와 요청 내용 포함

---

**마지막 업데이트**: 2025-12-12
**API 버전**: 1.0.0
