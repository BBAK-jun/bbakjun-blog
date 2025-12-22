# Bulk Upload Scripts

마크다운 파일들을 Vercel Blob Storage에 자동으로 업로드하는 스크립트입니다.

## 사전 요구사항

1. **환경 변수 설정**

   `.env.local` 파일에 다음 환경 변수가 설정되어 있어야 합니다:

   ```bash
   BACKOFFICE_API_KEY=your-api-key-here
   ```

   또는 터미널에서 직접 export:

   ```bash
   export BACKOFFICE_API_KEY=your-api-key-here
   ```

2. **blog-admin 서버 실행** (로컬 업로드 시)

   ```bash
   pnpm dev:admin
   ```

   서버가 `http://localhost:3001`에서 실행되어야 합니다.

## 사용 방법

### 1. 로컬 환경에 업로드

```bash
# 모든 마크다운 파일 업로드
pnpm upload-posts

# 또는 직접 실행
node scripts/upload-posts.js
```

### 2. 프로덕션 환경에 업로드

```bash
# Vercel 배포된 blog-admin에 업로드
pnpm upload-posts:prod

# 또는 직접 실행
NEXT_PUBLIC_ADMIN_URL=https://your-blog-admin.vercel.app node scripts/upload-posts.js
```

## 스크립트 동작 방식

### `upload-posts.js` - 전체 업로드

1. `packages/content/posts/` 디렉토리를 재귀적으로 스캔
2. 모든 `.md`, `.mdx` 파일 찾기
3. 각 파일에 대해:
   - 카테고리 추출 (첫 번째 폴더명)
   - 경로 생성 (예: `DEV/my-post`)
   - API로 업로드
4. 진행 상황 표시 및 최종 결과 요약

### 파일 경로 변환 예시

| 로컬 경로                                       | Blob Storage 경로    |
| ----------------------------------------------- | -------------------- |
| `packages/content/posts/DEV/my-post/index.mdx`  | `DEV/my-post`        |
| `packages/content/posts/REACT/hooks.mdx`        | `REACT/hooks`        |
| `packages/content/posts/career/2025-career.mdx` | `career/2025-career` |

## 출력 예시

```
🚀 Blog Posts Bulk Upload Script

ℹ️  Scanning directory: /path/to/packages/content/posts
ℹ️  Target API: http://localhost:3001

Found 45 markdown files

[1/45] Uploading: career/2025-career.mdx
✅   ✓ Uploaded to: career/2025-career
[2/45] Uploading: DEV/my-post/index.mdx
✅   ✓ Uploaded to: DEV/my-post
...

==================================================
📊 Upload Summary
==================================================
Total files:     45
Successful:      45
==================================================
```

## 에러 처리

스크립트가 실패하면 다음 정보를 표시합니다:

```
❌ Failed uploads:
  • DEV/broken-post: File size exceeds 10MB limit
  • REACT/invalid: Only .md and .mdx files are allowed
```

실패한 파일은 로그를 확인하여 수동으로 재업로드할 수 있습니다.

## 환경 변수

| 변수                    | 설명               | 기본값                  |
| ----------------------- | ------------------ | ----------------------- |
| `BACKOFFICE_API_KEY`    | API 인증 키 (필수) | -                       |
| `NEXT_PUBLIC_ADMIN_URL` | Blog-admin URL     | `http://localhost:3001` |

## 문제 해결

### 1. "BACKOFFICE_API_KEY is not set" 오류

**해결**:

```bash
export BACKOFFICE_API_KEY=your-api-key
```

또는 `.env.local` 파일에 추가

### 2. "fetch failed" 오류

**원인**: blog-admin 서버가 실행되지 않음

**해결**:

```bash
pnpm dev:admin
```

### 3. "Unauthorized" 응답

**원인**: API 키가 일치하지 않음

**해결**:

- `.env.local`의 키 확인
- blog-admin의 `BACKOFFICE_API_KEY`와 일치하는지 확인

### 4. "File size exceeds 10MB limit"

**원인**: 파일이 10MB를 초과

**해결**:

- 파일 크기 줄이기
- 이미지를 별도로 저장
- 파일 분할

## 추가 기능

### 특정 카테고리만 업로드

스크립트를 수정하여 특정 카테고리만 업로드할 수 있습니다:

```javascript
// upload-posts.js 수정
const files = findMarkdownFiles(POSTS_DIR).filter(file => {
  const { category } = extractPathInfo(file);
  return category === 'DEV'; // DEV 카테고리만
});
```

### 업로드 속도 조절

API 부하를 줄이기 위해 딜레이를 조정할 수 있습니다:

```javascript
// 현재: 100ms 딜레이
await new Promise(resolve => setTimeout(resolve, 100));

// 느리게: 500ms
await new Promise(resolve => setTimeout(resolve, 500));
```

## 보안 주의사항

1. **API 키 노출 방지**
   - `.env.local`을 절대 git에 커밋하지 마세요
   - 터미널 히스토리에 API 키가 남지 않도록 주의

2. **프로덕션 URL**
   - package.json의 `upload-posts:prod` 스크립트에서 URL 확인
   - 실제 배포된 URL로 업데이트하세요

## 로그 확인

업로드 중 문제가 발생하면 blog-admin 로그를 확인하세요:

```bash
# 로컬
pnpm dev:admin
# 터미널에서 로그 확인

# Vercel 프로덕션
vercel logs
```

---

**작성일**: 2025-12-13
**업데이트**: 2025-12-13
