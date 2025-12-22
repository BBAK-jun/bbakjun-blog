# Pages Routes

- **Scope**: 앱 라우터 페이지 구조 및 라우팅 규칙
- **Source of Truth**: Next.js App Router 파일 시스템
- **Last Verified**: 2024-12-22
- **Repo Ref**: 2c541823391c87ad23934193eddd21e2335f0b09

## 루트 페이지

### `/` - 홈페이지

- **Location**: `src/app/page.tsx` (L1-L5)
- **Purpose**: 대시보드로 직접 리디렉션
- **Key Details**:
  - 모든 접속을 /dashboard로 리디렉션
  - 인증 상태와 무관한 단순 리디렉션
- **Dependencies**: Next.js redirect
- **Evidence**:
  - `src/app/page.tsx`: redirect("/dashboard") 호출

### `/login` - 로그인 페이지

- **Location**: `src/app/login/page.tsx` (L1-L15)
- **Purpose**: 인증 상태에 따른 조건부 렌더링
- **Key Details**:
  - 이미 인증된 경우 /dashboard로 리디렉션
  - 미인증 시 LoginForm 컴포넌트 렌더링
- **Dependencies**: NextAuth.js auth(), LoginForm
- **Evidence**:
  - `src/app/login/page.tsx`: 세션 확인 후 조건부 렌더링

### `/unauthorized` - 접근 거부 페이지

- **Location**: `src/app/unauthorized/page.tsx` (L1-L61)
- **Purpose**: 권한이 없는 사용자에게 안내 메시지 표시
- **Key Details**:
  - 슈퍼 관리자만 접근 가능한 페이지임을 안내
  - 현재 사용자 정보(이메일, 역할) 표시
  - 로그아웃 기능 제공
- **Dependencies**: NextAuth.js auth(), signOut()
- **Evidence**:
  - `src/app/unauthorized/page.tsx`: 접근 권한 안내 및 로그아웃 폼

## 대시보드 레이아웃

### `/dashboard/*` 레이아웃

- **Location**: `src/app/dashboard/layout.tsx` (L1-L27)
- **Purpose**: 대시보드 공통 레이아웃 제공
- **Key Details**:
  - 인증되지 않은 경우 레이아웃 없이 children만 렌더링
  - 인증된 경우 DashboardNav와 Toaster 포함
  - 전체 화면 너비 활용 (max-width 제한 없음)
- **Dependencies**: DashboardNav, Toaster, auth()
- **Evidence**:
  - `src/app/dashboard/layout.tsx`: 인증 상태에 따른 조건부 레이아웃

## 대시보드 페이지

### `/dashboard` - 대시보드 메인

- **Location**: `src/app/dashboard/page.tsx` (L1-L35)
- **Purpose**: 사용자 환영 및 기본 정보 표시
- **Key Details**:
  - 사용자 이름/이메일 표시
  - 역할 정보 표시 (배지 형태)
  - 서버 컴포넌트로 구현
- **Dependencies**: NextAuth.js auth()
- **Evidence**:
  - `src/app/dashboard/page.tsx`: 세션 정보 표시

### `/dashboard/create` - 파일 생성 페이지

- **Location**: `src/app/dashboard/create/page.tsx` (L1-L13)
- **Purpose**: 새로운 MDX 파일 생성 인터페이스
- **Key Details**:
  - FileCreatorWidget 위젯 렌더링
  - 클라이언트 컴포넌트
- **Dependencies**: @/widgets/file-creator
- **Evidence**:
  - `src/app/dashboard/create/page.tsx`: FileCreatorWidget 컴포넌트 렌더링

### `/dashboard/files` - 파일 관리 페이지

- **Location**: `src/app/dashboard/files/page.tsx` (L1-L13)
- **Purpose**: 전체 파일 목록 및 관리 인터페이스
- **Key Details**:
  - FileManagerWidget 위젯 렌더링
  - 파일 검색, 필터링, 페이징 기능
  - 클라이언트 컴포넌트
- **Dependencies**: @/widgets/file-manager
- **Evidence**:
  - `src/app/dashboard/files/page.tsx`: FileManagerWidget 컴포넌트 렌더링

### `/dashboard/files/edit` - 파일 편집 페이지

- **Location**: `src/app/dashboard/files/edit/page.tsx` (L1-L424)
- **Purpose**: MDX 파일 편기 및 미리보기
- **Key Details**:
  - 쿼리 파라미터 pathname으로 파일 지정
  - CodeMirror 에디터와 실시간 미리보기
  - 스크롤 동기화 기능
  - 이미지 업로드 기능
  - 태그 입력, 프론트매터 편집
  - 저장되지 않은 변경사항 경고
- **Dependencies**: CodeMirror, useFileEditor, ImageUploader, TagInput
- **Evidence**:
  - `src/app/dashboard/files/edit/page.tsx`: 파일 편집 인터페이스 전체 구현

### `/dashboard/files/view` - 파일 보기 페이지

