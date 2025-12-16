# Blog-Admin 배포 가이드

## 목차

1. [배포 전 체크리스트](#배포-전-체크리스트)
2. [Vercel에 배포](#vercel에-배포)
3. [환경 변수 설정](#환경-변수-설정)
4. [배포 후 확인](#배포-후-확인)
5. [문제 해결 (트러블슈팅)](#문제-해결-트러블슈팅)
6. [롤백](#롤백)

---

## 중요: 모노레포 배포 이슈 해결

이 프로젝트는 Turborepo 모노레포 구조로, Vercel 배포 시 다음 두 가지 주요 이슈가 해결되었습니다:

### 1. Prisma Client 빌드 오류

**문제**: Prisma Client가 빌드 전에 생성되지 않아 오류 발생

**해결**: `package.json`의 `postinstall` 및 `build` 스크립트에 `prisma generate` 추가
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### 2. Turborepo 환경 변수 경고

**문제**: Vercel 환경 변수가 `turbo.json`에 선언되지 않아 빌드 실패

**해결**: `turbo.json`에 모든 필요한 환경 변수 선언, 패키지에 `envMode: "loose"` 추가

자세한 내용은 [문제 해결](#문제-해결-트러블슈팅) 섹션 참조.

---

## 배포 전 체크리스트

### 코드 검증

```bash
# 1. 타입스크립트 확인
pnpm type-check

# 2. 린트 확인
pnpm lint

# 3. 로컬 빌드 테스트
pnpm build:admin

# 4. 모든 변경사항 커밋
git status
git add .
git commit -m "chore: prepare for deployment"
```

### 환경 준비

- [ ] Vercel 계정 생성 및 로그인
- [ ] GitHub 저장소 Vercel과 연결
- [ ] Blob Storage 설정 완료
- [ ] 환경 변수 준비

### 보안 확인

- [ ] `.env.local` 파일이 `.gitignore`에 포함됨
- [ ] API 키가 안전하게 저장됨
- [ ] HTTPS 활성화됨

---

## Vercel에 배포

### 방법 1: GitHub 연동 배포 (자동)

#### 1.1 Vercel 프로젝트 생성

[https://vercel.com/new](https://vercel.com/new) 접속

#### 1.2 저장소 선택

- GitHub 계정 연결
- `bbakjun-blog` 저장소 선택
- "Import" 클릭

#### 1.3 프로젝트 설정

**Framework Preset**: Next.js

**Root Directory**: `apps/blog-admin`

```
Project Name: blog-admin
Framework: Next.js
Root Directory: apps/blog-admin
```

#### 1.4 환경 변수 설정

**Environment Variables** 섹션:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
BACKOFFICE_API_KEY=your-secret-key
```

#### 1.5 배포

"Deploy" 클릭 → 배포 시작

**배포 시간**: 2-3분

### 방법 2: Vercel CLI 배포 (수동)

#### 2.1 Vercel CLI 설치

```bash
npm install -g vercel
```

#### 2.2 로그인

```bash
vercel login
```

#### 2.3 프로젝트 링크

```bash
cd /path/to/bbakjun-blog
vercel link

# 질문에 답변
# - Create a new project? Yes
# - Project name: blog-admin
# - Anything else? No
```

#### 2.4 환경 변수 설정

```bash
vercel env add
```

대화형으로 환경 변수 추가:
- `BLOB_READ_WRITE_TOKEN`
- `BACKOFFICE_API_KEY`

#### 2.5 배포

```bash
# 프리뷰 배포
vercel

# 프로덕션 배포
vercel --prod
```

---

## 환경 변수 설정

### Vercel 대시보드에서 설정

#### Step 1: 프로젝트 선택

```
Vercel Dashboard → blog-admin 프로젝트
```

#### Step 2: Settings 이동

```
프로젝트 → Settings → Environment Variables
```

#### Step 3: 변수 추가

**`BLOB_READ_WRITE_TOKEN`**:
```
Value: vercel_blob_rw_...
Environments: Production, Preview, Development
```

**`BACKOFFICE_API_KEY`**:
```
Value: your-strong-secret-key
Environments: Production, Preview
주의: Development는 제외 (로컬 테스트용)
```

#### Step 4: 배포 재실행

변경사항 적용을 위해 배포 재실행:

```bash
vercel --prod
```

또는 대시보드에서 "Redeploy" 클릭

---

## 배포 후 확인

### 1. 배포 상태 확인

```bash
# 배포 확인
vercel list

# 배포 상태 보기
vercel --prod --confirm
```

### 2. 접속 테스트

배포된 URL 확인:
```
https://blog-admin-xxx.vercel.app
```

브라우저에서 열기:
1. `/dashboard`로 접속
2. `BACKOFFICE_API_KEY` 입력
3. 로그인 성공 확인

### 3. API 테스트

```bash
# 환경 변수로 API 테스트
API_URL="https://blog-admin-xxx.vercel.app"
API_KEY="your-secret-key"

# 파일 목록 조회
curl "$API_URL/api/admin/files" \
  -H "Authorization: Bearer $API_KEY"

# 응답 예시
# { "files": [...], "total": N }
```

### 4. 로그 확인

Vercel 대시보드:
```
프로젝트 → Deployments → 배포 선택 → Logs
```

---

## 배포 구성 최적화

### vercel.json 설정

프로젝트 루트에 `vercel.json` (이미 구성됨):

```json
{
  "buildCommand": "pnpm build:admin",
  "outputDirectory": "apps/blog-admin/.next",
  "rootDirectory": "apps/blog-admin"
}
```

### Next.js 설정 최적화 (next.config.ts)

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  // 프로덕션 최적화
  swcMinify: true,
  compress: true,
};
```

---

## 모니터링

### 성능 모니터링

**Vercel Analytics** (자동 포함):
```
프로젝트 → Analytics

지표:
- TTFB (Time to First Byte)
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
```

### 에러 추적

**Vercel Functions 로그**:
```
프로젝트 → Deployments → Functions Logs

에러 모니터링:
- 404 에러
- 500 에러
- API 타임아웃
```

### 스토리지 모니터링

**Vercel Blob 대시보드**:
```
프로젝트 → Storage → Blob

모니터링 항목:
- 저장된 파일 크기
- 요청 수
- 대역폭 사용량
```

---

## 자동 배포 (CI/CD)

### GitHub Actions 설정

`.github/workflows/deploy.yml`:

```yaml
name: Deploy blog-admin

on:
  push:
    branches:
      - main
    paths:
      - 'apps/blog-admin/**'
      - 'packages/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 10.25.0

      - uses: actions/setup-node@v3
        with:
          node-version: '24'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build:admin

      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### GitHub Secrets 설정

GitHub 저장소 Settings → Secrets:

```
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
```

---

## 문제 해결 (트러블슈팅)

### 모노레포 특화 이슈

#### Prisma Client 빌드 오류

**오류 메시지**:
```
Error: @prisma/client did not initialize yet.
Please run "prisma generate" and try to import it again.
```

**원인**: Vercel 빌드 프로세스에서 Prisma Client 생성 단계가 누락됨

**해결 방법**:

1. `apps/blog-admin/package.json`에 스크립트 추가 (이미 적용됨):
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

2. `apps/blog-admin/vercel.json` 확인 (이미 생성됨):
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm run build",
  "devCommand": "pnpm run dev",
  "installCommand": "pnpm install",
  "outputDirectory": ".next"
}
```

3. 로컬 테스트:
```bash
# Prisma Client 재생성
pnpm --filter=blog-admin exec prisma generate

# 빌드 테스트
pnpm --filter=blog-admin build
```

#### Turborepo 환경 변수 경고

**오류 메시지**:
```
Warning - the following environment variables are set on your Vercel project,
but missing from "turbo.json". These variables WILL NOT be available to your
application and may cause your build to fail.
```

**원인**:
- 모노레포 환경에서 Turborepo가 환경 변수를 관리
- Vercel 환경 변수가 `turbo.json`에 선언되지 않으면 빌드 시 사용 불가

**해결 방법**:

1. 루트 `turbo.json`에 환경 변수 추가 (이미 적용됨):
```json
{
  "globalEnv": [
    "NODE_ENV",
    "VERCEL",
    "VERCEL_ENV",
    "VERCEL_URL",
    "DATABASE_URL",
    "DIRECT_URL",
    "AUTH_SECRET",
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
    "BLOB_READ_WRITE_TOKEN",
    "BLOB_STORE_ID",
    "BACKOFFICE_API_KEY",
    "NEXT_PUBLIC_BLOG_URL",
    "JWT_SECRET",
    "REDIS_URL"
  ],
  "tasks": {
    "build": {
      "env": [
        "DATABASE_URL",
        "DIRECT_URL",
        "AUTH_SECRET",
        "AUTH_GOOGLE_ID",
        "AUTH_GOOGLE_SECRET",
        "BLOB_READ_WRITE_TOKEN",
        "BLOB_STORE_ID",
        "BACKOFFICE_API_KEY",
        "NEXT_PUBLIC_BLOG_URL",
        "JWT_SECRET",
        "REDIS_URL"
      ]
    }
  }
}
```

2. 각 라이브러리 패키지에 `envMode: "loose"` 추가 (이미 적용됨):
   - `packages/types/package.json`
   - `packages/ui/package.json`
   - `packages/analytics/package.json`

```json
{
  "envMode": "loose"
}
```

3. Vercel 대시보드에서 모든 환경 변수 설정 확인

### 일반 배포 이슈

#### 오류: "Build failed"

**원인**: 빌드 오류

**해결**:
```bash
# 로컬에서 빌드 테스트
pnpm build:admin

# 타입 확인
pnpm type-check

# 에러 메시지 확인
vercel logs
```

#### 오류: "Module not found"

**원인**: 의존성 누락

**해결**:
```bash
# 의존성 재설치
pnpm install

# 빌드 재시도
pnpm build:admin
```

### 환경 변수 오류

#### Prisma 데이터베이스 연결 실패 (Prisma 7)

**오류 메시지**:
```
[auth][cause] PrismaClientKnownRequestError:
Can't reach database server at base
```

**원인**: Vercel 환경 변수에 따옴표(`"`)가 포함되어 있어 PostgreSQL 연결 문자열이 잘못 파싱됨

**해결 방법**:

1. **Vercel 대시보드에서 환경 변수 수정**:
   ```
   Settings → Environment Variables → DATABASE_URL 클릭
   ```

2. **따옴표 제거**:

   ❌ 잘못된 설정:
   ```
   "postgresql://user:pass@host/db?sslmode=require"
   ```

   ✅ 올바른 설정:
   ```
   postgresql://user:pass@host/db?sslmode=require
   ```

3. **모든 데이터베이스 관련 환경 변수 확인**:
   - `DATABASE_URL` (pooled connection)
   - `DIRECT_URL` (direct connection)

4. **재배포**:
   ```bash
   vercel --prod
   ```
   또는 Vercel 대시보드에서 "Redeploy" 클릭

**주의사항**:
- Vercel 환경 변수 입력 시 **따옴표 없이** 순수한 값만 입력
- 환경 변수 변경 후 **반드시 재배포** 필요
- Prisma 7에서는 `schema.prisma`에 `url` 설정이 없어도 되지만, 런타임에 `DATABASE_URL` 환경 변수 필수

**관련 코드**:
- [apps/blog-admin/src/shared/lib/db.ts](../src/shared/lib/db.ts): PrismaClient 초기화
- [apps/blog-admin/prisma.config.ts](../prisma.config.ts): Prisma 설정 파일

#### 오류: "BLOB_READ_WRITE_TOKEN is not set"

**원인**: 환경 변수 미설정

**해결**:
1. Vercel 대시보드 → Environment Variables
2. `BLOB_READ_WRITE_TOKEN` 추가 확인
3. 배포 재실행

#### 오류: "Unauthorized" API 응답

**원인**: API 키 오류

**해결**:
1. `.env.local`의 `BACKOFFICE_API_KEY` 확인
2. Vercel의 환경 변수 확인
3. 값이 정확히 일치하는지 확인

### 성능 문제

#### 느린 초기 로딩

**원인**: Cold Start

**해결**:
- Vercel Pro 구독 (항상 워밍)
- 정기적인 접속으로 워밍 유지

#### 높은 대역폭 사용량

**원인**: 과도한 파일 업로드

**해결**:
- 파일 크기 모니터링
- 오래된 버전 삭제

---

## 롤백

### 이전 버전으로 되돌리기

#### 방법 1: Vercel 대시보드

```
프로젝트 → Deployments

목록에서 이전 배포 찾기
→ 클릭 → "Redeploy" 선택
```

#### 방법 2: Git 롤백

```bash
# 이전 커밋 찾기
git log --oneline

# 이전 버전으로 되돌리기
git revert <commit-hash>

# 푸시하면 자동 배포
git push origin main
```

#### 방법 3: 수동 배포

```bash
# 특정 커밋에서 배포
git checkout <commit-hash>
vercel --prod --confirm
```

---

## 배포 체크리스트 (최종)

배포 전 확인:

- [ ] 로컬에서 빌드 성공
- [ ] `pnpm type-check` 통과
- [ ] `pnpm lint` 통과
- [ ] 모든 변경사항 커밋
- [ ] GitHub에 푸시
- [ ] Vercel 환경 변수 설정
- [ ] 배포 완료 후 접속 테스트
- [ ] API 동작 테스트

배포 후 확인:

- [ ] 대시보드 로그인 성공
- [ ] 파일 업로드 테스트
- [ ] 파일 목록 조회 테스트
- [ ] API 응답 정상
- [ ] 로그 에러 없음

---

## 성능 최적화 팁

### 1. 캐싱 활용

```typescript
// API 응답 캐싱 (향후 구현)
import { unstable_cache } from 'next/cache';

export const getCachedFiles = unstable_cache(
  async () => listBlobs(),
  ['admin-files'],
  { revalidate: 3600 }
);
```

### 2. Streaming 활용

```typescript
// 대용량 파일 업로드
export async function POST(request: NextRequest) {
  const buffer = Buffer.from(await request.arrayBuffer());
  // 스트리밍으로 처리
}
```

### 3. 이미지 최적화

대시보드에서 로고/아이콘 사용 시:
```typescript
import Image from 'next/image';

<Image
  src="/logo.svg"
  alt="Logo"
  width={40}
  height={40}
  priority
/>
```

---

## 추가 리소스

- [Vercel 배포 문서](https://vercel.com/docs/deployments/overview)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Vercel Blob 문서](https://vercel.com/docs/storage/vercel-blob)

---

**마지막 업데이트**: 2025-12-12
**버전**: 1.0.0
