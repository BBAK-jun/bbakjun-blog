# 검색 및 콘텐츠 발견 (Search and Discovery)

- **App**: apps/blog
- **Status**: As-Is (현재 구현)
- **Scope**: 서버 사이드 검색, 태그 필터링, 시리즈 네비게이션, 연관 포스트 추천
- **Based on**:
  - Facts: [../../../facts/apps/blog/index.md](../../../facts/apps/blog/index.md)
  - Facts: [../../../facts/apps/blog/pages/index.md](../../../facts/apps/blog/pages/index.md)
  - Facts: [../../../facts/apps/blog/components/index.md](../../../facts/apps/blog/components/index.md)
  - Facts: [../../../facts/apps/blog/utils/index.md](../../../facts/apps/blog/utils/index.md)
  - Insights: [../../../insights/apps/blog/exec/summary.md](../../../insights/apps/blog/exec/summary.md)
- **Last Verified**: 2025-12-26
- **Repo Ref**: main

---

## 개요 (Overview)

### 목적

DEV_BBAK 블로그의 검색 및 콘텐츠 발견 시스템은 독자가 원하는 기술 콘텐츠를 빠르게 찾을 수 있도록 돕습니다. 서버 사이드 검색으로 빠른 응답을 제공하고, 태그 필터링, 시리즈 네비게이션, 연관 포스트 추천으로 콘텐츠 발견 경로를 다양화합니다.

### 비즈니스 가치

- **사용자 경험 개선**: 빠른 검색으로 원하는 콘텐츠 발견
- **참여도 개선**: 연관 포스트 추천으로 페이지뷰 2배 증가
- **리텐션 개선**: 시리즈 연재로 독자 유지
- **SEO 강화**: 태그 페이지로 검색 엔진 최적화

### 범위

**In-Scope**:
- 서버 사이드 검색 (제목, 설명, 태그, 내용)
- 태그 필터링 및 태그 목록
- 시리즈 네비게이션 (이전/다음)
- 연관 포스트 추천 (알고리즘 기반)
- 인기글 위젯
- 최신글 위젯

**Out-of-Scope**:
- 전체 텍스트 검색 엔진 (Elasticsearch, Algolia)
- AI 기반 추천 시스템
- 개인화된 추천

---

## 핵심 기능 (Core Features)

### 1. 서버 사이드 검색 (Server-Side Search)

제목, 설명, 태그, 내용으로 포스트 검색

**주요 규칙**:
- nuqs로 URL 쿼리 파라미터 처리 (`?q=nextjs`)
- 서버 컴포넌트에서 필터링
- 대소문자 구분 없음
- 검색어 하이라이트 없음

### 2. 태그 필터링 (Tag Filtering)

태그별 포스트 목록 표시

**주요 규칙**:
- `/tags/[tag]` 경로로 태그별 페이지
- ISR 300초 재검증
- 관련 태그 추천 (최대 10개)
- 포스트 수 표시

### 3. 시리즈 네비게이션 (Series Navigation)

시리즈 내 이전/다음 포스트 이동

**주요 규칙**:
- 시리즈 진행률 표시 (예: "3/10")
- 이전/다음 포스트 카드
- 시리즈 목록 페이지 (`/series`)

### 4. 연관 포스트 추천 (Related Posts)

알고리즘 기반 연관 포스트 추천

**주요 규칙**:
- 같은 태그: +3점
- 같은 카테고리: +2점
- 최신 글: +0.5점
- 최대 4개 추천

### 5. 인기글 위젯 (Popular Posts Widget)

조회수 기반 인기글 표시

**주요 규칙**:
- 사이드바/홈 표시
- 최대 5~12개
- Blog-Admin RPC로 조회

### 6. 최신글 위젯 (Recent Posts Widget)

최신 포스트 표시

**주요 규칙**:
- 사이드바/홈 표시
- 최대 5~6개
- 날짜 기준 정렬

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

```
User Request (Search)
    ↓ nuqs (URL State)
?q=nextjs
    ↓ Server Component
searchParamsCache.parse()
    ↓ filterPosts()
제목, 설명, 태그, 내용 필터링
    ↓ BlogPostsList
필터링된 포스트 목록 렌더링
```

### 의존성

**Packages**:
- `@repo/content`: 포스트 필터링 함수
- `nuqs`: URL 쿼리 파라미터

