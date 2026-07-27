# BBA크 블로그 백오피스 — 구현 노트

---

## 1. `globals.css` HSL 토큰 블록

### 라이트 모드 (기본)

```css
@layer base {
  :root {
    /* ── Brand: Indigo ── */
    --brand-50: 232 90% 97%;
    --brand-100: 231 85% 93%;
    --brand-200: 232 80% 86%;
    --brand-300: 232 75% 76%;
    --brand-400: 233 70% 64%;
    --brand-500: 234 72% 56%;
    --brand-600: 235 76% 51%;
    --brand-700: 238 80% 46%;
    --brand-800: 241 76% 38%;
    --brand-900: 243 68% 32%;
    --brand-950: 244 76% 20%;

    /* ── Neutral: Slate ── */
    --neutral-50: 220 14% 96%;
    --neutral-100: 220 13% 91%;
    --neutral-200: 218 14% 83%;
    --neutral-300: 218 12% 70%;
    --neutral-400: 219 10% 56%;
    --neutral-500: 219 9% 44%;
    --neutral-600: 220 9% 36%;
    --neutral-700: 220 10% 28%;
    --neutral-800: 222 14% 19%;
    --neutral-900: 222 18% 13%;
    --neutral-950: 224 24% 7%;

    /* ── Semantic ── */
    --success-50: 142 76% 97%;
    --success-500: 142 71% 45%;
    --success-600: 142 76% 36%;
    --success-700: 142 80% 28%;

    --warning-50: 38 92% 95%;
    --warning-500: 38 92% 50%;
    --warning-600: 32 95% 44%;
    --warning-700: 26 90% 37%;

    --error-50: 0 86% 97%;
    --error-500: 0 84% 60%;
    --error-600: 0 72% 51%;
    --error-700: 0 74% 42%;

    --info-50: 210 100% 97%;
    --info-500: 210 100% 56%;
    --info-600: 210 100% 46%;
    --info-700: 210 100% 36%;

    /* ── Surface ── */
    --bg: 214 20% 98%;
    --bg-card: 0 0% 100%;
    --bg-elevated: 0 0% 100%;
    --bg-inset: 214 18% 95%;
    --fg: 222 20% 14%;
    --fg-muted: 219 12% 46%;
    --fg-subtle: 218 12% 60%;
    --border: 218 14% 83%;
    --border-subtle: 220 14% 91%;
    --ring: 235 76% 51%;

    /* ── shadcn/ui mapping ── */
    --background: 214 20% 98%;
    --foreground: 222 20% 14%;
    --card: 0 0% 100%;
    --card-foreground: 222 20% 14%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 20% 14%;
    --primary: 235 76% 51%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 96%;
    --secondary-foreground: 222 20% 14%;
    --muted: 220 14% 96%;
    --muted-foreground: 219 9% 44%;
    --accent: 231 85% 93%;
    --accent-foreground: 238 80% 46%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 218 14% 83%;
    --input: 218 14% 83%;
    --ring: 235 76% 51%;
    --chart-1: 235 76% 51%;
    --chart-2: 142 71% 45%;
    --chart-3: 38 92% 50%;
    --chart-4: 210 100% 56%;
    --chart-5: 324 78% 58%;
    --sidebar-background: 222 24% 7%;
    --sidebar-foreground: 220 14% 96%;
    --sidebar-primary: 235 76% 51%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 224 18% 14%;
    --sidebar-accent-foreground: 220 14% 96%;
    --sidebar-border: 224 14% 14%;
    --sidebar-ring: 235 76% 51%;

    --radius: 0.5rem;

    /* ── Chart (Design System page) ── */
    --chart-brand: 235 76% 51%;
    --chart-success: 142 71% 45%;
    --chart-warning: 38 92% 50%;
    --chart-error: 0 84% 60%;
  }
}
```

### 다크 모드

