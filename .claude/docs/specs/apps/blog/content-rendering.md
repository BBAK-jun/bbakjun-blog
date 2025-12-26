# 콘텐츠 렌더링 (Content Rendering)

- **App**: apps/blog
- **Status**: As-Is (현재 구현)
- **Scope**: MDX 마크다운 처리 파이프라인, Mermaid 차트, 이미지 최적화, 코드 하이라이팅
- **Based on**:
  - Facts: [../../../facts/apps/blog/index.md](../../../facts/apps/blog/index.md)
  - Facts: [../../../facts/apps/blog/components/index.md](../../../facts/apps/blog/components/index.md)
  - Facts: [../../../facts/apps/blog/utils/index.md](../../../facts/apps/blog/utils/index.md)
  - Insights: [../../../insights/apps/blog/exec/summary.md](../../../insights/apps/blog/exec/summary.md)
- **Last Verified**: 2025-12-26
- **Repo Ref**: main

---

## 개요 (Overview)

### 목적

DEV_BBAK 블로그의 콘텐츠 렌더링 시스템은 MDX 마크다운을 다양한 형식의 리치 미디어 콘텐츠로 변환하여 기술 블로그의 가독성과 시각적 품질을 극대화합니다. Mermaid 다이어그램, 코드 하이라이팅, 최적화된 이미지를 지원하여 복잡한 기술 개념을 명확하게 전달합니다.

### 비즈니스 가치

- **가독성 개선**: 다양한 미디어 형식으로 콘텐츠 이해도 개선
- **사용자 경험 개선**: 빠른 로딩, 반응형 이미지, 다크모드 지원
- **SEO 강화**: 시맨틱 HTML, Alt 텍스트로 검색 엔진 최적화
- **브랜딩**: 일관된 스타일로 전문적인 이미지 구축

### 범위

**In-Scope**:
- MDX 마크다운 처리 파이프라인
- Mermaid 차트 렌더링 (다이어그램)
- 코드 하이라이팅 (syntax highlighting)
- 이미지 최적화 (WebP/AVIF, lazy loading)
- 목차 (Table of Contents) 자동 생성
- MDX 컴포넌트 커스터마이징

**Out-of-Scope**:
- 동기화된 스크롤링 (scrollytelling)
- 3D 시각화 (Three.js)
- 동영상 플레이어 (Vimeo, YouTube 임베드는 가능)

---

## 핵심 기능 (Core Features)

### 1. MDX 마크다운 처리 파이프라인

Raw MDX를 HTML로 변환하는 통합 파이프라인

**주요 규칙**:
- remark/rehype 플러그인 체인
- GitHub Flavored Markdown 지원
- 헤딩 ID 자동 생성
- 앵커 링크 추가

### 2. Mermaid 차트 렌더링

다이어그램 코드를 시각적 차트로 변환

**주요 규칙**:
- CDN에서 Mermaid v10.9.1 동적 로드
- 다크모드 감지 후 테마 자동 설정
- 지원 다이어그램: flowchart, sequence, gantt, pie, git, class

### 3. 코드 하이라이팅

코드 블록에 문법 강조 적용

**주요 규칙**:
- rehype-highlight 플러그인
- 언어 자동 감지
- 다크모드 테마 지원
- 복사 버튼 추가

### 4. 이미지 최적화

이미지를 자동으로 최적화

**주요 규칙**:
- WebP/AVIF 형식으로 자동 변환
- Lazy loading (`loading="lazy"`)
- 반응형 이미지 (deviceSizes: 640px ~ 3840px)
- Alt 텍스트가 있으면 캡션 추가

### 5. 목차 (Table of Contents)

헤딩 기반으로 목차 자동 생성

**주요 규칙**:
- DOM에서 h1-h6 헤딩 추출
- Intersection Observer로 현재 헤딩 하이라이트
- 클릭 시 부드러운 스크롤

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