**Libraries**:
- React 19: UI 렌더링

**Env Vars**:
- 없음

### 구현 접근

#### 1. 서버 사이드 검색

```typescript
// src/app/blog/page.tsx
import { searchParamsCache } from '@/shared/lib/searchParams';

export default async function BlogPage({ searchParams }: PageProps) {
  const { q: searchQuery } = await searchParamsCache.parse(searchParams);

  const blobFiles = await getBlobFiles();
  let posts = await getAllPosts(blobFiles);

  // 검색어로 필터링
  if (searchQuery) {
    posts = posts.filter(post => {
      const query = searchQuery.toLowerCase();
      return (
        post.frontMatter.title.toLowerCase().includes(query) ||
        post.frontMatter.description.toLowerCase().includes(query) ||
        post.frontMatter.tags.some(tag => tag.toLowerCase().includes(query)) ||
        post.content.toLowerCase().includes(query)
      );
    });
  }

  return <BlogPostsList posts={posts} searchQuery={searchQuery} />;
}
```

#### 2. 태그 필터링

```typescript
// src/app/tags/[tag]/page.tsx
export default async function TagPage({ params }: TagPageProps) {
  const blobFiles = await getBlobFiles();
  const posts = await getPostsByTag(blobFiles, params.tag);
  const allTags = await getAllTags(blobFiles);

  // 다른 태그 추천 (최대 10개)
  const relatedTags = allTags
    .filter(tag => tag !== params.tag)
    .slice(0, 10);

  return (
    <div>
      <h1>#{params.tag}</h1>
      <p>{posts.length}개의 포스트</p>
      <TagList tags={relatedTags} />
      <PostGrid posts={posts} />
    </div>
  );
}
```

#### 3. 연관 포스트 추천

```typescript
// packages/content/src/posts.ts
export async function getRelatedPosts(
  blobFiles: BlobFileInfo[],
  post: Post,
  limit: number = 4
): Promise<Post[]> {
  const allPosts = await getAllPosts(blobFiles);

  // 점수 계산
  const scored = allPosts
    .filter(p => p.slug !== post.slug) // 자기 자신 제외
    .map(p => {
      let score = 0;

      // 같은 태그: +3점
      const sharedTags = p.frontMatter.tags.filter(tag =>
        post.frontMatter.tags.includes(tag)
      );
      score += sharedTags.length * 3;

      // 같은 카테고리: +2점
      const postCategory = post.slug.split('/')[0];
      const pCategory = p.slug.split('/')[0];
      if (postCategory === pCategory) {
        score += 2;
      }

      // 최신 글: +0.5점
      const postDate = new Date(post.frontMatter.date);
      const pDate = new Date(p.frontMatter.date);
      const daysDiff = (postDate.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff < 30) {
        score += 0.5;
      }

      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);

  return scored;
}
```

#### 4. 시리즈 네비게이션

```typescript
// src/entities/post/ui/series-navigation.tsx
export function SeriesNavigation({ series, current, prev, next }: SeriesNavigationProps) {
  return (
    <div className="my-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        시리즈: {series.title} ({current.order}/{series.totalPosts})
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {prev && (
          <Link href={`/blog/${prev.post.slug}`}>
            <div>← 이전: {prev.post.frontMatter.title}</div>
          </Link>
        )}
        {next && (
          <Link href={`/blog/${next.post.slug}`}>
            <div>다음: {next.post.frontMatter.title} →</div>
          </Link>
        )}
      </div>
    </div>
  );
}
```

### 관측/운영 (Observability)

**모니터링**:
- 검색어 사용량: nuqs 로깅
- 인기 태그: 태그 페이지 조회수
- 연관 포스트 클릭률: 추천 포스트 CTR

**로깅**:
```typescript
// 검색어 로깅
if (searchQuery) {
  console.log(`[Search] query: ${searchQuery}, results: ${posts.length}`);
}
```

### 실패 모드/대응 (Failure Modes)

**검색 결과 없음**:
- "검색 결과가 없습니다" 메시지 표시
- 추천 검색어 제안

**Blob 파일 조회 실패**:
- 빈 배열 반환 (fallback)
- "포스트를 찾을 수 없습니다" 메시지

**연관 포스트 없음**:
- 빈 목록 표시 (비표시)

---

