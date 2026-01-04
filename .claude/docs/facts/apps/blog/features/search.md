# Search Feature

- **Scope**: Blog 앱의 검색 기능 (키보드 단축키, URL state, 필터링)
- **Source of Truth**: src/features/post-search
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
    apps/blog/src/features/post-search/ui/search-bar-client.tsx:
      git_hash: "c56ca3b"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true

  changed_files:
    - path: apps/blog/src/features/post-search/ui/search-bar-client.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "Added keyboard shortcuts (Cmd+K, ESC) for search (commit c56ca3b)"

  deleted_files: []

  extraction_config:
    depth: "standard"
    scope: "features"
    stale_detection: true
---
```

---

## SearchBarClient Component

- **Location**: `apps/blog/src/features/post-search/ui/search-bar-client.tsx` (L1-L111)
- **Purpose**: 클라이언트 사이드 검색 입력 UI, 키보드 단축키 지원
- **Source Exists**: true
- **Key Details**:
  - **키보드 단축키**: Cmd+K (Mac) / Ctrl+K (Windows)로 검색창 포커스
  - **ESC**: 검색어 지우기 또는 검색창 닫기
  - **URL State**: nuqs로 타입세이프한 쿼리 파라미터 관리
  - **Visual Hint**: 검색창 우측에 ⌘K 표시
  - **Auto-clear**: 빈 문자열 입력 시 URL 파라미터 제거
- **Dependencies**:
  - `nuqs`: useQueryState, parseAsString
  - `react`: useEffect, useRef
- **Evidence**:
  - `apps/blog/src/features/post-search/ui/search-bar-client.tsx`: `export default function SearchBarClient({ placeholder = '포스트 검색...', className = '' }: SearchBarClientProps) { const inputRef = useRef<HTMLInputElement>(null); const [query, setQuery] = useQueryState('q', parseAsString.withDefault('').withOptions({ scroll: false, shallow: true })); const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const value = e.target.value; setQuery(value || null); }; const clearSearch = () => { setQuery(null); }; useEffect(() => { const handleKeyDown = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); } if (e.key === 'Escape' && document.activeElement === inputRef.current) { if (query) { clearSearch(); } else { inputRef.current?.blur(); } } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [query]); return ( <div className={`relative ${className}`}><input ref={inputRef} type="text" value={query} onChange={handleInputChange} className="block w-full pl-10 pr-24 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" placeholder={placeholder} />{!query && (<div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-500 rounded">⌘K</kbd></div>)}{query && (<button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="검색 지우기"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>)}</div> ); }`

---

## 키보드 단축키

### Cmd+K / Ctrl+K

**목적**: 검색창 포커스

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

- **Mac**: Cmd (⌘) + K
- **Windows/Linux**: Ctrl + K
- **preventDefault**: 브라우저 기본 동작 방지
- **focus()**: 검색창에 포커스

### ESC

**목적**: 검색어 지우기 또는 검색창 닫기

```typescript
if (e.key === 'Escape' && document.activeElement === inputRef.current) {
  if (query) {
    clearSearch(); // 검색어 지우기
  } else {
    inputRef.current?.blur(); // 검색창 닫기
  }
}
```

- **검색어 있음**: 검색어 지우기
- **검색어 없음**: 검색창에서 포커스 해제

---

## URL State Management

### nuqs 사용

```typescript
const [query, setQuery] = useQueryState(
  'q',
  parseAsString.withDefault('').withOptions({
    scroll: false,  // 스크롤 유지
    shallow: true, // 얕은 라우팅
  })
);
```

- **parseAsString**: 문자열 타입 파싱
- **withDefault('')**: 기본값 빈 문자열
- **scroll: false**: 검색어 변경 시 스크롤 유지
- **shallow: true**: 상태 관리 라이브러리 리셋 방지

### Query Update

```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setQuery(value || null); // 빈 문자열이면 URL에서 파라미터 제거
};
```

- **value가 있으면**: URL에 쿼리 파라미터 추가 (?q=검색어)
- **value가 없으면**: URL에서 쿼리 파라미터 제거

### Clear Search

```typescript
const clearSearch = () => {
  setQuery(null); // URL에서 q 파라미터 제거
};
```

---

## UI 컴포넌트

### Search Input

```tsx
<input
  ref={inputRef}
  type="text"
  value={query}
  onChange={handleInputChange}
  className="block w-full pl-10 pr-24 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
  placeholder={placeholder}
/>
```

- **pl-10**: 왼쪽 패딩 (검색 아이콘 공간)
- **pr-24**: 오른쪽 패딩 (키보드 힌트 공간)
- **py-3**: 상하 패딩
- **focus:ring-2**: 포커스 시 링 효과
- **transition-colors**: 색상 전환 애니메이션

### Search Icon

```tsx
<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
  <svg
    className="h-5 w-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
</div>
```

- **absolute inset-y-0 left-0**: 왼쪽 수직 중앙
- **pl-3**: 왼쪽 패딩 0.75rem
- **pointer-events-none**: 클릭 통과 (input 포커스 방해 방지)

### Keyboard Hint

```tsx
{!query && (
  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
    <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-500 rounded">
      ⌘K
    </kbd>
  </div>
)}
```

- **!query**: 검색어 없을 때만 표시
- **hidden sm:inline-block**: 모바일에서 숨김
- **kbd**: 키보드 키 스타일링
- **pointer-events-none**: 클릭 통과

### Clear Button

```tsx
{query && (
  <button
    onClick={clearSearch}
    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    aria-label="검색 지우기"
  >
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
)}
```

- **query**: 검색어 있을 때만 표시
- **hover**: 마우스 오버 시 색상 변경
- **aria-label**: 접근성 라벨

---

## 검색 필터링

### Server-Side Filtering

**Location**: `apps/blog/src/app/blog/page.tsx`

```typescript
import { searchParamsCache } from '@/shared/lib/search-params';

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

### filterPosts Function

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

- **title**: 제목 매칭
- **description**: 설명 매칭
- **tags**: 태그 매칭
- **content**: 내용 매칭
- **toLowerCase**: 대소문자 구분 없음

---

## 접근성

### ARIA Labels

```tsx
<button
  onClick={clearSearch}
  aria-label="검색 지우기"
>
  <Icon />
</button>
```

### Keyboard Navigation

- **Tab**: 검색창 포커스
- **Cmd+K / Ctrl+K**: 검색창 포커스 (단축키)
- **ESC**: 검색어 지우기 또는 검색창 닫기
- **Enter**: 검색어 입력 (실시간 검색이므로 불필요)

### Focus Management

```typescript
inputRef.current?.focus(); // 포커스
inputRef.current?.blur();  // 포커스 해제
```

### Placeholder

```tsx
placeholder="포스트 검색..."
```

- 검색 기능을 명확하게 설명

---

## 성능 최적화

### Debouncing (현재 미사용)

실시간 검색으로 불필요하나, 필요 시 추가 가능:

```typescript
const debouncedQuery = useDebounce(query, 300);
```

### Server-Side Filtering

- **장점**: 클라이언트 JS 없음
- **장점**: 초기 로드 시 필터링 완료
- **단점**: 매 검색 시 서버 요청

### React.cache (Blob Files)

```typescript
const blobFiles = await getBlobFiles(); // React.cache로 중복 호출 방지
```

---

## 변경사항 요약

### commit c56ca3b: Search Keyboard Shortcuts

**추가된 기능**:
1. **Cmd+K / Ctrl+K**: 검색창 포커스
2. **ESC**: 검색어 지우기 또는 검색창 닫기
3. **Visual Keyboard Hint**: ⌘K 표시
4. **Auto-clear**: 빈 문자열 입력 시 URL 파라미터 제거

**코드 변경**:
```typescript
// 키보드 이벤트 리스너 추가
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      inputRef.current?.focus();
    }
    if (e.key === 'Escape' && document.activeElement === inputRef.current) {
      if (query) clearSearch();
      else inputRef.current?.blur();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [query]);
```

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
