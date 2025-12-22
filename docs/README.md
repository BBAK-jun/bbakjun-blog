# 문서 가이드

이 문서는 bbakjun-blog 모노레포의 문서 구조를 설명합니다.

## 📁 문서 구조

```
bbakjun-blog/
├── README.md                          # 프로젝트 개요 및 빠른 시작
├── CLAUDE.md                          # Claude Code 가이드 (모노레포 구조, 배포 지침)
├── QUICKSTART.md                      # 빠른 시작 가이드
├── DOCUMENTATION.md                   # 전체 프로젝트 문서
│
├── apps/blog/                         # Blog 앱 (문서 최소)
│   └── README.md                      # Blog 앱 기본 설명
│
├── apps/blog-admin/                   # Blog-Admin 앱
│   ├── README.md                      # 개요
│   ├── AUTH.md                        # Auth.js 인증 시스템 설명
│   └── docs/
│       ├── README.md                  # 문서 인덱스
│       ├── SETUP.md                   # 로컬 환경 설정 가이드
│       ├── DEPLOYMENT.md              # Vercel 배포 가이드 (Prisma, Turborepo 이슈 해결)
│       ├── ARCHITECTURE.md            # 아키텍처 설명
│       ├── API.md                     # API 문서
│       ├── DEVELOPMENT.md             # 개발 가이드
│       └── SERVER_ACTIONS_MIGRATION.md # Server Actions 마이그레이션 가이드
│
├── packages/                          # 공유 패키지 (README 없음 - 단순 라이브러리)
│   ├── analytics/
│   ├── content/
│   ├── types/
│   ├── ui/
│   └── config/
│
└── scripts/
    └── README.md                      # 스크립트 설명
```

## 📖 주요 문서

### 루트 레벨

#### [README.md](../README.md)

- **대상**: 모든 개발자
- **내용**: 프로젝트 개요, 모노레포 구조, 빠른 시작, 기술 스택
- **언제 읽나요**: 프로젝트 첫 시작 시

#### [CLAUDE.md](../CLAUDE.md)

- **대상**: Claude Code (AI), 개발자
- **내용**:
  - 프로젝트 아키텍처 상세 설명
  - 모노레포 구조 및 workspace 의존성
  - Blog 앱: MDX 처리, Redis 조회수, 마크다운 파이프라인
  - Blog-Admin 앱: Prisma, Auth.js, 배포 이슈 해결
  - Turborepo 환경 변수 설정
- **언제 읽나요**:
  - 프로젝트 구조를 깊이 이해하고 싶을 때
  - Vercel 배포 시 환경 변수 이슈 발생 시
  - Claude Code와 협업할 때

### Blog-Admin 앱 문서

#### [apps/blog-admin/docs/SETUP.md](../apps/blog-admin/docs/SETUP.md)

- **대상**: Blog-Admin 개발자
- **내용**: 로컬 개발 환경 설정, Vercel Blob Storage 설정, 환경 변수 구성
- **언제 읽나요**: Blog-Admin을 처음 로컬에서 실행할 때

#### [apps/blog-admin/docs/DEPLOYMENT.md](../apps/blog-admin/docs/DEPLOYMENT.md) ⭐

- **대상**: DevOps, 배포 담당자
- **내용**:
  - **중요**: Prisma Client 빌드 오류 해결
  - **중요**: Turborepo 환경 변수 경고 해결
  - Vercel 배포 프로세스
  - 환경 변수 설정
  - 트러블슈팅 가이드
- **언제 읽나요**:
  - Vercel에 Blog-Admin을 배포할 때
  - 배포 시 Prisma 또는 환경 변수 오류 발생 시

#### [apps/blog-admin/docs/ARCHITECTURE.md](../apps/blog-admin/docs/ARCHITECTURE.md)

- **대상**: 아키텍처 이해가 필요한 개발자
- **내용**: Blog-Admin의 아키텍처, 디렉토리 구조, 데이터 흐름
- **언제 읽나요**: 기능 개발 전 구조를 파악하고 싶을 때

#### [apps/blog-admin/docs/API.md](../apps/blog-admin/docs/API.md)

