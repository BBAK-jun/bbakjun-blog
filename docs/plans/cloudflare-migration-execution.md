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

## 검증

- `pnpm --filter @apps/blog-admin generate:prisma` 통과
- 공통 패키지 및 RAG Gateway build 통과
- `pnpm --filter @apps/blog-admin build:rpc` 통과
- `pnpm --filter @apps/blog-admin type-check` 통과
- `pnpm --filter @apps/blog type-check` 통과
- Blog production build 통과
- Blog-admin production build 통과 (`SKIP_ENV_VALIDATION=true`)
- Prettier check 및 `git diff --check` 통과

## 확인된 후속 이슈

- Blog build 결과 `/blog`가 현재 Dynamic route로 표시된다. Cloudflare 이전 전에 정적 ISR 경로로 되돌릴지 별도 확인한다.
- Blog-admin의 기본 production build는 필수 환경 변수 검증에서 중단된다. 실제 배포 검증에서는 Cloudflare secrets/vars를 주입해야 한다.
- `@opennextjs/cloudflare`는 아직 저장소에 추가하지 않았다. Next 호환성 확인 후 스토리지 추상화와 OpenNext 설정을 별도 PR로 진행한다.

## 다음 작업

1. Vercel 호환 상태에서 Next 16.4.6 변경을 독립 커밋한다.
2. `@opennextjs/cloudflare`와 Wrangler을 추가하고 최소 OpenNext preview build를 검증한다.
3. Vercel Blob 의존성을 storage interface 뒤로 이동한다.
4. R2 구현을 추가하되 기본 provider는 Vercel Blob으로 유지한다.
5. 콘텐츠 본문 전체 다운로드 구조를 포스트 단위 읽기로 줄인다.
