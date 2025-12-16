# 블로그 개선 로드맵

## 개요

이 문서는 DEV_BBAK 블로그의 향후 개선 계획을 우선순위별로 정리한 것입니다.

---

## 🎯 우선순위 2: Admin 에디터 UX 개선

### 현재 상태
- 기본 마크다운 에디터 (CodeMirror)
- 별도 프리뷰 필요
- 이미지 업로드는 별도 UI

### 개선 목표
가장 자주 사용하는 기능이므로 생산성 향상에 직접적인 영향

### 상세 기능

#### A. 실시간 프리뷰
**구현 방안**:
```typescript
// Split view editor
<div className="grid grid-cols-2 gap-4">
  <CodeMirrorEditor value={content} onChange={handleChange} />
  <MarkdownPreview content={content} />
</div>
```

**필요 라이브러리**:
- `@uiw/react-codemirror` (이미 있음)
- `react-split` (optional, 크기 조절 가능한 split view)

**작업 내용**:
- [ ] Split view 레이아웃 구현
- [ ] 실시간 마크다운 렌더링
- [ ] 스크롤 동기화 (에디터 ↔ 프리뷰)
- [ ] 프리뷰 토글 버튼 추가

**예상 소요**: 4-6시간

---

#### B. 마크다운 단축키 & 툴바
**구현할 단축키**:
```
Cmd/Ctrl + B     : **Bold**
Cmd/Ctrl + I     : *Italic*
Cmd/Ctrl + K     : [Link](url)
Cmd/Ctrl + Shift + C : `Code`
Cmd/Ctrl + Shift + K : 코드 블록
Cmd/Ctrl + Shift + I : 이미지 삽입
```

**필요 기능**:
- 텍스트 선택 → 단축키 → 포맷 적용
- 툴바 버튼 클릭으로도 동일 기능
- 코드 블록 언어 선택 드롭다운

**작업 내용**:
- [ ] 키보드 단축키 핸들러 구현
- [ ] 툴바 UI 컴포넌트 제작
- [ ] 선택 텍스트 포맷팅 로직
- [ ] 언어 선택 드롭다운 (코드 블록용)

**예상 소요**: 3-4시간

---

#### C. 드래그 앤 드롭 이미지 업로드
**현재 문제점**:
- 이미지 업로드가 별도 페이지
- 에디터에서 바로 삽입 불가능

**개선 방안**:
```typescript
// Drop zone in editor
const handleDrop = async (e: DragEvent) => {
  const files = e.dataTransfer.files;
  const imageFile = files[0];

  // Upload to Vercel Blob
  const { url } = await uploadImage(imageFile);

  // Insert markdown
  insertAtCursor(`![alt text](${url})`);
}
```

**작업 내용**:
- [ ] 드래그 앤 드롭 이벤트 핸들러
- [ ] 파일 타입 검증 (이미지만)
- [ ] 업로드 프로그레스 표시
- [ ] 에디터 커서 위치에 마크다운 삽입
- [ ] 클립보드 붙여넣기 지원 (Cmd+V)

**예상 소요**: 4-5시간

---

#### D. 템플릿 기능
**사용 사례**:
- 새 포스트 생성 시 기본 구조 자동 삽입
- 자주 쓰는 패턴 저장 (코드 예제, 경고 박스 등)

**템플릿 예시**:
```markdown
# Post Template
## 개요
[간단한 설명]

## 문제
[해결하려는 문제]

## 해결 방법
[솔루션]

## 결과
[성과]

## 참고 자료
- [링크1](url)
```

**작업 내용**:
- [ ] 템플릿 저장 UI
- [ ] LocalStorage에 템플릿 저장
- [ ] 템플릿 선택 드롭다운
- [ ] 커스텀 템플릿 추가/삭제

**예상 소요**: 2-3시간

---

## 🎯 우선순위 3: SEO & 검색 기능

### A. Sitemap 자동 생성

**필요성**: Google, Naver 등 검색 엔진 크롤링 최적화

**구현 방안**:
```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  const postEntries = posts.map(post => ({
    url: `https://your-blog.com/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: 'https://your-blog.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...postEntries,
  ];
}
```

**작업 내용**:
- [ ] `app/sitemap.ts` 생성
- [ ] 동적 포스트 URL 포함
- [ ] 태그 페이지 URL 포함
- [ ] `robots.txt` 업데이트

**예상 소요**: 1-2시간

---

### B. 블로그 내 검색 기능

**옵션 1: 클라이언트 사이드 검색 (간단)**
```typescript
// Simple search with Fuse.js
import Fuse from 'fuse.js';

const fuse = new Fuse(posts, {
  keys: ['title', 'description', 'tags', 'content'],
  threshold: 0.3,
});

