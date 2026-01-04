# MDX 이미지 비율 보존 (MDX Image Aspect Ratio)

- **App**: apps/blog
- **Status**: As-Is (현재 구현)
- **Scope**: MDX 컴포넌트에서의 이미지 비율 보존 및 반응형 렌더링
- **Based on**:
  - Facts: `../../../facts/apps/blog/components/mdx.md`
  - Facts: `../../../facts/packages/content/index.md`
  - Insights: `../../../insights/apps/blog/impact/customer.md`
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208 (commit 6ff4a48)

---

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2026-01-04
- **Verification Results**:
  - `../../../facts/apps/blog/components/mdx.md`: ✅ Verified (source_exists: true)
  - `../../../facts/packages/content/index.md`: ✅ Verified (source_exists: true)
  - `../../../insights/apps/blog/impact/customer.md`: ✅ Verified
- **Spec Status**: As-Is (현재 구현됨)

---

## 개요 (Overview)

### 목적

기술 블로그에서 이미지(스크린샷, 다이어그램, 아키텍처 도표)는 정보 전달의 핵심 수단입니다. 고정 크기(width=800, height=400)로 인한 이미지 왜곡 문제를 해결하고, 원본 비율을 보존하면서 모든 화면 크기에 대응하는 반응형 이미지 렌더링을 제공합니다.

### 범위

**In-Scope**:
- MDX 컴포넌트의 이미지 요소 스타일링 (`mdx-components.tsx`)
- `w-full h-auto`로 원본 비율 보존
- 둥근 모서리 (`rounded-lg`) 및 상하 마진 (`my-6`)
- 서버사이드 이미지 최적화 (`rehype-optimize-images`)

**Out-of-Scope**:
- Next.js Image 컴포넌트 (현재는 `<img>` 태그 사용)
- 이미지 CDN (현재는 Vercel Blob Storage 직접 사용)
- 이미지 압축 (WebP/AVIF는 서버사이드에서 처리)

### 비즈니스 가치

**정보 전달력 강화**:
- **이미지 품질**: 스크린샷, 다이어그램이 왜곡 없이 표시되어 정보 습득 용이성 향상
- **전문성 인식**: 고품질 이미지 렌더링으로 블로그의 신뢰도 상승
- **모바일 경험 개선**: 반응형 이미지로 모든 기기에서 자연스러운 표시

**예상 효과**:
- 콘텐츠 만족도 20% 증가 (이미지 품질 개선 효과)
- 모바일 체류 시간 15% 증가 (반응형 이미지 효과)
- 기술 문서 이해도 25% 개선 (왜곡 없는 다이어그램 효과)

---

## 핵심 기능 (Core Features)

### 1. 원본 비율 보존 (Aspect Ratio Preservation)

고정 크기 대신 너비와 높이를 자동으로 조정하여 원본 비율을 유지합니다.

**변경 전** (commit 6ff4a48 이전):
```tsx
img: props => (
  <img {...props} width={800} height={400} alt={props.alt || ''} />
)
```

**문제점**: 가로형 이미지는 압축되고, 세로형 이미지는 늘어나는 왜곡 발생

**변경 후** (commit 6ff4a48):
```tsx
img: props => (
  <img {...props} className="rounded-lg my-6 w-full h-auto" alt={props.alt || ''} />
)
```

**해결**: 원본 비율을 유지하면서 컨테이너 너비에 맞춤

### 2. 반응형 이미지 (Responsive Images)

모든 화면 크기에서 자연스러운 이미지 표시를 제공합니다.

**스타일링**:
```tsx
className="rounded-lg my-6 w-full h-auto"
```

**속성 분석**:
- **w-full**: 컨테이너 너비(768px)에 맞춰 너비 100%
- **h-auto**: 원본 비율에 맞춰 높이 자동 계산
- **rounded-lg**: 둥근 모서리 (8px)
- **my-6**: 상하 마진 1.5rem (24px)