- **대상**: API 개발자, 프론트엔드 개발자
- **내용**: API 엔드포인트 문서, 요청/응답 예시
- **언제 읽나요**: API를 사용하거나 수정할 때

#### [apps/blog-admin/docs/DEVELOPMENT.md](../apps/blog-admin/docs/DEVELOPMENT.md)

- **대상**: Blog-Admin 개발자
- **내용**: 개발 워크플로우, 코딩 컨벤션, 테스트 가이드
- **언제 읽나요**: 기능 개발 시

## 🔍 주제별 문서 찾기

### "로컬에서 프로젝트를 시작하고 싶어요"

1. [README.md](../README.md) - 빠른 시작 섹션
2. [apps/blog-admin/docs/SETUP.md](../apps/blog-admin/docs/SETUP.md) - Blog-Admin 설정

### "Vercel에 배포하고 싶어요"

1. [apps/blog-admin/docs/DEPLOYMENT.md](../apps/blog-admin/docs/DEPLOYMENT.md) - 배포 가이드
2. [CLAUDE.md](../CLAUDE.md) - 환경 변수 섹션

### "Prisma Client 빌드 오류가 발생했어요"

1. [apps/blog-admin/docs/DEPLOYMENT.md](../apps/blog-admin/docs/DEPLOYMENT.md) - "모노레포 특화 이슈" 섹션

### "Turborepo 환경 변수 경고가 떠요"

1. [apps/blog-admin/docs/DEPLOYMENT.md](../apps/blog-admin/docs/DEPLOYMENT.md) - "Turborepo 환경 변수 경고" 섹션
2. [CLAUDE.md](../CLAUDE.md) - "Turborepo Environment Variables" 섹션

### "프로젝트 구조를 이해하고 싶어요"

1. [README.md](../README.md) - 모노레포 구조 섹션
2. [CLAUDE.md](../CLAUDE.md) - Monorepo Structure 섹션
3. [apps/blog-admin/docs/ARCHITECTURE.md](../apps/blog-admin/docs/ARCHITECTURE.md)

### "API를 사용하고 싶어요"

1. [apps/blog-admin/docs/API.md](../apps/blog-admin/docs/API.md)

### "Auth.js 인증 시스템을 이해하고 싶어요"

1. [apps/blog-admin/AUTH.md](../apps/blog-admin/AUTH.md)

## ✅ 문서 정리 원칙

### 제거된 중복 문서

다음 문서들은 중복되어 제거되었습니다:

- ~~`BLOG_ADMIN_SETUP.md`~~ (루트) → `apps/blog-admin/docs/SETUP.md`로 통합
- ~~`DEPLOYMENT.md`~~ (루트) → `apps/blog-admin/docs/DEPLOYMENT.md`로 통합

### 문서 배치 원칙

- **루트**: 전체 프로젝트 개요, 빠른 시작
- **apps/[앱이름]/**: 해당 앱의 개요
- **apps/[앱이름]/docs/**: 해당 앱의 상세 문서
- **packages/**: README 없음 (단순 라이브러리)

### 업데이트 정책

- 배포 관련 이슈는 `apps/blog-admin/docs/DEPLOYMENT.md`에 추가
- 프로젝트 전체 구조 변경은 `CLAUDE.md`와 `README.md` 모두 업데이트
- 앱별 기능 추가는 해당 앱의 `docs/` 디렉토리에 문서 추가

## 📝 문서 작성 가이드

새 문서를 작성할 때:

1. **배치 위치 결정**
   - 전체 프로젝트 관련 → 루트
   - 특정 앱 관련 → `apps/[앱이름]/docs/`
   - Claude Code 가이드 → `CLAUDE.md`에 섹션 추가

2. **문서 구조**

   ```markdown
   # 제목

   ## 목차 (선택사항)

   ## 개요

   ## 주요 내용

   ## 예제

   ## 참고 문서
   ```

3. **링크 작성**
   - 상대 경로 사용: `[링크](../path/to/file.md)`
   - 섹션 링크: `[섹션](#섹션-이름)`

4. **코드 블록**
   - 언어 명시: ` ```bash`, ` ```typescript`, ` ```json`
   - 주석으로 설명 추가

---

**마지막 업데이트**: 2025-12-16