```css
@layer base {
  .dark {
    /* ── Surface (override) ── */
    --bg: 224 24% 7%;
    --bg-card: 224 18% 13%;
    --bg-elevated: 222 14% 19%;
    --bg-inset: 224 24% 5%;
    --fg: 220 14% 96%;
    --fg-muted: 219 12% 56%;
    --fg-subtle: 218 12% 46%;
    --border: 224 14% 19%;
    --border-subtle: 224 14% 14%;
    --ring: 235 76% 51%;

    /* ── shadcn/ui mapping (dark override) ── */
    --background: 224 24% 7%;
    --foreground: 220 14% 96%;
    --card: 224 18% 13%;
    --card-foreground: 220 14% 96%;
    --popover: 224 18% 13%;
    --popover-foreground: 220 14% 96%;
    --primary: 235 76% 51%;
    --primary-foreground: 0 0% 100%;
    --secondary: 224 18% 16%;
    --secondary-foreground: 220 14% 96%;
    --muted: 224 18% 16%;
    --muted-foreground: 219 9% 56%;
    --accent: 243 68% 32%;
    --accent-foreground: 232 85% 93%;
    --destructive: 0 62% 50%;
    --destructive-foreground: 0 0% 100%;
    --border: 224 14% 19%;
    --input: 224 14% 19%;
    --ring: 235 76% 51%;
    --sidebar-background: 224 24% 7%;
    --sidebar-foreground: 220 14% 96%;
    --sidebar-primary: 235 76% 51%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 224 18% 14%;
    --sidebar-accent-foreground: 220 14% 96%;
    --sidebar-border: 224 14% 14%;
    --sidebar-ring: 235 76% 51%;
  }
}
```

---

## 2. Tailwind v4 + shadcn 통합 가이드

### 2.1 `tailwind.config.ts` 설정

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard Variable", "Pretendard", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      colors: {
        brand: {
          50: "hsl(var(--brand-50))",
          100: "hsl(var(--brand-100))",
          200: "hsl(var(--brand-200))",
          300: "hsl(var(--brand-300))",
          400: "hsl(var(--brand-400))",
          500: "hsl(var(--brand-500))",
          600: "hsl(var(--brand-600))",
          700: "hsl(var(--brand-700))",
          800: "hsl(var(--brand-800))",
          900: "hsl(var(--brand-900))",
          950: "hsl(var(--brand-950))",
        },
        neutral: {
          50: "hsl(var(--neutral-50))",
          100: "hsl(var(--neutral-100))",
          200: "hsl(var(--neutral-200))",
          300: "hsl(var(--neutral-300))",
          400: "hsl(var(--neutral-400))",
          500: "hsl(var(--neutral-500))",
          600: "hsl(var(--neutral-600))",
          700: "hsl(var(--neutral-700))",
          800: "hsl(var(--neutral-800))",
          900: "hsl(var(--neutral-900))",
          950: "hsl(var(--neutral-950))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### 2.2 shadcn 컴포넌트 토큰 사용법

| Tailwind 클래스 | 토큰 | 용도 |
|---|---|---|
| `bg-background` | `--background` | 페이지 배경 |
| `bg-card` | `--card` | 카드/패널 배경 |
| `text-foreground` | `--foreground` | 기본 텍스트 |
| `text-muted-foreground` | `--muted-foreground` | 보조 텍스트 |
| `border-border` | `--border` | 기본 테두리 |
| `bg-primary text-primary-foreground` | `--primary` | 주요 액션 버튼 |
| `bg-secondary text-secondary-foreground` | `--secondary` | 보조 버튼/배지 |
| `bg-destructive text-destructive-foreground` | `--destructive` | 삭제/에러 액션 |
| `bg-sidebar text-sidebar-foreground` | `--sidebar-background` | 사이드바 배경 |
| `ring-ring` | `--ring` | 포커스 링 |

### 2.3 CSS에서 `globals.css` 임포트 순서

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* 위의 라이트 모드 토큰 전체 */
  }
  .dark {
    /* 위의 다크 모드 토큰 전체 */
  }
}
```

### 2.4 Pretendard Variable 폰트 연결

`layout.tsx`에서:

```tsx
import "pretendard/dist/variable.css";
// 또는 CDN 사용 시:
// <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
```

### 2.5 JetBrains Mono (코드/토큰 페이지용)

```tsx
import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
```

---

## 3. 모바일 UX 문제점 Top 5 + 해결책

### 문제 1: 터치 타겟이 작음

**현재 상태**: 기본 버튼/링크 높이가 32px → 손가락으로 누르기 어려움
**해결책**: 모든 인터랙티브 요소 최소 44px 높이

```tsx
// Before
<Button className="h-8 px-3 text-sm">수정</Button>

// After
<Button className="min-h-[44px] px-4 py-2 text-sm">수정</Button>
```

**적용 대상**: 버튼, 링크, 드롭다운 트리거, 체크박스 라벨, 테이블 행

---

### 문제 2: 모바일에서 테이블이 가로 스크롤됨

**현재 상태**: 데스크톱 테이블 그대로 모바일에 렌더링 → 375px에서 잘림
**해결책**: 모바일 카드 레이아웃 분기

```tsx
<div className="hidden md:block">
  {/* 데스크톱 테이블 */}
