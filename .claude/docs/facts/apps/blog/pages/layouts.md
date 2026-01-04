# Layouts

- **Scope**: Blog 앱의 레이아웃 계층 구조, 컨테이너 패턴, 스타일링
- **Source of Truth**: App Router Layout 파일
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## 메타데이터

```yaml
---
metadata:
  version: "2.0.0"
  created_at: "2026-01-04T00:00:00Z"
  last_verified: "2026-01-04T00:00:00Z"
  git_commit: "628174858956a2b1ff3d7c33e4ae03c790ed3208"
  git_branch: "BBAK-jun/vaduz"

  source_files:
    apps/blog/src/app/layout.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/src/app/globals.css:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/tailwind.config.ts:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true

  changed_files:
    - path: apps/blog/src/app/layout.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "Unified layout container hierarchy with max-w-3xl pattern (commit 40e4015)"

  deleted_files: []

  extraction_config:
    depth: "standard"
    scope: "layouts"
    stale_detection: true
---
```

---

## 레이아웃 계층 구조

### Root Layout

- **Location**: `apps/blog/src/app/layout.tsx` (L1-L74)
- **Purpose**: 전체 앱의 최상위 레이아웃
- **Source Exists**: true
- **Key Details**:
  - **HTML 구조**:
    ```tsx
    <html lang="ko" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <NuqsAdapter>
            <ThemeProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="grow">
                  <div className="mx-auto max-w-3xl px-4 py-12">
                    {children}
                  </div>
                </main>
                <Footer />
              </div>
            </ThemeProvider>
          </NuqsAdapter>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
    ```
  - **Container Pattern**: `max-w-3xl mx-auto px-4 py-12` (commit 40e4015)
  - **Flex Layout**: `min-h-screen flex flex-col`으로 Footer 하단 고정
  - **Grow Main**: `main className="grow"`으로 컨텐츠 영역 확장
  - **폰트**: Geist Sans, Geist Mono (Google Fonts)
  - **테마**: 다크모드 지원 (suppressHydrationWarning)
- **Dependencies**:
  - `next/font/google`: Geist, Geist_Mono
  - `@/features/navigation`: Header, Footer
  - `@/features/theme-toggle/ui`: ThemeProvider
  - `@/shared/providers/query-provider`: QueryProvider
  - `nuqs/adapters/next/app`: NuqsAdapter
  - `@vercel/analytics/react`: Analytics
- **Evidence**:
  - `apps/blog/src/app/layout.tsx`: `<html lang="ko" suppressHydrationWarning><body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}><QueryProvider><NuqsAdapter><ThemeProvider attribute="class" defaultTheme="system" enableSystem><div className="min-h-screen flex flex-col"><Header /><main className="grow"><div className="mx-auto max-w-3xl px-4 py-12">{children}</div></main><Footer /></div></ThemeProvider></NuqsAdapter></QueryProvider><Analytics /></body></html>`

---

## 컨테이너 패턴 (commit 40e4015)

### Unified Container Structure

**변경 전**: 각 페이지에서 다른 max-width 값 사용
**변경 후**: 모든 페이지에서 `max-w-3xl mx-auto px-4 py-12` 통일 사용

### Pattern 구성

```tsx
<div className="mx-auto max-w-3xl px-4 py-12">
  {children}
</div>
```

- **max-w-3xl**: 최대 너비 768px (48rem)
- **mx-auto**: 수평 중앙 정렬
- **px-4**: 좌우 패딩 1rem (16px)
- **py-12**: 상하 패딩 3rem (48px)

### 적용 대상

- ✅ 홈 페이지 (`/`)
- ✅ 블로그 목록 (`/blog`)
- ✅ 블로그 상세 (`/blog/[...slug]`)
- ✅ 태그 페이지 (`/tags`, `/tags/[tag]`)
- ✅ 시리즈 페이지 (`/series`, `/series/[slug]`)
- ✅ 소개 페이지 (`/about`)

### 이점

1. **일관된 독자 경험**: 모든 페이지에서 동일한 컨텐츠 너비
2. **가독성 향상**: 768px 너비가 읽기에 최적화됨
3. **유지보수성**: 단일 패턴으로 스타일 일관성 보장
4. **반응형 디자인**: 모바일에서 px-4로 여백 유지

---

## Flex Layout Pattern

### Full Height Layout

```tsx
<div className="min-h-screen flex flex-col">
  <Header />
  <main className="grow">
    <div className="mx-auto max-w-3xl px-4 py-12">
      {children}
    </div>
  </main>
  <Footer />
</div>
```

### 속성 분석

- **min-h-screen**: 최소 높이를 화면 높이(100vh)로 설정
- **flex flex-col**: 세로 방향 플렉스박스 레이아웃
- **main className="grow"**: 남은 공간을 모두 차지 (Footer 하단 고정)

