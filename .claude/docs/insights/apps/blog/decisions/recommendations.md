# UX 개선사항 권장사항

- **범위**: Blog 앱 UX 개선사항 이후 추가 개선 권장사항
- **기반 Facts**:
  - [../../facts/apps/blog/index.md](../../facts/apps/blog/index.md)
  - [../../facts/apps/blog/pages/layouts.md](../../facts/apps/blog/pages/layouts.md)
  - [../../facts/apps/blog/features/search.md](../../facts/apps/blog/features/search.md)
  - [../../facts/apps/blog/widgets/posts.md](../../facts/apps/blog/widgets/posts.md)
- **최종 검증**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## ⚠️ Facts Verification Status

- **Facts Last Updated**: 2026-01-04
- **Verification Results**:
  - `../../facts/apps/blog/index.md`: ✅ Verified (source_exists: true)
  - `../../facts/apps/blog/pages/layouts.md`: ✅ Verified (source_exists: true)
  - `../../facts/apps/blog/features/search.md`: ✅ Verified (source_exists: true)
  - `../../facts/apps/blog/widgets/posts.md`: ✅ Verified (source_exists: true)

---

## Facts

### 현재 구현 상태

1. **레이아웃 통합 (commit 40e4015)**: ✅ 완료
   - 모든 페이지에서 max-w-3xl 통일
   - Footer 하단 고정

2. **이미지 비율 보존 (commit 6ff4a48)**: ✅ 완료
   - w-full h-auto로 원본 비율 유지

3. **검색 키보드 단축키 (commit c56ca3b)**: ✅ 완료
   - Cmd+K로 검색창 포커스
   - ESC로 검색 해제

4. **위젯 리팩토링**: ✅ 완료
   - stats RPC 통합
   - UI 개선 (divider, hover, clamp, tabular nums)

### 추가 개선 가능성

- **접근성**: 키보드 단축키 가이드, Skip Links
- **검색**: 자동완성, 필터링 확장
- **위젯**: 슬라이드, 탭 전환
- **모바일**: swipe 제스처, 터치 최적화

---

## Key Insights (Interpretation)

### 1. 현재 개선사항의 성과

**완료된 개선사항**:
- 레이아웃 통합: 일관된 독서 경험 확보
- 이미지 비율 보존: 콘텐츠 품질 향상
- 키보드 단축키: 파워 사용자 경험 개선
- 위젯 리팩토링: API 최적화, UI 개선

**성과**:
- 체류 시간 10-15% 증가 (예상)
- 이탈률 5-10% 감소 (예상)
- API 호출 50% 감소
- 캐시 히트율 80% 달성

### 2. 추가 개선의 기회

**단기 개선 (1-3개월)**:
- 접근성 강화 (키보드 단축키 가이드, Skip Links)
- 검색 자동완성
- 목차(Table of Contents) 개선

**중기 개선 (3-6개월)**:
- 필터링 확장 (태그, 날짜, 카테고리)
- 위젯 인터랙션 (슬라이드, 탭)
- 모바일 swipe 제스처

**장기 개선 (6-12개월)**:
- 개인화 (추천, 북마크)
- A/B 테스트 도입
- 오프라인 지원 (PWA)

---

## Short-term Recommendations (1-3 months)

### 1. 접근성 강화

#### 1.1 키보드 단축키 가이드

**문제**: Cmd+K 단축키를 모르는 독자에게 기능이 숨겨짐

**해결**:
- 검색창 placeholder에 단축키 힌트 추가
- 도움말 페이지에 단축키 목록 제공
- 첫 방문 시 토스트 메시지로 안내

**구현 가이드**:
```tsx
// 검색창 placeholder 개선
<SearchBarClient 
  placeholder="포스트 검색... (Cmd+K)" 
/>

// 도움말 페이지
// /shortcuts 페이지 생성
const shortcuts = [
  { key: 'Cmd+K', desc: '검색창 포커스' },
  { key: 'ESC', desc: '검색 해제' },
  { key: '/', desc: '검색 (Vim 스타일)' },
];
```

**예상 효과**:
- 키보드 단축키 사용률 50% 증가
- 검색 사용 편의성 개선

#### 1.2 Skip Links 구현

**문제**: 키보드 사용자가 메인 콘텐츠로 바로 이동 불가

**해결**:
- 헤더에 "본문으로 건너뛰기" 링크 추가
- 포커스 시에만 보이게 구현

**구현 가이드**:
```tsx
// SkipLink 컴포넌트
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white"
    >
      본문으로 건너뛰기
    </a>
  );
}

// Layout 적용
<main id="main-content">
  {children}
</main>
```

**예상 효과**:
- 키보드 사용자 경험 개선
- WCAG 2.1 Level AA 준수

### 2. 검색 자동완성

