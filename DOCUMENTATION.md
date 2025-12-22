# DEV_BBAK 블로그 전체 문서

## 📋 목차

- [프로젝트 개요](#프로젝트-개요)
- [Monorepo 구조](#monorepo-구조)
- [Blog 앱](#blog-앱)
- [Blog Admin 앱](#blog-admin-앱)
- [공유 패키지](#공유-패키지)
- [개발 가이드](#개발-가이드)
- [배포 가이드](#배포-가이드)

---

## 프로젝트 개요

DEV_BBAK은 **pnpm Workspace + Turbo**를 사용하는 모노레포 기반의 현대적인 블로그 플랫폼입니다.

### 핵심 특징

- 🏢 **Monorepo 구조**: pnpm workspace로 앱과 패키지 관리
- 📝 **Blog**: MDX 기반 블로그 (Next.js 15 App Router)
- 🎛️ **Blog Admin**: 블로그 관리 대시보드 (Vercel Blob Storage 통합)
- 📦 **공유 패키지**: content, analytics, types, ui, config
- ⚡ **Turbo 빌드**: 병렬 빌드 및 캐싱으로 빠른 빌드
- 🔒 **타입 안전성**: TypeScript + Zod 검증

### 기술 스택

| 레이어            | 기술                         |
| ----------------- | ---------------------------- |
| **프레임워크**    | Next.js 15 (App Router)      |
| **언어**          | TypeScript                   |
| **패키지 관리자** | pnpm (workspace)             |
| **빌드 도구**     | Turbo                        |
| **스타일링**      | Tailwind CSS v4              |
| **콘텐츠**        | MDX (gray-matter, unified)   |
| **스토리지**      | Vercel Blob Storage          |
| **데이터베이스**  | Redis (Vercel KV)            |
| **검증**          | Zod                          |
| **상태 관리**     | TanStack Query (React Query) |
| **폼 관리**       | React Hook Form + Zod        |
| **배포**          | Vercel                       |

---

## Monorepo 구조

```
bbakjun-blog/
├── apps/
│   ├── blog/                 # 메인 블로그 앱 (Next.js)
│   └── blog-admin/           # 관리 대시보드 (Next.js)
├── packages/
│   ├── analytics/            # @repo/analytics - 뷰 트래킹
│   ├── content/              # @repo/content - 마크다운 처리
│   ├── types/                # @repo/types - 공유 타입
│   ├── ui/                   # @repo/ui - UI 컴포넌트
│   └── config/               # @repo/config - 설정
├── content/
│   └── posts/                # 블로그 포스트 (MDX)
├── scripts/                  # 유틸리티 스크립트
├── turbo.json                # Turbo 설정
├── pnpm-workspace.yaml       # pnpm workspace 설정
└── package.json              # 루트 package.json
```

### 주요 커맨드

```bash
# 개발 서버
pnpm dev              # 모든 앱 실행
pnpm dev:blog         # blog만 실행 (포트 3000)
pnpm dev:admin        # blog-admin만 실행 (포트 3001)

# 빌드
pnpm build            # 모든 앱 빌드 (Turbo 병렬 빌드)
pnpm build:blog       # blog만 빌드
pnpm build:admin      # blog-admin만 빌드

# 타입 체크
pnpm type-check       # 모든 패키지 타입 체크
pnpm --filter=blog type-check      # blog만 체크
pnpm --filter=blog-admin type-check # blog-admin만 체크

# 린트
pnpm lint             # 모든 앱 린트
```

---

## Blog 앱

### 개요

MDX 기반의 정적 블로그로, Next.js 15 App Router를 사용합니다.

**위치**: `apps/blog/`
**포트**: 3000
**배포**: Vercel

### 주요 기능

- 📝 **MDX 포스트**: Markdown + React 컴포넌트
- 👁️ **실시간 조회수**: Redis(Vercel KV) 기반 세션별 카운팅
- 🏷️ **태그 시스템**: 태그별 필터링 및 관련 포스트 추천
- 🌙 **다크 모드**: next-themes로 시스템 테마 감지
- 📱 **반응형 디자인**: Tailwind CSS
- 🔍 **SEO 최적화**: 동적 OG 이미지, 메타태그
- 💬 **댓글**: Giscus 통합

### 디렉토리 구조

```
apps/blog/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── views/[...slug]/        # 조회수 API
│   │   │   ├── og/[...slug]/           # OG 이미지 생성
│   │   │   └── revalidate/             # ISR 재검증
│   │   ├── blog/[...slug]/page.tsx     # 포스트 상세
│   │   ├── tags/[tag]/page.tsx         # 태그별 포스트
│   │   ├── layout.tsx
│   │   └── page.tsx                    # 홈
│   ├── components/
│   │   ├── ui/                         # shadcn/ui 컴포넌트
│   │   ├── ViewCounter.tsx             # 조회수 카운터
│   │   ├── TableOfContents.tsx         # 목차
│   │   ├── MermaidRenderer.tsx         # Mermaid 차트
│   │   └── Comments.tsx                # Giscus 댓글
│   └── lib/
│       ├── posts.ts                    # 포스트 로딩
│       ├── redis.ts                    # Redis 뷰 카운터
│       └── markdown.ts                 # Markdown 처리
└── public/
    └── static/images/                  # 정적 이미지 (마이그레이션됨)
```

### 콘텐츠 아키텍처

#### 포스트 구조

```
content/posts/
├── DEV/
│   └── my-post/
│       ├── index.mdx
│       └── images/           # 포스트별 이미지 (옵션)
├── REACT/
├── JS/
├── STUDY/
├── TIL/
└── career/
```

#### Front Matter 스키마

```yaml
---
title: '포스트 제목' # 필수
date: '2024-11-15' # 필수, YYYY-MM-DD
description: '포스트 설명' # 필수
tags: ['nextjs', 'react'] # 필수, 배열
author: 'bbakjun' # 필수
draft: false # 옵션, 기본값 false
---
```

### Markdown 처리 파이프라인

**위치**: `packages/content/src/markdown.ts`

```
Raw MDX
  ↓ remark-parse (markdown → AST)
  ↓ remark-gfm (GitHub Flavored Markdown)
  ↓ remark-rehype (markdown AST → HTML AST)
  ↓ rehype-slug (heading에 ID 추가)
  ↓ rehype-autolink-headings (heading 앵커 링크)
  ↓ rehype-highlight (코드 구문 강조)
  ↓ rehype-mermaid (Mermaid 차트 렌더링)
  ↓ rehype-stringify (HTML 문자열)
  → Rendered HTML
```

### 뷰 트래킹 시스템

**위치**: `packages/analytics/src/view-counter.ts`

#### Redis Hash 구조

```
Key: views:{slug}
Hash Fields:
  - views: 조회수 (number)
  - sessions:{sessionId}: 세션 마커 (1)

TTL: 24시간
```

#### 중복 방지 로직

1. 클라이언트에서 세션 ID 생성 (쿠키)
2. `HSETNX` 명령으로 세션 체크 및 삽입 (원자적 연산)
3. 신규 세션이면 `HINCRBY`로 조회수 증가
4. 봇 필터링 (User-Agent 체크)

#### API 라우트

- **GET** `/api/views/[...slug]`: 조회수 조회 (60초 캐싱)
- **POST** `/api/views/[...slug]`: 조회수 증가 (세션 기반)
- **GET** `/api/views/stats`: 전체 통계 및 인기 포스트

### 환경 변수

```env
# Redis (Vercel KV)
REDIS_URL=redis://...

# 사이트 정보
NEXT_PUBLIC_SITE_URL=https://your-blog.com
NEXT_PUBLIC_BLOG_NAME=DEV_BBAK 블로그
NEXT_PUBLIC_AUTHOR_NAME=bbakjun

# Giscus (댓글, 옵션)
NEXT_PUBLIC_GISCUS_REPO_ID=...
```

---

## Blog Admin 앱

### 개요

**FSD(Feature-Sliced Design)** 아키텍처를 따르는 블로그 관리 대시보드입니다.

**위치**: `apps/blog-admin/`
**포트**: 3001
**배포**: Vercel (별도 배포)

### 주요 기능

- 📤 **파일 업로드**: Vercel Blob Storage에 MDX 파일 업로드
- 🖼️ **이미지 업로드**: Blob Storage에 이미지 업로드 (CDN 제공)
- ✏️ **파일 편집**: 브라우저에서 MDX 파일 편집
- 👀 **미리보기**: 실시간 마크다운 미리보기
- 🗂️ **파일 관리**: 파일 목록, 검색, 삭제
- 📊 **이미지 갤러리**: 업로드된 이미지 관리
- ✅ **Zod 검증**: 클라이언트/서버 양방향 검증
- 🔐 **인증**: API Key 기반 보안

### FSD 아키텍처

```
apps/blog-admin/src/
├── app/                      # 📱 App Layer (라우팅)
│   ├── dashboard/
│   │   ├── files/
│   │   │   ├── page.tsx             # 파일 목록
│   │   │   ├── view/page.tsx        # 파일 뷰어
│   │   │   ├── edit/page.tsx        # 파일 편집
│   │   │   └── create/page.tsx      # 파일 생성
│   │   ├── images/page.tsx          # 이미지 갤러리
│   │   └── page.tsx                 # 대시보드 홈
│   ├── api/admin/
│   │   ├── upload/route.ts          # MDX 업로드
│   │   └── upload-image/route.ts    # 이미지 업로드
│   ├── actions/files.ts             # Server Actions
│   ├── layout.tsx
│   └── page.tsx
│
├── widgets/                  # 🧩 Widgets Layer (페이지 조합)
│   ├── file-list/
│   │   └── ui/file-list-widget.tsx
│   ├── file-viewer/
│   │   └── ui/file-viewer-widget.tsx
│   ├── file-editor/
│   │   └── ui/file-editor-widget.tsx
│   ├── file-creator/
│   │   └── ui/file-creator-widget.tsx
│   └── image-gallery/
│       └── ui/image-gallery-widget.tsx
│
├── features/                 # ⚙️ Features Layer (비즈니스 로직)
│   ├── file-list/
│   │   ├── model/use-file-list.ts
│   │   └── ui/file-list-controls.tsx
│   ├── file-view/
│   │   ├── model/use-file-viewer.ts
│   │   └── ui/markdown-preview.tsx
│   ├── file-edit/
│   │   ├── model/use-file-editor.ts
│   │   ├── model/form-schema.ts          # Zod 스키마
│   │   └── ui/frontmatter-editor.tsx
│   ├── file-create/
│   │   ├── model/use-file-creator.ts
│   │   ├── model/form-schema.ts          # Zod 스키마
│   │   ├── ui/category-selector.tsx
│   │   └── ui/path-preview.tsx
│   ├── file-upload/
│   │   ├── model/use-file-uploader.ts
│   │   └── ui/file-upload-form.tsx
│   └── image-upload/
│       ├── model/use-image-uploader.ts
│       └── ui/image-upload-dropzone.tsx
│
├── entities/                 # 🏛️ Entities Layer (도메인 모델)
│   ├── file/
│   │   ├── model/
│   │   │   ├── types.ts
│   │   │   └── schema.ts                 # Zod 스키마
│   │   ├── api/
│   │   │   ├── blob-client.ts
│   │   │   └── queries.ts                # React Query
│   │   ├── ui/file-list-item.tsx
│   │   └── index.ts
│   ├── frontmatter/
│   │   ├── model/
│   │   │   ├── types.ts
│   │   │   └── schema.ts                 # Zod 스키마
│   │   ├── lib/frontmatter.ts            # parse, serialize
│   │   └── index.ts
│   └── session/
│       ├── model/types.ts
│       └── index.ts
│
└── shared/                   # 🔧 Shared Layer (공통 인프라)
    ├── ui/                              # UI 컴포넌트
    │   ├── button.tsx
    │   ├── input.tsx
    │   ├── dialog.tsx
    │   ├── badge.tsx
    │   ├── card.tsx
    │   ├── image-uploader.tsx
    │   └── ...
    ├── lib/
    │   ├── auth.ts                      # API Key 검증
    │   ├── utils.ts                     # cn() 등
    │   └── schemas/                     # 공유 Zod 스키마
    │       ├── file.schema.ts
    │       └── index.ts
    └── hooks/
        ├── use-debounce.ts
        └── use-toast.ts
```

### Zod 검증 아키텍처

#### 1. Shared Layer - 공통 스키마

**위치**: `apps/blog-admin/src/shared/lib/schemas/file.schema.ts`

```typescript
export const createFileSchema = z.object({
  pathname: z.string().min(1, '경로는 필수입니다'),
  title: z.string().min(1, '제목은 필수입니다'),
  description: z.string().min(1, '설명은 필수입니다'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string().min(1)).min(1),
  author: z.string().min(1, '작성자는 필수입니다'),
  draft: z.boolean().optional(),
  content: z.string().min(1, '내용은 필수입니다'),
});

export type CreateFileInput = z.infer<typeof createFileSchema>;
```

#### 2. Entity Layer - 도메인 스키마

**위치**: `apps/blog-admin/src/entities/frontmatter/model/schema.ts`

```typescript
export const frontmatterEntitySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string().min(1)).min(1),
  author: z.string().min(1),
  draft: z.boolean().optional(),
});
```

#### 3. Feature Layer - 폼 스키마

**위치**: `apps/blog-admin/src/features/file-create/model/form-schema.ts`

```typescript
export const fileCreateFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요'),
  // ... 클라이언트 검증용 스키마
});
```

#### 4. Server Actions - 검증 실행

**위치**: `apps/blog-admin/src/app/actions/files.ts`

```typescript
export async function createFile(input: CreateFileInput) {
  // Zod 검증
  const validationResult = createFileSchema.safeParse(input);

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { success: false, error: firstError.message };
  }

  const validatedData = validationResult.data;
  // ... 비즈니스 로직
}
```

### Server Actions

**위치**: `apps/blog-admin/src/app/actions/files.ts`

| 함수                        | 설명              | 검증   |
| --------------------------- | ----------------- | ------ |
| `getFileContent(pathname)`  | 파일 내용 조회    | -      |
| `createFile(input)`         | 파일 생성         | ✅ Zod |
| `updateFile(input)`         | 파일 업데이트     | ✅ Zod |
| `deleteFile(pathname)`      | 파일 삭제         | ✅ Zod |
| `listFiles(limit)`          | 파일 목록 조회    | -      |
| `uploadMarkdown(formData)`  | MDX 업로드        | 수동   |
| `previewMarkdown(content)`  | 마크다운 미리보기 | -      |
| `listImages(prefix, limit)` | 이미지 목록 조회  | -      |

### API 라우트

#### POST /api/admin/upload

MDX 파일을 Blob Storage에 업로드합니다.

**인증**: `Authorization: Bearer {BACKOFFICE_API_KEY}`

**Request (multipart/form-data)**:

```
- file: File (.md 또는 .mdx)
- path: string (저장 경로, 예: "DEV/my-post")
```

**Response**:

```json
{
  "success": true,
  "pathname": "DEV/my-post/index.mdx",
  "url": "https://...",
  "contentType": "text/markdown"
}
```

#### POST /api/admin/upload-image

이미지를 Blob Storage에 업로드합니다.

**Request (multipart/form-data)**:

```
- file: File (image/jpeg, image/png, image/gif, image/webp)
- pathname: string (옵션, 커스텀 경로)
```

**Response**:

```json
{
  "success": true,
  "url": "https://...blob.vercel-storage.com/images/...",
  "pathname": "images/filename.jpg",
  "size": 12345,
  "contentType": "image/jpeg"
}
```

### TanStack Query 통합

**위치**: `apps/blog-admin/src/entities/file/api/queries.ts`

```typescript
// Query Keys
export const fileKeys = {
  all: () => ['files'] as const,
  lists: () => [...fileKeys.all(), 'list'] as const,
  list: (filters: string) => [...fileKeys.lists(), { filters }] as const,
  details: () => [...fileKeys.all(), 'detail'] as const,
  detail: (pathname: string) => [...fileKeys.details(), pathname] as const,
};

// Hooks
export const useFilesQuery = () => useQuery({...});
export const useFileQuery = (pathname) => useQuery({...});
export const useDeleteFileMutation = () => useMutation({...});
```

### 이미지 마이그레이션

**위치**: `scripts/migrate-images.js`, `scripts/update-mdx-paths.js`

#### 실행 순서

1. **이미지 업로드**: `apps/blog/public/static/images/` → Vercel Blob

   ```bash
   export BACKOFFICE_API_KEY=your-key
   node scripts/migrate-images.js
   ```

2. **MDX 경로 업데이트**: `/static/images/` → Blob CDN URL
   ```bash
   DRY_RUN=false node scripts/update-mdx-paths.js
   ```

#### 결과

- 168개 이미지 → Vercel Blob Storage
- 50개 MDX 파일에서 145개 경로 업데이트
- 매핑 파일: `scripts/image-url-mapping.json`

### 환경 변수

```env
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# 백오피스 보안
BACKOFFICE_API_KEY=your-secret-api-key

# Blog URL (ISR 재검증용)
NEXT_PUBLIC_BLOG_URL=https://your-blog.com
```

---

## 공유 패키지

### @repo/content

**위치**: `packages/content/`

마크다운 처리 및 포스트 로딩 로직을 제공합니다.

**주요 함수**:

- `processMarkdown(content: string)`: Markdown → HTML
- `getAllPosts()`: 모든 포스트 로드
- `getPostBySlug(slug: string)`: 특정 포스트 로드
- `getRelatedPosts(post)`: 관련 포스트 추천

**빌드 도구**: tsup (ESM/CJS 번들링)

### @repo/analytics

**위치**: `packages/analytics/`

Redis 기반 뷰 트래킹 클래스를 제공합니다.

**주요 클래스**:

- `ViewCounter`: Redis 뷰 카운터 관리

**메서드**:

- `getViews(slug)`: 조회수 조회
- `incrementViews(slug, sessionId)`: 조회수 증가 (중복 방지)
- `getTopPosts(limit)`: 인기 포스트

### @repo/types

**위치**: `packages/types/`

공유 TypeScript 타입 정의를 제공합니다.

**주요 타입**:

- `Post`: 블로그 포스트 타입
- `FrontMatter`: Front Matter 타입
- `Tag`: 태그 타입

### @repo/ui

**위치**: `packages/ui/`

공유 UI 컴포넌트 및 유틸리티를 제공합니다.

**주요 함수**:

- `cn(...inputs)`: clsx + tailwind-merge 유틸리티

### @repo/config

**위치**: `packages/config/`

공유 설정 파일을 제공합니다 (향후 확장).

---

## 개발 가이드

### 새 포스트 작성

#### 1. 로컬에서 작성 (권장)

```bash
# 1. 카테고리 폴더에 생성
mkdir -p content/posts/DEV/my-new-post

# 2. index.mdx 작성
cat > content/posts/DEV/my-new-post/index.mdx <<'EOF'
---
title: "새로운 포스트"
date: "2024-12-15"
description: "포스트 설명"
tags: ["nextjs", "typescript"]
author: "bbakjun"
draft: false
---

# 안녕하세요

콘텐츠 작성...
EOF

# 3. 개발 서버에서 확인
pnpm dev:blog
```

#### 2. Admin 대시보드에서 작성

```
1. http://localhost:3001/dashboard/files/create 접속
2. 카테고리 선택 (DEV, REACT, JS, etc.)
3. 제목, 설명, 태그, 날짜, 작성자 입력
4. 마크다운 콘텐츠 작성
5. 미리보기 확인
6. "생성" 버튼 클릭
```

### 이미지 추가

#### Admin 대시보드 사용

```
1. 파일 생성/편집 페이지에서 "+ 이미지" 버튼 클릭
2. 이미지 파일 드래그 앤 드롭 또는 선택
3. 자동으로 마크다운에 이미지 URL 삽입
4. 저장
```

#### 로컬 작업

```bash
# 1. 이미지를 포스트 폴더에 저장
cp ~/Downloads/screenshot.png content/posts/DEV/my-post/

# 2. MDX에서 참조
![Screenshot](./screenshot.png)
```

### 새 패키지 추가

```bash
# 1. 패키지 디렉토리 생성
mkdir -p packages/my-package/src

# 2. package.json 생성
cat > packages/my-package/package.json <<EOF
{
  "name": "@repo/my-package",
  "version": "0.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts"
  }
}
EOF

# 3. tsconfig.json 생성
cat > packages/my-package/tsconfig.json <<EOF
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"]
}
EOF

# 4. 앱에서 사용
cd apps/blog
pnpm add @repo/my-package@workspace:*
```

### Zod 스키마 추가

#### 1. Shared 스키마 추가

```typescript
// apps/blog-admin/src/shared/lib/schemas/my.schema.ts
import { z } from 'zod';

export const mySchema = z.object({
  field: z.string().min(1, '필드는 필수입니다'),
});

export type MyInput = z.infer<typeof mySchema>;
```

#### 2. Server Action에서 사용

```typescript
// apps/blog-admin/src/app/actions/my-actions.ts
import { mySchema } from '@/shared/lib/schemas/my.schema';

export async function myAction(input: MyInput) {
  const result = mySchema.safeParse(input);

  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  // 비즈니스 로직
}
```

### 환경 변수 관리

#### 로컬 개발

```bash
# apps/blog/.env.local
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# apps/blog-admin/.env.local
BLOB_READ_WRITE_TOKEN=...
BACKOFFICE_API_KEY=...
```

#### Vercel 배포

1. Vercel 대시보드 → Settings → Environment Variables
2. 환경 변수 추가
3. Production / Preview / Development 선택
4. 재배포

---

## 배포 가이드

### Vercel 배포 - Blog

#### 1. Blog 앱 배포

```
1. Vercel 대시보드에서 "Add New Project"
2. GitHub 저장소 선택
3. Framework Preset: Next.js
4. Root Directory: apps/blog
5. Build Command: cd ../.. && pnpm build:blog
6. Output Directory: .next
7. Install Command: pnpm install
```

#### 2. 환경 변수 설정

```
REDIS_URL=<Vercel KV URL>
NEXT_PUBLIC_SITE_URL=<프로덕션 URL>
NEXT_PUBLIC_GISCUS_REPO_ID=<Giscus ID>
```

#### 3. Vercel KV (Redis) 설정

```
1. Storage → Create Database → KV
2. 환경 변수 자동 설정 (KV_REST_API_URL, KV_REST_API_TOKEN)
3. REDIS_URL로 복사
```

### Vercel 배포 - Blog Admin

#### 1. Blog Admin 앱 배포

```
1. Vercel 대시보드에서 "Add New Project"
2. 동일한 GitHub 저장소 선택
3. Framework Preset: Next.js
4. Root Directory: apps/blog-admin
5. Build Command: cd ../.. && pnpm build:admin
6. Output Directory: .next
7. Install Command: pnpm install
```

#### 2. 환경 변수 설정

```
BLOB_READ_WRITE_TOKEN=<Vercel Blob Token>
BACKOFFICE_API_KEY=<임의의 강력한 키>
NEXT_PUBLIC_BLOG_URL=<Blog 프로덕션 URL>
```

#### 3. Vercel Blob Storage 설정

```
1. Storage → Create → Blob
2. 환경 변수 자동 설정 (BLOB_READ_WRITE_TOKEN)
```

### 배포 워크플로우

```bash
# 1. 로컬에서 테스트
pnpm build
pnpm type-check

# 2. Git 커밋 & 푸시
git add .
git commit -m "feat: Add new feature"
git push origin main

# 3. Vercel 자동 배포
# → main 브랜치에 푸시하면 자동 배포
# → PR 생성 시 Preview 배포
```

### ISR (Incremental Static Regeneration)

Blog 앱은 ISR을 사용하여 포스트를 정적 생성합니다.

```typescript
// apps/blog/src/app/blog/[...slug]/page.tsx
export const revalidate = 3600; // 1시간마다 재검증
```

Admin에서 파일을 수정하면 자동으로 Blog의 ISR 재검증 API를 호출합니다:

```typescript
// apps/blog-admin/src/app/actions/files.ts
await fetch(`${blogUrl}/api/revalidate?path=/blog/${slug}`, {
  method: 'POST',
});
```

---

## 트러블슈팅

### pnpm 관련

#### "Cannot find module '@repo/content'"

```bash
# 패키지 빌드 먼저 실행
pnpm build

# 또는 개발 모드에서 watch 빌드
pnpm --filter=@repo/content build --watch
```

### Zod 관련

#### "Type 'undefined' is not assignable to type 'string'"

```typescript
// 문제: Partial 타입 사용
export interface EditorFormData extends Partial<FrontMatter> {
  content: string;
}

// 해결: 명시적 타입 정의
export interface EditorFormData {
  title: string;
  description: string;
  // ...
  content: string;
}
```

### Blob Storage 관련

#### "BLOB_READ_WRITE_TOKEN is not configured"

```bash
# .env.local 확인
cat apps/blog-admin/.env.local

# Vercel에서 토큰 복사
# Settings → Storage → Blob → Show Token
```

### Redis 관련

#### "Connection refused"

```bash
# 로컬 Redis 시작 (Docker)
docker run -d -p 6379:6379 redis

# 또는 Vercel KV 사용
# .env.local에 REDIS_URL 설정
```

---

## 참고 자료

- [Next.js 15 문서](https://nextjs.org/docs)
- [pnpm Workspace](https://pnpm.io/workspaces)
- [Turborepo](https://turbo.build/repo)
- [FSD 아키텍처](https://feature-sliced.design/)
- [Zod 문서](https://zod.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Vercel KV (Redis)](https://vercel.com/docs/storage/vercel-kv)

---

**마지막 업데이트**: 2024-12-15
**버전**: 1.0.0
