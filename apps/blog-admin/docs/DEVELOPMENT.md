# Blog-Admin 개발 가이드

## 목차

1. [개발 환경 설정](#개발-환경-설정)
2. [개발 워크플로우](#개발-워크플로우)
3. [코드 구조](#코드-구조)
4. [새 기능 추가](#새-기능-추가)
5. [테스트](#테스트)
6. [디버깅](#디버깅)
7. [코드 스타일](#코드-스타일)

---

## 개발 환경 설정

### 필수 도구

```bash
# Node.js v24 설치
nvm install 24
nvm use 24

# pnpm 설치
npm install -g pnpm

# 의존성 설치
pnpm install
```

### 추천 IDE 설정

**Visual Studio Code**:

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

**확장 프로그램**:
- ESLint
- Prettier
- TypeScript Vue Plugin
- Thunder Client (API 테스트)

---

## 개발 워크플로우

### Step 1: 기능 브랜치 생성

```bash
# 저장소 최신 상태 가져오기
git checkout main
git pull origin main

# 기능 브랜치 생성
git checkout -b feature/new-feature

# 예시
git checkout -b feature/add-delete-file-api
```

### Step 2: 개발 서버 실행

```bash
# blog-admin 개발 서버 시작
pnpm dev:admin

# 또는 blog와 함께 실행
pnpm dev:all
```

**출력**:
```
blog-admin:dev: ▲ Next.js 16.0.8 (Turbopack)
blog-admin:dev: ✓ Ready in 682ms
blog-admin:dev: - Local: http://localhost:3001
```

### Step 3: 코드 작성

```bash
# 파일 구조 확인
ls -la apps/blog-admin/src/

# 파일 편집
code apps/blog-admin/src/app/api/admin/
```

### Step 4: 코드 검증

```bash
# 타입 확인
pnpm type-check

# 린트 확인
pnpm lint

# 빌드 테스트
pnpm build:admin
```

### Step 5: 커밋 및 푸시

```bash
# 변경사항 확인
git status

# 스테이징
git add apps/blog-admin/

# 커밋
git commit -m "feat: add delete file API"

# 푸시
git push origin feature/add-delete-file-api
```

### Step 6: Pull Request 생성

GitHub에서 PR 생성:
- 제목: 간단명료하게
- 설명: 변경사항 상세 설명
- 라벨: 기능/버그 등

---

## 코드 구조

### API Route 생성 방식

#### 새 엔드포인트 추가 예시

`DELETE /api/admin/file/:fileId` 추가:

```bash
# 디렉토리 생성
mkdir -p apps/blog-admin/src/app/api/admin/file/\[fileId\]

# 파일 생성
touch apps/blog-admin/src/app/api/admin/file/\[fileId\]/route.ts
```

**파일 내용** (`route.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { deleteBlob } from "@/lib/blob";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const isAuthorized = await verifyApiKey();
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "No fileId provided", code: "NO_FILE_ID" },
        { status: 400 }
      );
    }

    // Blob에서 파일 삭제
    await deleteBlob(fileId);

    // 메타데이터도 삭제
    await deleteBlob(`${fileId}/.metadata.json`);

    return NextResponse.json({
      success: true,
      message: "파일이 삭제되었습니다",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
```

---

## 새 기능 추가

### 예: 파일 상세 조회 API 추가

#### 1. 함수 추가 (blob.ts)

```typescript
// src/lib/blob.ts

export async function getBlobContent(path: string): Promise<string> {
  try {
    const buffer = await downloadBlob(path);
    return buffer.toString('utf-8');
  } catch (error) {
    console.error("Get blob content error:", error);
    throw error;
  }
}
```

#### 2. API Route 생성

```bash
mkdir -p apps/blog-admin/src/app/api/admin/file/\[fileId\]
touch apps/blog-admin/src/app/api/admin/file/\[fileId\]/route.ts
```

#### 3. Route 구현

```typescript
// src/app/api/admin/file/[fileId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth";
import { getBlobContent, getBlobMetadata } from "@/lib/blob";

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const isAuthorized = await verifyApiKey();
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { fileId } = params;

    // 파일 내용 조회
    const content = await getBlobContent(fileId);

    // 메타데이터 조회
    const metadata = await getBlobMetadata(fileId);

    return NextResponse.json({
      success: true,
      fileId,
      content,
      metadata,
    });
  } catch (error) {
    console.error("Get file error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
```

#### 4. 문서 업데이트

`docs/API.md`에 새 엔드포인트 추가:

```markdown
### 3. 파일 상세 조회

**GET** `/api/admin/file/:fileId`

파일 내용과 메타데이터를 조회합니다.

#### Request

**Headers**:
\`\`\`
Authorization: Bearer your-secret-key
\`\`\`

#### Response

\`\`\`json
{
  "success": true,
  "fileId": "DEV/my-post",
  "content": "# My Post\n\nContent here...",
  "metadata": {
    ...
  }
}
\`\`\`
```

#### 5. 테스트

```bash
# API 테스트
curl http://localhost:3001/api/admin/file/DEV/my-post \
  -H "Authorization: Bearer your-api-key"
```

---

## 테스트

### 수동 테스트

#### API 테스트 (cURL)

```bash
# 파일 업로드
curl -X POST http://localhost:3001/api/admin/upload \
  -H "Authorization: Bearer test-key" \
  -F "file=@test.md" \
  -F "path=DEV/test"

# 파일 목록
curl http://localhost:3001/api/admin/files?category=DEV \
  -H "Authorization: Bearer test-key"

# 파일 삭제 (향후)
curl -X DELETE http://localhost:3001/api/admin/file/DEV/test \
  -H "Authorization: Bearer test-key"
```

#### Thunder Client 테스트

VS Code Thunder Client 확장으로 API 테스트:

1. Thunder Client 열기 (Ctrl+Shift+D)
2. New Request 생성
3. Method: POST, URL: `http://localhost:3001/api/admin/upload`
4. Headers: `Authorization: Bearer test-key`
5. Body: multipart/form-data
6. Send

### 자동 테스트 (향후)

```typescript
// __tests__/api/admin/upload.test.ts

import { POST } from '@/app/api/admin/upload/route';
import { NextRequest } from 'next/server';

describe('POST /api/admin/upload', () => {
  it('should upload a file', async () => {
    // 테스트 구현
  });

  it('should reject unauthorized requests', async () => {
    // 테스트 구현
  });
});
```

---

## 디버깅

### 콘솔 로그

```typescript
// API Route에 로그 추가
export async function POST(request: NextRequest) {
  console.log('=== Upload Request ===');
  console.log('Headers:', request.headers);
  console.log('URL:', request.url);

  try {
    const formData = await request.formData();
    console.log('FormData:', Object.fromEntries(formData));

    // ... 처리 ...

    console.log('Upload successful');
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### VS Code 디버거

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev", "-p", "3001"],
      "cwd": "${workspaceFolder}/apps/blog-admin",
      "console": "integratedTerminal"
    }
  ]
}
```

### 네트워크 디버깅

```bash
# 요청/응답 모니터링
curl -v http://localhost:3001/api/admin/files \
  -H "Authorization: Bearer test-key"
```

---

## 코드 스타일

### TypeScript

```typescript
// ✅ 좋은 예
async function uploadFile(
  file: File,
  path: string
): Promise<{ success: boolean; url: string }> {
  if (!file) {
    throw new Error('File is required');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadBlob(path, buffer);

  return { success: true, url: result.url };
}

// ❌ 나쁜 예
function uploadFile(file, path) {
  if (!file) return null;
  // ...
  return { ok: true, u: result.url };
}
```

### 에러 처리

```typescript
// ✅ 좋은 예
try {
  await uploadBlob(path, content);
} catch (error) {
  if (error instanceof Error) {
    console.error('Upload failed:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
  throw new Error(`Upload failed: ${error}`);
}

// ❌ 나쁜 예
try {
  await uploadBlob(path, content);
} catch (error) {
  console.log(error); // 정보 부족
  throw error;
}
```

### 주석

```typescript
// ✅ 좋은 예
// SHA256 해시를 생성하여 파일 무결성 확인
const hash = createHash('sha256').update(buffer).digest('hex');

// ❌ 나쁜 예
// hash를 만든다
const hash = createHash('sha256').update(buffer).digest('hex');
```

### 네이밍

```typescript
// ✅ 좋은 예
const apiKey = process.env.BACKOFFICE_API_KEY;
const maxFileSizeInBytes = 10 * 1024 * 1024;
const isAuthenticated = await verifyApiKey();

// ❌ 나쁜 예
const key = process.env.BACKOFFICE_API_KEY;
const maxSize = 10 * 1024 * 1024;
const auth = await verifyApiKey();
```

---

## Git 커밋 메시지 가이드

### 형식

```
<type>: <subject>

<body>

<footer>
```

### Type

- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 스타일 (타입스크립트 아님)
- `refactor`: 코드 리팩토링
- `perf`: 성능 개선
- `test`: 테스트 추가
- `chore`: 빌드, 의존성 등

### 예시

```bash
git commit -m "feat: add file delete API"

git commit -m "fix: handle missing API key error"

git commit -m "docs: add deployment guide"

git commit -m "refactor: extract auth logic to separate module"
```

---

## 릴리스 프로세스

### 버전 관리

`package.json`에서 버전 업데이트:

```json
{
  "version": "1.0.1"
}
```

### 릴리스 체크리스트

- [ ] 모든 기능 테스트
- [ ] 문서 업데이트
- [ ] CHANGELOG 업데이트
- [ ] 버전 번호 업데이트
- [ ] 태그 생성

```bash
# 태그 생성
git tag -a v1.0.1 -m "Release version 1.0.1"

# 푸시
git push origin main --tags
```

---

## 추가 리소스

- [Next.js 공식 문서](https://nextjs.org/docs)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs)
- [Vercel Blob API](https://vercel.com/docs/storage/vercel-blob/api-reference)
- [ESLint 규칙](https://eslint.org/docs/rules)

---

**마지막 업데이트**: 2025-12-12
**버전**: 1.0.0
