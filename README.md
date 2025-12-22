# DEV_BBAK 블로그

Next.js, TypeScript, MDX, Redis를 사용한 현대적인 블로그 모노레포입니다.

## 📦 모노레포 구조

이 프로젝트는 **Turborepo**로 관리되는 모노레포입니다:

```
├── apps/
│   ├── blog/              # 공개 블로그 (Next.js 15)
│   └── blog-admin/        # 관리자 대시보드 (Next.js 16 + Prisma + Auth.js v5)
├── packages/
│   ├── analytics/         # Redis 기반 조회수 추적
│   ├── content/           # MDX 처리 및 마크다운 렌더링
│   ├── types/             # 공유 TypeScript 타입 정의
│   ├── ui/                # 공유 UI 컴포넌트 라이브러리
│   └── config/            # 공유 설정
└── content/posts/         # 블로그 포스트 (MDX)
```

## ✨ 주요 기능

### Blog App (공개 블로그)

- 📝 **MDX 기반 블로그 포스트**: 마크다운에 React 컴포넌트 사용 가능
- 👁️ **조회수 추적**: Redis(Vercel KV) 기반 실시간 조회수 카운팅
- 🏷️ **태그 시스템**: 포스트를 태그별로 분류 및 필터링
- 🌙 **다크 모드**: 시스템 테마에 따른 자동 다크/라이트 모드
- 📱 **반응형 디자인**: 모든 디바이스에서 최적화된 사용자 경험
- ⚡ **빠른 성능**: Next.js 15의 최신 기능 활용
- 🔍 **SEO 최적화**: 메타태그, Open Graph, Twitter Cards 지원

### Blog-Admin App (관리자 대시보드)

- 🔐 **인증 시스템**: Auth.js v5 + Google OAuth
- 👥 **역할 기반 접근 제어**: SUPER_ADMIN, ADMIN, GUEST
- 📂 **파일 관리**: Vercel Blob Storage를 통한 MDX 파일 업로드/관리
- 🗄️ **데이터베이스**: Neon PostgreSQL + Prisma ORM
- 📝 **마크다운 편집기**: CodeMirror 기반 실시간 프리뷰
- 📊 **대시보드**: 파일 관리, 업로드 이력, 설정

## 🛠️ 기술 스택

### Frontend

- **프레임워크**: Next.js 15 (Blog), Next.js 16 (Admin)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS v4
- **UI 라이브러리**: Radix UI
- **상태 관리**: React Query (Admin)

### Backend

- **데이터베이스**:
  - PostgreSQL (Neon) - Admin 인증 및 사용자 관리
  - Redis (Vercel KV) - 조회수 추적
- **ORM**: Prisma
- **인증**: Auth.js v5 (Google OAuth)
- **스토리지**: Vercel Blob Storage

### Build & Deploy

- **모노레포**: Turborepo
- **패키지 관리**: pnpm
- **배포**: Vercel
- **CI/CD**: Vercel Git Integration

## 🚀 빠른 시작

### 사전 요구사항

- Node.js v24 이상
- pnpm v10.25.0 이상

### 1. 저장소 클론