```
Raw MDX Content
    ↓ remark-parse (markdown → AST)
    ↓ remark-gfm (GitHub Flavored Markdown)
    ↓ remark-rehype (markdown AST → HTML AST)
    ↓ rehype-slug (헤딩 ID 추가)
    ↓ rehype-autolink-headings (앵커 링크)
    ↓ rehype-highlight (코드 하이라이팅)
    ↓ rehype-mermaid (Mermaid 변환)
    ↓ rehype-optimize-images (이미지 최적화)
    ↓ rehype-stringify (HTML AST → string)
    ↓ HTML Output
```

### 의존성

**Packages**:
- `@repo/content`: MDX 처리 파이프라인
- `@next/mdx`: MDX 지원
- `@mdx-js/react`: MDX 컴포넌트

**Libraries**:
- `remark`: Markdown 파서
- `rehype`: HTML 변환기
- `rehype-highlight`: 코드 하이라이팅
- `reading-time`: 읽기 시간 계산
- `gray-matter`: 프론트 매터 파싱
- `mermaid`: 다이어그램 렌더링 (CDN)

**Env Vars**:
- 없음

### 구현 접근

#### 1. MDX 처리 파이프라인

```typescript
// packages/content/src/markdown.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import rehypeMermaid from './rehype-mermaid';
import rehypeOptimizeImages from './rehype-optimize-images';

export async function processMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)                 // markdown → AST
    .use(remarkGfm)                   // GitHub Flavored Markdown
    .use(remarkRehype, { allowDangerousHtml: true }) // markdown AST → HTML AST
    .use(rehypeSlug)                  // 헤딩 ID 추가
    .use(rehypeAutolinkHeadings)      // 앵커 링크
    .use(rehypeHighlight)             // 코드 하이라이팅
    .use(rehypeMermaid)               // Mermaid 변환
    .use(rehypeOptimizeImages)        // 이미지 최적화
    .use(rehypeStringify)             // HTML AST → string
    .process(content);

  return String(result);
}
```

#### 2. Mermaid 렌더링

```typescript
// src/processes/post-reading/ui/mermaid-renderer.tsx
'use client';

export function MermaidRenderer({ content }: MermaidRendererProps) {
  useEffect(() => {
    const initMermaid = async () => {
      // CDN에서 Mermaid 로드
      const mermaidModule = await import('https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js');

      // 다크모드 감지
      const isDark = document.documentElement.classList.contains('dark');

      // Mermaid 초기화
      mermaidModule.default.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: isDark ? 'dark' : 'default',
      });

      // .mermaid-container 요소 렌더링
      const containers = document.querySelectorAll('.mermaid-container');
      for (const container of containers) {
        const graphDefinition = container.querySelector('pre')?.textContent;
        if (graphDefinition) {
          const { svg } = await mermaidModule.default.render('mermaid-graph', graphDefinition);
          container.innerHTML = svg;
        }
      }
    };

    initMermaid().catch(console.error);
  }, [content]);

  return null; // side effect only
}
```

#### 3. 목차 (Table of Contents)

```typescript
// src/processes/post-reading/ui/table-of-contents.tsx
'use client';

export function TableOfContents({ className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // DOM에서 h1-h6 헤딩 추출
    const elements = Array.from(
      document.querySelectorAll('article h1, article h2, article h3, article h4, article h5, article h6')
    );

    const items = elements.map(element => ({
      id: element.id,
      text: element.textContent || '',
      level: parseInt(element.tagName.substring(1)),
    }));

    setHeadings(items);

    // Intersection Observer로 현재 헤딩 하이라이트
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    elements.forEach(element => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <nav className={className}>
      {headings.map(heading => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          style={{ paddingLeft: `${heading.level * 0.75}rem` }}
          className={activeId === heading.id ? 'active' : ''}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}
```

#### 4. 이미지 최적화

```typescript
// packages/content/src/rehype-optimize-images.ts
import { visit } from 'unist-util-visit';

export function rehypeOptimizeImages() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img') {
        // lazy loading 추가
        node.properties.loading = 'lazy';
        node.properties.decoding = 'async';

        // Alt 텍스트가 있으면 figure + figcaption으로 감싸기
        const altText = node.properties.alt;
        if (altText) {
          node.properties.className = 'rounded-lg shadow-md';

          // figure 요소로 감싸기 (부모 요소로 교체)
          // (실제 구현에서는 rehype 플러그인으로 처리)
        }
      }
    });
  };
}
```