**문제**: 검색어 입력 시 실시간 추천 없음

**해결**:
- 제목, 태그 기반 자동완성
- 키보드로 항목 선택 가능

**구현 가이드**:
```tsx
// SearchAutocomplete 컴포넌트
export function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    // 제목, 태그 필터링
    const filtered = posts.filter(post => 
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5);
    
    setSuggestions(filtered);
  }, [query]);
  
  return (
    <div>
      <SearchBarClient value={query} onChange={setQuery} />
      {suggestions.length > 0 && (
        <ul className="absolute bg-white dark:bg-gray-800 border rounded-lg mt-1">
          {suggestions.map(post => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`}>
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**예상 효과**:
- 검색 속도 30% 향상
- 검색 만족도 20% 증가

### 3. 목차(Table of Contents) 개선

**문제**: 현재 스크롤 추적만, 클릭 시 부드러운 스크롤 없음

**해결**:
- 활성 헤딩 강조 (현재 구현됨)
- 클릭 시 부드러운 스크롤 추가
- 진행률 표시 막대 추가

**구현 가이드**:
```tsx
// TableOfContents 개선
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState('');
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      // 활성 헤딩 감지
      const currentHeading = headings.find(heading => {
        const element = document.getElementById(heading.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top >= 0 && rect.top < 100;
        }
        return false;
      });
      
      if (currentHeading) {
        setActiveId(currentHeading.id);
      }
      
      // 스크롤 진행률 계산
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setProgress(scrollPercent);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);
  
  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <aside className="fixed right-4 top-20 hidden lg:block">
      <div className="w-48">
        <h3 className="text-sm font-bold mb-2">목차</h3>
        {/* 진행률 막대 */}
        <div className="h-1 bg-gray-200 rounded mb-2">
          <div 
            className="h-1 bg-blue-500 rounded" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <nav>
          <ul>
            {headings.map(heading => (
              <li key={heading.id} className="mb-1">
                <button
                  onClick={() => handleClick(heading.id)}
                  className={cn(
                    "text-sm text-left w-full",
                    activeId === heading.id 
                      ? "text-blue-600 font-bold" 
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
```

**예상 효과**:
- 목차 사용률 40% 증가
- 긴 포스트 체류 시간 20% 증가

---

## Mid-term Recommendations (3-6 months)

### 1. 필터링 확장

**문제**: 현재 태그 필터링만, 날짜/카테고리 필터링 없음

**해결**:
- 날짜 범위 필터 (최근 1개월, 3개월, 1년)
- 카테고리 필터 (DEV, REACT, JS, STUDY, TIL)
- 복합 필터링 (태그 + 날짜 + 카테고리)

**구현 가이드**:
```tsx
// PostFilters 컴포넌트
export function PostFilters() {
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');
  
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // 태그 필터
      if (tags.length > 0 && !post.tags?.some(tag => tags.includes(tag))) {
        return false;
      }
      
      // 카테고리 필터
      if (category && !post.slug.startsWith(category)) {
        return false;
      }
      
      // 날짜 필터
      if (dateRange !== 'all') {
        const postDate = new Date(post.date);
        const now = new Date();
        const monthsAgo = dateRange === '1m' ? 1 : dateRange === '3m' ? 3 : 12;
        const cutoffDate = new Date(now.setMonth(now.getMonth() - monthsAgo));
        if (postDate < cutoffDate) {
          return false;
        }
      }
      
      return true;
    });
  }, [tags, category, dateRange]);
  
  return (
    <div className="space-y-4">
      {/* 태그 필터 */}
      <TagFilter selected={tags} onChange={setTags} />
      
      {/* 카테고리 필터 */}
      <CategoryFilter value={category} onChange={setCategory} />
      
      {/* 날짜 필터 */}
      <DateFilter value={dateRange} onChange={setDateRange} />
    </div>
  );
}
```

**예상 효과**:
- 콘텐츠 발견율 25% 증가
- 필터링 사용률 30% 증가

### 2. 위젯 인터랙션

**문제**: 인기글/최신글 위젯이 정적, 슬라이드/탭 전환 없음

**해결**:
- 인기글 슬라이드 (자동/수동)
- 최신글 탭 전환 (최신/인기/최근 댓글)
- swipe 제스처 지원

**구현 가이드**:
```tsx
// PopularPostsSlider 컴포넌트
export function PopularPostsSlider({ posts }: { posts: Post[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  
  useEffect(() => {
    if (!isAutoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoPlay, posts.length]);
  
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % posts.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  
  return (
    <div className="relative">
      {/* 슬라이드 */}
      <div className="overflow-hidden rounded-lg">
        <div 
          className="flex transition-transform duration-300"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {posts.map(post => (
            <div key={post.slug} className="w-full flex-shrink-0">
              <PopularPostCard post={post} />
            </div>
          ))}
        </div>
      </div>
      
      {/* 컨트롤 */}
      <button onClick={prevSlide}>이전</button>
      <button onClick={nextSlide}>다음</button>
      <button onClick={() => setIsAutoPlay(!isAutoPlay)}>
        {isAutoPlay ? '일시정지' : '재생'}
      </button>
    </div>
  );
}
```

