# Blog Admin Dashboard

Vercel Blob Storage와 CDC(Change Data Capture)를 통해 MDX 블로그 포스트를 관리하는 관리자 대시보드입니다.

## 개요

- **인증 시스템**: Auth.js v5 + Google OAuth로 보안
- **Vercel Blob Storage**: MDX 파일 저장 및 관리
- **CDC 파이프라인**: PostgreSQL 캐시로 Blob API 호출 97% 감소
- **마크다운 편집기**: CodeMirror 기반 실시간 프리뷰
- **뉴스레터**: Resend API를 활용한 구독자 관리

## 프로젝트 구조

```
apps/blog-admin/
├── prisma/
│   └── schema.prisma          # Prisma 스키마 (BlobFile, User, Newsletter)
├── src/
│   ├── app/
│   │   ├── actions/           # Server Actions
│   │   │   ├── auth.ts        # 인증 관련 액션
│   │   │   ├── experience.ts  # 경력 관리 액션
│   │   │   ├── files.ts       # 파일 관리 액션
│   │   │   └── newsletter.ts  # 뉴스레터 액션
│   │   ├── api/               # API Routes
│   │   ├── dashboard/         # 대시보드 페이지
│   │   │   ├── experience/    # 경력 관리
│   │   │   ├── files/         # 파일 관리
│   │   │   ├── newsletter/    # 뉴스레터 관리
│   │   │   ├── settings/      # 설정
│   │   │   └── upload/        # 파일 업로드
│   │   ├── login/             # 로그인 페이지
│   │   └── layout.tsx         # 루트 레이아웃
│   ├── components/
│   │   └── ui/                # Radix UI 컴포넌트
│   ├── contract/              # Zod 스키마 (Hono RPC)
│   ├── lib/
│   │   ├── blob-cdc.ts        # Vercel Blob CDC 로직
│   │   └── auth.ts            # Auth.js 설정
│   └── rpc/
│       └── routes/            # Hono RPC 라우트
│           ├── blob-files.ts  # Blob 파일 API
│           ├── experience.ts  # 경력 API
│           ├── newsletter.ts  # 뉴스레터 API
│           └── upload.ts      # 업로드 API
├── scripts/
│   └── initial-blob-sync.js   # 초기 Blob 동기화 스크립트
└── tests/                     # Vitest 테스트
```

## 시작하기

### 설치

```bash
# 루트 디렉토리에서
pnpm install

# blog-admin만 설치
pnpm install --filter=@apps/blog-admin
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
# 데이터베이스 (Neon PostgreSQL)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# 인증 (Auth.js v5)
AUTH_SECRET=...  # openssl rand -base64 32
AUTH_GOOGLE_ID=...  # Google OAuth Client ID
AUTH_GOOGLE_SECRET=...  # Google OAuth Client Secret

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=...  # Vercel 대시보드에서 발급
BLOB_STORE_ID=...

# JWT (대시보드 인증)
JWT_SECRET=...  # openssl rand -base64 32

# Redis (선택사항 - API 응답 캐싱)
REDIS_URL=redis://...

# 뉴스레터 (선택사항)
RESEND_API_KEY=...

# 기타
NEXT_PUBLIC_BLOG_URL=https://your-blog.com
BLOB_SYNC_INTERVAL_MINUTES=30  # CDC 동기화 간격
```

### 개발 서버 실행

```bash
# blog-admin만 실행 (포트 3001)
pnpm dev:admin

# 모든 앱 실행
pnpm dev
```

### 빌드

```bash
# blog-admin만 빌드
pnpm build:admin

# 전체 빌드
pnpm build
```

## Hono RPC API

Blog-Admin은 Hono RPC를 통해 Blog 앱과 통신합니다.

### Public Endpoints (Blog 앱에서 접근)

**Blob Files API** (`/api/rpc/blob-files`):

- `GET /api/rpc/blob-files` - 캐시된 Blob 파일 목록 조회
  - Query: `limit`, `offset`, `search`
  - Response: `{ files, total, hasMore }`

**Views API** (`/api/rpc/views`):

- `GET /api/rpc/views/stats` - 조회수 통계

### Admin Endpoints (인증 필요)

**Blob Files Admin API** (`/api/rpc/blob-files/admin`):

- `GET /api/rpc/blob-files/admin` - 자동 동기화 포함 파일 목록
- `POST /api/rpc/blob-files/admin/sync` - 수동 동기화 트리거

## Vercel Blob CDC (Change Data Capture)

### 문제

Vercel Blob 무료 플랜은 월 2,000회 작업으로 제한됩니다. 파일 관리 UI에서 빈번한 `list()` API 호출이 이 제한을 초과할 수 있습니다.

### 해결책

PostgreSQL에 Blob 파일 목록을 캐싱하여 API 호출을 97% 감소시킵니다.

```
Vercel Blob Storage (진실 공급원)
    ↓ 30분마다 동기화 (BLOB_SYNC_INTERVAL_MINUTES)
PostgreSQL BlobFile 테이블 (캐시)
    ↓ 읽기 작업
Blog-Admin UI & Blog App
```

### 주요 컴포넌트

**BlobFile Model** (`prisma/schema.prisma`):

```prisma
model BlobFile {
  id          String   @id @default(cuid())
  url         String
  pathname    String   @unique  // 고유 식별자
  size        BigInt
  uploadedAt  DateTime
  contentType String?
  syncedAt    DateTime @default(now())
  isDeleted   Boolean  @default(false)
}
```

**동기화 함수** (`lib/blob-cdc.ts`):

- `syncBlobToDatabase()` - Vercel Blob API 호출 후 DB 동기화
- `getCachedBlobFiles()` - DB 캐시에서 파일 목록 조회
- `onBlobUpload()` - 업로드 후 실시간 DB 업데이트 (upsert)
- `onBlobDelete()` - 삭제 후 실시간 DB 업데이트 (soft delete)

### 비용 절감

- **동기화 전**: ~2,000+ API 호출/월 (제한 초과)
- **동기화 후 (30분 간격)**: ~48 API 호출/월
- **절감율**: 97.6%

## 테스트

```bash
# 테스트 실행
pnpm --filter=@apps/blog-admin test

# 한 번 실행
pnpm --filter=@apps/blog-admin test:run

# UI 모드
pnpm --filter=@apps/blog-admin test:ui
```

## 공유 패키지 활용

- **@repo/analytics**: Redis 기반 조회수 추적
- **@repo/cache**: API 응답 캐싱
- **@repo/content**: MDX 처리
- **@repo/types**: 공유 타입 정의
- **@repo/ui**: UI 컴포넌트

## 배포

### Vercel 배포

1. Vercel 대시보드에서 새 프로젝트 생성
2. Root Directory: `apps/blog-admin`
3. Build Command: `pnpm build:admin`
4. Install Command: `pnpm install`
5. Start Command: `pnpm start`
6. 환경 변수 설정

### 중요: 첫 배포 후 초기 동기화

배포 후 반드시 초기 Blob 동기화를 실행해야 합니다:

```bash
node scripts/initial-blob-sync.js
```

자세한 배포 가이드는 [apps/blog-admin/docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)를 참고하세요.

## 문서

- [docs/SETUP.md](docs/SETUP.md) - 로컬 환경 설정
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Vercel 배포 가이드
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - 아키텍처 설명
- [docs/API.md](docs/API.md) - API 문서

## 라이선스

MIT