</div>
<div className="block md:hidden space-y-3">
  {/* 모바일 카드 */}
</div>
```

**적용 대상**: 포스트 목록, 댓글 관리, 사용자 관리, 파일 목록

---

### 문제 3: 사이드바가 모바일에서 전체 화면을 가림

**현재 상태**: 데스크톱 사이드바가 모바일에서도 240px 고정 → 콘텐츠 영역 135px만 남음
**해결책**: 모바일 하단 탭바 + 슬라이드 사이드바

```tsx
// 모바일: 하단 탭바 (4개 탭)
<nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden">
  <div className="grid grid-cols-4">
    <Tab icon="LayoutDashboard" label="대시보드" />
    <Tab icon="FileText" label="포스트" />
    <Tab icon="FolderOpen" label="파일" />
    <Tab icon="Settings" label="설정" />
  </div>
</nav>

// 데스크톱: 왼쪽 사이드바
<aside className="hidden md:block w-60 bg-sidebar ...">
  {/* 기존 사이드바 */}
</aside>
```

---

### 문제 4: 모바일 헤더가 너무 높음 / 정보 밀도 낮음

**현재 상태**: 모바일 헤더가 64px 차지 + 빈 공간 많음 → 콘텐츠 노출 부족
**해결책**: 컴팩트 헤더 + 빠른 액션 버튼

```tsx
<header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 md:px-6 md:py-4">
  <div className="flex items-center justify-between">
    {/* 왼쪽: 햄버거 메뉴 or 뒤로가기 */}
    <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
      <Menu className="h-5 w-5" />
    </Button>
    
    {/* 가운데: 페이지 제목 */}
    <h1 className="text-sm font-semibold truncate">{pageTitle}</h1>
    
    {/* 오른쪽: 빠른 액션 */}
    <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
      <Bell className="h-5 w-5" />
    </Button>
  </div>
</header>
```

---

### 문제 5: 모바일에서 폼 입력이 불편함

**현재 상태**: 데스크톱 2열 폼 → 모바일에서 입력 필드가 좁고, 키보드가 올라오면 레이아웃이 깨짐
**해결책**: 모바일 전용 단일 열 폼 + `padding-bottom` 확보

```tsx
// 모바일: 단일 열
<form className="space-y-4 px-4 pb-[120px]">
  {/* 키보드 올라와도 하단 탭바 + 여유 */}
  <div className="space-y-2">
    <Label>제목</Label>
    <Input className="min-h-[44px] text-base" />
    {/* text-base로 키보드에서 확대 방지 */}
  </div>
</form>

// 데스크톱: 2열 격자
<form className="grid grid-cols-2 gap-6">
  <div className="space-y-2">
    <Label>제목</Label>
    <Input />
  </div>
</form>
```

**추가 팁**:
- `<Input>`에 `text-base` 클래스 추가 (iOS 기본 확대 방지)
- `<form>`에 `pb-[120px]` 적용 (하단 탭바 + 키보드 높이 확보)
- `autoFocus`로 첫 필드에 포커스

---

## 4. 참고: Lucide 아이콘 사용 예시

```tsx
import { 
  LayoutDashboard, 
  FileText, 
  FolderOpen, 
  Settings,
  Bell,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  MessageSquare,
  Image,
  BarChart3,
  RefreshCw,
  LogOut,
} from "lucide-react";
```

---

## 5. 컬러 시스템 요약

| 시맨틱 | 용도 | 라이트 기본값 | 다크 기본값 |
|---|---|---|---|
| `brand-600` | 주요 액션, 링크, 포커스 | `hsl(235 76% 51%)` | `hsl(235 76% 51%)` |
| `neutral-50`~`950` | 배경, 텍스트, 테두리 | slate 계열 (cool tint) | slate 계열 (cool tint) |
| `success-500` | 완료, 게시됨 | `hsl(142 71% 45%)` | `hsl(142 71% 45%)` |
| `warning-500` | 주의, 검토중 | `hsl(38 92% 50%)` | `hsl(38 92% 50%)` |
| `error-500` | 오류, 삭제 | `hsl(0 84% 60%)` | `hsl(0 62% 50%)` |
| `info-500` | 정보, 임시저장 | `hsl(210 100% 56%)` | `hsl(210 100% 56%)` |

> **주의**: 다크 모드에서는 에러 색상 밝기를 낮추어 `0 62% 50%`로 조정합니다.
