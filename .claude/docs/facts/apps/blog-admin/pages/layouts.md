# Pages Layouts

- **Scope**: 앱 라우터 레이아웃 구조 및 공통 UI
- **Source of Truth**: Next.js App Router layout.tsx 파일
- **Last Verified**: 2025-12-22
- **Repo Ref**: 2c541823391c87ad23934193eddd21e2335f0b09

## 루트 레이아웃

### App Layout

- **Location**: `src/app/layout.tsx` (L18-L53)
- **Purpose**: 애플리케이션 전체 레이아웃 설정 및 글로벌 상태 관리
- **Key Details**:
  - HTML lang="ko" 설정으로 한국어 지원
  - 테마 초기화 스크립트로 SSR/CSR 간의 깜빡임 방지
  - OverlayProvider로 오버레이 상태 관리
  - NuqsAdapter로 URL 상태 동기화
  - QueryProvider로 TanStack Query 클라이언트 제공
  - antialiased 적용으로 폰트 렌더링 최적화
- **Dependencies**:
  - overlay-kit: 오버레이 UI 상태 관리
  - nuqs/adapters/next/app: URL 상태 관리
  - @tanstack/react-query: 서버 상태 관리
- **Evidence**:
  - `src/app/layout.tsx`: <html lang="ko">, 테마 초기화 스크립트, Provider 중첩 구조

## 대시보드 레이아웃

### Dashboard Layout

- **Location**: `src/app/dashboard/layout.tsx` (L5-L27)
- **Purpose**: 인증된 사용자를 위한 관리자 대시보드 공통 레이아웃
- **Key Details**:
  - 세션 인증 여부에 따른 조건부 렌더링
  - 전체 화면 너비 활용 (max-width 제한 없음)
  - DashboardNav 헤더와 내비게이션 포함
  - 반응형 패딩: px-4 sm:px-6 lg:px-8
  - Toaster 컴포넌트로 알림 처리
  - 다크 모드 배경색 지원
- **Dependencies**:
  - auth: NextAuth.js 세션 인증
  - DashboardNav: 대시보드 내비게이션 컴포넌트
  - @shared/ui/toaster: 알림 컴포넌트
- **Evidence**:
  - `src/app/dashboard/layout.tsx`: auth() 호출, 조건부 렌더링, min-h-screen bg-slate-50 dark:bg-slate-900

## 내비게이션 컴포넌트

### DashboardNav

- **Location**: `src/app/dashboard/dashboard-nav.tsx` (L8-L120)
- **Purpose**: 대시보드 헤더 및 탭 내비게이션 제공
- **Key Details**:
  - 두 단계 구조: 헤더 + 내비게이션 탭
  - 다크 모드 토글 기능 (localStorage 저장)
  - 로그아웃 기능 내장
  - 5개 주요 섹션: 새 글 작성, 파일 관리, 파일 업로드, 업로드 이력, 설정
  - 동적인 활성 탭 감지 (files 섹션은 서브라우트 포함)
  - 반응형 디자인 (px-4 sm:px-6 lg:px-8)
  - 아이콘과 텍스트 조합의 직관적인 UI
- **Dependencies**:
  - lucide-react: 아이콘 라이브러리
  - next/navigation: 라우팅 훅
  - ./actions: 로그아웃 액션
- **Evidence**:
  - `src/app/dashboard/dashboard-nav.tsx`: header와 nav 분리, toggleDarkMode 함수, tabs 배열, isActive 조건부 로직

## 레이아웃 특징

### 디자인 원칙

- **Location**: `src/app/dashboard/layout.tsx` (L19-L23)
- **Purpose**: 관리자 UI 설계 방향성 정의
- **Key Details**:
  - 최대 화면 활용을 위한 너비 제한 없음
  - 일관된 수평 간격: px-4 sm:px-6 lg:px-8
  - 수직 간격: py-8 (컨텐츠 영역)
  - 배경색 계층: slate-50 (라이트) / slate-900 (다크)
  - 경계선으로 시각적 구분
- **Dependencies**: Tailwind CSS classes
- **Evidence**:
  - `src/app/dashboard/layout.tsx`: max-width 클래스 없음, 일관된 패딩 적용

### QueryProvider 설정

- **Location**: `src/shared/lib/react-query/query-provider.tsx` (L6-L26)
- **Purpose**: TanStack Query 글로벌 설정
- **Key Details**:
  - 5분 staleTime으로 데이터 신선도 유지
  - 30분 gcTime으로 언마운트 후에도 캐시 보존
  - 에러 시 1회 재시도
  - 윈도우 포커스 시 자동 refetch 비활성화
- **Dependencies**: @tanstack/react-query
- **Evidence**:
  - `src/shared/lib/react-query/query-provider.tsx`: QueryClient 설정 객체

### 테마 초기화

- **Location**: `src/app/layout.tsx` (L26-L38)
- **Purpose**: SSR/CSR 간의 테마 깜빡임 방지
- **Key Details**:
  - 스크립트 태그로 HTML 파싱 단계에서 실행
  - localStorage 테마 설정 확인
  - 시스템 선호 다크 모드 감지
  - 조건부 dark 클래스 추가
- **Dependencies**: 없음 (순수 JavaScript)
- **Evidence**:
  - `src/app/layout.tsx`: dangerouslySetInnerHTML 내의 테마 초기화 스크립트