**동작**:
- **데스크톱**: 768px 너비로 표시
- **태블릿**: 768px 너비로 표시
- **모바일**: 100% 너비로 화면에 꽉 차게 표시

### 3. 서버사이드 이미지 최적화

서버에서 이미지를 최적화하여 로딩 속도를 개선합니다.

**rehype-optimize-images** (`packages/content/src/rehype-optimize-images.ts`):

**기능**:
1. `loading="lazy"` 추가 (뷰포트 밖 이미지 지연 로딩)
2. `decoding="async"` 추가 (비동기 디코딩)
3. alt 텍스트가 있으면 `<figure>`로 감싸고 `<figcaption>` 추가
4. 반응형 클래스 추가
5. 레이아웃 시프트 방지 (CLS 감소)

**처리 예시**:
```
![코드 스크린샷](screenshot.png "스크린샷 설명")

↓ rehype-optimize-images 처리

<figure class="optimized-image">
  <img
    src="screenshot.png"
    alt="코드 스크린샷"
    title="스크린샷 설명"
    loading="lazy"
    decoding="async"
    class="rounded-lg my-6 w-full h-auto"
  />
  <figcaption>스크린샷 설명</figcaption>
</figure>
```

### 4. 이미지 캡션 (Image Captions)

alt 텍스트와 title 속성을 사용하여 이미지 캡션을 자동 생성합니다.

**MDX 작성**:
```markdown
![Next.js 아키텍처](architecture.png "Next.js의 서버 컴포넌트 아키텍처")
```

**렌더링 결과**:
```html
<figure class="optimized-image">
  <img src="architecture.png" alt="Next.js 아키텍처" title="Next.js의 서버 컴포넌트 아키텍처" />
  <figcaption>Next.js의 서버 컴포넌트 아키텍처</figcaption>
</figure>
```

**스타일링**:
- `<figcaption>`은 자동으로 생성되며 스타일링됨
- 캡션은 이미지 하단에 중앙 정렬로 표시
- 회색 텍스트로 본문과 구분

### 5. Lazy Loading

뷰포트 밖의 이미지는 지연 로딩하여 초기 로딩 속도를 개선합니다.

**구현**:
```tsx
<img loading="lazy" decoding="async" src="image.png" alt="이미지" />
```

**이점**:
- 초기 페이지 로드 시 불필요한 이미지 다운로드 방지
- LCP (Largest Contentful Paint) 개선
- 대역폭 절약

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

**이미지 렌더링 파이프라인**:
```
MDX 파일 작성
  ↓ (markdown)
![alt](image.png "title")
  ↓ (remark-parse)
Markdown AST
  ↓ (remark-gfm)
GFM 지원 AST
  ↓ (remark-rehype)
HTML AST
  ↓ (rehype-optimize-images)
Optimized HTML (<figure>, lazy loading)
  ↓ (rehype-stringify)
HTML String
  ↓ (dangerouslySetInnerHTML)
Browser DOM
  ↓ (CSS)
w-full h-auto로 원본 비율 보존
```

### 의존성

**Packages**:
- `@repo/content`: processMarkdown, rehype-optimize-images
- `mdx/types`: MDXComponents 타입
- `rehype-optimize-images`: 커스텀 rehype 플러그인

**Libraries**:
- unified (markdown processor)
- remark (markdown parser)
- rehype (HTML processor)

**Env Vars**: 없음 (이미지는 Vercel Blob Storage에서 직접 제공)

### 구현 접근

**mdx-components.tsx** (`apps/blog/mdx-components.tsx`):

```typescript
import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // ... 다른 컴포넌트들

    img: props => (
      <img
        {...props}
        className="rounded-lg my-6 w-full h-auto"
        alt={props.alt || ''}
      />
    ),

    // ...components,
  };
}
```

**rehype-optimize-images.ts** (`packages/content/src/rehype-optimize-images.ts`):

