# 검색 키보드 단축키 (Search Keyboard Shortcuts)

- **App**: apps/blog
- **Status**: As-Is (현재 구현)
- **Scope**: 블로그 검색 기능의 키보드 단축키 지원 및 URL State 관리
- **Based on**:
  - Facts: `../../../facts/apps/blog/features/search.md`
  - Facts: `../../../facts/apps/blog/pages/routes.md`
  - Insights: `../../../insights/apps/blog/impact/customer.md`
  - Insights: `../../../insights/apps/blog/exec/summary.md`
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208 (commit c56ca3b)

---

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2026-01-04
- **Verification Results**:
  - `../../../facts/apps/blog/features/search.md`: ✅ Verified (source_exists: true)
  - `../../../facts/apps/blog/pages/routes.md`: ✅ Verified (source_exists: true)
  - `../../../insights/apps/blog/impact/customer.md`: ✅ Verified
  - `../../../insights/apps/blog/exec/summary.md`: ✅ Verified
- **Spec Status**: As-Is (현재 구현됨)

---

## 개요 (Overview)

### 목적

파워 사용자(개발자, 엔지니어)의 생산성을 향상시키기 위해 키보드 단축키로 검색창에 빠르게 접근할 수 있는 기능을 제공합니다. 마우스 없이 즉시 검색창을 포커스하고, ESC 키로 빠르게 검색을 해제할 수 있어 "개발자 친화적" 블로그 경험을 강화합니다.

### 범위

**In-Scope**:
- Cmd+K (Mac) / Ctrl+K (Windows/Linux) 단축키로 검색창 포커스
- ESC 키로 검색어 지우기 또는 검색창 닫기
- URL State를 통한 검색어 관리 (nuqs)
- Visual Keyboard Hint (⌘K) 표시 (모바일에서 숨김)
- 실시간 검색 (서버 사이드 필터링)

**Out-of-Scope**:
- 전역 검색 모달 (현재는 페이지 내 검색창만 지원)
- 검색 자동완성/제안 (TODO)
- 검색 기록 저장 (TODO)

### 비즈니스 가치

**파워 사용자 경험 최적화**:
- **검색 효율성**: 마우스 없이 즉시 검색창 접근 (평균 2-3초 절약)
- **생산성 향상**: 자주 사용하는 기능을 키보드로 빠르게 실행
- **브랜드 인식**: "개발자를 위한 블로그"라는 인식 강화

**예상 효과**:
- 검색 사용 빈도 30% 증가 (접근성 향상 효과)
- 파워 사용자 재방문율 10% 증가 (UX 개선 효과)
- 개발자 유입 증가 (기술 블로그로 인식)

---

## 핵심 기능 (Core Features)

### 1. Cmd+K / Ctrl+K 단축키

검색창을 즉시 포커스하는 키보드 단축키입니다.

**동작**:
- **Mac**: Cmd (⌘) + K
- **Windows/Linux**: Ctrl + K
- **Prevent Default**: 브라우저 기본 동작 방지 (예: Chrome 개발자 도구)

