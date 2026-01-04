# 통합 레이아웃 시스템 (Unified Layout System)

- **App**: apps/blog
- **Status**: As-Is (현재 구현)
- **Scope**: 블로그 앱의 모든 페이지에 적용된 통합 컨테이너 패턴 및 레이아웃 계층 구조
- **Based on**:
  - Facts: `../../../facts/apps/blog/pages/layouts.md`
  - Facts: `../../../facts/apps/blog/pages/routes.md`
  - Insights: `../../../insights/apps/blog/impact/customer.md`
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208 (commit 40e4015)

---

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2026-01-04
- **Verification Results**:
  - `../../../facts/apps/blog/pages/layouts.md`: ✅ Verified (source_exists: true)
  - `../../../facts/apps/blog/pages/routes.md`: ✅ Verified (source_exists: true)
  - `../../../insights/apps/blog/impact/customer.md`: ✅ Verified
- **Spec Status**: As-Is (현재 구현됨)

---

## 개요 (Overview)

### 목적

블로그의 모든 페이지에서 일관된 독서 경험을 제공하기 위해 레이아웃 컨테이너 계층 구조를 통일합니다. 페이지 간 이동 시 발생하는 시각적 불일치를 제거하고, 독자가 콘텐츠에 집중할 수 있는 최적의 가독성 환경을 제공합니다.

### 범위

**In-Scope**:
- Root Layout (`apps/blog/src/app/layout.tsx`)의 기본 레이아웃 구조
- 모든 페이지에 적용된 통일 컨테이너 패턴 (`max-w-3xl mx-auto px-4 py-12`)
- Flex Layout 패턴을 통한 Footer 하단 고정
- 반응형 패딩 및 타이포그래피 설정

**Out-of-Scope**:
- 개별 페이지 컴포넌트의 내부 레이아웃 (각 페이지에서 자율적으로 관리)
- 블로그-Admin 앱의 레이아웃 (별도의 full-screen 패턴 사용)

### 비즈니스 가치

**고객 경험 개선**:
- **가독성 향상**: 768px 너비는 웹 가독성 표준 (60-75문자/행)에 부합하여 눈의 피로도 감소
- **인지 부하 감소**: 모든 페이지에서 동일한 컨텐츠 너비와 컨테이너 패턴 사용으로 페이지 간 이동 시 인지적 노력 최소화
- **시각적 안정감**: 변경 전 홈 페이지(max-w-4xl)와 블로그 페이지(max-w-3xl) 간 너비 차이로 인한 레이아웃 변화 제거

**예상 효과**:
- 체류 시간 10-15% 증가 (가독성 개선 효과)
- 이탈률 5-10% 감소 (일관된 경험으로)
- 모바일 체류 시간 15% 증가 (반응형 패딩 px-4 효과)

---

## 핵심 기능 (Core Features)

### 1. 통일 컨테이너 패턴

모든 페이지에서 동일한 컨테이너 스타일을 적용합니다.

**패턴 구성**:
```tsx
<div className="mx-auto max-w-3xl px-4 py-12">
  {children}
</div>
```

**속성 분석**:
- **max-w-3xl**: 최대 너비 768px (48rem) - 웹 가독성에 최적화된 너비
- **mx-auto**: 수평 중앙 정렬
- **px-4**: 좌우 패딩 1rem (16px) - 모바일에서 적절한 여백
- **py-12**: 상하 패딩 3rem (48px) - 세로 여백

**적용 대상**:
- ✅ 홈 페이지 (`/`)
- ✅ 블로그 목록 (`/blog`)
- ✅ 블로그 상세 (`/blog/[...slug]`)
- ✅ 태그 페이지 (`/tags`, `/tags/[tag]`)
- ✅ 시리즈 페이지 (`/series`, `/series/[slug]`)
- ✅ 소개 페이지 (`/about`)

### 2. Flex Layout 패턴