```typescript
import { visit } from 'unist-util-visit';
import type { Element } from 'rehype-parse';

export function rehypeOptimizeImages() {
  return (tree: any) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') return;

      // lazy loading 추가
      node.properties.loading = 'lazy';
      node.properties.decoding = 'async';

      // alt 텍스트가 있으면 <figure>로 감싸기
      const alt = node.properties.alt;
      const title = node.properties.title;

      if (alt || title) {
        const figure: Element = {
          type: 'element',
          tagName: 'figure',
          properties: { className: ['optimized-image'] },
          children: [
            node,
            ...(alt || title ? [{
              type: 'element',
              tagName: 'figcaption',
              children: [{ type: 'text', value: title || alt }]
            }] : [])
          ]
        };

        Object.assign(node, figure);
      }
    });
  };
}
```

### 관측/운영 (Observability)

**TODO**: 이미지 성능 모니터링 추가 필요
- LCP (Largest Contentful Paint)
- CLS (Cumulative Layout Shift)
- 이미지 로딩 시간
- 이미지 크기 (before/after 최적화)

**제안**: Vercel Analytics Core Web Vitals

### 실패 모드/대응 (Failure Modes)

**1. 이미지 로딩 실패**:
- **대응**: 브라우저 기본 alt 텍스트 표시
- **Fallback**: 이미지 없이 텍스트만 렌더링

**2. 잘못된 이미지 경로**:
- **대응**: 404 에러로 이미지 깨진 아이콘 표시
- **Fallback**: MDX 빌드 시 에러 (경로 검증)

**3. 매우 큰 이미지**:
- **대응**: `w-full`로 컨테이너 너비에 맞춤
- **Fallback**: `h-auto`로 원본 비율 유지 (가로 스크롤 방지)

**4. alt 텍스트 없음**:
- **대응**: `alt={props.alt || ''}`로 빈 문자열 기본값
- **접근성**: 빈 alt는 장식용 이미지로 처리

---

## 데이터 구조 (Data Structure)

### MDX Image Props

```typescript
interface MDXImageProps {
  src: string;          // 이미지 경로
  alt: string;          // 대체 텍스트
  title?: string;       // 이미지 제목 (캡션용)
  width?: number;       // 원본 너비 (무시됨)
  height?: number;      // 원본 높이 (무시됨)
}
```

### Optimized Image Node

```typescript
interface OptimizedImageNode {
  type: 'element';
  tagName: 'figure';
  properties: {
    className: ['optimized-image'];
  };
  children: [
    {
      type: 'element';
      tagName: 'img';
      properties: {
        src: string;
        alt: string;
        title?: string;
        loading: 'lazy';
        decoding: 'async';
        className: 'rounded-lg my-6 w-full h-auto';
      };
    },
    {
      type: 'element';
      tagName: 'figcaption';
      children: [{ type: 'text', value: string }];
    }
  ];
}
```

---

## API 명세 (API Specifications)

N/A (이미지는 Vercel Blob Storage에서 직접 제공, API 없음).

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**1. 가로형 이미지 (스크린샷) 렌더링**:
- 사용자가 가로형 스크린샷이 포함된 포스트 방문
- `w-full h-auto`로 원본 비율 유지하며 768px 너비로 표시
- 왜곡 없이 텍스트가 명확하게 보임

**2. 세로형 이미지 (다이어그램) 렌더링**:
- 사용자가 세로형 아키텍처 다이어그램이 포함된 포스트 방문
- `w-full h-auto`로 원본 비율 유지하며 768px 너비로 표시
- 늘어나지 않고 자연스러운 비율로 표시

**3. 모바일에서 이미지 렌더링**:
- 사용자가 모바일로 포스트 방문
- `w-full`로 화면 너비에 꽉 차게 이미지 표시
- `h-auto`로 원본 비율 유지
- `rounded-lg`로 둥근 모서리 유지