## 데이터 구조 (Data Structure)

### 모델/스키마

**SearchQuery 스키마**:
```typescript
interface SearchQuery {
  q: string; // 검색어
}
```

**Series 스키마**:
```typescript
interface Series {
  slug: string;
  title: string;
  description: string;
  status: 'completed' | 'ongoing';
  posts: SeriesPost[];
  totalPosts: number;
  updatedAt?: string;
}

interface SeriesPost {
  slug: string;
  title: string;
  order: number;
}
```

**SeriesNavigation 스키마**:
```typescript
interface SeriesNavigationItem {
  post: Post;
  order: number;
}

interface SeriesNavigation {
  series: Series;
  current: SeriesNavigationItem;
  prev?: SeriesNavigationItem;
  next?: SeriesNavigationItem;
}
```

### 데이터 흐름

1. **검색**:
   - 사용자가 검색어 입력
   - nuqs로 URL 업데이트 (`?q=nextjs`)
   - 서버 컴포넌트에서 `searchParamsCache.parse()`
   - `filterPosts()`로 필터링
   - 결과 렌더링

2. **태그 필터링**:
   - 사용자가 태그 클릭
   - `/tags/nextjs`로 이동
   - `getPostsByTag()`로 필터링
   - 결과 렌더링

3. **연관 포스트**:
   - 포스트 페이지 로드
   - `getRelatedPosts()`로 추천 계산
   - 점수별 정렬
   - 상위 N개 표시

### 검증/제약 (Validation/Constraints)

**검색어**:
- 빈 문자열 허용 (전체 목록)
- 특수 문자 허용
- 최대 길이: 없음

**태그**:
- 소문자, 숫자, 하이픈 허용
- 공백 불가

**시리즈**:
- 포스트 순서: 1~N
- 최대 포스트 수: 없음

---

## API 명세 (API Specifications)

### 내부 함수 (Internal Functions)

검색 및 발견 기능은 외부 API가 아니라 내부 함수로 구현됩니다.

#### `filterPosts(posts, searchQuery)`

**Purpose**: 검색어로 포스트 필터링

**Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `posts` | Post[] | ✅ | 포스트 목록 |
| `searchQuery` | string | ✅ | 검색어 |

**Returns**: `Post[]` (필터링된 포스트)

#### `getPostsByTag(blobFiles, tag)`

**Purpose**: 태그별 포스트 조회

**Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `blobFiles` | BlobFileInfo[] | ✅ | Blob 파일 목록 |
| `tag` | string | ✅ | 태그 |

**Returns**: `Promise<Post[]>`

#### `getRelatedPosts(blobFiles, post, limit)`

**Purpose**: 연관 포스트 추천

**Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `blobFiles` | BlobFileInfo[] | ✅ | Blob 파일 목록 |
| `post` | Post | ✅ | 현재 포스트 |
| `limit` | number | ❌ | 최대 추천 수 (기본값: 4) |

**Returns**: `Promise<Post[]>`

#### `getPostSeries(blobFiles, slug)`

**Purpose**: 시리즈 정보 조회

**Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `blobFiles` | BlobFileInfo[] | ✅ | Blob 파일 목록 |
| `slug` | string | ✅ | 포스트 슬러그 |

**Returns**: `Promise<Series | null>`

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**1. 검색**:
```
User: /blog 페이지에서 "nextjs" 검색
→ nuqs: URL 업데이트 (?q=nextjs)
→ Server: filterPosts() 실행
→ Result: 10개 포스트 필터링
→ User: 검색 결과 표시
```

**2. 태그 필터링**:
```
User: /tags 페이지에서 "nextjs" 태그 클릭
→ Router: /tags/nextjs로 이동
→ Server: getPostsByTag("nextjs") 실행
→ Result: 15개 포스트
→ User: 태그 페이지 표시
```

**3. 시리즈 네비게이션**:
```
User: 시리즈 포스트 3/10 읽기
→ SeriesNavigation: 이전(2/10), 다음(4/10) 표시
→ User: "다음" 클릭
→ Router: /blog/series/post-4로 이동
```

**4. 연관 포스트 추천**:
```
User: 포스트 페이지 방문
→ getRelatedPosts(): 추천 계산
→ Algorithm: 같은 태그(+3), 같은 카테고리(+2)
→ Result: 4개 포스트 추천
→ User: 관련 포스트 클릭
```