Footer를 화면 하단에 고정하고 컨텐츠가 적을 때도 레이아웃 유지합니다.

**구조**:
```tsx
<div className="min-h-screen flex flex-col">
  <Header />
  <main className="grow">
    <div className="mx-auto max-w-3xl px-4 py-12">
      {children}
    </div>
  </main>
  <Footer />
</div>
```

**동작**:
1. **컨텐츠가 적을 때**: Footer가 화면 하단에 고정 (`min-h-screen` + `flex` + `main className="grow"`)
2. **컨텐츠가 많을 때**: 스크롤 생성, Footer는 컨텐츠 아래에 위치

### 3. 반응형 여백

모바일, 태블릿, 데스크톱에서 최적의 여백을 제공합니다.

**패턴**:
```tsx
<div className="px-4 sm:px-6 lg:px-8">
  {content}
</div>
```

**브레이크포인트**:
- **px-4**: 모바일 (16px)
- **sm:px-6**: 태블릿 640px 이상 (24px)
- **lg:px-8**: 데스크톱 1024px 이상 (32px)

**현재 적용**: Root Layout에서 px-4만 사용 (모든 기기에서 16px)

### 4. 다크모드 지원

시스템 설정을 감지하고 다크모드 전환을 지원합니다.

**ThemeProvider 설정**:
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
>
  {children}
</ThemeProvider>
```

**다크모드 전환**:
- **Class Strategy**: .dark 클래스 추가 시 테마 변경
- **Transition**: 200ms smooth animation
- **색상**: OKLCH 색공간 사용 (일관된 밝기)

### 5. Typography 최적화

가독성을 위한 폰트와 행간 설정입니다.

**폰트**:
- **Geist Sans**: 본문 텍스트 (Google Fonts)
- **Geist Mono**: 코드, 숫자 (Google Fonts)

**행간**:
- **본문**: leading-relaxed (1.625 = 26px)
- **제목**: 행간 줄임 (큰 제목일수록 좁은 간격)

**글자 크기**:
- **본문**: 1.0625rem (17px)
- **제목**: text-2xl (24px) ~ text-6xl (60px)

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

**레이아웃 계층 구조**:
```
Root Layout (apps/blog/src/app/layout.tsx)
  ├── HTML (lang="ko", suppressHydrationWarning)
  ├── Body (Geist Sans + Geist Mono)
  ├── QueryProvider (TanStack Query)
  ├── NuqsAdapter (URL query state)
  ├── ThemeProvider (next-themes)
  ├── Flex Container (min-h-screen flex flex-col)
  │   ├── Header
  │   ├── Main (grow)
  │   │   └── Container (max-w-3xl mx-auto px-4 py-12)
  │   │       └── Page Content
  │   └── Footer
  └── Analytics (Vercel)
```

### 의존성

**Services**:
- Vercel Analytics: `@vercel/analytics/react`

**Packages**:
- `next`: Next.js 15 App Router
- `next/font/google`: Geist, Geist_Mono
- `@tanstack/react-query`: QueryProvider
- `nuqs`: NuqsAdapter (URL query state)
- `next-themes`: ThemeProvider

**Libraries**:
- React 19
- TypeScript 5

**Env Vars**:
- `NEXT_PUBLIC_SITE_URL`: 사이트 URL (메타데이터용)

### 구현 접근

**Root Layout 구현** (`apps/blog/src/app/layout.tsx`):

```typescript
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { QueryProvider } from '@/shared/providers/query-provider';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ThemeProvider } from '@/features/theme-toggle/ui';
import { Header } from '@/features/navigation';
import { Footer } from '@/features/navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <NuqsAdapter>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="grow">
                  <div className="mx-auto max-w-3xl px-4 py-12">
                    {children}
                  </div>
                </main>
                <Footer />
              </div>
            </ThemeProvider>
          </NuqsAdapter>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