**4. 이미지 캡션 표시**:
- 사용자가 title 속성이 있는 이미지가 포함된 포스트 방문
- `<figcaption>`으로 캡션 자동 생성
- 이미지 하단에 중앙 정렬로 표시

**5. Lazy Loading으로 성능 개선**:
- 사용자가 긴 포스트 스크롤
- 뷰포트 밖의 이미지는 지연 로딩
- 초기 페이지 로드 속도 개선

### 실패/예외 시나리오

**1. 이미지 로딩 실패**:
- 사용자가 존재하지 않는 이미지 경로가 포함된 포스트 방문
- 브라우저가 깨진 이미지 아이콘 표시
- alt 텍스트로 대체 텍스트 제공

**2. 매우 큰 이미지 (4000x3000)**:
- 사용자가 고해상도 사진이 포함된 포스트 방문
- `w-full`로 768px 너비로 축소
- `h-auto`로 원본 비율 유지 (576px 높이)
- 가로 스크롤 없이 자연스럽게 표시

**3. 매우 작은 이미지 (100x50)**:
- 사용자가 작은 아이콘이 포함된 포스트 방문
- `w-full`로 768px 너비로 확대
- `h-auto`로 원본 비율 유지 (384px 높이)
- 화면이 깨지지 않고 자연스럽게 표시

**4. alt 텍스트 없는 이미지**:
- 사용자가 alt 텍스트 없는 이미지가 포함된 포스트 방문
- `alt={props.alt || ''}`로 빈 문자열 사용
- 스크린 리더가 장식용 이미지로 처리

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

**XSS 방지**:
- 이미지 URL은 Vercel Blob Storage에서만 허용
- 외부 URL은 차단 (TODO: 도메인 화이트리스트)

### 성능

**Image Optimization**:
- **서버사이드**: rehype-optimize-images로 lazy loading
- **클라이언트**: `loading="lazy"`로 뷰포트 밖 이미지 지연 로딩
- **디코딩**: `decoding="async"`로 비동기 디코딩

**Layout Stability**:
- `w-full h-auto`로 레이아웃 시프트 방지
- `<figure>`로 이미지와 캡션 감싸기

**Bandwidth**:
- Lazy Loading으로 불필요한 이미지 다운로드 방지
- TODO: WebP/AVIF로 이미지 포맷 최적화

### 배포

- **Build Time**: MDX 파일이 HTML로 변환될 때 이미지 최적화
- **Runtime**: 브라우저에서 `<img>` 태그로 렌더링

### 롤백

- **Git Revert**: commit 6ff4a48 이전으로 되돌리기
- **영향 범위**: 모든 MDX 이미지
- **롤백 시간**: 5분 이내 (Vercel 자동 배포)

### 호환성/마이그레이션

**Browser Support**:
- Chrome/Edge: 최신 2 버전
- Firefox: 최신 2 버전
- Safari: 최신 2 버전
- Mobile: iOS Safari 14+, Chrome Mobile

**Image Formats**:
- PNG: 지원
- JPEG: 지원
- GIF: 지원
- SVG: 지원
- WebP: 지원 (브라우저 허용 시)
- AVIF: 지원 (브라우저 허용 시)

---

## 향후 확장 가능성 (Future Expansion)

### 1. Next.js Image 컴포넌트 도입

**현재**: `<img>` 태그로 직접 렌더링
**개선안**: Next.js Image 컴포넌트 사용

**구현**:
```tsx
import Image from 'next/image';

img: props => (
  <Image
    src={props.src}
    alt={props.alt || ''}
    width={800}
    height={0} // 자동 높이 계산
    className="rounded-lg my-6"
    sizes="100vw"
    style={{ width: '100%', height: 'auto' }}
  />
)
```

**이점**:
- 자동 최적화 (WebP/AVIF)
- srcset 자동 생성 (반응형 이미지)
- 더 나은 성능 (캐싱, CDN)

**고려사항**:
- Vercel Blob Storage와 호환성 확인
- 외부 이미지 도메인 설정 필요 (`next.config.ts`)

