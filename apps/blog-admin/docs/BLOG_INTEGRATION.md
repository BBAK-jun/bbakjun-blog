# Blog Integration - ISR Revalidation

## 개요

Blog-Admin과 공개 블로그 간의 연동 기능입니다. Admin에서 포스트를 생성/수정/삭제할 때 자동으로 블로그의 캐시를 무효화(revalidate)하여 즉시 반영되도록 합니다.

## 동작 방식

```
[Blog-Admin] 포스트 수정
    ↓
[files.ts] updateFile() 호출
    ↓
[Vercel Blob] 콘텐츠 업데이트
    ↓
[revalidate-blog.ts] revalidateBlogPost() 호출
    ↓
[Blog API] POST /api/revalidate?secret=XXX&path=/blog/slug
    ↓
[Blog] ISR 캐시 무효화 + 재생성
    ↓
✅ 블로그에 즉시 반영
```

## 구현 상세

### 1. Revalidation Utility (`src/shared/lib/revalidate-blog.ts`)

**함수**:

- `revalidateBlogPost(pathname)`: 특정 포스트 재검증
- `revalidateBlogPath(path)`: 특정 경로 재검증
- `revalidateAllBlogPages()`: 전체 페이지 재검증
- `extractSlugFromPathname(pathname)`: pathname에서 slug 추출

**사용 예시**:

```typescript
import { revalidateBlogPost } from '@/shared/lib/revalidate-blog';

// 포스트 업데이트 후
await revalidateBlogPost('DEV/my-post/index.mdx');
// → Revalidates: /blog/DEV/my-post, /, /blog
```

### 2. 통합된 Server Actions

**`src/app/actions/files.ts`**:

#### createFile()

```typescript
// 새 포스트 생성 시
await put(finalPathname, fullContent, { ... });
await revalidateBlogPost(blob.pathname); // ✅ 추가됨
```

#### updateFile()

```typescript
// 포스트 수정 시
await put(validatedData.pathname, fullContent, { ... });
await revalidateBlogPost(validatedData.pathname); // ✅ 개선됨
```

#### deleteFile()

```typescript
// 포스트 삭제 시
await del(validationResult.data.pathname, { ... });
await revalidateBlogPost(validationResult.data.pathname); // ✅ 추가됨
```

## 환경 변수 설정

### 개발 환경 (`.env.local`)

```env
# Blog Integration (ISR Revalidation)
NEXT_PUBLIC_BLOG_URL=http://localhost:3000
BLOG_REVALIDATION_SECRET=gKvUkQuiix93rC+NiA3DTWkztrnE0vhHOvRYzLlL+OM=
```

### 프로덕션 (Vercel)

**Settings → Environment Variables**:

1. **NEXT_PUBLIC_BLOG_URL**
   - Value: `https://your-blog.vercel.app`
   - Environments: Production, Preview

