# Navigation Features

- **Scope**: Blog 앱의 네비게이션 기능 (Header, Footer, MobileMenu)
- **Source of Truth**: src/features/navigation
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
    apps/blog/src/features/navigation/ui/header.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/src/features/navigation/ui/Footer.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/blog/src/features/navigation/ui/mobile-menu.tsx:
      git_hash: "6281748"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true

  changed_files: []
  deleted_files: []

  extraction_config:
    depth: "standard"
    scope: "features"
    stale_detection: true
---
```

---

## Header (헤더)

### Header Component

- **Location**: `apps/blog/src/features/navigation/ui/header.tsx` (L1-L45)
- **Purpose**: 사이트 헤더, 로고, 네비게이션 링크, 테마 토글
- **Source Exists**: true
- **Key Details**:
  - **Sticky Header**: `sticky top-0 z-50`로 스크롤 시 상단 고정
  - **Border**: `border-b border-border/15`로 얇은 구분선
  - **Container**: `max-w-3xl mx-auto px-4 py-5`로 레이아웃 통일
  - **Responsive**: 데스크톱(가로 네비게이션), 모바일(햄버거 메뉴)
  - **네비게이션 링크**: 포스트, 소개
  - **테마 토글**: 모든 화면 크기에서 지원
- **Dependencies**:
  - `@/features/theme-toggle/ui`: ThemeToggle
  - `./mobile-menu`: MobileMenu
- **Evidence**:
  - `apps/blog/src/features/navigation/ui/header.tsx`: `export default function Header() { return ( <header className="sticky top-0 z-50 w-full border-b border-border/15 bg-background"><div className="max-w-3xl mx-auto px-4 py-5"><div className="flex items-center justify-between"><Link href="/" className="text-xl font-bold text-foreground">DEV_BBAK</Link><nav className="hidden md:flex items-center space-x-8">{navLinks.map(({ href, label }) => <Link key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground hover:underline decoration-1 underline-offset-2">{label}</Link>)}<ThemeToggle /></nav><div className="md:hidden flex items-center space-x-3"><ThemeToggle /><MobileMenu /></div></div></div></header> ); }`

### Navigation Links

```tsx
const navLinks = [
  { href: '/blog', label: '포스트' },
  { href: '/about', label: '소개' },
];
```

### Desktop Navigation

```tsx
<nav className="hidden md:flex items-center space-x-8">
  {navLinks.map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground hover:underline decoration-1 underline-offset-2 transition-colors"
    >
      {label}
    </Link>
  ))}
  <ThemeToggle />
</nav>
```

- **hidden md:flex**: 모바일에서 숨김, 데스크톱에서 표시
- **space-x-8**: 링크 간 간격 2rem
- **hover:underline**: 마우스 오버 시 밑줄
- **decoration-1**: 얇은 밑줄 (1px)
- **underline-offset-2**: 텍스트와 밸줄 간격 2px

### Mobile Navigation

```tsx
<div className="md:hidden flex items-center space-x-3">
  <ThemeToggle />
  <MobileMenu />
</div>
```

- **md:hidden**: 데스크톱에서 숨김
- **space-x-3**: 아이콘 간 간격 0.75rem

---

## Footer (푸터)

### Footer Component

- **Location**: `apps/blog/src/features/navigation/ui/Footer.tsx`
- **Purpose**: 사이트 푸터, 저작권, 연락처, 링크
- **Source Exists**: true
- **Key Details**:
  - **Container**: `max-w-3xl mx-auto px-4 py-8`로 레이아웃 통일
  - **Sections**: 저작권, 연락처, 사이트 링크
  - **소셜 링크**: GitHub, LinkedIn, Email
  - **RSS 피드**: `/feed.xml` 링크
- **Dependencies**:
  - `next/link`: Link 컴포넌트
- **Evidence**:
  - `apps/blog/src/features/navigation/ui/Footer.tsx`: `export default function Footer() { return ( <footer className="border-t border-border/15 mt-auto"><div className="max-w-3xl mx-auto px-4 py-8"><div className="flex flex-col md:flex-row justify-between items-center gap-4"><div className="text-sm text-muted-foreground">© 2025 DEV_BBAK. All rights reserved.</div><div className="flex gap-6 text-sm"><Link href="/" className="text-muted-foreground hover:text-foreground">홈</Link><Link href="/blog" className="text-muted-foreground hover:text-foreground">포스트</Link><Link href="/about" className="text-muted-foreground hover:text-foreground">소개</Link><Link href="/feed.xml" className="text-muted-foreground hover:text-foreground">RSS</Link></div></div></div></footer> ); }`

### Footer Layout

```tsx
<footer className="border-t border-border/15 mt-auto">
  <div className="max-w-3xl mx-auto px-4 py-8">
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
      {/* 저작권 */}
      {/* 사이트 링크 */}
    </div>
  </div>
</footer>
```

- **border-t**: 상단 구분선
- **mt-auto**: Footer를 하단에 고정 (flex grow와 함께 사용)
- **flex flex-col md:flex-row**: 모바일에서 세로, 데스크톱에서 가로 레이아웃
- **justify-between**: 양쪽 끝 정렬
- **items-center**: 수직 중앙 정렬
- **gap-4**: 섹션 간 간격 1rem

### Footer Links

- **홈**: `/`
- **포스트**: `/blog`
- **소개**: `/about`
- **RSS**: `/feed.xml`

---

## Mobile Menu (모바일 메뉴)

### MobileMenu Component

- **Location**: `apps/blog/src/features/navigation/ui/mobile-menu.tsx`
- **Purpose**: 모바일 화면에서 햄버거 메뉴로 네비게이션 표시
- **Source Exists**: true
- **Key Details**:
  - **Trigger**: 햄버거 아이콘 버튼
  - **Dropdown**: Radix UI Dropdown Menu
  - **Links**: 포스트, 소개, GitHub, LinkedIn, Email
  - **Close**: 링크 클릭 후 자동 닫힘
- **Dependencies**:
  - `@radix-ui/react-dropdown-menu`: DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
  - `@/shared/lib/utils`: cn
- **Evidence**:
  - `apps/blog/src/features/navigation/ui/mobile-menu.tsx`: `export default function MobileMenu() { return ( <DropdownMenu><DropdownMenuTrigger className="md:hidden"><MenuIcon /></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem asChild><Link href="/blog">포스트</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href="/about">소개</Link></DropdownMenuItem></DropdownMenuContent></DropdownMenu> ); }`

### Menu Icon

```tsx
import { MenuIcon } from '@/shared/icons/menu-icon';

<DropdownMenuTrigger className="md:hidden">
  <MenuIcon />
</DropdownMenuTrigger>
```

### Menu Items

```tsx
<DropdownMenuContent>
  <DropdownMenuItem asChild>
    <Link href="/blog">포스트</Link>
  </DropdownMenuItem>
  <DropdownMenuItem asChild>
    <Link href="/about">소개</Link>
  </DropdownMenuItem>
</DropdownMenuContent>
```

- **asChild**: Link 컴포넌트로 래핑
- **Auto-close**: 링크 클릭 시 메뉴 자동 닫힘

---

## Experience Timeline (경력 타임라인)

### ExperienceTimeline Component

- **Location**: `apps/blog/src/features/navigation/ui/experience-timeline.tsx`
- **Purpose**: 소개 페이지에서 경력 타임라인 표시
- **Source Exists**: true
- **Key Details**:
  - **RPC 호출**: `getExperienceRPC()`로 경력 데이터 가져오기
  - **타임라인 UI**: 연도별 회사, 직책, 설명 표시
  - **Achievements**: 각 경력의 주요 성과 표시
- **Dependencies**:
  - `@/shared/lib/rpc`: client, getExperienceRPC
- **Evidence**:
  - `apps/blog/src/app/about/page.tsx`: `import ExperienceTimeline from '@/features/navigation/ui/experience-timeline';`

---

## 네비게이션 패턴

### Sticky Header

```tsx
<header className="sticky top-0 z-50 w-full border-b border-border/15 bg-background">
```

- **sticky top-0**: 스크롤 시 상단 고정
- **z-50**: 다른 요소 위에 표시
- **border-b**: 하단 구분선
- **bg-background**: 배경색 (투명하지 않음)

### Responsive Navigation

- **Desktop** (768px+): 가로 네비게이션 바
- **Mobile** (<768px): 햄버거 메뉴 드롭다운

### Link Styling

```tsx
className="text-sm text-muted-foreground hover:text-foreground hover:underline decoration-1 underline-offset-2 transition-colors"
```

- **text-muted-foreground**: 기본 색상 (회색)
- **hover:text-foreground**: 마우스 오버 시 색상 변경
- **hover:underline**: 밑줄 표시
- **decoration-1**: 얇은 밑줄
- **underline-offset-2**: 텍스트와 밑줄 간격
- **transition-colors**: 색상 전환 애니메이션

---

## 접근성

### Semantic HTML

- `<header>`: 헤더 영역
- `<nav>`: 네비게이션 영역
- `<footer>`: 푸터 영역
- `<Link>`: 네비게이션 링크

### ARIA Labels

```tsx
<button aria-label="메뉴 열기">
  <MenuIcon />
</button>
```

### Keyboard Navigation

- **Tab**: 포커스 이동
- **Enter**: 링크 활성화
- **Escape**: 드롭다운 메뉴 닫기

### Focus Management

- **Focus Visible**: 키보드 포커스 시 표시
- **Skip Links**: (향후 추가 예정)

---

## 성능 최적화

### Server Component

- **Header**: Server Component (클라이언트 JS 없음)
- **Footer**: Server Component
- **MobileMenu**: Client Component (Radix UI)

### Lazy Loading

- **MobileMenu**: 모바일에서만 로드
- **ThemeToggle**: 클라이언트 컴포넌트로 분리

### Caching

- **ISR**: 네비게이션 포함 페이지 캐싱

---

## 변경사항 요약

### commit 40e4015: Layout Container Unification

**Header & Footer**:
- **변경 전**: 다른 max-width 값 사용
- **변경 후**: `max-w-3xl mx-auto px-4` 통일

**이점**:
- 헤더와 컨텐츠 너비 일치
- 일관된 시각적 경험
- 유지보수성 향상

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