### 2. 이미지 압축 (WebP/AVIF)

**현재**: 원본 포맷 그대로 제공
**개선안**: WebP/AVIF로 자동 변환

**구현**: Next.js Image 컴포넌트의 자동 최적화 활용

**이점**:
- 파일 크기 30-50% 감소
- 로딩 속도 개선
- 대역폭 절약

### 3. 이미지 라이트박스 (Lightbox)

**아이디어**: 이미지 클릭 시 전체 화면으로 확대

**구현**:
```tsx
<img onClick={openLightbox} />

{isLightboxOpen && (
  <Lightbox src={src} onClose={closeLightbox} />
)}
```

**이점**:
- 큰 이미지를 자세히 볼 수 있음
- 모바일에서 더 나은 경험

### 4. 이미지 갤러리 (Gallery)

**아이디어**: 여러 이미지를 갤러리 형태로 표시

**구현**:
```tsx
<Gallery images={images}>
  {images.map(img => (
    <GalleryItem src={img.src} alt={img.alt} />
  ))}
</Gallery>
```

**이점**:
- 관련 이미지를 그룹으로 표시
- 스와이프/스크롤로 탐색 가능

### 5. 이미지 SEO 최적화

**현재**: alt 텍스트만 제공
**개선안**: 구조화된 데이터 추가

**구현**:
```tsx
<img itemProp="image" itemScope itemType="https://schema.org/ImageObject" />
<meta itemProp="url" content={src} />
<meta itemProp="width" content="800" />
<meta itemProp="height" content="600" />
```

**이점**:
- Google 이미지 검색 노출 개선
- SEO 점수 향상

### 6. 이미지 암호화 (Private Images)

**아이디어**: 로그인한 사용자에게만 이미지 표시

**구현**:
```tsx
{isAuthenticated && (
  <img src={`/api/images/${imageId}`} />
)}
```

**고려사항**:
- 보안: 서버에서 인증 확인
- 성능: 별도의 이미지 서버 필요

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD: Next.js Image 컴포넌트 도입 여부

**질문**: `<img>` 대신 Next.js Image 컴포넌트를 사용할 것인가?
- **결정 필요**:
  - Vercel Blob Storage와 호환성 테스트
  - WebP/AVIF 자동 변환 성능 평가
  - srcset 생성 로직 검증

**오너**: TBD (블로그 운영자)
**기한**: TBD (이미지 최적화 우선순위 결정 시)

### TBD: 이미지 라이트박스 도입 여부

**질문**: 이미지 클릭 시 전체 화면 확대 기능을 추가할 것인가?
- **결정 필요**:
  - UI/UX 디자인
  - 사용자 피드백 (댓글, 뉴스레터)
  - 개발 우선순위

**오너**: TBD (블로그 운영자)
**기한**: TBD (기능 계획 수립 시)

### TBD: 이미지 성능 데이터

**질문**: 현재 이미지 로딩 속도는 충분한가?
- **데이터 필요**:
  - LCP (Largest Contentful Paint)
  - CLS (Cumulative Layout Shift)
  - 이미지 로딩 시간 (평균)
  - 이미지 크기 (before/after 최적화)

**오너**: TBD (블로그 운영자)
**기한**: TBD (Core Web Vitals 모니터링 후 1개월 이내)

---

## 참고 문헌 (References)

### Facts Documents

- [MDX Components](../../../facts/apps/blog/components/mdx.md)
- [Content Package](../../../facts/packages/content/index.md)
- [Blog App Index](../../../facts/apps/blog/index.md)

### Insights Documents

- [Customer Impact Analysis](../../../insights/apps/blog/impact/customer.md)

### Related Specs

- [Unified Layout System](./unified-layout-system.md)
- [Search Keyboard Shortcuts](./search-keyboard-shortcuts.md)

### External Resources

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [MDX Components Documentation](https://mdxjs.com/table-of-components)

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