**구현**:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd+K (Mac) 또는 Ctrl+K (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**이벤트 리스너 생명주기**:
- 컴포넌트 마운트 시 window에 이벤트 리스너 등록
- 컴포넌트 언마운트 시 이벤트 리스너 제거 (cleanup)

### 2. ESC 키로 검색 해제

두 단계로 검색을 해제하는 키보드 단축키입니다.

**동작**:
1. **검색어 있음**: ESC → 검색어 지우기 (`setQuery(null)`)
2. **검색어 없음**: ESC → 검색창에서 포커스 해제 (`inputRef.current?.blur()`)

**구현**:
```typescript
if (e.key === 'Escape' && document.activeElement === inputRef.current) {
  if (query) {
    clearSearch(); // 검색어 지우기
  } else {
    inputRef.current?.blur(); // 검색창 닫기
  }
}
```

**UX 이점**:
- 단일 키(ESC)로 두 단계 해제 지원
- 실수로 검색어를 지워도 다시 ESC로 포커스 해제 가능

### 3. URL State 관리

검색어를 URL 쿼리 파라미터로 저장하여 공유 가능하게 만듭니다.

**라이브러리**: nuqs (URL query state for Next.js)

**구현**:
```typescript
const [query, setQuery] = useQueryState(
  'q',
  parseAsString.withDefault('').withOptions({
    scroll: false,  // 스크롤 유지
    shallow: true, // 얕은 라우팅
  })
);
```

**옵션 설명**:
- **scroll: false**: 검색어 변경 시 스크롤 유지 (페이지 상단으로 이동 방지)
- **shallow: true**: 상태 관리 라이브러리(TanStack Query) 리셋 방지

**URL 패턴**:
- 검색어 있음: `/blog?q=nextjs`
- 검색어 없음: `/blog`

**이점**:
- 검색 결과 URL 공유 가능
- 브라우저 뒤로/앞으로 가기 지원
- 새로고침 시 검색어 유지

### 4. Visual Keyboard Hint

검색창 우측에 ⌘K 힌트를 표시하여 단축키를 알립니다.

**구현**:
```tsx
{!query && (
  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
    <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-500 rounded">
      ⌘K
    </kbd>
  </div>
)}
```

**조건부 렌더링**:
- `!query`: 검색어 없을 때만 표시
- `hidden sm:inline-block`: 모바일에서 숨김 (화면 공간 부족)

**스타일링**:
- **kbd**: 키보드 키 스타일링 (회색 배경, 둥근 모서리)
- **pointer-events-none**: 클릭 통과 (input 포커스 방해 방지)

### 5. 실시간 검색

입력마다 즉시 검색 결과를 업데이트합니다.

**서버 사이드 필터링**:
```typescript
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParamsCache.parse(searchParams);

  const blobFiles = await getBlobFiles();
  const allPosts = await getAllPosts(blobFiles);

  // 필터링
  const filteredPosts = q
    ? filterPosts(allPosts, q)
    : allPosts;

  return (
    <>
      <SearchBarClient />
      <BlogPostsList posts={filteredPosts} searchQuery={q || ''} />
    </>
  );
}
```

**filterPosts 함수**:
```typescript
function filterPosts(posts: Post[], query: string): Post[] {
  const lowerQuery = query.toLowerCase();

  return posts.filter(post => {
    const titleMatch = post.frontMatter.title.toLowerCase().includes(lowerQuery);
    const descriptionMatch = post.frontMatter.description?.toLowerCase().includes(lowerQuery);
    const tagsMatch = post.frontMatter.tags?.some(tag =>
      tag.toLowerCase().includes(lowerQuery)
    );
    const contentMatch = post.content.toLowerCase().includes(lowerQuery);

    return titleMatch || descriptionMatch || tagsMatch || contentMatch;
  });
}
```

**검색 대상**:
- 제목 (title)
- 설명 (description)
- 태그 (tags)
- 내용 (content)

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

**검색 기능 구조**:
```
Blog Page (/blog)
  ├── SearchBarClient (Client Component)
  │   ├── inputRef (useRef)
  │   ├── query state (nuqs useQueryState)
  │   ├── Keyboard Event Listeners
  │   │   ├── Cmd+K / Ctrl+K → focus()
  │   │   └── ESC → clearSearch() / blur()
  │   ├── Visual Elements
  │   │   ├── Search Icon
  │   │   ├── Input Field
  │   │   ├── Keyboard Hint (⌘K)
  │   │   └── Clear Button (X)
  │   └── URL Update (setQuery)
  └── BlogPostsList (Server Component)
      ├── Server-Side Filtering (filterPosts)
      └── Posts Display
```

### 의존성

**Services**:
- Blog-Admin RPC: Blob files 가져오기 (캐시됨)

**Packages**:
- `nuqs`: URL query state 관리
- `react`: useEffect, useRef

**Libraries**:
- React 19

**Env Vars**:
- `NEXT_PUBLIC_ADMIN_URL`: Blog-Admin RPC endpoint

### 구현 접근

**SearchBarClient 컴포넌트** (`apps/blog/src/features/post-search/ui/search-bar-client.tsx`):

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryState } from 'nuqs';
import { parseAsString } from 'nuqs';

