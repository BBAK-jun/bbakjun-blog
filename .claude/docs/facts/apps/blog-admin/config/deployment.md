# 배포 설정 (Deployment Configuration)

- **Scope**: blog-admin 애플리케이션의 Vercel 배포 구성
- **Source of Truth**: `vercel.json`, `package.json` scripts
- **Last Verified**: 2025-12-22
- **Repo Ref**: main

## 개요

blog-admin은 Vercel 플랫폼에 최적화되어 배포되도록 설계되었습니다. Next.js 애플리케이션으로서 Prisma 데이터베이스, Auth.js 인증, Vercel Blob Storage를 통합하며, Turborepo 모노레포 구조에서 빌드됩니다.

## Vercel.json 설정

### 기본 프레임워크 설정

- **Location**: `vercel.json` (L2)
- **Purpose**: Vercel이 사용할 프레임워크 명시
- **Key Details**:
  - framework: "nextjs"
  - 자동 최적화 활성화
- **Dependencies**: Vercel platform
- **Evidence**: `vercel.json`: `"framework": "nextjs"`

### 빌드 명령어

- **Location**: `vercel.json` (L3)
- **Purpose**: 배포 시 실행할 빌드 커맨드
- **Key Details**:
  - `pnpm run build` 사용
  - Turborepo 캐싱 활용
- **Dependencies**: pnpm, Turborepo
- **Evidence**: `vercel.json`: `"buildCommand": "pnpm run build"`

### 개발 명령어

- **Location**: `vercel.json` (L4)
- **Purpose**: 로컬 개발 시 실행 커맨드
- **Key Details**:
  - `pnpm run dev` 사용
  - 포트 3001에서 실행
- **Dependencies**: Next.js dev server
- **Evidence**: `vercel.json`: `"devCommand": "pnpm run dev"`

### 설치 명령어

- **Location**: `vercel.json` (L5)
- **Purpose**: 의존성 설치 커맨드
- **Key Details**:
  - `pnpm install` 사용
  - pnpm-lock.json 기반 정확한 버전 설치
- **Dependencies**: pnpm package manager
- **Evidence**: `vercel.json`: `"installCommand": "pnpm install"`

### 출력 디렉토리

- **Location**: `vercel.json` (L6)
- **Purpose**: 빌드 결과물이 위치한 디렉토리
- **Key Details**:
  - `.next` 디렉토리
  - Next.js 표준 출력 위치
- **Dependencies**: Next.js build output
- **Evidence**: `vercel.json`: `"outputDirectory": ".next"`

## 빌드 프로세스

### 빌드 단계 (package.json)

- **Location**: `package.json` (L14, L22)
- **Purpose**: 프로덕션 빌드 실행 단계 정의

#### 1. Prisma Client 생성

```bash
prisma generate
```

- **Purpose**: Prisma Client TypeScript 타입 생성
- **Location**: `package.json` (L14)
- **Dependencies**: Prisma schema, node_modules

#### 2. RPC 타입 빌드 (postinstall)

```bash
pnpm build:rpc
```

- **Purpose**: Hono RPC 타입 정의 생성
- **Location**: `package.json` (L22)
- **Dependencies**: tsup, src/rpc/index.ts

#### 3. Next.js 빌드

```bash
next build
```

- **Purpose**: Next.js 애플리케이션 빌드
- **Features**:
  - SSR/SSG 페이지 최적화
  - API 라우트 함수 빌드
  - CSS/JS 번들링 및 최적화

## 필수 환경 변수

### 데이터베이스 관련

- **DATABASE_URL**: PostgreSQL 연결 (필수)
- **DIRECT_URL**: 직접 DB 연결 (마이그레이션용, 권장)

### 인증 관련

- **AUTH_SECRET**: NextAuth.js 시크릿 (필수)
- **AUTH_GOOGLE_ID**: Google OAuth ID (필수)
- **AUTH_GOOGLE_SECRET**: Google OAuth Secret (필수)

### 스토리지 관련

- **BLOB_READ_WRITE_TOKEN**: Vercel Blob 토큰 (필수)
- **BLOB_STORE_ID**: Blob Store ID (선택)

### API 관련

- **BACKOFFICE_API_KEY**: API 인증 키 (필수)
- **JWT_SECRET**: JWT 서명 키 (필수)
- **RESEND_API_KEY**: 이메일 발송 키 (선택)

### 애플리케이션 관련

- **NEXT_PUBLIC_BLOG_URL**: 블로그 URL (필수)
- **BLOG_REVALIDATION_SECRET**: 블로그 재검증 토큰 (선택)
- **BLOB_SYNC_INTERVAL_MINUTES**: CDC 동기화 간격 (선택, 기본 30)

### 중요: Vercel 환경 변수 입력 방법

⚠️ **Vercel 대시보드에서 환경 변수 값은 절대 따옴표로 감싸지 마세요**

❌ 잘못됨:

```
DATABASE_URL = "postgresql://user:pass@host/db"
```

