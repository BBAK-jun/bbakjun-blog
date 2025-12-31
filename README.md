# DEV_BBAK 블로그

Next.js, TypeScript, MDX, Redis를 사용한 현대적인 블로그 모노레포입니다.

## 모노레포 구조

이 프로젝트는 **Turborepo**로 관리되는 모노레포입니다:

```
├── apps/
│   ├── blog/              # 공개 블로그 (Next.js 16)
│   ├── blog-admin/        # 관리자 대시보드 (Next.js 16 + Prisma + Auth.js v5)
│   └── rag-gateway/       # RAG API 게이트웨이 (Hono + OpenAI)
├── packages/
│   ├── analytics/         # Redis 기반 조회수 추적
│   ├── cache/             # Redis 클라이언트 + API 응답 캐싱
│   ├── content/           # MDX 처리 및 마크다운 렌더링
│   ├── types/             # 공유 TypeScript 타입 정의
│   ├── ui/                # 공유 UI 컴포넌트 라이브러리
│   └── config/            # 공유 설정
└── content/posts/         # 블로그 포스트 (MDX)
```

## 주요 기능

### Blog App (공개 블로그)

- **MDX 기반 블로그 포스트**: 마크다운에 React 컴포넌트 사용 가능
- **조회수 추적**: Redis(Vercel KV) 기반 실시간 조회수 카운팅
- **태그 시스템**: 포스트를 태그별로 분류 및 필터링
- **다크 모드**: 시스템 테마에 따른 자동 다크/라이트 모드
- **반응형 디자인**: 모든 디바이스에서 최적화된 사용자 경험
- **빠른 성능**: Next.js 16의 최신 기능 활용
- **SEO 최적화**: 메타태그, Open Graph, Twitter Cards 지원
- **ISR**: Incremental Static Regeneration으로 자동 콘텐츠 갱신

### Blog-Admin App (관리자 대시보드)

- **인증 시스템**: Auth.js v5 + Google OAuth
- **역할 기반 접근 제어**: SUPER_ADMIN, ADMIN, GUEST
- **파일 관리**: Vercel Blob Storage를 통한 MDX 파일 업로드/관리
- **CDC**: Change Data Capture로 Blob API 호출 97% 감소
- **데이터베이스**: Neon PostgreSQL + Prisma ORM
- **마크다운 편집기**: CodeMirror 기반 실시간 프리뷰
- **대시보드**: 파일 관리, 업로드 이력, 설정

### RAG Gateway (AI 검색)

- **Hono 기반 API**: 고성능 서버리스 API
- **OpenAI 통합**: GPT 모델을 활용한 검색
- **벡터 검색**: 의미 기반 검색 지원

## 기술 스택

### Frontend

- **프레임워크**: Next.js 16
- **언어**: TypeScript
- **스타일링**: Tailwind CSS v4
- **UI 라이브러리**: Radix UI
- **상태 관리**: React Query (Admin)
- **React**: 19.2.1

### Backend

- **데이터베이스**:
  - PostgreSQL (Neon) - Admin 인증 및 사용자 관리
  - Redis (Vercel KV) - 조회수 추적, API 캐싱
- **ORM**: Prisma 7
- **인증**: Auth.js v5 (Google OAuth)
- **스토리지**: Vercel Blob Storage
- **API**: Hono (RAG Gateway)

### Build & Deploy

- **모노레포**: Turborepo
- **패키지 관리**: pnpm 10.25.0
- **배포**: Vercel
- **Node.js**: v24 이상

## 빠른 시작

### 사전 요구사항

- Node.js v24 이상
- pnpm 10.25.0 이상

### 1. 저장소 클론

```bash
git clone <repository-url>
cd bbakjun-blog
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 개발 서버 실행

**모든 앱 실행:**
```bash
pnpm dev
```

**특정 앱만 실행:**
```bash
pnpm dev:blog     # Blog (http://localhost:3000)
pnpm dev:admin    # Blog-Admin (http://localhost:3001)
pnpm dev:rag      # RAG Gateway (http://localhost:3002)
```

### 4. 빌드

```bash
# 전체 빌드
pnpm build

# 특정 앱 빌드
pnpm build:blog       # Blog
pnpm build:admin      # Blog-Admin
pnpm build:rag-gateway # RAG Gateway
```

## 문서

### 루트 문서

- [CLAUDE.md](CLAUDE.md) - Claude Code를 위한 프로젝트 가이드 (모노레포 구조, 배포 지침 포함)
- [QUICKSTART.md](QUICKSTART.md) - 빠른 시작 가이드
- [DOCUMENTATION.md](DOCUMENTATION.md) - 프로젝트 전체 문서

### Blog App 문서

블로그 앱은 기본적으로 환경 변수 없이 작동합니다 (Redis 없이 조회수 0 표시).

### Blog-Admin App 문서

- [apps/blog-admin/README.md](apps/blog-admin/README.md) - 개요
- [apps/blog-admin/docs/SETUP.md](apps/blog-admin/docs/SETUP.md) - 환경 설정 가이드
- [apps/blog-admin/docs/DEPLOYMENT.md](apps/blog-admin/docs/DEPLOYMENT.md) - Vercel 배포 가이드 (Prisma, Turborepo 이슈 해결 포함)
- [apps/blog-admin/docs/ARCHITECTURE.md](apps/blog-admin/docs/ARCHITECTURE.md) - 아키텍처 설명
- [apps/blog-admin/docs/API.md](apps/blog-admin/docs/API.md) - API 문서

## 블로그 포스트 작성

`content/posts/` 디렉토리에 MDX 파일을 생성하여 포스트를 작성할 수 있습니다.

### 포스트 Front Matter

```yaml
---
title: "포스트 제목"
date: "2024-11-15"
description: "포스트 설명"
tags: ["nextjs", "react", "typescript"]
author: "bbakjun"
draft: false
---
```

## Vercel 배포하기

### 1. GitHub 저장소 생성

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repository-url>
git push -u origin main
```

### 2. Vercel에 배포

1. [Vercel](https://vercel.com)에 접속하여 GitHub 계정으로 로그인
2. "New Project" 클릭
3. GitHub 저장소를 선택하고 Import
4. Root Directory를 각 앱으로 설정하여 배포:
   - Blog: `apps/blog`
   - Blog-Admin: `apps/blog-admin`

### 3. 환경 변수 설정

**Blog App**:
```
REDIS_URL=redis://...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_ADMIN_URL=https://your-admin-url.com
```

**Blog-Admin App**:
```
DATABASE_URL=postgresql://...
AUTH_SECRET=...
BLOB_READ_WRITE_TOKEN=...
```

자세한 내용은 [apps/blog-admin/docs/DEPLOYMENT.md](apps/blog-admin/docs/DEPLOYMENT.md)를 참고하세요.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.
