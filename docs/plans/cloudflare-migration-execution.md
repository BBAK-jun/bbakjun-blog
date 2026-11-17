# Cloudflare 이전 실행 기록

> 기준 설계서: `docs/plans/cloudflare-migration-design.md`

## 현재 브랜치

- `feat/cloudflare-migration`
- 기준 커밋: `83cb4dc feat(blog-mcp): add public safety scan workflow`
- 작업 디렉터리: `/home/bbakjun/projects/bbakjun-blog-cloudflare`

## 완료

### 단계 0: Next.js 호환 버전 선행 작업

- `next`: `16.0.8` → `16.4.6`
- `@next/mdx`: `^16.0.7` → `^16.4.6`
- `eslint-config-next`: `16.0.3` → `16.4.6`
- workspace catalog의 `next`를 `16.4.6`으로 통일
- `pnpm-lock.yaml` 갱신

### 단계 1: `/blog` 정적 ISR 전환

- 서버 페이지에서 `searchParams`를 직접 await하던 코드를 제거
- 검색어 파싱·필터링을 `SearchablePostsClient`로 이동
- `Suspense` fallback에는 검색어 없는 전체 포스트 목록을 유지해 SEO HTML 보존
- `SearchBarClient`의 `useSearchParams()`를 내부 `Suspense`로 감쌈
- `/blog`에 `revalidate = 3600` 추가
- 클라이언트로 전달하는 본문은 검색용 첫 1000자로 제한

### 단계 2: OpenNext 최소 부트스트랩

- `@opennextjs/cloudflare`: `1.20.17` 설치
- `wrangler`: `4.148.0` 설치
- `apps/blog/open-next.config.ts` 추가
- `apps/blog/wrangler.jsonc` 추가
- R2 incremental cache binding을 최소 설정으로 추가

### 단계 3: 스토리지 추상화 및 D1 사전 호환성

- `shared/storage`에 provider-neutral 인터페이스 추가
  - 기본 구현: Vercel Blob
  - 추가 구현: Cloudflare R2 bucket adapter
  - R2 목록은 cursor 페이지를 반복 처리
- Blob CDC, Server Actions, MCP post operations를 공통 storage API로 전환
- Vercel Blob client `handleUpload`/client token 흐름 제거
- `POST /api/rpc/upload/direct` 추가
  - 세션 확인
  - 서버 직접 업로드
  - 업로드 후 CDC 동기화
- 이미지 업로더를 `fetch` 기반 직접 업로드로 전환
- `schema.d1.prisma` 추가
  - SQLite provider
  - Cloudflare generator runtime
  - PostgreSQL 전용 `@db.Text` 제거
- Prisma D1 adapter 의존성 추가
- 기존 Neon 경로를 유지하면서 `DB_PROVIDER` 기반 provider 분기를 준비
- `$transaction`, `skipDuplicates`, `mode: 'insensitive'` 사용 지점을 D1 호환 코드로 정리
- 기존 Blob/upload 테스트 mock을 storage 인터페이스 mock으로 전환
- R2 fake bucket 단위 테스트 추가

### 단계 4: Content binding read 및 배포 설정

- `packages/content/src/posts-blob.ts`에 `ReadPost(pathname)` 주입 경로 추가
- 기존 URL `fetch` reader는 기본 fallback으로 유지
- `apps/blog/src/lib/blob.ts`에서 `CONTENT_BUCKET.get(pathname)` 기반 reader 연결
- Cloudflare context/binding이 없는 Vercel·Node 실행에서는 기존 Blob URL fetch로 fallback
- `apps/blog-admin/open-next.config.ts` 및 `wrangler.jsonc` 추가
  - D1 `DB`
  - R2 `CONTENT_BUCKET`
  - OpenNext incremental cache bucket
- `apps/rag-gateway/wrangler.jsonc` 추가
  - `main: src/index.ts`
- blog/blog-admin `next.config.ts`에 `initOpenNextCloudflareForDev()` 추가
- Cloudflare 배포 workflow 파일 추가
- 실제 deploy는 실행하지 않음
- 사용하지 않는 `@vercel/kv`, content package의 `@vercel/blob` 의존성 제거

## 이번 단계의 리스크 및 제한

- 실제 R2 bucket 생성 및 데이터 이전은 수행하지 않았다.
- 실제 D1 생성, migration, seed 실행은 수행하지 않았다.
- `git push`, PR 생성·수정, `wrangler deploy`, DNS 변경은 수행하지 않았다.
- OpenNext 빌드에서 `blog-admin proxy.ts`의 Node.js middleware support가 experimental이라는 경고가 계속 발생한다. Prisma 기반 middleware가 Cloudflare Worker preview에서 실제로 동작하는지는 별도 preview 검증이 필요하다.

- OpenNext 로컬 preview는 Wrangler local runtime compatibility date를 `2026-10-13`으로 override해야 부팅됐다. 설정 파일의 `2026-11-01`은 현재 설치된 local workerd가 지원하지 않아 그대로 실행할 수 없었다.
- compatibility date override 후 D1/R2 local bindings가 연결되고 `/unauthorized`는 `200 OK`를 반환했다.
- 보호 경로 `/dashboard` 요청에서는 실제 workerd의 OpenNext middleware가 실행되었지만 `TypeError: Method Promise.prototype.then called on incompatible receiver #<Promise>`로 `500`이 발생했다. 이는 `proxy.ts` Node middleware 실험 경고가 실제 local runtime에서도 재현된 것이며, PR 4에서 해결하지 않고 차단 리스크로 남긴다.

## 검증

- `pnpm --filter @apps/blog-admin generate:prisma` 통과
- 공통 패키지 및 RAG Gateway build 통과
- `pnpm --filter @apps/blog-admin build:rpc` 통과
- `pnpm --filter @apps/blog-admin type-check` 통과
- `pnpm --filter @apps/blog type-check` 통과
- Blog production build 통과
- Blog-admin production build 통과 (`SKIP_ENV_VALIDATION=true`)
- Prettier check 및 `git diff --check` 통과
- `/blog`가 `○ /blog 1h 1y`로 정적 ISR 표시됨
- `pnpm exec opennextjs-cloudflare build` 통과
  - Next.js `16.4.6`
  - OpenNext `1.20.17`
  - Wrangler 설정의 compatibility date `2026-11-01`
  - `.open-next/worker.js` 생성 완료

## 확인된 후속 이슈

- OpenNext 빌드에서 Node.js middleware가 experimental 경고를 출력한다. 현재 `apps/blog-admin`의 Prisma 기반 proxy와 함께 실제 Cloudflare preview에서 검증해야 한다.
- Blog-admin의 기본 production build는 필수 환경 변수 검증에서 중단된다. 실제 배포 검증에서는 Cloudflare secrets/vars를 주입해야 한다.
- R2 콘텐츠 bucket binding과 D1/태그 캐시는 아직 추가하지 않았다. 이번 단계는 OpenNext 최소 빌드 검증 범위다.

## 다음 작업

1. OpenNext 결과를 로컬 Wrangler preview로 실행해 worker 부팅을 확인한다.
2. 스토리지 추상화와 R2 content binding을 추가하되 기본 provider는 Vercel Blob으로 유지한다.
3. 콘텐츠 본문 전체 다운로드 구조를 포스트 단위 읽기로 줄인다.
4. 이후 blog-admin과 RAG Gateway의 Cloudflare 실행 구성을 별도 검증한다.
