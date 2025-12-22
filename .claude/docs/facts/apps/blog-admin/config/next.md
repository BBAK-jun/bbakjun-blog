# Next.js 설정 (Next.js Configuration)

- **Scope**: blog-admin 애플리케이션의 Next.js 프레임워크 설정
- **Source of Truth**: `next.config.ts`
- **Last Verified**: 2025-12-22
- **Repo Ref**: main

## 개요

blog-admin 애플리케이션은 Next.js App Router를 사용하며, 현재는 기본 설정에 가깝지만 CORS 헤더 구성과 패키지 트랜스파일 설정이 포함되어 있습니다.

## 핵심 설정

### React Strict Mode

- **Location**: `next.config.ts` (L6)
- **Purpose**: React 엄격 모드 활성화
- **Key Details**:
  - 개발 시 추가적인 검증 및 경고 제공
  - 컴포넌트가 두 번 렌더링되어 side effects 감지
- **Dependencies**: React
- **Evidence**: `next.config.ts`: `reactStrictMode: true`

### 페이지 확장자

- **Location**: `next.config.ts` (L7)
- **Purpose**: Next.js가 인식하는 페이지 파일 확장자 목록
- **Key Details**:
  - 지원 확장자: js, jsx, ts, tsx
  - MDX는 포함되지 않음 (blog 앱에만 해당)
- **Dependencies**: Next.js routing
- **Evidence**: `next.config.ts`: `pageExtensions: ["js", "jsx", "ts", "tsx"]`

### 패키지 트랜스파일

- **Location**: `next.config.ts` (L8)
- **Purpose**: node_modules에서 특정 패키지 트랜스파일
- **Key Details**:
  - `@t3-oss/env-nextjs`, `@t3-oss/env-core` 트랜스파일
  - ESM 모듈 호환성 문제 해결
- **Dependencies**: @t3-oss/env-nextjs
- **Evidence**: `next.config.ts`: `transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"]`

### 환경 변수 로드

- **Location**: `next.config.ts` (L3)
- **Purpose**: Next.js 설정 전에 환경 변수 로드
- **Key Details**:
  - `env.ts` import로 t3-env 초기화
  - 빌드 시 환경 변수 검증 수행
- **Dependencies**: @t3-oss/env-nextjs
- **Evidence**: `next.config.ts`: `import './src/env'`

## CORS 헤더 설정

### API 경로 헤더

- **Location**: `next.config.ts` (L9-29)
- **Purpose**: API 라우트에 대한 CORS 헤더 자동 추가
- **Key Details**:
  - `/api/*` 경로의 모든 요청에 헤더 추가
  - NEXT_PUBLIC_BLOG_URL에서 출처 허용
  - 지원 메서드: GET, POST, PUT, DELETE, OPTIONS
- **Dependencies**: Blog app의 API 호출
- **Evidence**: `next.config.ts`: `async headers() { return [{ source: "/api/:path*", headers: [...] }] }`

#### Access-Control-Allow-Origin

- 동적 설정: `process.env.NEXT_PUBLIC_BLOG_URL` 또는 기본값 `http://localhost:3000`
- 블로그 앱의 API 호출 허용

#### Access-Control-Allow-Methods

- 모든 HTTP 메서드 허용 (GET, POST, PUT, DELETE, OPTIONS)

#### Access-Control-Allow-Headers

- Content-Type, Authorization 헤더 허용

## TypeScript 설정 연동

### tsconfig.json 구성

- **Location**: `tsconfig.json` (L1-23)
- **Purpose**: TypeScript 컴파일러 설정
- **Key Details**:
  - 루트 tsconfig.json 상속
  - baseUrl과 path aliases 설정
  - Next.js 플러그인 활성화
- **Dependencies**: TypeScript, Next.js
- **Evidence**: `tsconfig.json`: `"extends": "../../tsconfig.json", "baseUrl": ".", "paths": { "@/*": ["./src/*"] }`

### 포함 파일