### 동작

1. 컨텐츠가 적을 때: Footer가 화면 하단에 고정
2. 컨텐츠가 많을 때: 스크롤 생성, Footer는 컨텐츠 아래에 위치

---

## 글로벌 스타일

### globals.css

- **Location**: `apps/blog/src/app/globals.css` (L1-L169)
- **Purpose**: 글로벌 CSS 변수, 테마, 기본 스타일
- **Source Exists**: true
- **Key Details**:
  - **Tailwind CSS v4**: `@import "tailwindcss"`
  - **Dark Mode Animation**: 200ms smooth transition (commit c56ca3b)
  - **CSS Variables**: 테마 색상, 반지름, 폰트
  - **Responsive Images**: `max-w-full h-auto`
  - **Reduced Motion**: 접근성 지원

### CSS Variables

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  /* ... 색상 변수들 ... */
}
```

### Theme Colors

**Light Mode** (`:root`):
- `--background`: oklch(1 0 0) - 순백색
- `--foreground`: oklch(0.15 0 0) - 거의 검정
- `--primary`: oklch(0 0 0) - 검정
- `--border`: oklch(0.9 0 0) - 밝은 회색

**Dark Mode** (`.dark`):
- `--background`: oklch(0.08 0 0) - 매우 어두운 회색
- `--foreground`: oklch(0.95 0 0) - 거의 흰색
- `--primary`: oklch(1 0 0) - 흰색
- `--border`: oklch(1 0 0 / 10%) - 투명도 10% 흰색

### Dark Mode Transitions

```css
/* Smooth dark mode transitions */
html {
  transition: background-color 200ms ease-in-out, color 200ms ease-in-out;
}

body, div, header, footer, nav, main, section, article, aside {
  transition: background-color 200ms ease-in-out, color 200ms ease-in-out,
    border-color 200ms ease-in-out;
}
```

- **200ms**: 빠르지만 자연스러운 전환
- **ease-in-out**: 부드러운 가속/감속
- **요소별 적용**: 깜빡임 방지

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

- **접근성**: 움직임에 민감한 사용자 지원
- **시스템 설정**: OS의 "동작 줄이기" 설정 반영

---

## Tailwind Configuration

### tailwind.config.ts

- **Location**: `apps/blog/tailwind.config.ts` (L1-L148)
- **Purpose**: Tailwind CSS 커스텀 설정
- **Source Exists**: true
- **Key Details**:
  - **Content Paths**: App Router, MDX 파일 포함
  - **Custom Font Sizes**: 2xl~6xl 커스텀 크기
  - **Typography Plugin**: Prose 스타일링
  - **Line Clamp Plugin**: 텍스트 줄 제한

### Content Paths

```typescript
content: [
  './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  './content/**/*.{md,mdx}',
  './mdx-components.tsx',
],
```

### Custom Font Sizes

```typescript
fontSize: {
  '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.03em' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.04em' }],
  '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
  '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.06em' }],
}
```

- **Letter Spacing**: 큰 제목일수록 자간 줄임
- **Line Height**: 큰 제목일수록 행간 줄임

### Typography Configuration

```typescript
typography: {
  DEFAULT: {
    css: {
      maxWidth: 'none',
      color: 'inherit',
      fontSize: '1.0625rem',
      lineHeight: '1.75',
      /* ... 스타일 확장 ... */
    },
  },
}
```

- **color: inherit**: 테마 색상 상속
- **maxWidth: none**: 컨테이너 너비 제한 없음
- **fontSize: 1.0625rem**: 17px (가독성 최적화)
- **lineHeight: 1.75**: 175% 행간 (읽기 최적화)

### Blockquote Styling

```css
blockquote {
  color: inherit;
  borderLeftColor: currentColor;
  borderLeftWidth: '1px';
  paddingLeft: '1rem';
  fontStyle: 'normal';
}

blockquote p {
  marginTop: '0';
  marginBottom: '0';
}
```

- **margin 제거**: blockquote 하단 p 태그의 여백 제거 (commit c3e2c62)

---

## 폰트 설정

### Google Fonts

```typescript
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
```

### CSS Variables

```css
--font-sans: var(--font-geist-sans);
--font-mono: var(--font-geist-mono);
```

### Usage

```tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
```

- **variable**: 폰트 패밀리 변수 설정
- **antialiased**: 폰트 스무딩 (하위 픽셀 렌더링)

---

## 스타일링 패턴

### Divide Pattern

**구분선 스타일링**:

```tsx
<div className="divide-y divide-border/15">
  {items.map(item => (
    <div key={item.id} className="py-4">
      {item.content}
    </div>
  ))}