### 관측/운영 (Observability)

**모니터링**:
- 이미지 로딩 시간: Vercel Analytics
- Mermaid 렌더링 성공/실패: 콘솔 로그
- 목차 클릭률: (미구현)

**로깅**:
```typescript
// Mermaid 렌더링 로그
console.log(`[Mermaid] rendered ${count} diagrams`);
```

### 실패 모드/대응 (Failure Modes)

**Mermaid 로딩 실패**:
- "차트 로드 실패" 메시지 표시
- 원본 코드 표시

**이미지 로딩 실패**:
- Alt 텍스트 표시
- broken-image 아이콘

**목차 헤딩 없음**:
- 목차 비표시

---

## 데이터 구조 (Data Structure)

### 모델/스키마

**HeadingItem 스키마**:
```typescript
interface HeadingItem {
  id: string;      // 헤딩 ID (anchor link)
  text: string;    // 헤딩 텍스트
  level: number;   // 헤딩 레벨 (1-6)
}
```

**ProcessedHTML 스키마**:
```typescript
interface ProcessedHTML {
  html: string;    // 렌더링된 HTML
  readingTime: string; // 읽기 시간 ("5 min read")
}
```

### 데이터 흐름

1. **MDX 처리**:
   - Raw MDX 파일 읽기
   - `gray-matter`로 프론트 매터 파싱
   - `processMarkdown()`으로 HTML 변환
   - 출력: HTML 문자열

2. **Mermaid 렌더링**:
   - HTML에서 `.mermaid-container` 요소 찾기
   - `<pre class="mermaid">` 내용 추출
   - Mermaid로 SVG 렌더링
   - DOM에 삽입

3. **목차 생성**:
   - DOM에서 h1-h6 헤딩 추출
   - HeadingItem 배열 생성
   - Intersection Observer로 활성 헤딩 추적

### 검증/제약 (Validation/Constraints)

**MDX 문법**:
- GitHub Flavored Markdown
- HTML 허용 (`allowDangerousHtml: true`)

**Mermaid 문법**:
- 지원 다이어그램: flowchart, sequence, gantt, pie, git, class
- 최대 크기: 없음

**이미지**:
- 지원 형식: WebP, AVIF (자동 변환)
- 최대 크기: Vercel Blob Storage 제한

---

## API 명세 (API Specifications)

### 내부 함수 (Internal Functions)

콘텐츠 렌더링은 외부 API가 아니라 내부 함수로 구현됩니다.

#### `processMarkdown(content)`

**Purpose**: MDX를 HTML로 변환

**Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `content` | string | ✅ | Raw MDX 콘텐츠 |

**Returns**: `Promise<string>` (렌더링된 HTML)

**Pipeline**:
```
remark-parse
  → remark-gfm
  → remark-rehype
  → rehype-slug
  → rehype-autolink-headings
  → rehype-highlight
  → rehype-mermaid
  → rehype-optimize-images
  → rehype-stringify
```

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**1. MDX 렌더링**:
```
User: 포스트 페이지 방문
→ Server: processMarkdown() 실행
→ Pipeline: MDX → HTML 변환
→ Result: 렌더링된 HTML
→ User: 포스트 내용 표시
```

**2. Mermaid 차트 렌더링**:
```
User: 포스트 페이지 방문 (Mermaid 포함)
→ MermaidRenderer: CDN에서 Mermaid 로드
→ Initialization: 다크모드 테마 설정
→ Rendering: .mermaid-container 요소 찾기
→ Output: SVG 차트 렌더링
→ User: 시각적 다이어그램 표시
```

**3. 목차 사용**:
```
User: 포스트 페이지 스크롤
→ TableOfContents: Intersection Observer 감지
→ Highlight: 현재 헤딩 하이라이트
→ Click: 헤딩 클릭
→ Scroll: 부드러운 스크롤로 해당 섹션 이동
```

**4. 이미지 로딩**:
```
User: 포스트 페이지 방문 (이미지 포함)
→ rehype-optimize-images: WebP/AVIF 변환
→ Lazy Loading: 스크롤 시 이미지 로드
→ Caption: Alt 텍스트로 캡션 추가
→ User: 최적화된 이미지 표시
```