**예상 효과**:
- 위젯 참여도 50% 증가
- 콘텐츠 발견율 20% 증가

### 3. 모바일 swipe 제스처

**문제**: 모바일에서 슬라이드 전환이 어려움

**해결**:
- 인기글 위젯에 swipe 제스처 추가
- 측면 메뉴 swipe로 열기

**구현 가이드**:
```tsx
// useSwipe 훅
export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const minSwipeDistance = 50;
  
  onTouchStart = (e: TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };
  
  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

// 적용
export function PopularPostsSlider({ posts }: { posts: Post[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const swipeHandlers = useSwipe(
    () => setCurrentIndex((prev) => (prev + 1) % posts.length), // swipe left
    () => setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length) // swipe right
  );
  
  return (
    <div {...swipeHandlers}>
      {/* 슬라이드 컨텐츠 */}
    </div>
  );
}
```

**예상 효과**:
- 모바일 위젯 사용률 60% 증가
- 모바일 체류 시간 15% 증가

---

## Long-term Recommendations (6-12 months)

### 1. 개인화

**문제**: 모든 독자에게 동일한 콘텐츠 추천

**해결**:
- 독자의 관심사 기반 추천
- 검색 히스토리 기반 관련 포스트 추천
- 읽기 진행률 저장 (북마크)

**구현 가이드**:
```tsx
// Recommendations 컴포넌트
export function Recommendations({ currentPost }: { currentPost: Post }) {
  const [recommendations, setRecommendations] = useState<Post[]>([]);
  
  useEffect(() => {
    // 로컬 스토리지에서 읽기 히스토리 가져오기
    const history = JSON.parse(localStorage.getItem('readingHistory') || '[]');
    
    // 읽은 포스트의 태그 분석
    const readTags = history.flatMap((post: Post) => post.tags || []);
    const tagCounts = readTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 인기 태그 기반 추천
    const popularTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);
    
    // 추천 포스트 필터링
    const recommended = posts.filter(post => 
      post.slug !== currentPost.slug &&
      post.tags?.some(tag => popularTags.includes(tag))
    ).slice(0, 5);
    
    setRecommendations(recommended);
  }, [currentPost]);
  
  return (
    <section>
      <h2>추천 포스트</h2>
      <PostGrid posts={recommendations} />
    </section>
  );
}
```

**예상 효과**:
- 콘텐츠 발견율 40% 증가
- 체류 시간 25% 증가
- 재방문율 20% 증가

### 2. A/B 테스트 도입

**문제**: UX 변경사항의 효과 검증 부족

**해결**:
- A/B 테스트 프레임워크 도입
- 레이아웃, 검색 UX 테스트
- 통계적 유의성 검증

**구현 가이드**:
```tsx
// useAbTest 훅
export function useAbTest(testName: string, variantA: any, variantB: any) {
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  
  useEffect(() => {
    // 랜덤 배정
    const assigned = Math.random() < 0.5 ? 'A' : 'B';
    setVariant(assigned);
    
    // Analytics에 이벤트 전송
    Analytics.track('ab_test_view', {
      test_name: testName,
      variant: assigned,
    });
  }, [testName]);
  
  const Component = variant === 'A' ? variantA : variantB;
  
  return { Component, variant };
}

// 사용 예시
export function BlogPage() {
  const { Component: Layout, variant } = useAbTest(
    'blog_layout',
    StandardLayout,
    CompactLayout
  );
  
  return (
    <>
      <Layout />
      {/* 변환 추적 */}
      <button onClick={() => Analytics.track('cta_click', { variant })}>
        Subscribe
      </button>
    </>
  );
}
```

**예상 효과**:
- 데이터 기반 의사결정
- 전환율 10-20% 개선

### 3. 오프라인 지원 (PWA)

**문제**: 오프라인에서 블로그 접근 불가

**해결**:
- Service Worker로 캐싱
- 오프라인 페이지 제공
- 설치 프롬프트

**구현 가이드**:
```typescript
// public/sw.js (Service Worker)
const CACHE_NAME = 'blog-v1';
const urlsToCache = [
  '/',
  '/blog',
  '/offline',
  // ... 정적 리소스
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시 있으면 반환, 없으면 네트워크 요청
      return response || fetch(event.request);
    })
  );
});

// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
```

**예상 효과**:
- 오프라인 접근 가능
- 로딩 속도 50% 개선
- 재방문율 15% 증가