</div>
```

- **divide-y**: 하위 요소 간 가로 구분선
- **divide-border/15**: 15% 투명도 구분선
- **py-4**: 각 항목의 상하 패딩

### Hover Pattern

**링크 호버 효과**:

```tsx
<Link
  href="/blog/post"
  className="text-muted-foreground hover:text-foreground hover:underline decoration-1 underline-offset-2"
>
  Post Title
</Link>
```

- **hover:text-foreground**: 마우스 오버 시 색상 변경
- **hover:underline**: 밑줄 표시
- **decoration-1**: 얇은 밑줄 (1px)
- **underline-offset-2**: 텍스트와 밑줄 간격 2px

### Text Clamp Pattern

**텍스트 줄 제한**:

```tsx
<p className="line-clamp-2 leading-relaxed">
  {description}
</p>
```

- **line-clamp-2**: 최대 2줄 표시, 초과 시 생략 부호(...)
- **leading-relaxed**: 행간 1.625 (26px)

### Tabular Nums Pattern

**숫자 정렬**:

```tsx
<div className="tabular-nums">
  {views.toLocaleString()}
</div>
```

- **tabular-nums**: 숫자를 테이블 형식으로 정렬 (조회수 표시에 사용)

---

## 반응형 디자인

### Breakpoints

Tailwind 기본 브레이크포인트 사용:

- **sm**: 640px (모바일)
- **md**: 768px (태블릿)
- **lg**: 1024px (데스크톱)
- **xl**: 1280px (와이드 데스크톱)

### Responsive Padding

```tsx
<div className="px-4 sm:px-6 lg:px-8">
  {content}
</div>
```

- **px-4**: 모바일 (16px)
- **sm:px-6**: 태블릿 (24px)
- **lg:px-8**: 데스크톱 (32px)

### Responsive Typography

```tsx
<h1 className="text-5xl md:text-6xl font-bold">
  Title
</h1>
```

- **text-5xl**: 모바일 (3rem = 48px)
- **md:text-6xl**: 태블릿 이상 (3.75rem = 60px)

---

## 다크모드 지원

### Theme Provider

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
>
  {children}
</ThemeProvider>
```

- **attribute="class"**: .dark 클래스로 테마 전환
- **defaultTheme="system"**: OS 테마 따라감
- **enableSystem**: 시스템 테마 감지 활성화

### Theme Toggle

- **Component**: `@/features/theme-toggle/ui/theme-toggle.tsx`
- **Icon**: Sun/Moon 아이콘
- **Transition**: 200ms smooth animation

### Dark Mode CSS

```css
.dark {
  --background: oklch(0.08 0 0);
  --foreground: oklch(0.95 0 0);
  /* ... */
}
```

- **Class Strategy**: .dark 클래스 추가 시 테마 변경
- **OKLCH**: 현대적인 색공간 (일관된 밝기)

---

## 접근성

### Semantic HTML

- `<header>`: 사이트 헤더
- `<main>`: 주요 컨텐츠
- `<footer>`: 사이트 푸터
- `<nav>`: 네비게이션
- `<article>`: 독립적인 컨텐츠
- `<section>`: 콘텐츠 섹션

### ARIA Labels

```tsx
<button aria-label="검색 지우기">
  <Icon />
</button>
```

### Focus Management

```tsx
inputRef.current?.focus(); // 검색창 포커스
inputRef.current?.blur();  // 검색창 해제
```

### Keyboard Navigation

- **Tab**: 포커스 이동
- **Enter**: 링크/버튼 활성화
- **Cmd+K**: 검색창 포커스
- **ESC**: 검색창 닫기

---

## 성능 최적화

### Font Loading

```typescript
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap', // 폰트 로딩 중 텍스트 표시
});
```

### Antialiasing

```tsx
<body className="antialiased">
```

- **하위 픽셀 렌더링**: 폰트 부드럽게 표시
- **Cross-browser**: Chrome, Firefox, Safari 지원

### CSS Transitions

```css
transition: background-color 200ms ease-in-out, color 200ms ease-in-out;
```

- **GPU 가속**: transform, opacity 사용 시
- **짧은 시간**: 200ms로 빠른 전환

---

## 변경사항 요약

### commit 40e4015: Layout Container Hierarchy Unification

**변경 전**:
```tsx
<div className="max-w-4xl mx-auto px-6 py-12"> {/* 홈 페이지 */}
<div className="max-w-3xl mx-auto px-4 py-8">  {/* 블로그 페이지 */}
```

**변경 후**:
```tsx
<div className="mx-auto max-w-3xl px-4 py-12"> {/* 모든 페이지 통일 */}
```

**이점**:
- 일관된 컨텐츠 너비 (768px)
- Footer 하단 고정 (flex grow)
- 유지보수성 향상

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