2. **BLOG_REVALIDATION_SECRET**
   - Value: (Same as blog's `REVALIDATION_SECRET`)
   - Environments: Production, Preview

**중요**: Blog 앱의 `REVALIDATION_SECRET`과 동일한 값을 사용해야 합니다!

### Turborepo 설정

**`turbo.json`**:

```json
{
  "globalEnv": ["NEXT_PUBLIC_BLOG_URL", "BLOG_REVALIDATION_SECRET", "REVALIDATION_SECRET"],
  "tasks": {
    "build": {
      "env": ["NEXT_PUBLIC_BLOG_URL", "BLOG_REVALIDATION_SECRET", "REVALIDATION_SECRET"]
    }
  }
}
```

## 테스트

### 1. 로컬 테스트

**사전 준비**:

```bash
# Terminal 1: Blog 실행
cd apps/blog
pnpm build && pnpm start

# Terminal 2: Blog-Admin 실행
cd apps/blog-admin
pnpm dev
```

**테스트 시나리오**:

1. Blog-Admin에서 포스트 수정
2. 저장 버튼 클릭
3. 터미널에서 로그 확인:
   ```
   ✅ Revalidated blog path: /blog/DEV/my-post
   ```
4. Blog 페이지 새로고침 → 즉시 반영 확인

### 2. 수동 테스트 (curl)

```bash
# Blog API 직접 호출
curl -X POST \
  'http://localhost:3000/api/revalidate?secret=gKvUkQuiix93rC+NiA3DTWkztrnE0vhHOvRYzLlL+OM=&path=/blog/DEV/my-post'

# 응답 예시:
# {
#   "revalidated": true,
#   "paths": ["/blog/DEV/my-post", "/", "/blog"],
#   "timestamp": "2025-12-16T..."
# }
```

### 3. 프로덕션 확인

**Vercel Functions Logs**:

```
Deployments → blog-admin → Functions → Logs

검색어: "Revalidated blog"
```

**성공 로그**:

```
✅ Revalidated blog path: /blog/DEV/my-post
{
  revalidated: true,
  paths: ['/blog/DEV/my-post', '/', '/blog'],
  timestamp: '...'
}
```

## 에러 처리

### Revalidation 실패 시

**동작**:

- 포스트 업데이트는 성공적으로 완료
- Revalidation 실패는 로그만 기록
- 사용자에게는 성공 메시지 표시

**로그 확인**:

```
Blog revalidation error: Error: Failed to fetch
```

**원인 및 해결**:

1. **환경 변수 미설정**

   ```
   NEXT_PUBLIC_BLOG_URL is not set. Skipping blog revalidation.
   ```

   → Vercel에서 `NEXT_PUBLIC_BLOG_URL` 추가

2. **Secret 불일치**

   ```
   Revalidation failed with status 401
   ```

   → `BLOG_REVALIDATION_SECRET` 확인

3. **Blog 서버 응답 없음**
   ```
   Failed to fetch
   ```
   → Blog 앱 상태 확인, CORS 설정 확인

## 재배포 시 주의사항

1. **환경 변수 동기화**

   ```bash
   # Blog의 REVALIDATION_SECRET 확인
   vercel env ls --filter=blog

   # Blog-Admin의 BLOG_REVALIDATION_SECRET와 일치하는지 확인
   vercel env ls --filter=blog-admin
   ```

2. **Secret 변경 시**
   - Blog의 `REVALIDATION_SECRET` 변경
   - Blog-Admin의 `BLOG_REVALIDATION_SECRET`도 동일하게 변경
   - 양쪽 모두 재배포

3. **URL 변경 시**
   - `NEXT_PUBLIC_BLOG_URL` 업데이트
   - Blog-Admin 재배포

## 문제 해결

### 포스트가 즉시 반영되지 않음

**확인 사항**:

1. Revalidation API 호출 성공 여부 (로그 확인)
2. Blog의 ISR 설정 확인 (revalidate: 60)
3. 브라우저 캐시 무효화 (Hard Refresh)

**해결 방법**:

```bash
# 전체 사이트 수동 재검증
curl -X POST \
  'https://your-blog.vercel.app/api/revalidate?secret=XXX&all=true'
```

### "Invalid secret token" 에러

**원인**: Secret 불일치

**해결**:

```bash
# 1. Blog secret 확인
vercel env pull .env.production --filter=blog

# 2. Blog-Admin에 동일한 값 설정
vercel env add BLOG_REVALIDATION_SECRET --filter=blog-admin

# 3. 재배포
vercel --prod
```

### Revalidation 비활성화 (개발 중)

환경 변수를 제거하면 revalidation이 자동으로 스킵됩니다:

```env
# .env.local에서 주석 처리
# NEXT_PUBLIC_BLOG_URL=http://localhost:3000
# BLOG_REVALIDATION_SECRET=...
```

로그:

```
NEXT_PUBLIC_BLOG_URL is not set. Skipping blog revalidation.
```

## 관련 파일

- [src/shared/lib/revalidate-blog.ts](../src/shared/lib/revalidate-blog.ts): Revalidation 유틸리티
- [src/app/actions/files.ts](../src/app/actions/files.ts): Server Actions (CRUD)
- [apps/blog/src/app/api/revalidate/route.ts](../../blog/src/app/api/revalidate/route.ts): Blog API
- [apps/blog/docs/ISR.md](../../blog/docs/ISR.md): Blog ISR 문서

---

**마지막 업데이트**: 2025-12-16