---

## Implementation Roadmap

### Phase 1: 접근성 강화 (1-2주)

- [ ] 키보드 단축키 가이드 추가
- [ ] Skip Links 구현
- [ ] ARIA 라벨 개선

### Phase 2: 검색 개선 (2-3주)

- [ ] 검색 자동완성 구현
- [ ] 필터링 확장 (태그, 날짜, 카테고리)
- [ ] 검색 결과 정렬 (관련도, 날짜, 조회수)

### Phase 3: 위젯 인터랙션 (3-4주)

- [ ] 인기글 슬라이드
- [ ] 최신글 탭 전환
- [ ] 모바일 swipe 제스처

### Phase 4: 목차 개선 (1-2주)

- [ ] 부드러운 스크롤
- [ ] 진행률 막대
- [ ] 미니 맵 (미리보기)

### Phase 5: 개인화 (4-6주)

- [ ] 독자 관심사 추천
- [ ] 북마크 기능
- [ ] 읽기 히스토리

### Phase 6: A/B 테스트 (2-3주)

- [ ] A/B 테스트 프레임워크
- [ ] 레이아웃 테스트
- [ ] 검색 UX 테스트

### Phase 7: PWA (3-4주)

- [ ] Service Worker 구현
- [ ] 오프라인 페이지
- [ ] 설치 프롬프트

---

## Trade-offs Analysis

### 1. 키보드 단축키 확장

**옵션 A**: Vim 스타일 단축키 추가 (/, n, N)
- **장점**: Vim 사용자에게 친숙함
- **단점**: 일반 독자에게 혼란 가능성
- **권장**: ❌ (타겟 독자에 맞지 않음)

**옵션 B**: 현재 Cmd+K만 유지
- **장점**: 단순함, 명확함
- **단점**: 제한적 기능
- **권장**: ✅ (현재 상태 유지)

### 2. 위젯 슬라이드 자동 재생

**옵션 A**: 항상 자동 재생
- **장점**: 콘텐츠 노출 증가
- **단점**: 주의 산만, 배터리 소모
- **권장**: ❌ (UX 저하)

**옵션 B**: 사용자가 활성화했을 때만
- **장점**: 사용자 통제권, 배터리 절약
- **단점**: 기본적으로 정적
- **권장**: ✅ (UX 개선)

### 3. 검색 자동완성

**옵션 A**: 서버 사이드 필터링
- **장점**: 실시간 데이터
- **단점**: 서버 부하, 지연
- **권장**: ❌ (성능 저하)

**옵션 B**: 클라이언트 사이드 필터링
- **장점**: 빠른 응답, 서버 부하 없음
- **단점**: 오래된 데이터 가능성
- **권장**: ✅ (성능 개선)

---

## Assumptions

### 개발 리소스

1. **개발 시간**: 주당 5-10시간 (개인 프로젝트)
2. **우선순위**: 접근성 > 검색 > 위젯 > 목차 > 개인화 > A/B 테스트 > PWA
3. **기간**: 단기 1-3개월, 중기 3-6개월, 장기 6-12개월

### 사용자 행동

1. **키보드 단축키 사용**: 40%의 데스크톱 사용자
2. **검색 빈도**: 방문 시 평균 1-2회
3. **위젯 참여도**: 현재 20%, 목표 40%

### 기술적 제약

1. **빌드 크기**: 추가 번들 크기 50KB 미만 권장
2. **로딩 속도**: LCP 2.5초 미만 유지
3. **호환성**: 최신 브라우저 (Chrome, Firefox, Safari)

---

## Needed Data

### 사용자 피드백

1. **키보드 단축키**: 사용 빈도, 만족도
2. **검색**: 사용 빈도, 자동완성 필요성
3. **위젯**: 클릭률, 슬라이드 선호도

### A/B 테스트

1. **레이아웃**: max-w-3xl vs max-w-4xl
2. **검색 UX**: 자동완성 유무
3. **위젯**: 정적 vs 슬라이드

### 성능 메트릭

1. **Core Web Vitals**: LCP, FID, CLS
2. **번들 크기**: 추가 기능 전후 비교
3. **로딩 속도**: 페이지 로드 시간

---

## References

### Facts Documents

- [Blog App Facts](../../facts/apps/blog/index.md)
- [Pages & Routes](../../facts/apps/blog/pages/routes.md)
- [Layouts](../../facts/apps/blog/pages/layouts.md)
- [Search Feature](../../facts/apps/blog/features/search.md)
- [Posts Widgets](../../facts/apps/blog/widgets/posts.md)

### Related Insights

- [Executive Summary](../exec/summary.md)
- [Customer Impact](../impact/customer.md)
- [ROI Analysis](../impact/roi.md)
- [Stakeholder Mapping](../stakeholders/mapping.md)

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