```

### 관측/운영 (Observability)

**Vercel Analytics**:
- 페이지 뷰 추적
- Core Web Vitals 모니터링
- 장치별 접근 통계

**TODO**: 성능 모니터링 추가 필요
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

### 실패 모드/대응 (Failure Modes)

**Font Loading 실패**:
- **대응**: `display: 'swap'`으로 폰트 로딩 중 텍스트 표시
- **Fallback**: 시스템 폰트로 대체

**ThemeProvider 실패**:
- **대응**: `defaultTheme="system"`으로 OS 테마 따라감
- **Fallback**: 라이트 모드 기본

**Flex Layout 실패**:
- **대응**: `min-h-screen`로 최소 높이 보장
- **Fallback**: 컨텐츠가 많을 때 스크롤 생성

---

## 데이터 구조 (Data Structure)

관련 데이터 모델 없음 (레이아웃 시스템은 UI 구조만 관리).

---

## API 명세 (API Specifications)

N/A (레이아웃 시스템은 API를 사용하지 않음).

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**1. 블로그 발견 (Discovery)**:
- 사용자가 홈 페이지 진입
- 768px 너비의 통일된 컨테이너로 콘텐츠 표시
- 적절한 여백(px-4 py-12)으로 가독성 확보

**2. 페이지 간 이동**:
- 사용자가 홈 → 블로그 목록 → 블로그 상세 이동
- 모든 페이지에서 동일한 컨테이너 패턴으로 일관된 경험 제공
- 레이아웃 변화 없이 콘텐츠에 집중

**3. 모바일 접근**:
- 사용자가 모바일로 접속
- px-4 패딩으로 좌우 16px 여백 유지
- 768px 너비로 모바일에서도 가독성 확보

**4. 다크모드 전환**:
- 사용자가 테마 토글 버튼 클릭
- 200ms smooth transition으로 부드러운 전환
- 모든 페이지에서 동일한 다크모드 적용

**5. Footer 하단 고정**:
- 사용자가 콘텐츠가 적은 페이지 방문
- Footer가 화면 하단에 고정되어 표시
- 콘텐츠가 많을 때는 스크롤 생성 후 Footer 표시

### 실패/예외 시나리오

**1. 폰트 로딩 지연**:
- 네트워크 지연으로 폰트 로딩 실패
- `display: 'swap'`으로 시스템 폰트로 즉시 텍스트 표시
- 폰트 로딩 완료 후 Geist 폰트로 교체

**2. 아주 긴 제목**:
- 제목이 768px 너비를 초과
- 텍스트 줄바꿈으로 컨테이너 너비 유지
- 가로 스크롤 방지

**3. 아주 큰 이미지**:
- 이미지가 768px 너비를 초과
- `w-full`로 컨테이너 너비에 맞춤
- `h-auto`로 원본 비율 유지

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

- **CSP**: `suppressHydrationWarning`으로 서버/클라이언트 hydration 불일치 허용
- **Font Loading**: Google Fonts에서 외부 리소스 로딩 (HTTPS 사용)

### 성능

**Font Loading**:
- `display: 'swap'`: 폰트 로딩 중 텍스트 표시
- `subsets: ['latin']`: 필요한 문자셋만 로딩

**CSS Transitions**:
- 200ms duration: 빠르지만 자연스러운 전환
- `ease-in-out`: 부드러운 가속/감속
- GPU 가속: transform, opacity 사용 시

**Layout Stability**:
- `min-h-screen`: 레이아웃 시프트 방지
- 고정 컨테이너 너비: CLS 감소

### 배포

- **Build Time**: 정적 생성으로 빌드 시 HTML 생성
- **ISR**: 60초 재검증으로 최신 상태 유지
- **CDN**: Vercel Edge Network에서 전역 캐싱

### 롤백

- **Git Revert**: commit 40e4015 이전으로 되돌리기
- **영향 범위**: 모든 페이지의 컨테이너 패턴
- **롤백 시간**: 5분 이내 (Vercel 자동 배포)

### 호환성/마이그레이션

**Browser Support**:
- Chrome/Edge: 최신 2 버전
- Firefox: 최신 2 버전
- Safari: 최신 2 버전
- Mobile: iOS Safari 14+, Chrome Mobile

**Responsive Breakpoints**:
- sm: 640px (모바일)
- md: 768px (태블릿)
- lg: 1024px (데스크톱)
- xl: 1280px (와이드 데스크톱)

---

## 향후 확장 가능성 (Future Expansion)

### 1. 반응형 컨테이너 너비

**현재**: 모든 기기에서 max-w-3xl (768px)
**개선안**: 데스크톱에서 max-w-4xl (896px)로 확장

```tsx
<div className="mx-auto max-w-3xl md:max-w-4xl px-4 py-12">
  {children}