✅ 올바름:

```
DATABASE_URL = postgresql://user:pass@host/db
```

## 데이터베이스 마이그레이션

### Prisma Migrate 설정

- **Location**: `prisma/schema.prisma`
- **Purpose**: 데이터베이스 스키마 정의 및 마이그레이션

#### 마이그레이션 실행 (로컬)

```bash
# 개발 환경
pnpm prisma migrate dev

# 프로덕션 환경 (Vercel)
pnpm prisma migrate deploy
```

#### Vercel 자동 마이그레이션

- Vercel은 빌드 시 `prisma migrate deploy` 자동 실행
- `package.json`에 postinstall 스크립트 포함됨
- Prisma Client는 마이그레이션 후 자동 생성

## Turborepo 빌드 최적화

### 캐싱 전략

- **Location**: `../../turbo.json` (L27-47)
- **Purpose**: 빌드 시간 단축을 위한 캐싱 설정

#### 글로벌 환경 변수

- **Location**: `../../turbo.json` (L4-25)
- **Purpose**: 모든 빌드에 전달되는 환경 변수
- **Key Variables**:
  - NODE_ENV, VERCEL 관련 변수
  - 모든 DATABASE*\*, AUTH*_, BLOB\__ 변수

#### 빌드 태스크 환경 변수

- **Location**: `../../turbo.json` (L30-47)
- **Purpose**: build 태스크에만 전달되는 변수
- **Dependencies**: 전체 빌드에 필요한 모든 환경 변수

## 배포 파이프라인

### 로컬 개발 → 테스트

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정 (.env.local)
cp .env.example .env.local

# 3. 데이터베이스 마이그레이션
pnpm prisma migrate dev

# 4. 개발 서버 실행
pnpm dev
```

### 프로덕션 배포 (Vercel)

1. **코드 푸시**: GitHub에 main 브랜치 푸시
2. **자동 빌드**: Vercel이 자동으로 빌드 트리거
3. **빌드 단계**:
   - pnpm install
   - prisma generate
   - pnpm build:rpc
   - next build
4. **배포**: .next 디렉토리를 Vercel 엣지에 배포

### Pull Request 배포 (Preview)

- Vercel은 각 PR에 대한 프리뷰 배포 자동 생성
- 프리뷰 환경은 별도 데이터베이스 연결 필요 (권장)

## 모니터링 및 로깅

### Vercel Analytics

- **자동 활성화**: Vercel 프로젝트에서 활성화 가능
- **지표**: 페이지 뷰, Web Vitals, 사용자 위치

### Vercel Logs

- **실시간 로그**: Vercel 대시보드에서 실시간 확인
- **로그 레벨**: error, warn, info, debug
- **소스 맵**: 디버깅을 위한 소스 맵 제공

## 배포 후 확인 사항

### 1. 환경 변수 확인

```bash
# Vercel CLI로 확인
vercel env ls

# 대시보드에서 Settings → Environment Variables 확인
```

### 2. 데이터베이스 연결 확인

```bash
# 배포된 앱에서 API 테스트
curl https://your-app.vercel.app/api/health
```

### 3. 인증 흐름 확인

- Google OAuth 연동 동작
- 세션 관리 정상 동작
- 역할 기반 접근 제어 동작

## 문제 해결

### 빌드 실패 시

#### Prisma 관련

- **오류**: "Can't reach database server"
- **원인**: DATABASE_URL에 따옴표 포함
- **해결**: Vercel에서 따옴표 제거

#### 타입 오류

- **오류**: TypeScript 타입 에러
- **원인**: Prisma Client 생성 실패
- **해결**: `pnpm prisma generate` 로컬 실행

### 런타임 오류 시

#### 데이터베이스 연결

- **오류**: "P2024: Connection pool exhausted"
- **해결**: Vercel Pooled URL 사용 (connection_limit 추가)

#### 환경 변수 누락

- **오류**: "Missing environment variable"
- **해결**: Vercel 대시보드에서 환경 변수 확인

## 롤백 전략

### 자동 롤백

- Vercel은 이전 배포로 자동 롤백 지원
- Deployments 탭에서 이전 버전 선택

### 수동 롤백

```bash
# 특정 커밋으로 롤백
git revert <commit-hash>
git push origin main
```

### 데이터베이스 롤백

```bash
# 마이그레이션 롤백
pnpm prisma migrate reset
```

## 보안 고려사항

### 1. 환경 변수 보호

- 모든 시크릿 키는 Vercel에만 저장
- .gitignore에 .env.local 포함
- 클라이언트 노출 변수는 NEXT*PUBLIC* 접두사만 허용

### 2. 데이터베이스 보안

- SSL 연결 강제 (postgresql:// ... ?sslmode=require)
- Vercel 네트워크 내에서만 접근 가능

### 3. CORS 설정

- next.config.ts에서 허용된 출처만 명시
- NEXT_PUBLIC_BLOG_URL 동적 설정