### 실패/예외 시나리오

**1. Mermaid 로딩 실패**:
```
User: 포스트 페이지 방문
→ MermaidRenderer: CDN 로드 실패
→ Fallback: "차트 로드 실패" 메시지
→ User: 원본 코드 표시
```

**2. 이미지 로딩 실패**:
```
User: 포스트 페이지 방문
→ Image: 로딩 실패 (404)
→ Fallback: Alt 텍스트 표시
→ User: broken-image 아이콘
```

**3. 목차 헤딩 없음**:
```
User: 포스트 페이지 방문 (헤딩 없음)
→ TableOfContents: headings = []
→ UI: 목차 비표시
→ User: 다른 섹션 탐색
```

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

**XSS 방지**:
- HTML sanitization 없음 (`allowDangerousHtml: true`)
- 신뢰할 수 있는 작성자만 MDX 작성 가능

### 성능

**이미지 최적화**:
- WebP/AVIF로 파일 크기 30-50% 감소
- Lazy loading으로 초기 로딩 시간 단축

**Mermaid CDN**:
- 10.9.1 버전 (약 500KB)
- 동적 로드로 초기 로딩 영향 최소화

**코드 하이라이팅**:
- 서버 사이드 처리
- 클라이언트 JS 없음

### 배포

**환경변수**: 없음

### 롤백

**플러그인 롤백**:
- 코드 롤백으로 이전 버전 복원

### 호환성/마이그레이션

**MDX 버전**:
- `@mdx-js/react` v3.1.1

**Remark/Rehype 버전**:
- latest (2025-01 기준)

**Mermaid 버전**:
- v10.9.1 (CDN)

---

## 향후 확장 가능성 (Future Expansion)

### 1. 수학 공식 렌더링 (KaTeX)

**목표**: LaTeX 수학 공식 지원

**구현 방안**:
- rehype-katex 플러그인
- 인라인/블록 수식 지원

**예상 효과**:
- 기술 블로그 가독성 개선
- 수학/물리 포스팅 가능

### 2. 동영상 임베드

**목표**: YouTube, Vimeo 임베드 지원

**구현 방안**:
- rehype 플러그인
- 반응형 비디오 플레이어

**예상 효과**:
- 콘텐츠 형식 다양화
- 튜토리얼 품질 개선

### 3. 인터랙티브 차트

**목표**: D3.js, Chart.js 차트 지원

**구현 방안**:
- MDX 컴포넌트로 차트 렌더링
- 클라이언트 사이드 시각화

**예상 효과**:
- 데이터 시각화
- 참여도 개선

### 4. 코드 실행 (Sandpack)

**목표**: 인라인 코드 실행

**구현 방안**:
- Sandpack (CodeSandbox)
- React 컴포넌트 미리보기

**예상 효과**:
- 인터랙티브 튜토리얼
- 학습 경험 개선

### 5. 스크롤링 애니메이션

**목표**: Scrollytelling 지원

**구현 방안**:
- GSAP, ScrollTrigger
- 스크롤 기반 애니메이션

**예상 효과**:
- 스토리텔링 품질 개선
- 몰입감 증가

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD: 수학 공식 지원

**질문**:
- KaTeX 또는 MathJax를 도입할 것인가?
- 어떤 수학 포스팅을 계획 중인가?

**오너**: 콘텐츠 팀
**기한**: TBD

### TBD: 인터랙티브 요소

**질문**:
- Sandpack 또는 유사한 도구를 도입할 것인가?
- 예산 범위는?

**오너**: 제품 팀
**기한**: 6개월 내

---

## 참고 문헌 (References)

- [Blog App Facts](../../../facts/apps/blog/index.md)
- [Components](../../../facts/apps/blog/components/index.md)
- [Utils & Libraries](../../../facts/apps/blog/utils/index.md)
- [Executive Summary](../../../insights/apps/blog/exec/summary.md)
- [MDX Documentation](https://mdxjs.com/)
- [Remark Documentation](https://remark.js.org/)
- [Rehype Documentation](https://rehypejs.com/)
- [Mermaid Documentation](https://mermaid.js.org/)