\`\`\`bash
git clone <repository-url>
cd bbakjun-blog
\`\`\`

### 2. 의존성 설치

\`\`\`bash
pnpm install
\`\`\`

### 3. 개발 서버 실행

**모든 앱 실행:**
\`\`\`bash
pnpm dev
\`\`\`

**특정 앱만 실행:**
\`\`\`bash
pnpm dev:admin # Blog-Admin (http://localhost:3001)

# 또는 blog만 실행 (http://localhost:3000)

\`\`\`

### 4. 빌드

\`\`\`bash

# 전체 빌드

pnpm build

# 특정 앱 빌드

pnpm build:admin # Blog-Admin
pnpm build:blog # Blog
\`\`\`

## 📚 문서

### 루트 문서

- [CLAUDE.md](CLAUDE.md) - Claude Code를 위한 프로젝트 가이드 (모노레포 구조, 배포 지침 포함)
- [QUICKSTART.md](QUICKSTART.md) - 빠른 시작 가이드
- [DOCUMENTATION.md](DOCUMENTATION.md) - 프로젝트 전체 문서

### Blog App 문서

블로그 앱은 기본적으로 환경 변수 없이 작동합니다 (Redis 없이 조회수 0 표시).

### Blog-Admin App 문서

- [apps/blog-admin/README.md](apps/blog-admin/README.md) - 개요
- [apps/blog-admin/docs/SETUP.md](apps/blog-admin/docs/SETUP.md) - 환경 설정 가이드
- [apps/blog-admin/docs/DEPLOYMENT.md](apps/blog-admin/docs/DEPLOYMENT.md) - **Vercel 배포 가이드 (Prisma, Turborepo 이슈 해결 포함)**
- [apps/blog-admin/docs/ARCHITECTURE.md](apps/blog-admin/docs/ARCHITECTURE.md) - 아키텍처 설명
- [apps/blog-admin/docs/API.md](apps/blog-admin/docs/API.md) - API 문서

## 📝 블로그 포스트 작성

\`content/posts/\` 디렉토리에 MDX 파일을 생성하여 포스트를 작성할 수 있습니다.

### 포스트 파일 구조

## \`\`\`mdx

title: "포스트 제목"
date: "2024-11-15"
description: "포스트 설명"
tags: ["nextjs", "react", "typescript"]
author: "bbakjun"
draft: false

---

# 안녕하세요!

이것은 **MDX** 포스트입니다.

## 코드 예제

\\\`\\\`\\\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\\\`\\\`\\\`

> 인용구도 사용할 수 있습니다.
> \`\`\`

## 🚀 Vercel 배포하기

### 1. GitHub 저장소 생성

1. GitHub에서 새 저장소를 생성합니다.
2. 로컬 코드를 푸시합니다:

\`\`\`bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repository-url>
git push -u origin main
\`\`\`

### 2. Vercel에 배포

1. [Vercel](https://vercel.com)에 접속하여 GitHub 계정으로 로그인
2. "New Project" 클릭
3. GitHub 저장소를 선택하고 Import
4. 환경 변수는 자동으로 감지됩니다 (필요시 추가 설정)

### 3. Vercel KV (Redis) 설정

1. Vercel 대시보드에서 프로젝트 선택
2. "Storage" 탭 → "Create Database" → "KV" 선택
3. 데이터베이스 생성 후 환경 변수가 자동으로 설정됩니다:
   - \`KV_REST_API_URL\`
   - \`KV_REST_API_TOKEN\`

### 4. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

\`\`\`
NEXT_PUBLIC_BLOG_NAME=DEV_BBAK 블로그
NEXT_PUBLIC_BLOG_DESCRIPTION=안녕하세요 프론트엔드 개발자 박준형입니다.
NEXT_PUBLIC_AUTHOR_NAME=bbakjun
NEXT_PUBLIC_AUTHOR_EMAIL=your-email@example.com
\`\`\`

## 📁 프로젝트 구조

\`\`\`
├── content/
│ └── posts/ # 블로그 포스트 (MDX)
├── src/
│ ├── app/ # Next.js App Router
│ │ ├── api/ # API 라우트
│ │ ├── posts/ # 포스트 페이지
│ │ └── tags/ # 태그 페이지
│ ├── components/ # React 컴포넌트
│ ├── hooks/ # 커스텀 훅
│ └── lib/ # 유틸리티 함수
├── public/ # 정적 파일
└── tailwind.config.ts # Tailwind CSS 설정
\`\`\`

## 🎨 커스터마이징

### 색상 테마 변경

\`tailwind.config.ts\`에서 색상을 변경할 수 있습니다:

\`\`\`typescript
theme: {
extend: {
colors: {
// 여기서 색상을 커스터마이징
}
}
}
\`\`\`

### 레이아웃 수정

- 헤더: \`src/components/Header.tsx\`
- 푸터: \`src/components/Footer.tsx\`
- 전체 레이아웃: \`src/app/layout.tsx\`

## 📈 성능 최적화

- **이미지 최적화**: Next.js Image 컴포넌트 사용
- **폰트 최적화**: next/font로 웹폰트 최적화
- **번들 최적화**: 동적 import와 코드 스플리팅
- **캐싱**: Redis를 통한 조회수 캐싱

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your Changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the Branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 📞 연락처

- 블로그: [https://your-blog-url.vercel.app](https://your-blog-url.vercel.app)
- 이메일: your-email@example.com
- GitHub: [@your-username](https://github.com/your-username)

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!
