# MDX Components

- **Scope**: Blog 앱의 MDX 커스텀 컴포넌트, 렌더링 설정
- **Source of Truth**: mdx-components.tsx, @repo/content
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
    apps/blog/mdx-components.tsx:
      git_hash: "6ff4a48"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true

  changed_files:
    - path: apps/blog/mdx-components.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "Fixed image aspect ratio preservation with w-full h-auto (commit 6ff4a48)"

  deleted_files: []

  extraction_config:
    depth: "standard"
    scope: "components"
    stale_detection: true
---
```

---

## MDX Components 설정

### mdx-components.tsx

- **Location**: `apps/blog/mdx-components.tsx` (L1-L66)
- **Purpose**: MDX 파일에서 사용하는 HTML 요소들의 커스텀 렌더링
- **Source Exists**: true
- **Key Details**:
  - useMDXComponents 함수로 컴포넌트 오버라이드
  - 헤딩 (h1-h3): 커스텀 크기, 색상, 마진
  - 단락 (p): leading-relaxed로 가독성 향상
  - 링크 (a): 외부 링크는 새 탭에서 열림
  - 목록 (ul, ol): 커스텀 마커 스타일
  - 인용문 (blockquote): 파란색 왼쪽 테두리
  - 코드 (code, pre): 배경색, 라운딩
  - 이미지 (img): w-full h-auto로 비율 보존 (commit 6ff4a48)
- **Dependencies**:
  - `mdx/types`: MDXComponents 타입
- **Evidence**:
  - `apps/blog/mdx-components.tsx`: `export function useMDXComponents(components: MDXComponents): MDXComponents { return { h1: ({ children }) => <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100">{children}</h1>, img: props => <img {...props} className="rounded-lg my-6 w-full h-auto" alt={props.alt || ''} />, ...components, }; }`

---

## 컴포넌트 상세

### 헤딩 (Headings)

#### h1

```tsx
h1: ({ children }) => (
  <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100">
    {children}
  </h1>
)
```

- **크기**: text-4xl (2.25rem = 36px)
- **굵기**: font-bold (700)
- **하단 마진**: mb-6 (1.5rem = 24px)
- **색상**: light 모드 - gray-900, dark 모드 - gray-100

#### h2

```tsx
h2: ({ children }) => (
  <h2 className="text-3xl font-semibold mb-4 mt-8 text-gray-900 dark:text-gray-100">
    {children}
  </h2>
)
```

- **크기**: text-3xl (1.875rem = 30px)
- **굵기**: font-semibold (600)
- **마진**: mt-8 (상단 2rem), mb-4 (하단 1rem)

#### h3

```tsx
h3: ({ children }) => (
  <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-900 dark:text-gray-100">
    {children}
  </h3>
)
```

- **크기**: text-2xl (1.5rem = 24px)
- **굵기**: font-semibold (600)
- **마진**: mt-6 (상단 1.5rem), mb-3 (하단 0.75rem)

---

### 단락 (Paragraph)

```tsx
p: ({ children }) => (
  <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
    {children}
  </p>
)
```

- **하단 마진**: mb-4 (1rem)
- **색상**: light 모드 - gray-700, dark 모드 - gray-300
- **행간**: leading-relaxed (1.625)

---

### 링크 (Anchor)

```tsx
a: ({ href, children }) => (
  <a
    href={href}
    className="text-blue-600 dark:text-blue-400 hover:underline"
    target={href?.startsWith('http') ? '_blank' : '_self'}
    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
  >
    {children}
  </a>
)
```

- **색상**: light 모드 - blue-600, dark 모드 - blue-400
- **호버**: 밑줄 표시
- **외부 링크**: 새 탭에서 열림 (target="_blank")
- **보안**: noopener noreferrer 속성

---

### 목록 (Lists)

#### 순서 없는 목록 (ul)

```tsx
ul: ({ children }) => (
  <ul className="mb-4 ml-6 list-disc text-gray-700 dark:text-gray-300">
    {children}
  </ul>
)
```

- **마커**: list-disc (동그라미)
- **왼쪽 마진**: ml-6 (1.5rem)
- **색상**: gray-700 (light), gray-300 (dark)

#### 순서 있는 목록 (ol)

```tsx
ol: ({ children }) => (
  <ol className="mb-4 ml-6 list-decimal text-gray-700 dark:text-gray-300">
    {children}
  </ol>
)
```

- **마커**: list-decimal (숫자)
- **왼쪽 마진**: ml-6 (1.5rem)

#### 목록 항목 (li)

```tsx
li: ({ children }) => <li className="mb-1">{children}</li>
```

- **하단 마진**: mb-1 (0.25rem)

---

### 인용문 (Blockquote)

```tsx
blockquote: ({ children }) => (
  <blockquote className="border-l-4 border-blue-500 pl-4 mb-4 italic text-gray-600 dark:text-gray-400">
    {children}
  </blockquote>
)
```

- **왼쪽 테두리**: border-l-4 (4px 두께)
- **테두리 색상**: blue-500
- **왼쪽 패딩**: pl-4 (1rem)
- **스타일**: italic (기울임꼴)
- **색상**: gray-600 (light), gray-400 (dark)

**참고**: tailwind.config.ts에서 blockquote p의 마진 제거됨 (commit c3e2c62)

---

### 코드 (Code)

#### 인라인 코드

```tsx
code: ({ children }) => (
  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-red-600 dark:text-red-400">
    {children}
  </code>
)
```

- **배경색**: gray-100 (light), gray-800 (dark)
- **패딩**: px-2 py-1
- **둥근 모서리**: rounded
- **폰트**: text-sm, font-mono
- **색상**: red-600 (light), red-400 (dark)

#### 코드 블록

```tsx
pre: ({ children }) => (
  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto">
    {children}
  </pre>
)
```

- **배경색**: gray-100 (light), gray-800 (dark)
- **패딩**: p-4 (1rem)
- **둥근 모서리**: rounded-lg
- **가로 스크롤**: overflow-x-auto

---

### 이미지 (Image) - commit 6ff4a48

```tsx
img: props => (
  <img
    {...props}
    className="rounded-lg my-6 w-full h-auto"
    alt={props.alt || ''}
  />
)
```

- **너비**: w-full (100%)
- **높이**: h-auto (원본 비율 유지)
- **둥근 모서리**: rounded-lg
- **상하 마진**: my-6 (1.5rem)
- **alt 텍스트**: props.alt 또는 빈 문자열

**변경사항 (commit 6ff4a48)**:
- **변경 전**: 고정 크기 (width=800, height=400)로 이미지 왜곡 발생
- **변경 후**: w-full h-auto로 원본 비율 유지하면서 반응형
- **이유**: 서버사이드 rehype-optimize-images에서 최적화되므로, 여기서는 비율만 보존

---

## 서버사이드 Markdown 처리

### @repo/content/processMarkdown

- **Location**: `packages/content/src/markdown.ts`
- **Purpose**: Markdown → HTML 변환
- **Source Exists**: true
- **Processing Pipeline**:

```
Raw MDX content
  ↓ remark-parse (markdown → AST)
  ↓ remark-gfm (GitHub Flavored Markdown: tables, checkboxes)
  ↓ remark-rehype (markdown AST → HTML AST)
  ↓ rehype-slug (add IDs to headings)
  ↓ rehype-autolink-headings (add anchor links to headings)
  ↓ rehype-highlight (syntax highlighting for code blocks)
  ↓ rehype-mermaid (convert ```mermaid to renderable divs)
  ↓ rehype-optimize-images (lazy loading, responsive images, captions)
  ↓ rehype-stringify (HTML AST → string)
```

### rehype-optimize-images

- **Location**: `packages/content/src/rehype-optimize-images.ts`
- **Purpose**: 이미지 태그 최적화
- **Key Features**:
  1. `loading="lazy"` 추가
  2. `decoding="async"` 추가
  3. alt 텍스트가 있으면 `<figure>`로 감싸고 `<figcaption>` 추가
  4. 반응형 클래스 추가
  5. 레이아웃 시프트 방지

---

## Mermaid 차트 지원

### rehype-mermaid

- **Location**: `packages/content/src/rehype-mermaid.ts`
- **Purpose**: Mermaid 코드 블록을 렌더링 가능한 div로 변환
- **Transformation**:

```
\```mermaid
graph TD
  A-->B
\```

↓

<div data-mermaid="graph TD&#10;  A-->B">
  <pre class="mermaid">
    graph TD
      A-->B
  </pre>
</div>
```

### MermaidRenderer Component

- **Location**: `apps/blog/src/processes/post-reading/ui/mermaid-renderer.tsx`
- **Purpose**: 클라이언트 사이드에서 Mermaid 초기화
- **Key Features**:
  - CDN에서 mermaid.js 동적 로드
  - `data-mermaid` 속성의 컨텐츠를 렌더링
  - 다크모드 테마 지원

---

## 코드 하이라이팅

### rehype-highlight

- **패키지**: `rehype-highlight`
- **Purpose**: 코드 블록에 syntax highlighting 적용
- **Supported Languages**: JavaScript, TypeScript, Python, Go, etc.
- **Styling**: GitHub Dark/Light 테마

---

## GFM (GitHub Flavored Markdown)

### remark-gfm

- **패키지**: `remark-gfm`
- **Purpose**: GitHub 확장 Markdown 문법 지원
- **Features**:
  - **Tables**: 표 렌더링
  - **Checkboxes**: 체크박스 (`- [ ]`, `- [x]`)
  - **Strikethrough**: 취소선 (`~~text~~`)
  - **Autolinks**: URL 자동 링크화

---

## 목차 (Table of Contents)

### TableOfContents Component

- **Location**: `apps/blog/src/processes/post-reading/ui/table-of-contents.tsx`
- **Purpose**: 헤딩 기반 목차 자동 생성
- **Key Features**:
  - 클라이언트 사이드에서 DOM 헤딩 추출
  - 스크롤 위치에 따라 활성 헤딩 강조
  - 클릭 시 해당 섹션으로 스크롤
  - 다크모드 지원

---

## 렌더링 순서

### Blog Post Page

```tsx
// 1. MDX 파일에서 프론트 매터 분리
const { frontMatter, content } = post;

// 2. Markdown → HTML 변환 (서버사이드)
const htmlContent = await processMarkdown(content);

// 3. HTML 렌더링 (dangerouslySetInnerHTML)
<div dangerouslySetInnerHTML={{ __html: htmlContent }} />

// 4. 클라이언트 사이드 컴포넌트 초기화
<MermaidRenderer />  // Mermaid 차트 렌더링
<TableOfContents />  // 목차 생성 및 스크롤 추적
```

---

## 스타일링 일관성

### Typography Plugin

- **패키지**: `@tailwindcss/typography`
- **Purpose**: Prose 클래스로 Markdown 스타일링
- **Usage**: `prose prose-gray dark:prose-invert`

**현재 프로젝트**: 커스텀 MDX 컴포넌트 사용으로 typography 플러그인 미사용

### Custom CSS

```css
/* markdown.css */
.prose {
  /* 커스텀 prose 스타일 */
}
```

---

## 접근성

### Semantic HTML

- `<h1>`-`<h3>`: 제목 계층 구조
- `<p>`: 단락
- `<ul>`, `<ol>`, `<li>`: 목록
- `<blockquote>`: 인용문
- `<code>`, `<pre>`: 코드
- `<img>`: 이미지 (alt 텍스트 필수)

### Alt Text

```tsx
<img
  {...props}
  alt={props.alt || ''}  // alt 텍스트 없으면 빈 문자열
/>
```

### Link Purpose

- **외부 링크**: 새 탭에서 열림 (`target="_blank"`)
- **보안**: `rel="noopener noreferrer"`
- **색상**: 파란색으로 링크 식별

---

## 성능 최적화

### Image Optimization

- **Lazy Loading**: `loading="lazy"`로 불필요한 로드 방지
- **Decoding**: `decoding="async"`로 비동기 디코딩
- **Responsive**: w-full h-auto로 모든 화면 크기 지원

### Code Splitting

- **MermaidRenderer**: CDN에서 동적 로드
- **TableOfContents**: 클라이언트 컴포넌트로 분리

### Caching

- **ISR**: HTML 캐싱 (60초)
- **CDN**: 정적 자산 캐싱

---

## 변경사항 요약

### commit 6ff4a48: Preserve Image Aspect Ratio

**변경 전**:
```tsx
img: props => (
  <img {...props} width={800} height={400} alt={props.alt || ''} />
)
```

**문제점**: 고정 크기로 인해 이미지 왜곡 발생

**변경 후**:
```tsx
img: props => (
  <img {...props} className="rounded-lg my-6 w-full h-auto" alt={props.alt || ''} />
)
```

**이점**:
- 원본 비율 유지
- 반응형 이미지 지원
- 모든 화면 크기에서 자연스러운 표시

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
