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
