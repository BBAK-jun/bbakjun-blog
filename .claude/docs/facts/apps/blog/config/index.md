# Blog App - Configuration

- **Scope**: Blog 앱의 모든 설정 파일 및 환경변수
- **Source of Truth**: next.config.ts, env.ts, package.json
- **Last Verified**: 2025-12-26
- **Repo Ref**: main

## 개요

Blog 앱의 설정은 다음과 같이 구성됩니다:

1. **Next.js 설정**: MDX, 이미지, 트랜스파일 패키지
2. **환경변수**: 서버/클라이언트 변수 (타입 안전)
3. **의존성**: package.json
4. **Tailwind CSS**: 스타일 시스템
5. **TypeScript**: 타입 검증

---

## Next.js 설정

### `next.config.ts`

- **Location**: `apps/blog/next.config.ts` (L1-L43)
- **Purpose**: Next.js 15 + MDX 설정

**설정 항목**:

```typescript
const nextConfig: NextConfig = {
  // 1. 페이지 확장자
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

  // 2. 트랜스파일 패키지 (workspace packages)
  transpilePackages: [
    '@repo/content',
    '@repo/analytics',
    '@repo/types',
    '@repo/ui',
    '@t3-oss/env-nextjs',
    '@t3-oss/env-core',
  ],

  // 3. 이미지 설정
  images: {
    // Vercel Blob Storage 호스트
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
    // 최신 이미지 형식
    formats: ['image/webp', 'image/avif'],
    // 반응형 이미지 사이즈
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

**MDX 설정**:

```typescript
const withMDX = createMDX({
  options: {
    remarkPlugins: [],  // 빈 배열 (plugins는 @repo/content에서 처리)
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
```

**특징**:

- **MDX 지원**: `@next/mdx`로 MDX 파일 import 가능
- **Rust 컴파일러**: 사용하지 않음 (기본 JS 컴파일러)
- **Remark/Rehype**: 빈 배열 (plugins는 `@repo/content`의 `processMarkdown`에서 처리)
- **트랜스파일**: workspace 패키지를 ES5로 트랜스파일하지 않음

**Evidence**:

- `apps/blog/next.config.ts:6-32`: NextConfig 설정

---

## 환경변수 설정

### `src/env.ts`

- **Location**: `apps/blog/src/env.ts` (L1-L48)
- **Purpose**: 타입 안전한 환경변수 접근 (`@t3-oss/env-nextjs`)

**서버 사이드 변수**:

```typescript
server: {
  // Redis 연결 URL (선택사항)
  REDIS_URL: z.string().url().optional(),

  // ISR 재검증 시크릿 토큰 (선택사항)
  REVALIDATION_SECRET: z.string().min(1).optional(),
}
```

**클라이언트 사이드 변수**:

```typescript
client: {
  // 사이트 기본 URL (선택사항, OG 이미지용)
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // Blog-Admin 앱 URL (필수, RPC 통신용)
  NEXT_PUBLIC_ADMIN_URL: z.string().url(),

  // Giscus 리포지토리 (선택사항)
  NEXT_PUBLIC_GISCUS_REPO: z.string().optional(),

  // Giscus 리포지토리 ID (선택사항)
  NEXT_PUBLIC_GISCUS_REPO_ID: z.string().optional(),

  // Giscus 카테고리명 (선택사항)
  NEXT_PUBLIC_GISCUS_CATEGORY: z.string().optional(),

  // Giscus 카테고리 ID (선택사항)
  NEXT_PUBLIC_GISCUS_CATEGORY_ID: z.string().optional(),
}
```

**런타임 환경변수 매핑**:

```typescript
runtimeEnv: {
  REDIS_URL: process.env.REDIS_URL,
  REVALIDATION_SECRET: process.env.REVALIDATION_SECRET,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
  NEXT_PUBLIC_GISCUS_REPO: process.env.NEXT_PUBLIC_GISCUS_REPO,
  NEXT_PUBLIC_GISCUS_REPO_ID: process.env.NEXT_PUBLIC_GISCUS_REPO_ID,
  NEXT_PUBLIC_GISCUS_CATEGORY: process.env.NEXT_PUBLIC_GISCUS_CATEGORY,
  NEXT_PUBLIC_GISCUS_CATEGORY_ID: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
}
```

**검증 건너뛰기**:

```typescript
skipValidation: !!process.env.SKIP_ENV_VALIDATION,
```

**사용 예시**:

```typescript
import { env } from '@/env';

// 서버 사이드
const redisUrl = env.REDIS_URL;
const secret = env.REVALIDATION_SECRET;

// 클라이언트 사이드
const adminUrl = env.NEXT_PUBLIC_ADMIN_URL;
const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
```

**검증 동작**:

- 개발/빌드 시 첫 `import`에서 검증 실행
- 필수 변수 누락 시 에러 발생
- `SKIP_ENV_VALIDATION=true` 시 검증 건너뜀 (Docker 빌드용)

**Evidence**:

- `apps/blog/src/env.ts:4-47`: createEnv로 환경변수 스키마 정의

---

## 의존성 설정

### `package.json`

- **Location**: `apps/blog/package.json` (L1-L66)
- **Purpose**: 프로젝트 의존성 및 스크립트

**의존성 (Dependencies)**:

```json
{
  "dependencies": {
    // MDX
    "@mdx-js/loader": "^3.1.1",
    "@mdx-js/react": "^3.1.1",
    "@next/mdx": "^16.0.7",
    "next-mdx-remote": "^5.0.0",

    // UI 라이브러리
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",

    // Workspace 패키지
    "@repo/analytics": "workspace:*",
    "@repo/content": "workspace:*",
    "@repo/types": "workspace:*",
    "@repo/ui": "workspace:*",

    // 환경변수
    "@t3-oss/env-nextjs": "^0.13.10",

    // Tailwind CSS
    "@tailwindcss/line-clamp": "^0.4.4",
    "@tailwindcss/typography": "^0.5.19",
    "tailwindcss-animate": "^1.0.7",

    // 상태 관리
    "@tanstack/react-query": "^5.90.12",
    "nuqs": "^2.8.5",

    // 테마
    "next-themes": "^0.4.6",

    // 유틸리티
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0",
    "zod": "^4.1.13",

    // 댓글
    "@giscus/react": "^3.1.0",

    // 분석
    "@vercel/analytics": "^1.6.1",

    // 기타
    "lucide-react": "^0.553.0",
    "marked": "^17.0.0",
    "resend": "^6.6.0",
    "uuid": "^13.0.0"
  }
}
```

**개발 의존성 (DevDependencies)**:

```json
{
  "devDependencies": {
    // Tailwind CSS v4
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",

    // TypeScript
    "typescript": "^5",
    "@types/mdx": "^2.0.13",
    "@types/node": "^24",
    "@types/react": "^19",
    "@types/react-dom": "^19",

    // Linting
    "eslint": "^9",
    "eslint-config-next": "16.0.3",

    // DevTools
    "@tanstack/react-query-devtools": "^5.91.1",

    // OpenAPI
    "openapi-typescript": "^7.9.1",

    // Workspace
    "@apps/blog-admin": "workspace:*"
  }
}
```

**스크립트**:

```json
{
  "scripts": {
    "prepare": "turbo run build:rpc --filter @apps/blog-admin",
    "prebuild": "pnpm prepare",
    "predev": "pnpm prepare",
    "pretype-check": "pnpm prepare",
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "type-check": "tsc --noEmit"
  }
}
```

**스크립트 설명**:

| 스크립트 | 설명 |
|----------|------|
| `prepare` | Blog-Admin RPC 타입 빌드 (의존성) |
| `prebuild` | 빌드 전 RPC 타입 빌드 |
| `predev` | 개발 전 RPC 타입 빌드 |
| `pretype-check` | 타입 체크 전 RPC 타입 빌드 |
| `dev` | 개발 서버 시작 (port 3000) |
| `build` | 프로덕션 빌드 |
| `start` | 프로덕션 서버 시작 |
| `lint` | ESLint 실행 |
| `type-check` | TypeScript 타입 검증 |

**Evidence**:

- `apps/blog/package.json:5-15`: 스크립트 정의
- `apps/blog/package.json:16-64`: 의존성 목록

---

## Tailwind CSS 설정

### `src/app/globals.css`

- **Location**: `apps/blog/src/app/globals.css` (L1-L171)
- **Purpose**: Tailwind CSS v4 설정 및 전역 스타일

**Tailwind v4 설정**:

```css
@import "tailwindcss";

@plugin "tailwindcss-animate";

@custom-variant dark (&:is(.dark *));
```

**테마 변수**:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  /* ... */
}
```

**색상 시스템**:

- **OKLCH 색상 공간**: 더 일관된 색상 (HSL보다 개선됨)
- **다크모드**: `.dark` 클래스로 전환
- **Semantic 색상**: `--primary`, `--secondary`, `--muted`, etc.

**라이트 모드 색상** (`:root`):

```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);           /* 흰색 */
  --foreground: oklch(0.145 0 0);      /* 거의 검은색 */
  --primary: oklch(0.205 0 0);         /* 짙은 회색 */
  --secondary: oklch(0.97 0 0);        /* 밝은 회색 */
  --muted: oklch(0.97 0 0);            /* 밝은 회색 */
  --accent: oklch(0.97 0 0);           /* 밝은 회색 */
  --destructive: oklch(0.577 0.245 27.325); /* 빨간색 */
  --border: oklch(0.922 0 0);          /* 밝은 회색 */
  --input: oklch(0.922 0 0);           /* 밝은 회색 */
  --ring: oklch(0.708 0 0);            /* 회색 */
}
```

**다크 모드 색상** (`.dark`):

```css
.dark {
  --background: oklch(0.145 0 0);      /* 거의 검은색 */
  --foreground: oklch(0.985 0 0);      /* 흰색 */
  --primary: oklch(0.922 0 0);         /* 흰색 */
  --secondary: oklch(0.269 0 0);       /* 어두운 회색 */
  --muted: oklch(0.269 0 0);           /* 어두운 회색 */
  --accent: oklch(0.269 0 0);          /* 어두운 회색 */
  --destructive: oklch(0.704 0.191 22.216); /* 빨간색 */
  --border: oklch(1 0 0 / 10%);       /* 반투명 회색 */
  --input: oklch(1 0 0 / 15%);        /* 반투명 회색 */
  --ring: oklch(0.556 0 0);            /* 회색 */
}
```

**베이스 스타일**:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }

  /* 부드러운 다크모드 전환 (200ms) */
  html {
    transition: background-color 200ms ease-in-out, color 200ms ease-in-out;
  }

  /* 블로그 이미지 최적화 */
  .blog-image {
    @apply shadow-md;
    transition: transform 200ms ease-in-out, box-shadow 200ms ease-in-out;
  }

  .blog-image:hover {
    @apply shadow-lg;
    transform: scale(1.01);
  }

  /* 반응형 이미지 */
  img {
    @apply max-w-full h-auto;
  }
}
```

**Mermaid 스타일**:

```css
@import './mermaid.css';
```

**Evidence**:

- `apps/blog/src/app/globals.css:1-171`: Tailwind 설정 및 전역 스타일

---

## TypeScript 설정

### `tsconfig.json`

- **Location**: `apps/blog/tsconfig.json` (루트에서 확장)
- **Purpose**: TypeScript 컴파일러 설정

**주요 설정**:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**특징**:

- 루트 `tsconfig.json` 확장
- Next.js 플러그인 사용
- 경로 별칭: `@/*` → `./src/*`

---

## ESLint 설정

### `.eslintrc.js`

- **Location**: `apps/blog/.eslintrc.js` (루트에서 확장)
- **Purpose**: ESLint 규칙

**주요 설정**:

```javascript
module.exports = {
  extends: ['next', 'prettier'],
  rules: {
    // 커스텀 규칙
  },
};
```

**특징**:

- `next` config 확장
- `prettier` config 확장 (충돌 방지)

---

## Vercel 설정

### `vercel.json`

- **Location**: `apps/blog/vercel.json`
- **Purpose**: Vercel 배포 설정

**설정**:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**특징**:

- 빌드 명령: `pnpm build`
- 출력 디렉토리: `.next`
- 프레임워크: Next.js (자동 감지)

---

## 환경별 설정

### 로컬 개발 (`.env.local`)

```bash
# Blog-Admin RPC 통신
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001

# Redis (선택사항)
REDIS_URL=redis://localhost:6379

# ISR 재검증 (선택사항)
REVALIDATION_SECRET=your-secret-token

# 사이트 URL (선택사항)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Giscus (선택사항)
NEXT_PUBLIC_GISCUS_REPO=BBAK-jun/bbakjun-blog
NEXT_PUBLIC_GISCUS_REPO_ID=R_kgDON12345
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDON12345
```

### 프로덕션 (Vercel Environment Variables)

```bash
# 필수
NEXT_PUBLIC_ADMIN_URL=https://admin.example.com

# 선택사항
REDIS_URL=redis://...
REVALIDATION_SECRET=...
NEXT_PUBLIC_SITE_URL=https://your-site.com
NEXT_PUBLIC_GISCUS_REPO=...
NEXT_PUBLIC_GISCUS_REPO_ID=...
```

---

## 설정 우선순위

1. **코드 내 기본값**: `env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'`
2. **로컬 .env 파일**: `.env.local`
3. **Vercel 환경변수**: 프로덕션 배포 시
4. **빌드 타임 검증**: `env.ts`에서 Zod 스키마 검증

---

## 보안 설정

### 1. 시크릿 토큰

- `REVALIDATION_SECRET`: OpenSSL로 생성
  ```bash
  openssl rand -base64 32
  ```

### 2. 환경변수 분리

- **서버 전용**: `REDIS_URL`, `REVALIDATION_SECRET` (클라이언트 노출 안됨)
- **클라이언트**: `NEXT_PUBLIC_*` 프리픽스 (공개됨)

### 3. CORS 설정

- Blog-Admin 간 통신만 허용 (필요시)

---

## 성능 설정

### 1. ISR 재검증

| 페이지 | 재검증 간격 |
|--------|-------------|
| 홈 (`/`) | 60초 |
| 포스트 (`/blog/[...slug]`) | 60초 |
| 태그 (`/tags/[tag]`) | 300초 |
| 시리즈 (`/series`) | 300초 |
| About (`/about`) | 300초 |

### 2. 이미지 최적화

- **형식**: WebP, AVIF
- **디바이스 사이즈**: 640px ~ 3840px
- **이미지 사이즈**: 16px ~ 384px
- **Lazy loading**: `loading="lazy"`

### 3. 캐싱

- **TanStack Query**: 1분 (`staleTime`)
- **RPC 통계**: 5분 (`next: { revalidate: 300 }`)
- **RSS Feed**: 1시간 (`Cache-Control`)

---

## 개발자 경험

### 1. 핫 리로드

- `pnpm dev`로 자동 리로드
- Fast Refresh 지원

### 2. 타입 안전성

- TypeScript strict mode
- Zod 런타임 검증
- Hono RPC 타입 추론

### 3. DevTools

- TanStack Query DevTools (개발 환경만)
- React DevTools
- Next.js DevTools

### 4. Linting

- ESLint + Prettier
- 자동 포맷팅
- `pnpm lint`로 검증

---

## 트러블슈팅

### 1. RPC 타입 에러

```bash
# Blog-Admin RPC 타입 재빌드
pnpm prepare
```

### 2. 환경변수 에러

```bash
# 검증 건너뛰기 (Docker 빌드용)
SKIP_ENV_VALIDATION=true pnpm build
```

### 3. Tailwind CSS 빌드 에러

```bash
# 캐시 삭제 후 재빌드
rm -rf .next
pnpm build
```

### 4. TypeScript 에러

```bash
# 타입 검증
pnpm type-check
```