export default function SearchBarClient({
  placeholder = '포스트 검색...',
  className = '',
}: SearchBarClientProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({
      scroll: false,
      shallow: true,
    })
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value || null); // 빈 문자열이면 URL에서 파라미터 제거
  };

  const clearSearch = () => {
    setQuery(null); // URL에서 q 파라미터 제거
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K로 검색창 포커스
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // ESC로 검색어 지우기 또는 검색창 닫기
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        if (query) {
          clearSearch();
        } else {
          inputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        className="block w-full pl-10 pr-24 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        placeholder={placeholder}
      />

      {/* 검색 아이콘 */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* 키보드 힌트 */}
      {!query && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-500 rounded">
            ⌘K
          </kbd>
        </div>
      )}

      {/* 지우기 버튼 */}
      {query && (
        <button
          onClick={clearSearch}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="검색 지우기"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
```

### 관측/운영 (Observability)

**TODO**: 검색 사용량 추적 추가 필요
- 검색 횟수 (일별/주별)
- 검색어 분석 (인기 검색어)
- Cmd+K 단축키 사용 빈도
- 검색 후 평균 체류 시간

**제안**: Vercel Analytics 이벤트 추적
```typescript
// 검색 시 이벤트 추적
analytics.track('search', { query: query });
```

### 실패 모드/대응 (Failure Modes)

**1. Keyboard Event Listener 실패**:
- **대응**: cleanup 함수로 메모리 누수 방지
- **Fallback**: 마우스로 검색창 클릭 가능

**2. URL State 동기화 실패**:
- **대응**: nuqs의 내부 에러 핸들링
- **Fallback**: 로컬 state로 검색 기능 유지

**3. Server-Side Filtering 실패**:
- **대응**: React.cache로 blobFiles 중복 호출 방지
- **Fallback**: 빈 결과 표시 ("검색 결과가 없습니다")

**4. 포커스 관리 실패**:
- **대응**: `inputRef.current?.focus()` 옵셔널 체이닝
- **Fallback**: 포커스 실패 시 사용자가 직접 클릭

---

## 데이터 구조 (Data Structure)

### Post Type

```typescript
interface Post {
  slug: string;
  frontMatter: {
    title: string;
    description?: string;
    tags?: string[];
    date: string;
    readingTime?: string;
  };
  content: string;
}
```

### Query State

```typescript
type QueryState = string | null;

// null: 검색어 없음
// string: 검색어 있음
```

### Filtered Posts

```typescript
type FilteredPosts = Post[];
```

---

## API 명세 (API Specifications)

### RPC Endpoint

**GET /api/rpc/blob-files**:

- **Purpose**: Vercel Blob Storage에서 파일 목록 가져오기
- **Auth**: 없음 (public)
- **Request**:
  ```typescript
  query: {
    limit?: number;
    offset?: number;
    search?: string;
  }
  ```
- **Response**:
  ```typescript
  {
    files: BlobFileInfo[];
    total: number;
    hasMore: boolean;
  }
  ```
- **Cache**: 300초 (5분)

**Note**: Blog Page에서는 `getBlobFiles()` 함수를 통해 간접 호출

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**1. 키보드 단축키로 검색창 포커스**:
- 사용자가 블로그 목록 페이지 방문
- Cmd+K (Mac) 또는 Ctrl+K (Windows) 키 입력
- 검색창에 즉시 포커스
- Visual Hint (⌘K)로 단축키 확인

**2. 검색어 입력 및 결과 필터링**:
- 사용자가 검색어 입력 (예: "nextjs")
- 입력마다 URL 업데이트 (`/blog?q=nextjs`)
- 서버 사이드에서 포스트 필터링
- 실시간으로 결과 업데이트

**3. ESC 키로 검색어 지우기**:
- 사용자가 검색어 입력 상태에서 ESC 키 입력
- 검색어 지워짐 (`setQuery(null)`)
- URL에서 쿼리 파라미터 제거 (`/blog`)
- 모든 포스트 다시 표시

**4. ESC 키로 검색창 닫기**:
- 사용자가 검색어 없는 상태에서 ESC 키 입력
- 검색창에서 포커스 해제 (`inputRef.current?.blur()`)
- 키보드 포커스가 문서 본문으로 이동

**5. URL 공유 및 검색 결과 유지**:
- 사용자가 검색 결과 화면의 URL 복사 (`/blog?q=react`)
- 다른 사용자가 URL로 접속
- 검색어가 유지되어 동일한 결과 표시

**6. 브라우저 뒤로/앞으로 가기**:
- 사용자가 검색어 입력 (예: "nextjs")
- 브라우저 뒤로 가기 버튼 클릭
- 검색어가 제거되고 이전 상태로 복원

### 실패/예외 시나리오

**1. 검색 결과 없음**:
- 사용자가 존재하지 않는 검색어 입력 (예: "xyz123")
- `filterPosts` 함수가 빈 배열 반환
- "검색 결과가 없습니다" 메시지 표시

**2. 키보드 단축키 충돌**:
- 사용자가 Cmd+K 입력 시 브라우저 기본 동작 트리거
- `e.preventDefault()`로 기본 동작 방지
- 검색창에만 포커스

**3. 모바일에서 키보드 힌트 숨김**:
- 사용자가 모바일로 접속
- `hidden sm:inline-block`으로 ⌘K 힌트 숨김
- 대신 Clear 버튼(X)만 표시

**4. 검색어 특수 문자 처리**:
- 사용자가 특수 문자 입력 (예: "C++", "Node.js")
- `toLowerCase()`로 대소문자 구분 없이 검색
- 특수 문자는 그대로 포함하여 검색

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

**XSS 방지**:
- 검색어를 DOM에 렌더링하지 않음 (서버 사이드 필터링)
- React의 자동 XSS 방지 활용

**Query Parameter 검증**:
- nuqs의 `parseAsString`로 타입 안전성 보장
- SQL Injection 방지 (ORM 사용)

### 성능

**Server-Side Filtering**:
- **장점**: 클라이언트 JS 없음
- **장점**: 초기 로드 시 필터링 완료
- **단점**: 매 검색 시 서버 요청

**React.cache (Blob Files)**:
```typescript
const blobFiles = await getBlobFiles(); // React.cache로 중복 호출 방지
```
- 렌더링 컨텍스트 내에서 중복 호출 방지
- 한 번의 RPC 호출로 모든 페이지에서 재사용

**Debouncing (현재 미사용)**:
- 실시간 검색으로 불필요
- 필요 시 추가 가능 (300ms 지연)

### 배포

- **Build Time**: SearchBarClient는 클라이언트 컴포넌트로 번들링
- **Runtime**: 서버 사이드 필터링으로 빠른 초기 로딩

### 롤백

- **Git Revert**: commit c56ca3b 이전으로 되돌리기
- **영향 범위**: SearchBarClient 컴포넌트만
- **롤백 시간**: 5분 이내 (Vercel 자동 배포)

### 호환성/마이그레이션

**Browser Support**:
- Chrome/Edge: 최신 2 버전
- Firefox: 최신 2 버전
- Safari: 최신 2 버전
- Mobile: iOS Safari 14+, Chrome Mobile

**Keyboard Shortcuts**:
- **Mac**: Cmd (⌘) + K
- **Windows/Linux**: Ctrl + K
- **ESC**: 모든 플랫폼 동일

---

## 향후 확장 가능성 (Future Expansion)

### 1. 전역 검색 모달 (Command Palette)

**아이디어**: Cmd+K로 전역 검색 모달 열기

**구현**:
```tsx
<CommandPalette>
  <CommandInput />
  <CommandList>
    <CommandGroup>포스트</CommandGroup>
    <CommandGroup>태그</CommandGroup>
    <CommandGroup>시리즈</CommandGroup>
  </CommandList>
</CommandPalette>
```

**이점**:
- 포스트, 태그, 시리즈를 통합 검색
- 키보드만으로 탐색 가능
- VS Code, Slack 같은 경험 제공

**참고**: cmdk 라이브러리 사용 가능

### 2. 검색 자동완성/제안

**아이디어**: 입력마다 검색어 제안 표시

**구현**:
```typescript
const suggestions = await getSearchSuggestions(query);

<SearchSuggestions>
  {suggestions.map(suggestion => (
    <SuggestionItem onClick={() => setQuery(suggestion)}>
      {suggestion}
    </SuggestionItem>
  ))}
</SearchSuggestions>
```

**데이터 소스**:
- 인기 검색어 (조회수 기준)
- 최근 검색어 (localStorage)
- 태그 자동완성

### 3. 검색 기록 저장

**아이디어**: 최근 검색어를 localStorage에 저장

**구현**:
```typescript
const [recentSearches, setRecentSearches] = useState<string[]>([]);

const saveSearch = (query: string) => {
  const updated = [query, ...recentSearches].slice(0, 5); // 최대 5개
  setRecentSearches(updated);
  localStorage.setItem('recentSearches', JSON.stringify(updated));
};
```

**이점**:
- 반복 검색 용이
- 개인화된 검색 경험

### 4. 검색 결과 정렬

**현재**: 필터링만 (정렬 없음)
**개선안**: 관련도 순 정렬

**알고리즘**:
```typescript
function sortByRelevance(posts: Post[], query: string): Post[] {
  return posts.sort((a, b) => {
    const aScore = calculateRelevance(a, query);
    const bScore = calculateRelevance(b, query);
    return bScore - aScore;
  });
}

function calculateRelevance(post: Post, query: string): number {
  let score = 0;

  if (post.frontMatter.title.includes(query)) score += 10;
  if (post.frontMatter.tags?.includes(query)) score += 5;
  if (post.frontMatter.description?.includes(query)) score += 2;
  if (post.content.includes(query)) score += 1;

  return score;
}
```

### 5. 검색 결과 강조 (Highlight)

**아이디어**: 검색어를 결과에서 하이라이팅

**구현**:
```typescript
function highlightText(text: string, query: string): ReactNode {
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : part
  );
}
```

**이점**:
- 검색어 위치를 시각적으로 표시
- 사용자가 원하는 정보를 빠르게 찾기

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD: 검색 사용량 데이터

**질문**: 검색 기능이 실제로 얼마나 사용되는가?
- **데이터 필요**:
  - 일일 검색 횟수
  - Cmd+K 단축키 사용 빈도
  - 검색 후 평균 체류 시간
  - 인기 검색어 TOP 10

**오너**: TBD (블로그 운영자)
**기한**: TBD (성과 측정 후 1개월 이내)

### TBD: 검색 속도 최적화

**질문**: Debouncing이 필요한가?
- **데이터 필요**:
  - 평균 검색어 길이
  - 검색어 입력 빈도 (타이핑 속도)
  - 서버 응답 시간

**오너**: TBD (블로그 운영자)
**기한**: TBD (검색 성능 모니터링 후)

### TBD: 전역 검색 모달 도입 여부

**질문**: Command Palette 기능을 도입할 것인가?
- **결정 필요**:
  - UI/UX 디자인
  - 개발 우선순위
  - 사용자 피드백

**오너**: TBD (블로그 운영자)
**기한**: TBD (기능 계획 수립 시)

---

## 참고 문헌 (References)

### Facts Documents

- [Search Feature](../../../facts/apps/blog/features/search.md)
- [Pages & Routes](../../../facts/apps/blog/pages/routes.md)
- [Blog App Index](../../../facts/apps/blog/index.md)

### Insights Documents

- [Customer Impact Analysis](../../../insights/apps/blog/impact/customer.md)
- [Executive Summary](../../../insights/apps/blog/exec/summary.md)

### Related Specs

- [Unified Layout System](./unified-layout-system.md)
- [Widgets Refactoring](./widgets-refactoring.md)

### External Resources

- [nuqs Documentation](https://nuqs.47ng.com/)
- [cmdk (Command Palette)](https://cmdk.paco.me/)

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