- **Location**: `src/app/dashboard/files/view/page.tsx` (L1-L17)
- **Purpose**: MDX 파일 내용 및 메타데이터 조회
- **Key Details**:
  - 쿼리 파라미터 pathname으로 파일 지정
  - FileViewerWidget 사용
  - 읽기 전용 뷰 제공
- **Dependencies**: @/widgets/file-viewer
- **Evidence**:
  - `src/app/dashboard/files/view/page.tsx`: FileViewerWidget에 pathname 전달

### `/dashboard/upload` - 파일 업로드 페이지

- **Location**: `src/app/dashboard/upload/page.tsx` (L1-L216)
- **Purpose**: MDX 파일 직접 업로드
- **Key Details**:
  - 파일 드래그앤드롭 업로드
  - 경로, 태그, 상태 지정
  - TanStack Query로 상태 관리
  - 업로드 결과 피드백
- **Dependencies**: @/app/actions/files, TanStack Query
- **Evidence**:
  - `src/app/dashboard/upload/page.tsx`: 파일 업로드 폼 구현

### `/dashboard/history` - 업로드 이력 페이지

- **Location**: `src/app/dashboard/history/page.tsx` (L1-L26)
- **Purpose**: 파일 업로드 및 수정 이력 조회
- **Key Details**:
  - 현재 개발 중인 페이지
  - 안내 메시지만 표시
- **Dependencies**: -
- **Evidence**:
  - `src/app/dashboard/history/page.tsx`: "곧 추가될 예정입니다" 메시지

### `/dashboard/settings` - 설정 페이지

- **Location**: `src/app/dashboard/settings/page.tsx` (L1-L39)
- **Purpose**: 백오피스 설정 관리
- **Key Details**:
  - 환경 정보 표시 (Next.js 16, Vercel Blob 등)
  - 추가 설정 기능 개발 중
- **Dependencies**: -
- **Evidence**:
  - `src/app/dashboard/settings/page.tsx`: 환경 정보 및 개발 안내

### `/dashboard/subscribers` - 구독자 관리 페이지

- **Location**: `src/app/dashboard/subscribers/page.tsx` (L1-L221)
- **Purpose**: 뉴스레터 구독자 관리 및 통계
- **Key Details**:
  - 구독자 목록 조회 (API 호출)
  - 통계 카드 (전체, 활성, 비활성)
  - CSV 내보내기 기능
  - 구독일, 출처, 상태 표시
- **Dependencies**: /api/newsletter/subscribers API
- **Evidence**:
  - `src/app/dashboard/subscribers/page.tsx`: 구독자 데이터 fetch 및 표시

## API 라우트

### `/api/auth/[...nextauth]` - NextAuth.js API

- **Location**: `src/app/api/auth/[...nextauth]/route.ts` (L1-L3)
- **Purpose**: NextAuth.js 인증 API 핸들러
- **Key Details**:
  - 모든 인증 관련 API 라우트 처리
  - GET, POST 메서드 export
- **Dependencies**: NextAuth.js handlers
- **Evidence**:
  - `src/app/api/auth/[...nextauth]/route.ts`: auth handlers export

### `/api/[...routes]` - RPC 프록시

- **Location**: `src/app/api/[...routes]/route.ts` (L1-L16)
- **Purpose**: Hono RPC 라우트로 모든 API 요청 프록시
- **Key Details**:
  - 모든 HTTP 메서드 (GET, POST, PUT, DELETE, PATCH, OPTIONS) 처리
  - Hono/vercel handle 사용
  - Node.js 런타임
- **Dependencies**: @/rpc, Hono
- **Evidence**:
  - `src/app/api/[...routes]/route.ts`: rpcApp을 handle로 프록시

## 라우팅 패턴

### 동적 라우팅

1. **쿼리 파라미터 사용**:
   - `/dashboard/files/edit?pathname=DEV/my-post`
   - `/dashboard/files/view?pathname=DEV/my-post`
   - Next.js 동적 라우팅 대신 쿼리 파라미터 활용

2. **인증 미들웨어**:
   - 대시보드 레이아웃에서 세션 확인
   - 미인증 시 레이아웃 없이 페이지만 렌더링
   - 로그인 페이지는 미인증 시에만 접근 가능

3. **권한 체크**:
   - /unauthorized 페이지를 통한 권한 안내
   - 역할 기반 접근 제어 (슈퍼 관리자)

### 클라이언트 vs 서버 컴포넌트

1. **서버 컴포넌트**:
   - `/dashboard` - 메인 대시보드
   - `/login` - 로그인 페이지 (서버에서 세션 확인)
   - `/unauthorized` - 권한 없음 페이지

2. **클라이언트 컴포넌트**:
   - `/dashboard/create` - 파일 생성
   - `/dashboard/files` - 파일 목록
   - `/dashboard/files/edit` - 파일 편집
   - `/dashboard/files/view` - 파일 보기
   - `/dashboard/upload` - 파일 업로드
   - `/dashboard/subscribers` - 구독자 관리
