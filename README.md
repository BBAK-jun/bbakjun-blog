# DEV_BBAK 블로그

Next.js 15, TypeScript, MDX, Redis를 사용한 현대적인 블로그입니다.

## ✨ 기능

- 📝 **MDX 기반 블로그 포스트**: 마크다운에 React 컴포넌트 사용 가능
- 👁️ **조회수 추적**: Redis(Vercel KV) 기반 실시간 조회수 카운팅
- 🏷️ **태그 시스템**: 포스트를 태그별로 분류 및 필터링
- 🌙 **다크 모드**: 시스템 테마에 따른 자동 다크/라이트 모드
- 📱 **반응형 디자인**: 모든 디바이스에서 최적화된 사용자 경험
- ⚡ **빠른 성능**: Next.js 15의 최신 기능 활용
- 🔍 **SEO 최적화**: 메타태그, Open Graph, Twitter Cards 지원

## 🛠️ 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **콘텐츠**: MDX (Markdown + React)
- **데이터베이스**: Redis (Vercel KV)
- **배포**: Vercel
- **폰트**: Geist Sans & Geist Mono

## 🚀 로컬 개발 시작하기

### 1. 저장소 클론

\`\`\`bash
git clone <repository-url>
cd bbakjun-blog
\`\`\`

### 2. 의존성 설치

\`\`\`bash
npm install
\`\`\`

### 3. 환경 변수 설정

\`\`\`.env.local
# 로컬 개발용 (Redis 없이도 작동)
NODE_ENV=development
\`\`\`

### 4. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

[http://localhost:3000](http://localhost:3000)에서 블로그를 확인할 수 있습니다.

## 📝 블로그 포스트 작성

\`content/posts/\` 디렉토리에 MDX 파일을 생성하여 포스트를 작성할 수 있습니다.

### 포스트 파일 구조

\`\`\`mdx
---
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
\`\`\`

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
│   └── posts/           # 블로그 포스트 (MDX)
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── api/        # API 라우트
│   │   ├── posts/      # 포스트 페이지
│   │   └── tags/       # 태그 페이지
│   ├── components/     # React 컴포넌트
│   ├── hooks/          # 커스텀 훅
│   └── lib/            # 유틸리티 함수
├── public/             # 정적 파일
└── tailwind.config.ts  # Tailwind CSS 설정
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