- **Location**: `tsconfig.json` (L14-21)
- **Purpose**: 컴파일 대상 파일 목록
- **Key Details**:
  - 모든 .ts, .tsx 파일 포함
  - Next.js 타입 정의 포함 (.next/types)
  - Auth 관련 파일 포함 (auth.ts, auth.config.ts)
- **Evidence**: `tsconfig.json`: `include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", "auth.ts", "auth.config.ts"]`

## Tailwind CSS 설정

### tailwind.config.ts 구성

- **Location**: `tailwind.config.ts` (L1-93)
- **Purpose**: Tailwind CSS 프레임워크 설정
- **Key Details**:
  - 다크 모드: class 전략
  - 컨텐츠 경로: src/와 packages/ui 포함
  - 커스텀 컬러: background, foreground CSS 변수
  - 플러그인: line-clamp, typography
- **Dependencies**: Tailwind CSS, @tailwindcss/typography
- **Evidence**: `tailwind.config.ts`: `darkMode: 'class', content: ["./src/**/*", "../../packages/ui/src/**/*"]`

### Typography 스타일 오버라이드

- **Location**: `tailwind.config.ts` (L20-84)
- **Purpose**: @tailwindcss/typography 기본 스타일 커스터마이징
- **Key Details**:
  - color: inherit로 다크 모드 지원
  - maxWidth: 'none'로 제약 해제
  - 링크, 코드, 인용 등 상속 색상 사용
- **Evidence**: `tailwind.config.ts`: `typography: { DEFAULT: { css: { color: 'inherit', maxWidth: 'none' } } }`

## 빌드 설정

### 빌드 커맨드 (package.json)

- **Location**: `package.json` (L14)
- **Purpose**: 프로덕션 빌드 실행 명령
- **Key Details**:
  - Prisma Client 생성 먼저 실행
  - Next.js 빌드 실행
- **Dependencies**: Prisma, Next.js
- **Evidence**: `package.json`: `"build": "prisma generate && next build"`

### Postinstall 스크립트

- **Location**: `package.json` (L22)
- **Purpose**: 설치 후 자동 실행 스크립트
- **Key Details**:
  - Prisma Client 생성
  - RPC 타입 정의 빌드
- **Dependencies**: Prisma, tsup
- **Evidence**: `package.json`: `"postinstall": "prisma generate && pnpm build:rpc"`

## 현재 제한 사항

### MDX 지원

- **상태**: 미지원
- **이유**: blog-admin은 MDX 콘텐츠를 직접 렌더링하지 않음
- **영향**: 코드 미리보기는 CodeMirror 사용

### 실험적 기능

- **상태**: 비활성화
- **현재 설정**: 기본값 사용
- **추가 고려**: Turbopack (개발 시 성능 향상 가능)

## 권장 개선 사항

### 1. 이미지 최적화 설정

```typescript
images: {
  domains: ['your-vercel-blob-domain.com'],
  formats: ['image/webp', 'image/avif'],
}
```

### 2. 실험적 기능 활성화 (고려)

```typescript
experimental: {
  serverComponentsExternalPackages: ['@prisma/client'],
  optimizeCss: true,
}
```

### 3. Turbopack 설정 (개발용)

```typescript
// next.config.ts 개발 전용 설정
const nextConfig = {
  turbo: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};
```

## 관련 파일

### Vercel 설정

- **File**: `vercel.json`
- **Purpose**: Vercel 배포 설정
- **Key Details**: Framework, 빌드 커맨드, 출력 디렉토리 지정

### 테스트 설정

- **File**: `vitest.config.ts`
- **Purpose**: Vitest 테스트 프레임워크 설정
- **Key Details**: Node 환경, 전역 함수, 경로 별칭

### RPC 빌드 설정

- **File**: `tsup.config.ts`
- **Purpose**: Hono RPC 타입 정의 빌드
- **Key Details**: ESM 포맷, 타입 정의 생성, 소스맵