</div>
```

**이점**: 와이드 모니터에서 더 넓은 컨텐츠 영역
**고려사항**: 가독성 저하 위험 (줄 길이 75문자 초과)

### 2. 가변 컨테이너 너비

**아이디어**: 사용자 설정으로 컨텐츠 너비 조정

```tsx
<div className={`mx-auto ${userWidthPreference} px-4 py-12`}>
  {children}
</div>
```

**옵션**:
- 좁음: max-w-2xl (672px)
- 보통: max-w-3xl (768px) - 기본
- 넓음: max-w-4xl (896px)

### 3. 다크모드 전환 애니메이션 개선

**현재**: 200ms smooth transition
**개선안**: 페이지 전환 시 다크모드 유지

```typescript
// useEffect로 테마 전환 시 스크롤 위치 유지
useEffect(() => {
  const scrollY = window.scrollY;
  // 테마 전환
  window.scrollTo(0, scrollY);
}, [theme]);
```

### 4. 접근성 향상

**Reduced Motion 지원**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

**High Contrast Mode 지원**:
```css
@media (prefers-contrast: high) {
  /* 고대비 색상 */
}
```

### 5. 다국어 지원 (i18n)

**현재**: lang="ko"로 한국어만 지원
**개선안**: next-intl로 다국어 지원

```tsx
<html lang={locale} suppressHydrationWarning>
```

**지원 언어**:
- 한국어 (ko)
- 영어 (en)

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD: 사용자 행동 데이터

**질문**: 768px 너비가 실제 독자에게 최적인가?
- **데이터 필요**:
  - 페이지별 체류 시간 (너비별 비교)
  - 스크롤 깊이 (컨텐츠 소비율)
  - 디바이스별 접속 비율

**오너**: TBD (블로그 운영자)
**기한**: TBD (성과 측정 후 3개월 이내)

### TBD: 반응형 너비 테스트

**질문**: 데스크톱에서 896px (max-w-4xl)로 확장 시 가독성 저하가 있는가?
- **데이터 필요**:
  - A/B 테스트 (768px vs 896px)
  - 독자 피드백 (댓글, 뉴스레터)
  - Core Web Vitals (CLS, LCP)

**오너**: TBD (블로그 운영자)
**기한**: TBD (설정 기능 구현 전)

---

## 참고 문헌 (References)

### Facts Documents

- [Blog App Pages - Layouts](../../../facts/apps/blog/pages/layouts.md)
- [Blog App Pages - Routes](../../../facts/apps/blog/pages/routes.md)
- [Blog App Index](../../../facts/apps/blog/index.md)

### Insights Documents

- [Customer Impact Analysis](../../../insights/apps/blog/impact/customer.md)
- [Executive Summary](../../../insights/apps/blog/exec/summary.md)

### Related Specs

- [Search Keyboard Shortcuts](./search-keyboard-shortcuts.md)
- [MDX Image Aspect Ratio](./mdx-image-aspect-ratio.md)
- [Widgets Refactoring](./widgets-refactoring.md)

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