const results = fuse.search(query);
```

**장점**: 추가 서비스 불필요, 빠른 구현
**단점**: 모든 포스트를 클라이언트에 로드 (많아지면 느림)

**옵션 2: Algolia 연동 (권장)**
```typescript
// algolia.ts
import algoliasearch from 'algoliasearch';

const client = algoliasearch(APP_ID, API_KEY);
const index = client.initIndex('blog_posts');

// 검색
const { hits } = await index.search(query);
```

**장점**: 빠른 검색, 오타 교정, 필터링
**단점**: 무료 플랜 제한 (10K requests/month)

**작업 내용**:
- [ ] 검색 UI 컴포넌트 (헤더에 돋보기 아이콘)
- [ ] 검색 결과 모달/페이지
- [ ] 하이라이팅 (검색어 강조)
- [ ] 태그 필터 통합
- [ ] 검색 결과 정렬 (관련도, 날짜)

**예상 소요**:
- 옵션 1 (Fuse.js): 4-5시간
- 옵션 2 (Algolia): 6-8시간 (인덱싱 자동화 포함)

---

### C. RSS Feed

**필요성**: RSS 리더 사용자를 위한 구독 기능

**구현 방안**:
```typescript
// app/feed.xml/route.ts
export async function GET() {
  const posts = await getAllPosts();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>DEV_BBAK 블로그</title>
        <link>https://your-blog.com</link>
        <description>프론트엔드 개발 블로그</description>
        ${posts.map(post => `
          <item>
            <title>${post.title}</title>
            <link>https://your-blog.com/blog/${post.slug}</link>
            <description>${post.description}</description>
            <pubDate>${new Date(post.date).toUTCString()}</pubDate>
          </item>
        `).join('')}
      </channel>
    </rss>`;

  return new Response(rss, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
```

**작업 내용**:
- [ ] RSS feed 생성 API 라우트
- [ ] Atom feed 지원 (선택)
- [ ] 태그별 RSS (`/feed/tag/react.xml`)
- [ ] 헤더에 RSS 링크 추가
- [ ] `<link rel="alternate" type="application/rss+xml">`

**예상 소요**: 2-3시간

---

## 🎯 우선순위 4: 이미지 최적화

### 현재 문제점
- 포스트 내 이미지가 Next.js Image 최적화 미적용
- 느린 로딩 속도
- WebP 변환 안 됨

### 개선 방안

#### A. MDX 이미지 자동 최적화
```typescript
// mdx-components.tsx
const components = {
  img: ({ src, alt }: { src: string; alt: string }) => (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={400}
      className="rounded-lg"
      quality={85}
      loading="lazy" // ← 지연 로딩
    />
  ),
};
```

**작업 내용**:
- [ ] MDX 컴포넌트에 Next.js Image 적용
- [ ] 자동 width/height 추출
- [ ] Blur placeholder 추가
- [ ] 외부 이미지 도메인 설정 (`next.config.ts`)

**예상 소요**: 2-3시간

---

#### B. OG 이미지 캐싱
**현재**: 매번 동적 생성
**개선**: Vercel Blob에 캐싱

```typescript
// Check cache first
const cachedImage = await getFromBlob(`og-images/${slug}.png`);
if (cachedImage) return cachedImage;

// Generate and cache
const image = await generateOGImage(post);
await putToBlob(`og-images/${slug}.png`, image);
```

**작업 내용**:
- [ ] OG 이미지 캐싱 로직
- [ ] Admin에서 포스트 수정 시 캐시 무효화
- [ ] 캐시 만료 시간 설정 (예: 7일)

**예상 소요**: 3-4시간

---

## 🎯 우선순위 5: 분석 & 대시보드

### Admin 대시보드 개선

#### A. 통계 요약
```typescript
// Dashboard cards
- 총 포스트 수
- 총 조회수
- 주간 조회수 증가율
- 인기 포스트 Top 5
```

**필요 데이터**:
- Redis에서 조회수 통계
- 포스트 메타데이터

**작업 내용**:
- [ ] 통계 데이터 fetch 함수
- [ ] 카드 UI 컴포넌트
- [ ] 차트 라이브러리 연동 (recharts 추천)
- [ ] 시간대별 조회수 그래프

**예상 소요**: 5-6시간

---

#### B. 태그 분석
```typescript
// Tag analytics
- 태그별 포스트 수
- 태그별 총 조회수
- 트렌딩 태그 (최근 30일)
```

**시각화**:
- 태그 클라우드
- 막대 그래프 (태그별 조회수)

**작업 내용**:
- [ ] 태그 통계 집계 함수
- [ ] 시각화 컴포넌트
- [ ] 날짜 범위 필터

**예상 소요**: 4-5시간

---

## 🎯 우선순위 6: 코드 블록 개선

### A. 복사 버튼 추가

**사용자 경험 개선**:
```tsx
// CodeBlock component
<div className="relative">
  <pre><code>{children}</code></pre>
  <button
    className="absolute top-2 right-2"
    onClick={copyToClipboard}
  >
    📋 Copy
  </button>
</div>
```

**작업 내용**:
- [ ] 복사 버튼 UI
- [ ] Clipboard API 구현
- [ ] 복사 완료 토스트 알림
- [ ] 코드 블록 hover 시 버튼 표시

**예상 소요**: 2-3시간

---

### B. 코드 블록 줄 번호

**rehype 플러그인 수정**:
```typescript
// rehype-highlight.ts에 line numbers 추가
import rehypeHighlight from 'rehype-highlight';
import rehypePrism from 'rehype-prism-plus'; // line numbers 지원

export default rehypePrism;
```

**작업 내용**:
- [ ] rehype-prism-plus 설치
- [ ] line-numbers 클래스 추가
- [ ] CSS 스타일링
- [ ] 줄 강조 기능 (예: `{3-5}` 구문)

**예상 소요**: 2-3시간

---

## 🎯 우선순위 7: 다크모드 개선

### 현재 구현
- `next-themes` 사용
- 기본 토글 기능

### 개선 사항

#### A. 시스템 설정 자동 감지
```typescript
// 이미 구현되어 있을 수 있음, 확인 필요
const { theme, setTheme, systemTheme } = useTheme();
```

**작업 내용**:
- [ ] 시스템 테마 자동 적용
- [ ] "System" 옵션 추가 (Light/Dark/System)
- [ ] 초기 로드 시 깜빡임 방지

**예상 소요**: 1-2시간

---

#### B. 토글 애니메이션

**현재**: 즉시 전환
**개선**: 부드러운 애니메이션

```css
/* Smooth transition */
:root {
  --transition-speed: 200ms;
}

* {
  transition: background-color var(--transition-speed),
              color var(--transition-speed);
}
```

**작업 내용**:
- [ ] CSS 트랜지션 추가
- [ ] 깜빡임 방지
- [ ] 토글 버튼 애니메이션 (아이콘 회전 등)

**예상 소요**: 1-2시간

---

## 🎯 우선순위 8: 시리즈/카테고리 페이지

### 현재 구조
- 태그별 분류만 있음
- 연속된 포스트 시리즈 표현 어려움

### 개선 방안

#### A. 시리즈 Front Matter
```yaml
---
title: "React 18 Deep Dive - Part 1"
series: "React 18 Deep Dive"
seriesOrder: 1
---
```

**작업 내용**:
- [ ] Front matter schema 확장
- [ ] 시리즈별 포스트 그룹핑 함수
- [ ] 시리즈 페이지 (`/series/[name]`)
- [ ] 시리즈 내비게이션 (이전/다음 포스트)

**예상 소요**: 6-8시간

---

#### B. 카테고리 시각화
**현재**: 폴더 구조가 카테고리 역할
**개선**: 카테고리 페이지 강화

```typescript
// Category page with stats
- DEV (32 posts, 1,234 views)
- REACT (18 posts, 890 views)
- JS (15 posts, 567 views)
```

**작업 내용**:
- [ ] 카테고리 목록 페이지
- [ ] 카테고리별 통계
- [ ] 카테고리 설명 추가
- [ ] 카테고리 아이콘/색상

**예상 소요**: 4-5시간

---

## 🎯 우선순위 9: 관련 포스트 알고리즘 개선

### 현재 알고리즘
```typescript
// src/lib/posts.ts
score = (sharedTags * 3) + (sameCategory * 2) + (recency * 0.5)
```

### 개선 방안

#### A. TF-IDF 기반 유사도
```typescript
import { tfidf } from 'natural'; // NLP 라이브러리

// 포스트 내용 기반 유사도 계산
const similarity = calculateTFIDF(post1.content, post2.content);
```

**작업 내용**:
- [ ] natural.js 또는 유사 라이브러리 연동
- [ ] 포스트 내용 벡터화
- [ ] 코사인 유사도 계산
- [ ] 기존 점수와 결합

**예상 소요**: 6-8시간

---

#### B. 사용자 행동 기반 추천
```typescript
// 같이 읽힌 포스트 추적
// Redis에 저장: "read_together:{postSlug}" -> [slug1, slug2, ...]
```

**작업 내용**:
- [ ] 포스트 조회 시 세션 추적
- [ ] "함께 읽은 포스트" 데이터 수집
- [ ] 추천 알고리즘에 반영
- [ ] 개인정보 보호 고려 (익명화)

**예상 소요**: 8-10시간

---

## 🎯 우선순위 10: Newsletter 구독 기능

### 기능 개요
- 이메일 구독 기능
- 새 포스트 발행 시 자동 이메일 발송

### 구현 옵션

#### 옵션 1: 간단한 이메일 수집
```typescript
// Mailchimp or ConvertKit 연동
export async function subscribeToNewsletter(email: string) {
  await fetch('https://api.mailchimp.com/3.0/lists/...', {
    method: 'POST',
    body: JSON.stringify({ email_address: email }),
  });
}
```

**작업 내용**:
- [ ] 구독 폼 UI
- [ ] Mailchimp/ConvertKit API 연동
- [ ] 이메일 유효성 검증
- [ ] 구독 확인 이메일

**예상 소요**: 4-6시간

---

#### 옵션 2: 자체 구현 (Resend + DB)
```typescript
// Resend.com으로 이메일 발송
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'blog@your-domain.com',
  to: subscribers,
  subject: '새 포스트: ${post.title}',
  html: emailTemplate,
});
```

**필요 작업**:
- [ ] 구독자 DB 스키마 (Prisma)
- [ ] 구독/구독 취소 API
- [ ] 이메일 템플릿 제작
- [ ] 발송 스케줄링 (새 포스트 발행 시)
- [ ] 구독 해지 링크

**예상 소요**: 10-12시간

---

## 📊 작업 우선순위 요약

| 우선순위 | 기능 | 예상 소요 시간 | 난이도 | 사용자 가치 |
|---------|------|---------------|--------|------------|
| 2 | Admin 에디터 UX | 13-18시간 | 중간 | ⭐⭐⭐⭐⭐ |
| 3 | SEO & 검색 | 7-13시간 | 중간 | ⭐⭐⭐⭐⭐ |
| 4 | 이미지 최적화 | 5-7시간 | 쉬움 | ⭐⭐⭐⭐ |
| 5 | 분석 대시보드 | 9-11시간 | 중간 | ⭐⭐⭐⭐ |
| 6 | 코드 블록 개선 | 4-6시간 | 쉬움 | ⭐⭐⭐ |
| 7 | 다크모드 개선 | 2-4시간 | 쉬움 | ⭐⭐⭐ |
| 8 | 시리즈/카테고리 | 10-13시간 | 높음 | ⭐⭐⭐⭐ |
| 9 | 관련 포스트 개선 | 14-18시간 | 높음 | ⭐⭐⭐ |
| 10 | Newsletter | 4-12시간 | 중간 | ⭐⭐⭐⭐ |

---

## 🚀 추천 순서

### Phase 1: Quick Wins (1-2주) ✅ **완료**

1. ✅ SEO (Sitemap, RSS) - 4-5시간
   - Auto-generated sitemap at `/sitemap.xml`
   - RSS feed at `/feed.xml`
   - Updated `robots.txt` with sitemap reference

2. ✅ 코드 블록 복사 버튼 - 2-3시간
   - Client-side `CodeBlockWrapper` component
   - Copy to clipboard with visual feedback
   - Hover-triggered UI

3. ✅ 다크모드 개선 - 2-4시간
   - Smooth CSS transitions (200ms)
   - Respects `prefers-reduced-motion`
   - Applied to all layout elements

4. ✅ 이미지 최적화 - 5-7시간
   - `rehype-optimize-images` plugin
   - Lazy loading with `loading="lazy"`
   - Automatic captions from alt text
   - Responsive design with hover effects
   - WebP/AVIF format support

**총 예상**: 13-19시간 | **실제 소요**: ~15시간

### Phase 2: 핵심 기능 (2-3주)
1. Admin 에디터 UX 개선 - 13-18시간
2. 블로그 검색 기능 - 4-8시간
3. 분석 대시보드 - 9-11시간

**총 예상**: 26-37시간

### Phase 3: 고급 기능 (3-4주)
1. 시리즈/카테고리 - 10-13시간
2. Newsletter 구독 - 4-12시간
3. 관련 포스트 알고리즘 - 14-18시간

**총 예상**: 28-43시간

---

## 🎯 다음 작업 선택 가이드

**빠른 성과를 원한다면**:
→ Phase 1 (SEO + 코드 블록 + 다크모드)

**에디터 생산성 향상이 중요하다면**:
→ Admin 에디터 UX 개선부터 시작

**블로그 성장에 집중한다면**:
→ SEO + 검색 기능 + Newsletter

**사용자 경험 개선이 우선이라면**:
→ 이미지 최적화 + 코드 블록 + 시리즈

---

**마지막 업데이트**: 2025-12-16
**작성자**: Claude Code