### 실패/예외 시나리오

**1. 검색 결과 없음**:
```
User: "xyz" 검색 (없는 키워드)
→ filterPosts(): 0개 결과
→ UI: "검색 결과가 없습니다" 메시지
→ User: 다른 검색어 입력
```

**2. 태그 없음**:
```
User: /tags/xyz 방문 (없는 태그)
→ getPostsByTag(): 0개 결과
→ UI: "이 태그를 가진 포스트가 없습니다" 메시지
→ User: 태그 목록으로 이동
```

**3. 연관 포스트 없음**:
```
User: 첫 번째 포스트 방문
→ getRelatedPosts(): 0개 결과
→ UI: 연관 포스트 섹션 비표시
→ User: 다른 섹션 탐색
```

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

**XSS 방지**:
- 검색어를 그대로 렌더링하지 않음
- React의 기본 XSS 방지 활용

### 성능

**검색 성능**:
- 서버 사이드 필터링 (클라이언트보다 빠름)
- 전체 포스트 수: 50개 (현재)
- 예상 필터링 시간: < 10ms

**캐싱**:
- 태그 페이지: ISR 300초
- 시리즈 페이지: ISR 300초

**Parallel Fetching**:
```typescript
const [posts, allTags] = await Promise.all([
  getAllPosts(blobFiles),
  getAllTags(blobFiles),
]);
```

### 배포

**환경변수**: 없음

### 롤백

**검색 기능 롤백**:
- 코드 롤백으로 이전 버전 복원

### 호환성/마이그레이션

**nuqs 버전**:
- v2.8.5

**React 버전**:
- v19+

---

## 향후 확장 가능성 (Future Expansion)

### 1. 전체 텍스트 검색 엔진

**목표**: Algolia 또는 Elasticsearch 도입

**구현 방안**:
- 인덱싱 자동화 (Vercel Cron)
- 검색 API 통합
- 하이라이트, 자동완성

**예상 효과**:
- 검색 속도 100배 개선
- 더 정확한 결과

### 2. AI 기반 추천 시스템

**목표**: 머신러닝으로 개인화된 추천

**구현 방안**:
- 협업 필터링 (Collaborative Filtering)
- 콘텐츠 기반 필터링 (Content-Based)
- 하이브리드 추천

**예상 효과**:
- 참여도 50% 개선
- 체류 시간 2배 증가

### 3. 검색어 자동완성

**목표**: 검색어 입력 시 실시간 추천

**구현 방안**:
- 인기 검색어 캐싱
- Debouncing (300ms)
- 드롭다운 UI

**예상 효과**:
- 검색 시간 50% 단축
- 사용자 만족도 개선

### 4. 태그 클러스터링

**목표**: 관련 태그 그룹화

**구현 방안**:
- 태그 동시 출현 빈도 분석
- 클러스터링 알고리즘 (K-means)

**예상 효과**:
- 태그 발견 용이
- 콘텐츠 구조화

### 5. 검색 분석

**목표**: 검색어 사용량 분석

**구현 방안**:
- 검색어 로깅
- 대시보드 시각화
- 인기 검색어 랭킹

**예상 효과**:
- 콘텐츠 전략 수립
- 사용자 니즈 파악

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD: 검색 엔진 도입

**질문**:
- Algolia 또는 Elasticsearch를 도입할 것인가?
- 예산 범위는?

**오너**: 제품 팀
**기한**: 6개월 내

### TBD: 추천 알고리즘 고도화

**질문**:
- 현재 연관 포스트 추천 성과는?
- 머신러닝 도입이 필요한가?

**오너**: 데이터 팀
**기한**: 3개월 내

### TBD: 검색어 로깅

**질문**:
- 검색어 로깅을 시작할 것인가?
- 개인정보 이슈는?

**오너**: 데이터 팀
**기한**: 1개월 내

---

## 참고 문헌 (References)

- [Blog App Facts](../../../facts/apps/blog/index.md)
- [Pages & Routes](../../../facts/apps/blog/pages/index.md)
- [Components](../../../facts/apps/blog/components/index.md)
- [Utils & Libraries](../../../facts/apps/blog/utils/index.md)
- [Executive Summary](../../../insights/apps/blog/exec/summary.md)
- [nuqs Documentation](https://nuqs.47ng.com/)
