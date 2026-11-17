# ☁️ `bbakjun-blog` Cloudflare 이전 설계서

> 대상 저장소: `BBAK-jun/bbakjun-blog` (main, `9547992`, 최종 푸시 2026-09-30)
> 분석 기준: 저장소 트리 1,171개 항목(파일 842개) 중 바이너리 제외 650개 소스·문서를 전수 확보한 뒤 파일·라인 단위 확인
> 작성: 2026-11-17 · **코드 수정/PR/외부 계정 변경은 하지 않았습니다.** 이 문서는 실행 설계서입니다.

---

## 0. 결론 요약

| 항목           | 결과                                                                                                                                                                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 이전 가능성    | **가능**. 단, **지금 상태(Next.js 16.0.8)로는 Cloudflare 배포가 불가능**합니다. `@opennextjs/cloudflare` 최신(1.20.17)의 peer 요구가 `next >=15.5.29 <16 \|\| >=16.4.5`라 **Next 16.4.6으로 올리는 작업이 0단계 선행 조건**입니다.                                                              |
| Blob(108MB)    | **R2로 이전 적합**. 무료 한도(10GB/Class A 1M/Class B 10M, egress 무료) 안에 충분히 들어갑니다. 단 **MDX 본문 안에 박힌 `*.public.blob.vercel-storage.com` 이미지 URL 재작성**이 필수입니다(§6 단계 2-B).                                                                                       |
| Redis(조회수)  | 코드는 `@vercel/kv`가 아니라 **Upstash(node-redis)** 입니다. `@vercel/kv`는 `apps/blog/package.json`에만 남은 **미사용 의존성**입니다. Workers에서는 `@upstash/redis`(REST)로 바꾸거나 D1 테이블로 흡수합니다.                                                                                  |
| Neon(Postgres) | **pgvector 없음**(벡터는 외부 Qdrant). 스키마는 10모델/2enum, 네이티브 타입은 `BIGINT`×2, `@db.Text`×5뿐 → **D1 이전 난이도 낮음**. 다만 ①`$transaction` 3곳 무결성 상실, ②`skipDuplicates` 미지원 2곳, ③`mode:'insensitive'` 미지원 3곳, ④바인딩 파라미터 100개 제한이 실제 수정 포인트입니다. |
| rag-gateway    | 순수 Hono + `@hono/node-server` 1줄 → **Workers 이전 거의 무료**. Qdrant(외부)는 그대로 두는 것을 권장(Cloudflare Vectorize는 재임베딩 필요).                                                                                                                                                   |
| 비용           | 현재 **$22/월**(Vercel Pro $20 + VAT) → 이전 후 **$5.5/월**(Workers Paid $5 + VAT) = **월 $16.5 / 연 $198 절감(75%)**. 이미 다른 프로젝트로 Workers Paid를 쓰고 있다면 **추가 비용 $0**(§9).                                                                                                    |
| 예상 공수      | 코드 3~4일 + 데이터 이전·검증 1~2일 + DNS 전환(대기 포함) 2~3일. 무중단 전환 가능.                                                                                                                                                                                                              |

**권고 순서**: ① Next 16.4.6 업그레이드 + Vercel에서 그대로 배포 검증 → ② 스토리지 추상화(R2) → ③ Cloudflare 배포 파이프라인 → ④ R2 콘텐츠 이전 → ⑤ D1 이전 → ⑥ 가비아 NS 전환 → ⑦ 2~4주 병행 후 Vercel/Neon/Render 해지.

---

## 1. 현재 아키텍처 (코드로 확인한 사실)

```
[사용자] ──> Vercel: dev-bbak.site
              ├─ apps/blog        (Next 16.0.8, ISR revalidate=3600)
              │    ├─ 빌드/ISR 시 blog-admin RPC `getBlobFiles` 호출 (CDC 캐시 목록)
              │    ├─ 목록에 있는 모든 .md/.mdx 를 Vercel Blob URL로 병렬 fetch
              │    ├─ 조회수: 브라우저가 admin RPC(`getViewsBySlug`/`incrementViewsBySlug`) 직접 호출 → Redis(Upstash)
              │    │     ※ `entities/view/lib/view.api.ts`의 `/api/views/*` fetch는 매칭 라우트가 없는 dead code
              │    ├─ /api/og/[...slug] : next/og 이미지 생성
              │    └─ /api/revalidate : blog-admin이 호출하는 온디맨드 ISR
              └─ apps/blog-admin  (Next 16.0.8, Auth.js v5 + Prisma 7)
                   ├─ Prisma → Neon Postgres (pooled `DATABASE_URL` + `DIRECT_URL`)
                   ├─ Vercel Blob put/del/list (MDX·이미지 원본 저장소)
                   ├─ Hono RPC: /api/[...routes] (hono/vercel, runtime='nodejs')
                   ├─ Redis 캐시(@repo/cache) → 조회수 통계 3분 캐시
                   └─ Resend 뉴스레터 (noreply@dev-bbak.site)
[Render 무료] apps/rag-gateway (Hono + @hono/node-server) → Qdrant(외부) + OpenAI/GLM
```

### 1.1 앱별 역할과 데이터 흐름의 핵심

- **글 본문의 원본은 Vercel Blob**, 저장소 안에는 MDX가 없습니다(`packages/content/src/posts-blob.ts`가 Blob URL을 fetch).
- 공개 블로그는 **Blob을 직접 list 하지 않습니다**. `apps/blog/src/lib/blob.ts` → `client.rpc.getBlobFiles` → blog-admin의 `BlobFile` 테이블(CDC 캐시)을 읽고, 그 URL로 본문을 내려받습니다. 즉 **Postgres는 공개 블로그의 렌더 경로에 있는 의존성**입니다.
- `getPostBySlug()`도 `fetchAllPostsFromBlobFiles()`를 호출합니다(`packages/content/src/posts.ts:4-7`). **글 1개 렌더에도 전체 포스트를 병렬 다운로드**하는 구조라, Worker로 옮기면 서브리퀘스트 수가 그대로 이슈가 됩니다(§4.1).
- **조회수는 브라우저 → admin RPC 직접 호출**입니다(`apps/blog/src/shared/hooks/useViews.ts:57,69` → `client.rpc.*`). 따라서 ① admin 도메인이 바뀌면 CORS(`ALLOWED_ORIGINS`)·`NEXT_PUBLIC_ADMIN_URL`을 함께 바꿔야 하고, ② **admin을 Cloudflare Access로 보호하면 조회수가 죽습니다**.

---

## 2. Vercel 의존 지점 전수 조사

### 2.1 `@vercel/blob` (MDX 본문·이미지 저장소)

| 파일:라인                                                                        | 내용                                                                         |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `apps/blog-admin/src/app/actions/files.ts:3,122,194,353,473,571,826`             | `put()`/`del()` — 글 작성·수정·삭제, 이미지 업로드(서버 액션)                |
| `apps/blog-admin/src/app/actions/files.ts:30,244`                                | `fetch(blob.url)` — 본문 읽기(`cache:'no-store'`)                            |
| `apps/blog-admin/src/rpc/routes/upload/upload.handlers.ts:2-3,38-90,146,232,367` | `handleUpload()` — **Vercel Blob 클라이언트 업로드 토큰/콜백 계약**, `put()` |
| `apps/blog-admin/src/shared/ui/image-uploader/image-uploader.tsx:4,45,84`        | `@vercel/blob/client`의 `upload()` — **브라우저가 Blob으로 직접 PUT**        |
| `apps/blog-admin/src/shared/server/blob-cdc.ts:52`                               | `list()` — 전체 객체 목록 동기화(CDC)                                        |
| `apps/blog-admin/src/entities/file/lib/blob-cdc.ts:6`                            | 동일 기능의 **중복 구현체**(둘 다 수정 필요)                                 |
| `apps/blog-admin/src/shared/server/blog-mcp-posts.ts:2,244,294,328`              | MCP 서버 글 생성/수정/이미지 업로드                                          |
| `packages/content/src/posts-blob.ts:51,89`                                       | `fetch(url)` 후 `Promise.all` — 공개 블로그의 본문 로딩                      |
| `apps/blog/src/lib/blob.ts:32`                                                   | CDC 목록 매핑                                                                |
| `apps/blog/next.config.ts:18-26`                                                 | `images.remotePatterns`에 Blob 호스트 (단, `next/image` 미사용 → 실효 없음)  |

**중요**: 업로드된 이미지의 **절대 URL이 MDX 본문에 그대로 저장**됩니다(`onImageUploaded(blob.url, …)`). 이전 시 콘텐츠 URL 재작성이 필수(§6.2).

### 2.2 Redis / `@vercel/kv`

| 파일:라인                                                      | 내용                                                                                                                       |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `packages/analytics/src/index.ts` 전체                         | `ViewCounter`: `type`, `hSet/hGet`, `hIncrBy`, `exists`, `set NX EX`, `keys`, `multi().exec()` — **조회수 영구 저장소**    |
| `packages/cache/src/redis.ts` 전체                             | `node-redis` `createClient()`, 커넥션 타임아웃·서킷브레이커(장애 시 DB 직접 조회)                                          |
| `packages/cache/src/index.ts`                                  | `cachedQuery`, `invalidateCache`(`scan`/`del`)                                                                             |
| `apps/blog-admin/src/rpc/routes/views/views.handlers.ts:82-90` | 조회수 통계 3분 캐시                                                                                                       |
| `apps/rag-gateway/src/middleware/rate-limit.ts:144-165`        | `incr`+`expire` 레이트리밋 (미설정 시 인메모리 폴백)                                                                       |
| `apps/blog/package.json:30`                                    | **`@vercel/kv` — 코드에서 import 0건(죽은 의존성)**                                                                        |
| `apps/blog/src/entities/view/lib/view.api.ts:5-80`             | **dead code** — `/api/views/*` 라우트가 존재하지 않음. 실제 조회수 경로는 브라우저 → admin RPC(`shared/hooks/useViews.ts`) |

→ **KV 이전 이슈는 사실상 없습니다.** 실체는 Upstash Redis이고, Upstash는 Workers에서 REST로 그대로 씁니다. `@vercel/kv`는 삭제 대상.

### 2.3 Neon Postgres / Prisma

`apps/blog-admin/prisma/schema.prisma` — 10모델, 2enum:

| 모델                                           | 테이블                                              | 특징                                                       |
| ---------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| `User`/`Account`/`Session`/`VerificationToken` | `users`,`accounts`,`sessions`,`verification_tokens` | Auth.js v5 어댑터 표준                                     |
| `Subscriber`                                   | `subscribers`                                       | 뉴스레터                                                   |
| `Experience`/`Achievement`                     | `experiences`,`achievements`                        | 경력 관리                                                  |
| `BlobFile`                                     | `blob_files`                                        | **CDC 캐시(공개 블로그가 읽는 테이블)**, `pathname` UNIQUE |
| `UploadHistory`                                | `upload_history`                                    | 업로드 이력                                                |
| `Setting`                                      | `settings`                                          | 시스템 설정                                                |

- 네이티브 타입: `BIGINT`×2(`blob_files.size`, `upload_history.fileSize`), `@db.Text`×5(Account 토큰 3개, `Achievement.description`, `Setting.value`)
- **`JSONB`·배열·`pgvector`·`tsvector`·부분 인덱스·함수/트리거: 없음** → D1 이전에 유리
- **없는 것도 확인**(저장소 전체 grep): `drizzle`, `kysely`, `@neondatabase/serverless`(Neon HTTP 드라이버), `better-sqlite3`, `typeorm` — **전부 0건**. DB 접근은 `Prisma 7 + @prisma/adapter-pg` 단일 경로이고, `pg`를 직접 쓰는 곳은 정리 스크립트 2개(`scripts/test-pathname-unique.ts`, `scripts/cleanup-duplicates-raw.ts`)뿐
- 마이그레이션 7개(`apps/blog-admin/prisma/migrations/*`)는 `CREATE TYPE … AS ENUM`, `BIGINT`, `TIMESTAMP(3)`, 윈도우 함수(`ROW_NUMBER() OVER`) 사용 → **그대로 재사용 불가**, D1용으로 새로 생성해야 함
- Prisma 호출 **49곳**(`apps/blog-admin/src`), 그중 Postgres 전용 기능:

| 위치                                                                     | 기능                                   | D1 영향                                    |
| ------------------------------------------------------------------------ | -------------------------------------- | ------------------------------------------ |
| `app/actions/settings.ts:208,240`                                        | `prisma.$transaction([...])`           | **무결성 상실**(에러 없이 순차 실행)       |
| `app/actions/experience.ts:273`                                          | `prisma.$transaction([...])`           | 동일                                       |
| `shared/server/blob-cdc.ts:67-76`, `entities/file/lib/blob-cdc.ts:37-46` | `createMany({ skipDuplicates: true })` | **`Unknown argument skipDuplicates` 오류** |
| `shared/server/blob-cdc.ts:128,298`, `entities/file/lib/blob-cdc.ts:98`  | `contains` + `mode:'insensitive'`      | **SQLite 미지원**(Prisma 검증 오류)        |
| `shared/server/blob-cdc.ts:52`, `entities/file/lib/blob-cdc.ts:6`        | `list()` 페이지네이션 없음             | R2 `list()`는 1회 1,000개 → 커서 루프 필요 |

### 2.4 Next.js 설정 / ISR / 이미지 / 미들웨어

| 항목           | 상태                                                                                                      | Cloudflare 영향                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Next 버전      | **16.0.8** (`apps/blog/package.json:35`, `apps/blog-admin/package.json:62`)                               | **OpenNext 미지원 구간** → 16.4.6 업그레이드 필수                            |
| ISR            | `revalidate = 3600` (홈·/blog·/blog/[...slug]·/series·/about), `dynamicParams = true`                     | OpenNext: R2 증분 캐시 + DO 큐 필요                                          |
| 온디맨드 ISR   | `apps/blog/src/app/api/revalidate/route.ts` → `revalidatePath`                                            | OpenNext: D1 태그 캐시 필요                                                  |
| 데이터 캐시    | `apps/blog/src/shared/lib/stats.ts:34` `next:{revalidate:300}` (조회수 통계)                              | 증분 캐시(R2)로 처리 → 동일 동작                                             |
| 이미지 최적화  | **`next/image` 사용 0건**, `mdx-components.tsx`의 일반 `<img>`                                            | 이전 걸림돌 없음(추후 필요 시 Cloudflare Images 유료)                        |
| 미들웨어       | Next 16 `proxy.ts` 2개(`apps/blog`=세션ID 쿠키, `apps/blog-admin`=**Auth.js 세션 검증 + Prisma DB 조회**) | OpenNext의 Node 미들웨어(1.20.3+ 실험적) 필요                                |
| OG 이미지      | `apps/blog/src/app/api/og/[...slug]/route.tsx` (`next/og` ImageResponse)                                  | OpenNext에서 지원(wasm 번들 크기 주의)                                       |
| Server Actions | `bodySizeLimit: '5mb'` (`blog-admin/next.config.ts`)                                                      | Workers 요청 본문 한도(Free/Pro 100MB) 내                                    |
| 폰트           | `next/font/google` (Geist)                                                                                | 빌드 타임 다운로드 → 문제 없음                                               |
| Vercel 전용    | `@vercel/analytics` (`apps/blog/src/app/layout.tsx:8`)                                                    | **비 Vercel 호스트에서는 동작 안 함** → 제거/Cloudflare Web Analytics로 대체 |
| `vercel.json`  | `apps/blog-admin/vercel.json` 1개                                                                         | 삭제                                                                         |

### 2.5 `apps/rag-gateway` (Render 무료)

- `src/index.ts`: `@hono/node-server`의 `serve()` + `getQdrantService().initializeCollection()` — **Workers에서는 `export default app`** 으로 교체(2줄).
- `src/middleware/logger.ts`: `pino` + `pino-pretty` — Workers에서 transport 사용 불가 → 운영은 transport 없는 pino 또는 console 로거.
- `src/middleware/rate-limit.ts`: Redis 미설정 시 **인메모리 폴백**(Workers에서는 isolate 단위라 제한적).
- `src/services/qdrant.ts`: `@qdrant/js-client-rest`(fetch 기반) → Workers 호환. 벡터 1536차원, 컬렉션 `blog_documents`.
- `openai` SDK → Workers(fetch) 호환.
- `stoker`, `hono`, `zod` → 호환.
- `render.yaml`: `buildCommand: pnpm build:rag-gateway`, `PORT 3002`, health `/api/admin/health`.

### 2.6 배포·CI

- Vercel 프로젝트 2개(blog, blog-admin) + `.github/workflows/doc-update.yml`(문서 자동화, 인프라 무관).
- `turbo.json` 빌드 그래프: `@apps/blog#build` ← `@apps/blog-admin#build:rpc`(tsup dist), `@apps/blog-admin#build` ← `@apps/rag-gateway#build`. **Cloudflare 빌드에서도 이 순서를 유지해야** 합니다(`packages/*` dist를 워크스페이스로 참조).

---

## 3. 호환성 판정 (항목별)

| 의존                          | 대체                                    | 판정                        | 근거·주의                                                                                                                                     |
| ----------------------------- | --------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js 16.0.8                | 16.4.6                                  | ⚠️ **선행 업그레이드 필수** | `@opennextjs/cloudflare@1.20.17` peer: `next >=15.5.29 <16 \|\| >=16.4.5`. 1.16.0부터 **지원 밖 버전은 빌드 에러**. Next 16.0.8은 미지원 구간 |
| Vercel Blob                   | R2 버킷 + 커스텀 도메인                 | ✅ 적합                     | 무료 10GB/Class A 1M/Class B 10M/egress 무료. `put`의 `addRandomSuffix:false`(덮어쓰기)는 R2 `put(key)` 기본 동작과 동일                      |
| Vercel Blob 클라이언트 업로드 | 서버 경유 업로드(Worker → `bucket.put`) | ✅ 대체 가능                | `@vercel/blob/client`의 토큰 핸드셰이크 계약은 R2에 없음. 이미지 ≤5MB라 Worker 경유로 충분                                                    |
| `@vercel/kv`                  | 삭제                                    | ✅                          | 미사용                                                                                                                                        |
| Upstash Redis                 | `@upstash/redis`(REST) 유지             | ✅                          | 무료 한도 내. Workers에서 raw TCP(`redis` npm)는 불안정 → REST 권장                                                                           |
| 조회수 저장                   | **(권장) D1 테이블로 흡수**             | ✅                          | `post_views(slug TEXT PK, views INTEGER)` + `UPDATE … SET views=views+1`. D1 쓰기 50M/월 포함                                                 |
| Neon Postgres                 | D1                                      | ⚠️ 조건부 적합              | §4.2 참조                                                                                                                                     |
| Neon Postgres                 | **유지(무료) + Hyperdrive**             | ✅ 대안                     | Hyperdrive는 Workers Paid에 포함(무제한 쿼리), 코드 변경 거의 없음                                                                            |
| pgvector                      | — (Qdrant 사용)                         | ✅ 해당 없음                | D1에 벡터 기능 없음 → **Qdrant 유지** 권장                                                                                                    |
| Render(rag-gateway)           | Workers                                 | ✅                          | §6.5                                                                                                                                          |
| `@vercel/analytics`           | Cloudflare Web Analytics                | ✅                          | npm 패키지 불필요(존 단위 비콘)                                                                                                               |

---

## 4. 핵심 판정 상세

### 4.1 OpenNext 제약 3가지 (설계에 직접 영향)

1. **Next 16.4.5+ 요구** — 업그레이드 없이는 `opennextjs-cloudflare build`가 실패합니다.
2. **증분 캐시 구성**: ISR을 쓰므로 OpenNext 문서의 "Small site using revalidation" 권장 구성을 그대로 따릅니다 → **R2 증분 캐시 + Durable Object 큐 + D1 태그 캐시**.
3. **서브리퀘스트/CPU**: Workers Free는 서브리퀘스트 50/요청·CPU 10ms. 이 앱은 **글 1개 렌더에도 전체 포스트를 병렬 fetch**하므로(§1.1) **Workers Paid 필수**(서브리퀘스트 10,000/요청, CPU 기본 30초). 다만 동시 아웃바운드 연결은 Free/Paid 모두 **6개**이므로, R2 바인딩으로 읽도록 바꾸는 것이 성능·안정성 양쪽에서 낫습니다(§6.1-3).

### 4.2 Neon → D1 호환성 매트릭스

| Prisma 타입 / 기능          | Postgres 현재                       | D1(SQLite) 결과                               | 조치                                                                                          |
| --------------------------- | ----------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `String`/`TEXT`             | TEXT                                | TEXT                                          | 그대로                                                                                        |
| `Boolean`                   | BOOLEAN                             | INTEGER 0/1                                   | 그대로 동작                                                                                   |
| `Int`                       | INTEGER                             | INTEGER                                       | 그대로                                                                                        |
| `BigInt`                    | BIGINT                              | INTEGER(64bit)                                | **Prisma 7 D1에서 지원**, 읽을 때 `Number()` 변환 코드 이미 존재(`shared/server/blob-cdc.ts`) |
| `DateTime`                  | TIMESTAMP(3)                        | 드라이버 어댑터 기본 **ISO-8601 문자열**      | 데이터 적재 시 형식 일치 필수(§6.3-3)                                                         |
| `enum` (2개)                | PG ENUM                             | **TEXT**로 저장(앱 레벨 검증만)               | 스키마에서 enum 선언 유지 가능. DB 제약 없음 → 오타 시 런타임 오류                            |
| `@db.Text`                  | 사용                                | **SQLite 미지원**                             | 5곳 제거                                                                                      |
| `Json`/`Jsonb`              | 미사용                              | —                                             | 해당 없음                                                                                     |
| `$transaction`              | 3곳                                 | **어댑터가 경고만 하고 개별 실행**(롤백 없음) | 3곳 재작성(§6.1-6)                                                                            |
| `createMany.skipDuplicates` | 2곳                                 | **오류**                                      | 사전 조회 후 insert 또는 `INSERT OR IGNORE` 원시 쿼리                                         |
| `mode:'insensitive'`        | 3곳                                 | **오류**                                      | 옵션 제거(SQLite `LIKE`는 ASCII 기본 대소문자 무시, 한글은 무관)                              |
| 바인딩 파라미터             | 무제한                              | **문 1개당 100개**                            | Prisma 어댑터가 98개로 자동 분할하나, 대량 `in`은 분할 로직 확인 필요                         |
| `LIKE` 패턴                 | 무제한                              | **50바이트**                                  | 검색어 `zod.max(40)` 가드                                                                     |
| 트랜잭션/동시성             | MVCC                                | **DB당 단일 스레드**(쿼리 직렬화)             | 관리자 트래픽 수준에서는 무해, 배치 동기화는 `batch()`                                        |
| DB 크기                     | 무제한(과금)                        | **10GB/DB(Paid)**, 500MB(Free)                | 현재 데이터 예상 <10MB → 여유                                                                 |
| 백업                        | Neon PITR 6시간(Free)               | **D1 Time Travel 30일**(Paid)                 | 오히려 개선                                                                                   |
| 데이터 egress               | **Free 5GB/월 초과 시 컴퓨트 정지** | **무료·무제한**                               | 현재 "Neon public network 80% 도달" 이력(CLAUDE.md:248)의 근본 해결                           |

**결론**: 기능 손실은 `$transaction` 무결성 하나이고, 나머지는 기계적 수정입니다. DB가 작아 D1의 10GB·단일 스레드 제약은 문제가 되지 않습니다.

### 4.3 대안 비교 (DB)

| 안                                 | 월 비용 | 코드 변경                           | 리스크                                         | 판정                                           |
| ---------------------------------- | ------- | ----------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| **A. D1 이전**                     | $0      | 중(스키마·쿼리 5~8곳·적재 스크립트) | 트랜잭션 무결성, 적재 형식                     | **권장**(단일 벤더, egress 절벽 제거)          |
| **B. Neon Free 유지 + Hyperdrive** | $0      | 소(`db.ts` 어댑터 1곳 + 배포 설정)  | Neon Free 5GB egress·100 CU-h 한도, 콜드스타트 | **보험으로 유효**. D1 안이 흔들릴 때 즉시 대체 |
| C. Neon Launch($15~)               | ~$15    | 0                                   | —                                              | 비용 절감 목적과 상충                          |

> 권고: **A로 진행하되, 컷오버 2주간 B를 롤백 경로로 남깁니다.** D1 schema를 별도 파일로 두고 `DATABASE_URL` 유무로 어댑터를 고르는 구조면 롤백이 배포 1회로 끝납니다.

### 4.4 벡터 검색 (pgvector 아님)

- 현재 벡터는 **Qdrant Cloud**(컬렉션 `blog_documents`, 1536차원, `text-embedding-3-small`)입니다. Neon에는 벡터 데이터가 **없습니다**.
- 대안: Cloudflare **Vectorize**(1536차원 cosine 지원, Workers Paid 포함 한도) — 다만 **전 문서 재임베딩·재색인**과 필터 표현식 재작성이 필요하고, OpenAI 임베딩 비용이 다시 발생합니다. 이전 이득이 없으므로 **Qdrant 유지**를 권장합니다.

---

## 5. 목표 아키텍처

```
[Cloudflare zone: dev-bbak.site]
 ├─ Worker  bbakjun-blog      ← apps/blog       (OpenNext)   도메인 dev-bbak.site, www
 ├─ Worker  bbakjun-blog-admin ← apps/blog-admin (OpenNext)   도메인 admin.dev-bbak.site
 ├─ Worker  bbakjun-rag       ← apps/rag-gateway (Hono)       도메인 rag.dev-bbak.site
 ├─ R2      bbakjun-blog-content   (MDX·이미지 원본, 공개 도메인 cdn.dev-bbak.site)
 ├─ R2      bbakjun-blog-isr       (ISR 증분 캐시, 비공개)
 ├─ D1      bbakjun-blog-db        (앱 데이터, binding DB)
 ├─ D1      bbakjun-blog-tagcache  (OpenNext 태그 캐시, binding NEXT_TAG_CACHE_D1)
 ├─ DO      DOQueueHandler         (ISR 재검증 큐)
 └─ 외부: Qdrant(유지) · Upstash Redis(조회수 유지 또는 D1 흡수) · Resend · Google OAuth
```

**리소스 명세**

| 리소스        | 이름                                                                       | 바인딩/설정                                                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worker(blog)  | `bbakjun-blog`                                                             | `r2_buckets`: `NEXT_INC_CACHE_R2_BUCKET`, `CONTENT_BUCKET`(PR 3 채택 시) / `durable_objects`: `NEXT_CACHE_DO_QUEUE` / `d1_databases`: `NEXT_TAG_CACHE_D1` / `services`: `WORKER_SELF_REFERENCE` |
| Worker(admin) | `bbakjun-blog-admin`                                                       | `d1_databases`: `DB` / `r2_buckets`: `CONTENT_BUCKET`                                                                                                                                           |
| Worker(rag)   | `bbakjun-rag`                                                              | `compatibility_flags: ["nodejs_compat"]`, env: `QDRANT_URL` 등                                                                                                                                  |
| R2            | `bbakjun-blog-content`                                                     | 공개 액세스: 커스텀 도메인 `cdn.dev-bbak.site`                                                                                                                                                  |
| R2            | `bbakjun-blog-isr`                                                         | 비공개                                                                                                                                                                                          |
| D1            | `bbakjun-blog-db` / `bbakjun-blog-tagcache`                                | `wrangler d1 create`                                                                                                                                                                            |
| 공통          | `compatibility_flags: ["nodejs_compat"]`, `compatibility_date: 2026-11-01` | OpenNext 필수                                                                                                                                                                                   |

---

## 6. 단계별 실행 계획

### 단계 0 — 선행: Next.js 16.4.6 업그레이드 (Vercel에서 먼저 검증)

```bash
# apps/blog, apps/blog-admin
pnpm up next@16.4.6 eslint-config-next@16.4.6 -F @apps/blog -F @apps/blog-admin
# 루트 catalog도 정리: pnpm-workspace.yaml 의 next: 16.0.7 → 16.4.6
pnpm type-check && pnpm build && pnpm test
```

- Vercel에 그대로 배포해 회귀 확인(이 단계는 되돌리기 쉬움).
- `proxy.ts`(Next 16 Node 미들웨어) 시그니처가 16.4에서 변하지 않았는지 확인.

### 단계 1 — 코드 변경 (PR 분할)

> 원칙: **각 PR 후에도 main이 Vercel에서 정상 동작**해야 합니다. DB 전환만 컷오버 직전 별도 브랜치로 미룹니다.

#### PR 1 `chore/next-16.4` (단계 0 포함)

| 파일                                                                            | 변경        |
| ------------------------------------------------------------------------------- | ----------- |
| `apps/blog/package.json`, `apps/blog-admin/package.json`, `pnpm-workspace.yaml` | next 16.4.6 |

#### PR 2 `feat/storage-abstraction` (기본은 Blob 유지, R2 구현 추가)

| 파일                                                              | 변경                                                                                                                              |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **신규** `apps/blog-admin/src/shared/storage/types.ts`            | `putObject(key, body, {contentType})`, `deleteObject(key)`, `listObjects(cursor)`, `getObjectText(key)`, `publicUrl(key)`         |
| **신규** `shared/storage/blob-storage.ts`                         | 기존 `@vercel/blob` 로직 이동                                                                                                     |
| **신규** `shared/storage/r2-storage.ts`                           | R2 바인딩 구현(`bucket.put`, `bucket.delete`, `bucket.list` 커서 루프, `bucket.get`)                                              |
| `app/actions/files.ts:3,122,194,244,353,473,571,826`              | `put/del/fetch(url)` → `storage.*`                                                                                                |
| `shared/server/blob-cdc.ts:52`, `entities/file/lib/blob-cdc.ts:6` | `list()` → `storage.listObjects()` (커서 페이지네이션)                                                                            |
| `shared/server/blog-mcp-posts.ts:2,244,294,328`                   | 동일 치환                                                                                                                         |
| `rpc/routes/upload/upload.handlers.ts`                            | `handleUpload`(Vercel 전용) 제거 → `POST /api/rpc/upload/direct` (서버에서 `storage.putObject(key, await request.arrayBuffer())`) |
| `shared/ui/image-uploader/image-uploader.tsx:4,45,84`             | `@vercel/blob/client upload()` → `fetch('/api/rpc/upload/direct', {method:'POST', body:file})`                                    |
| `apps/blog/src/lib/blob.ts`, `packages/content/src/posts-blob.ts` | URL 문자열 그대로 두되, **R2 공개 도메인으로 교체만** 되면 동작(코드 변경 최소)                                                   |
| `tests/file-update-integration.test.ts`, `tests/vitest.env.ts`    | mock 대상 교체                                                                                                                    |

#### PR 3 `feat/content-binding-read` (성능·서브리퀘스트 절감, 선택이지만 권장)

| 파일                                       | 변경                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `packages/content/src/posts-blob.ts:51,89` | `downloadBlobContent(url)` → 주입받은 `readPost(pathname)` 함수 사용 (기존 fetch 구현을 기본값으로)           |
| `apps/blog/src/lib/blob.ts`                | `readPost`를 R2 바인딩(`env.CONTENT_BUCKET.get(pathname)`)으로 제공 → **글 1개 렌더 시 100+ 외부 fetch 제거** |

#### PR 4 `feat/cloudflare-deploy` (파일 추가만, Vercel 동작 불변)

| 파일                                                                    | 내용                                               |
| ----------------------------------------------------------------------- | -------------------------------------------------- |
| `apps/blog/wrangler.jsonc`, `apps/blog/open-next.config.ts`             | §6.4 스니펫                                        |
| `apps/blog-admin/wrangler.jsonc`, `apps/blog-admin/open-next.config.ts` | 동일 + `DB`, `CONTENT_BUCKET`                      |
| `apps/rag-gateway/wrangler.jsonc`                                       | `main: src/index.ts`                               |
| 각 `next.config.ts`                                                     | `initOpenNextCloudflareForDev()` 추가(로컬 바인딩) |
| `.github/workflows/deploy-cloudflare.yml`                               | main 푸시 시 3개 Worker 배포                       |
| `apps/blog/src/app/layout.tsx:8,` + `apps/blog/package.json`            | `@vercel/analytics` 제거                           |
| `apps/blog/package.json:30`                                             | `@vercel/kv` 제거                                  |
| `packages/content/package.json:27`                                      | 미사용 `@vercel/blob` 제거                         |
| `apps/blog-admin/vercel.json`                                           | 삭제                                               |

#### PR 5 `feat/db-d1` (컷오버 브랜치 — D1 이전 확정 시 머지)

| 파일                                                                     | 변경                                                                                                                                                |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **신규** `apps/blog-admin/prisma/schema.d1.prisma`                       | `provider="sqlite"`, `generator prisma-client { runtime="cloudflare" output="../src/generated/prisma" }`, `@db.Text` 5곳 제거, `BigInt`·`enum` 유지 |
| `apps/blog-admin/src/shared/lib/db.ts`                                   | `PrismaPg` → `PrismaD1(getCloudflareContext().env.DB)`                                                                                              |
| `apps/blog-admin/src/env.ts:23-24,67-68`                                 | `BLOB_READ_WRITE_TOKEN` 제거, `DATABASE_URL/DIRECT_URL` 제거                                                                                        |
| `shared/server/blob-cdc.ts:67-76`, `entities/file/lib/blob-cdc.ts:37-46` | `skipDuplicates` 제거 → 기존 pathname 사전 조회 후 insert                                                                                           |
| `shared/server/blob-cdc.ts:128,298`, `entities/file/lib/blob-cdc.ts:98`  | `mode:'insensitive'` 제거                                                                                                                           |
| `app/actions/settings.ts:208,240`, `app/actions/experience.ts:273`       | `$transaction` → 단일 `createMany`/`update` 또는 `db.batch()` 원시 쿼리로 원자성 유지                                                               |
| `app/api/[...routes]/route.ts:5,9-14`                                    | `hono/vercel` → `export const GET = (req: Request) => rpcApp.fetch(req)` (+ `runtime` 유지)                                                         |
| `apps/blog-admin/package.json`                                           | `@vercel/blob`,`pg`,`@prisma/adapter-pg` 제거, `@prisma/adapter-d1` 추가                                                                            |
| `scripts/test-pathname-unique.ts`, `scripts/cleanup-duplicates-raw.ts`   | `fs`+`pg` 기반 스크립트 → D1 REST/`wrangler d1 execute`로 재작성 또는 삭제                                                                          |
| `packages/analytics/src/index.ts`                                        | **(권장)** Redis ViewCounter → D1 `post_views` 구현체 (`upstash-analytics.ts`를 대안으로 유지)                                                      |
| `prisma.config.ts`                                                       | D1 모드에서는 `prisma migrate` 미사용 → `prisma generate` 전용으로 정리                                                                             |

#### PR 6 `refactor/rag-gateway-workers`

| 파일                                        | 변경                                                     |
| ------------------------------------------- | -------------------------------------------------------- |
| `apps/rag-gateway/src/index.ts`             | `@hono/node-server` 제거, `export default app`           |
| `apps/rag-gateway/src/middleware/logger.ts` | `pino-pretty` transport 조건부(개발만), 운영은 기본 pino |
| `apps/rag-gateway/package.json`             | `@hono/node-server` dev 전용으로 이동                    |
| `render.yaml`                               | 삭제(또는 보관용으로 남기고 사용 중지)                   |

### 단계 2 — 데이터 이전 ①: Blob → R2

**원칙**: 원본은 삭제하지 않고 `rclone`으로 복사 → 검증 → 전환 → 2주 후 Blob 정리.

```bash
# 1) 사전 인벤토리 (객체 수·총 용량 확정)
#    - Vercel 대시보드 Blob 스토어, 또는 기존 admin의 list() 결과로 확인
#    - 기대값: 약 108MB, 객체 수는 blob_files 행 수와 동일해야 함

# 2) R2 버킷 생성 + 공개 커스텀 도메인 연결
npx wrangler r2 bucket create bbakjun-blog-content
# 대시보드: R2 > 버킷 > Settings > Public access > Custom domain → cdn.dev-bbak.site

# 3) 복사 (Vercel Blob은 S3 호환 아님 → HTTP 열거 + 다운로드/업로드 스크립트)
#    스크립트 개요(신규 scripts/migrate-blob-to-r2.ts):
#      a. admin RPC로 blob_files 전체 목록 취득(url, pathname)
#      b. 각 url fetch → 압축 저장 없이 원본 바이트 그대로
#      c. R2에 put(pathname, body, { httpMetadata:{ contentType } })
#         · 키에 한글/공백이 포함된 파일 존재(public/static 이미지 명 참고) → 키는 원본 pathname 유지, URL은 encodeURI
#      d. manifest.csv(url_old, pathname, bytes, sha256) 기록

# 4) 검증: 객체 수 일치 + 표본 20개 sha256 비교 + 총 바이트 일치
npx wrangler r2 object list bbakjun-blog-content   # 개수 확인
```

**R2가 Blob보다 유리한 점**: Class A(쓰기/목록) 1M·Class B(읽기) 10M·저장 10GB 무료, **egress 무료**. 저장소 문서에 따르면 Blob 무료 한도(오퍼레이션 2,000/월) 때문에 CDC를 도입했다는 기록이 있어(`CLAUDE.md:333`), 이 제약 자체가 사라집니다.

### 단계 2-B — 콘텐츠 URL 재작성 (**필수**)

이미지 업로드가 `onImageUploaded(blob.url)`로 **절대 URL을 본문에 삽입**하므로, 이전 후 기존 글의 이미지가 깨집니다.

```bash
# 1) 영향 범위 측정: 전체 MDX 본문에서 호스트 문자열 출현 횟수
#    (스크립트: blob_files 중 .md/.mdx 본문을 읽어 'public.blob.vercel-storage.com' 카운트)
# 2) 치환: https://<store>.public.blob.vercel-storage.com/  →  https://cdn.dev-bbak.site/
#    · 본문(MDX)과 DB(blob_files.url) 양쪽 모두
# 3) 재검증: 위 호스트 문자열 잔존 0건, 이미지 200 응답 표본 확인
```

- 안전장치: Cloudflare에서 `*.public.blob.vercel-storage.com` 경로를 `cdn.dev-bbak.site`로 302 리다이렉트하는 규칙을 2주간 두면 누락분도 커버됩니다(단, Blob 스토어를 그 기간 유지해야 함).

### 단계 3 — 데이터 이전 ②: Neon → D1 (상세)

#### 3-1. 스키마 생성

```bash
cd apps/blog-admin
# 1) D1용 Prisma 스키마 작성 (schema.d1.prisma)
#    - datasource provider = "sqlite"
#    - generator provider = "prisma-client", runtime = "cloudflare", output = "../src/generated/prisma"
#    - @db.Text 5곳 제거 / BigInt·enum 유지
# 2) DDL 추출 (설치 버전에 따라 옵션명 확인: --to-schema-datamodel / --to-schema)
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.d1.prisma --script > migrations/0001_init.sql
# 3) D1 생성 및 적용
npx wrangler d1 create bbakjun-blog-db          # database_id → wrangler.jsonc
npx wrangler d1 migrations apply bbakjun-blog-db --remote
# 4) 확인: 테이블 10개, UNIQUE(blob_files.pathname) 존재
npx wrangler d1 execute bbakjun-blog-db --remote --command "SELECT name, sql FROM sqlite_master WHERE type IN ('table','index')"
```

#### 3-2. 백업 (이중)

```bash
# Neon: 논리 백업 + PITR(Free 6시간) 병행
pg_dump "$DIRECT_URL" -Fc --no-owner --no-acl -f neon-backup-$(date +%F).dump
pg_dump "$DIRECT_URL" --data-only --column-inserts --no-owner -f neon-data-$(date +%F).sql
# 행 수 기준선 저장 (이후 대조용)
psql "$DIRECT_URL" -c "SELECT 'users',count(*) FROM users UNION ALL SELECT 'accounts',count(*) FROM accounts …"
```

#### 3-3. 적재 — 방법 A(권장): Prisma D1 어댑터 경유

이유: **DateTime 저장 형식**을 사람이 맞추지 않아도 됩니다. Prisma 드라이버 어댑터 계층은 SQLite에 `DateTime`을 **ISO-8601 문자열**로 저장하는 것이 기본입니다(`timestampFormat` 옵션의 기본값). 다만 이 옵션이 문서에 명시된 것은 `better-sqlite3`/`libsql` 어댑터이므로 **D1 어댑터는 검증 #2로 확인이 필수**입니다. 만약 `Invalid Date`가 나면 `unixepoch-ms`(정수 밀리초) 방식으로 다시 적재하면 됩니다 — Prisma로 쓰면 어느 쪽이든 100% 일치합니다.

```
[로컬 Node 스크립트]  ──(SELECT, pg)──> Neon
        │  NDJSON 500행 단위 청크, Bearer MIGRATION_TOKEN
        ▼
[임시 Worker 라우트] POST /api/migrate/:table   (Prisma + PrismaD1, 컷오버 후 삭제)
        │  prisma.<model>.create({ data })  ← id/createdAt/updatedAt 명시 전달
        ▼
      D1
```

- 적재 순서(FK): `users → accounts → sessions → verification_tokens → subscribers → experiences → achievements → blob_files → upload_history → settings`
- `id`(cuid)와 `createdAt/updatedAt`를 **명시적으로** 넣어 시각 보존
- `BigInt`는 문자열로 전송 후 `BigInt(v)` 변환
- 청크 크기 200~500행(Worker CPU/메모리·D1 바인딩 한도 고려), 실패 시 해당 테이블만 재시도(idempotent: `upsert` 또는 사전 `deleteMany`)

#### 3-3'. 적재 — 방법 B(대안): SQL 변환 후 `wrangler d1 execute`

```bash
# pg_dump --column-inserts 산출물을 변환:
#   true/false      → 1/0
#   '2025-01-02 03:04:05.678' → '2025-01-02T03:04:05.678Z' (ISO-8601, Prisma 어댑터 기대 형식)
#   NULL            → NULL / '' → ''(그대로)
#   스키마 한정 "public." 제거
npx wrangler d1 execute bbakjun-blog-db --remote --file=seed.sql
```

주의: 문 1개 100KB, 바인딩 100개, 파일 5GB 제한 → **테이블별 파일 분리 + 500행 단위 트랜잭션**. 변환 스크립트를 쓰지 않고 손으로 만들면 위험합니다.

#### 3-4. 검증 (필수 체크)

| #   | 검증        | 방법                                                                         | 합격 기준                   |
| --- | ----------- | ---------------------------------------------------------------------------- | --------------------------- |
| 1   | 행 수 일치  | 테이블별 `COUNT(*)` 양쪽 비교                                                | 10개 테이블 전부 일치       |
| 2   | 시각 무결성 | Prisma로 `findFirst` 후 `instanceof Date`, `!isNaN(Date)`                    | Invalid Date 0건            |
| 3   | BigInt      | `blob_files.size` 최대값 비교                                                | 원본과 동일                 |
| 4   | enum        | `users.role` distinct 값                                                     | `SUPER_ADMIN/ADMIN/GUEST`만 |
| 5   | UNIQUE      | `blob_files.pathname` 중복 0                                                 | 통과                        |
| 6   | FK          | `accounts` 중 고아 userId 0                                                  | 통과                        |
| 7   | 앱 스모크   | Google 로그인 → 파일 목록 → 글 1건 수정 → 이미지 업로드 → 삭제 → 조회수 증가 | 전부 정상                   |
| 8   | 공개 블로그 | `/`, `/blog`, `/blog/<slug>`, `/tags/*`, `/series/*`, RSS, OG 이미지         | 200 + 콘텐츠 일치           |

#### 3-5. 리스크 (D1 이전)

| 리스크                            | 영향                                 | 확률          | 대응                                           |
| --------------------------------- | ------------------------------------ | ------------- | ---------------------------------------------- |
| `$transaction` 무결성 상실        | 다중 쓰기 부분 실패 시 데이터 불일치 | 중            | 3곳을 단일 문/배치로 재설계, 실패 시 보상 로직 |
| 시각 형식 불일치                  | `Invalid Date` → 정렬·표시 오류      | 중            | 방법 A(Prisma 경유) 사용 + 검증 #2             |
| `skipDuplicates`/`mode` 누락 수정 | 런타임 500                           | 높음(방치 시) | PR 5에서 전수 수정, 단위 테스트 추가           |
| D1 단일 스레드                    | 동기화·업로드 동시 실행 시 지연      | 낮음          | CDC 동기화를 Cron 1일 1회로 축소               |
| enum 무검증                       | 오타 값 저장                         | 낮음          | zod 스키마로 앱 레벨 검증 유지                 |
| D1 10GB 한도                      | —                                    | 매우 낮음     | 현재 <10MB                                     |
| 롤백 필요                         | —                                    | 낮음          | Neon 2주 유지 + `DATABASE_URL` 분기(§4.3)      |
| Prisma 7 D1 어댑터 미묘한 버그    | 특정 쿼리 실패                       | 낮음          | 검증 #7·#8 전 항목, 실패 시 안 B로 전환        |

### 단계 4 — 인프라 & 가비아 DNS (무중단 순서)

> 핵심 원칙: **DNS 이전(NS 변경)과 트래픽 이전(Worker 연결)을 분리**합니다. NS를 먼저 옮겨도 기존 레코드를 그대로 복제하면 사이트는 지금처럼 Vercel을 봅니다. 그 다음 워커로 갈아끼웁니다.

**4-1. 사전(전환 48시간 전)**

1. **가비아 관리툴에서 현재 DNS 레코드 전체를 캡처**(A, CNAME, TXT, MX). 특히 **Resend 인증 레코드**:
   - `TXT @  v=spf1 include:_spf.resend.com ~all`
   - `TXT resend._domainkey  <Resend DKIM 값>` ← 값이 가장 중요(누락 시 뉴스레터 발송 실패)
   - `TXT _dmarc  v=DMARC1; p=none; rua=mailto:dmarc@dev-bbak.site`
   - (있으면 MX/메일 인증 레코드)
2. **TTL을 300초로 낮춤**(최소 24시간 유지) → 전파 지연 최소화
3. Google Cloud Console > OAuth 클라이언트에 **새 리디렉션 URI 추가**: `https://admin.dev-bbak.site/api/auth/callback/google` (현재는 `https://bbakjun-blog-admin.vercel.app/api/auth/callback/google`이며, 전환 확인 후 기존 URI 삭제)
4. 배포 스크립트/문서에 박힌 옛 주소 정리: `package.json:23`의 `upload-posts:prod`(`https://bbakjun-blog-admin.vercel.app`)

**4-2. Cloudflare 존 추가 + 레코드 복제**

1. Cloudflare > Add site → `dev-bbak.site` (Free 플랜)
2. 자동 스캔 결과를 **가비아 캡처와 1:1 대조**(특히 TXT). 없으면 수동 추가
3. 처음에는 프록시를 **DNS only(회색)** 로 두어 Vercel 동작을 그대로 유지
4. Cloudflare가 제시한 NS 2개 확인(예: `xxx.ns.cloudflare.com`, `yyy.ns.cloudflare.com`)

**4-2'. 배포 순서 주의 — blog 빌드가 admin에 의존**

- `apps/blog`의 `generateStaticParams()`가 **빌드 시점에 admin RPC(`NEXT_PUBLIC_ADMIN_URL/api`)를 호출**합니다. 따라서 ① **admin을 먼저 배포**, ② 빌드 러너에서 admin URL이 **공개 접근 가능**해야 합니다.
- admin을 Cloudflare Access 등으로 보호하면 **blog 빌드가 깨집니다**. 보호가 필요하면 빌드용 서비스 토큰 헤더를 넣거나, 빌드는 보호 해제 상태에서 수행하세요.

**4-3. 가비아 NS 변경(사용자 직접 수행)**

> My가비아 > 서비스 관리 > 도메인 > **관리툴** > 도메인 정보 변경 > 도메인 선택 > **네임서버** 탭 > 기존 호스트명 전부 삭제 > Cloudflare NS 2개 입력(1차/2차) > **소유자 인증**(휴대폰/이메일) > 적용

- 전파 12~48시간(가비아 안내 1~2일). **이 시점에도 서비스는 Vercel이 응답**(레코드 동일).
- 확인: `dig NS dev-bbak.site` → Cloudflare NS, `dig A dev-bbak.site` → 기존 Vercel IP

**4-4. Worker 배포 + 도메인 연결**

```bash
# 각 앱에서 (turbo로 의존 패키지 먼저 빌드)
pnpm build:rpc && pnpm --filter @apps/blog-admin exec opennextjs-cloudflare build
pnpm --filter @apps/blog-admin exec wrangler deploy
# 1차 검증은 workers.dev 도메인에서 (OG/사이트맵은 운영 도메인 기준이라 일부만 확인)
```

1. Cloudflare > Workers > `bbakjun-blog` > Settings > **Custom Domains** → `dev-bbak.site`, `www.dev-bbak.site`
2. `bbakjun-blog-admin` → `admin.dev-bbak.site`
3. 이 순간 해당 레코드가 Worker로 바뀝니다(프록시 주황). **롤백 = 레코드를 원래 A/CNAME으로 되돌리기(수 분)**

**4-5. 전환 순서 권장**
| 순서 | 대상 | 이유 |
|---|---|---|
| 1 | `admin.dev-bbak.site` | 비공개·사용자 1명 → 위험 최소, D1/R2 실전 검증 |
| 2 | `rag.dev-bbak.site` | 내부 API, 소비자는 admin·MCP뿐 |
| 3 | `dev-bbak.site` (blog) | 최종 사용자 노출 → 마지막 |

**4-6. 전환 후 정리**

- 24~48시간 모니터링: 5xx율, ISR 재검증 동작(글 수정 → `/api/revalidate` → 1분 내 반영), 조회수 증가, 뉴스레터 발송
- Vercel은 **2~4주 병행 유지**(롤백 경로) → 이후 프로젝트 삭제 및 Pro 해지(12월 결제 전 해지하면 다음 달부터 $0)
- Neon: 2주 후 PITR 만료 전 최종 덤프 보관 → 프로젝트 삭제
- Render: rag Worker 안정화 후 서비스 삭제

### 단계 5 — rag-gateway → Workers (선택, 비용 $0이므로 급하지 않음)

```jsonc
// apps/rag-gateway/wrangler.jsonc
{
  "name": "bbakjun-rag",
  "main": "src/index.ts",
  "compatibility_date": "2026-11-01",
  "compatibility_flags": ["nodejs_compat", "nodejs_compat_populate_process_env"],
  "vars": { "NODE_ENV": "production" },
}
```

- `src/index.ts`: `serve()` 제거 → `export default app` (컬렉션 초기화는 최초 요청 시 lazy + `ctx.waitUntil`)
- 시크릿: `wrangler secret put QDRANT_URL|QDRANT_API_KEY|OPENAI_API_KEY|GLM_API_KEY|RAG_GATEWAY_API_KEY`
- `process.env`는 `nodejs_compat_populate_process_env`로 채워지므로 `src/env.ts` 수정 불필요(검증 필요)
- 레이트리밋: Upstash 유지 또는 Durable Object로 이전(인메모리 폴백은 isolate 단위라 부정확)

### 6.4 배포 설정 스니펫

```jsonc
// apps/blog/wrangler.jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "bbakjun-blog",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-11-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "services": [{ "binding": "WORKER_SELF_REFERENCE", "service": "bbakjun-blog" }],
  "r2_buckets": [
    { "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "bbakjun-blog-isr" },
    { "binding": "CONTENT_BUCKET", "bucket_name": "bbakjun-blog-content" },
  ],
  "d1_databases": [
    {
      "binding": "NEXT_TAG_CACHE_D1",
      "database_name": "bbakjun-blog-tagcache",
      "database_id": "<ID>",
    },
  ],
  "durable_objects": {
    "bindings": [{ "name": "NEXT_CACHE_DO_QUEUE", "class_name": "DOQueueHandler" }],
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["DOQueueHandler"] }],
}
```

```ts
// apps/blog/open-next.config.ts
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import { d1NextModeTagCache } from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';
import { doQueue } from '@opennextjs/cloudflare/overrides/queue/do-queue';

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  tagCache: d1NextModeTagCache,
});
```

> 정확한 import 경로·옵션명은 설치 버전 문서를 따르세요. `npx @opennextjs/cloudflare migrate`가 `wrangler.jsonc`/`open-next.config.ts` 초안을 생성합니다.

---

## 7. 데이터 인벤토리 (이전 전 확정해야 할 값)

| 항목                     | 현재 파악                           | 확정 방법                                |
| ------------------------ | ----------------------------------- | ---------------------------------------- |
| Blob 총 용량             | **108MB**(전달값)                   | Vercel 대시보드 / `list()` 합계          |
| Blob 객체 수             | 미확인                              | `blob_files` 행 수 = 객체 수             |
| MDX 글 수                | 미확인                              | `blob_files WHERE pathname LIKE '%.md%'` |
| 본문 내 Blob URL 출현 수 | 미확인                              | URL 재작성 대상 건수                     |
| DB 행 수                 | 미확인(예상 <1만)                   | §3-2 기준선 쿼리                         |
| D1 예상 용량             | <10MB                               | 이전 후 `wrangler d1 info`               |
| 월 요청 수               | 약 1.7M CDN 요청/월(13일 실측 환산) | Vercel Analytics                         |
| Active CPU               | 약 6.9시간/월(환산)                 | Vercel 사용량                            |

---

## 8. 리스크 등록부

| #   | 리스크                                                   | 영향               | 확률          | 대응                                                                                             |
| --- | -------------------------------------------------------- | ------------------ | ------------- | ------------------------------------------------------------------------------------------------ |
| R1  | Next 16.4 업그레이드 회귀(NextAuth 5 beta·`proxy.ts`)    | 빌드/로그인 실패   | 중            | Vercel에서 먼저 배포·검증, 실패 시 16.4.6 범위 내 롤백                                           |
| R2  | OpenNext Node 미들웨어(실험적)에서 Prisma 세션 조회 실패 | admin 접근 불가    | 중            | 미들웨어에서 DB 조회를 제거하고 레이아웃 서버 컴포넌트에서 검증(권장 리팩터), 또는 JWT 세션 전환 |
| R3  | `@vercel/blob/client` 대체 후 5MB 업로드 실패            | 이미지 업로드 불가 | 중            | Worker 경유 업로드 스트리밍(`request.body` → `bucket.put`), 5MB 제한 유지·검증                   |
| R4  | ISR 태그 캐시 설정 누락 → 글 수정이 반영 안 됨           | 콘텐츠 지연        | 중            | `revalidatePath` 경로 실측(수정→1분 내 반영) 체크리스트화                                        |
| R5  | NS 전환 중 Resend DKIM 누락                              | 뉴스레터 발송 실패 | 중            | 전환 전 TXT 레코드 1:1 대조, 전환 후 테스트 발송                                                 |
| R6  | Google OAuth 리디렉션 URI 미등록                         | admin 로그인 불가  | 높음(방치 시) | §4-1-3 선행                                                                                      |
| R7  | Worker 메모리 128MB 초과(대량 포스트 렌더)               | 500 오류           | 낮음          | R2 바인딩 읽기(PR 3)로 메모리·서브리퀘스트 절감, 실패 시 포인터 캐시(포스트 1건만 로드)          |
| R8  | Cloudflare 부가세/환율로 $5.5 초과                       | 소액               | 중            | 지출 한도(spending limit) 설정, 청구 주소 확인                                                   |
| R9  | 무중단 전환 실패 시 SEO 영향                             | 일시 5xx           | 낮음          | TTL 300 + Vercel 병행 + 레코드 롤백 절차 문서화                                                  |
| R10 | Prisma D1 어댑터의 미묘한 동작 차이                      | 특정 화면 오류     | 낮음          | 검증 #7·#8, 안 B(Neon+Hyperdrive) 즉시 전환 가능 구조 유지                                       |

---

## 9. 예상 비용

### 9-1. 현재 (2026-11 기준, 확인된 청구서)

| 항목                                         | 월                                                                          |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| Vercel Pro (Speed Insights Plus $10 해지 후) | $20 + VAT $2 = **$22**                                                      |
| Neon Postgres                                | **확인 필요**(대화 중 $10 언급과 "무료 티어" 언급이 엇갈림. Neon Free = $0) |
| Upstash Redis                                | $0                                                                          |
| Render (rag-gateway)                         | $0                                                                          |
| Vercel Blob                                  | Pro 포함 한도 내(108MB)                                                     |
| **합계**                                     | **$22 (연 $264)** · Neon이 유료였다면 $32                                   |

### 9-2. 이전 후

| 항목                                                         | 월                  | 근거                                                          |
| ------------------------------------------------------------ | ------------------- | ------------------------------------------------------------- |
| Workers Paid (계정 최소 과금)                                | $5                  | 요청 10M/월, CPU 30M ms 포함. 요청은 static asset 무료·무제한 |
| 부가세(결제 주소 기준 10%)                                   | $0.5                |                                                               |
| R2 `bbakjun-blog-content` (108MB, 목록 1회/일, 읽기 수만/월) | $0                  | 10GB·Class A 1M·Class B 10M 무료                              |
| R2 `bbakjun-blog-isr` (수 MB)                                | $0                  | 동일                                                          |
| D1 ×2 (수 MB, 읽기 수십만/월)                                | $0                  | 5GB·25B reads·50M writes 포함                                 |
| Durable Objects (ISR 재검증 큐, 소량)                        | $0                  | Workers Paid 포함 한도(요청/저장 소량)                        |
| Qdrant / Upstash / Resend                                    | $0                  | 기존 무료 티어 유지                                           |
| **합계**                                                     | **≈ $5.5 (연 $66)** |                                                               |

### 9-3. 절감

| 시나리오                                                         | 월 절감          | 연 절감  |
| ---------------------------------------------------------------- | ---------------- | -------- |
| 기준($22 → $5.5)                                                 | **$16.5 (-75%)** | **$198** |
| Speed Insights 해지 전 기준($33 → $5.5)                          | $27.5            | $330     |
| **이미 다른 프로젝트로 Workers Paid를 쓰는 경우**($22 → $0 추가) | **$22**          | **$264** |
| Neon이 유료($10)였다면 동시 해지                                 | $26.5            | $318     |

> Workers Free($0)는 **비현실적**입니다: CPU 10ms/요청, 서브리퀘스트 50/요청 — 이 앱은 글 1건 렌더에 전체 포스트를 fetch하는 구조라 즉시 한도 초과합니다. **Paid $5는 필수 전제**입니다.

---

## 10. 실행 체크리스트 (요약)

**코드**

- [ ] next 16.4.6 업그레이드, Vercel 배포 검증
- [ ] `@vercel/kv`, 미사용 `@vercel/blob`(packages/content) 제거
- [ ] `@vercel/analytics` 제거 → Cloudflare Web Analytics
- [ ] 스토리지 추상화 + R2 구현 + 클라이언트 업로드 경로 교체
- [ ] blog: R2 바인딩 직접 읽기(선택, 권장)
- [ ] Prisma sqlite 스키마 + `@prisma/adapter-d1`
- [ ] `$transaction` 3곳 / `skipDuplicates` 2곳 / `mode:'insensitive'` 3곳 수정
- [ ] `hono/vercel` → 표준 `fetch` 핸들러
- [ ] rag-gateway `export default app`
- [ ] wrangler/open-next 설정 + GitHub Actions 배포

**데이터**

- [ ] R2 객체 복사 + sha256 검증
- [ ] MDX·DB URL 재작성(`blob.vercel-storage.com` → `cdn.dev-bbak.site`) 잔존 0
- [ ] Neon `pg_dump` 이중 백업 + 행 수 기준선
- [ ] D1 스키마 적용 + Prisma 경유 적재
- [ ] 검증 8종(행 수·시각·BigInt·enum·UNIQUE·FK·admin 스모크·공개 블로그)

**인프라**

- [ ] 가비아 DNS 레코드 캡처(TXT 포함), TTL 300
- [ ] Google OAuth 리디렉션 URI 추가
- [ ] Cloudflare 존 추가 + 레코드 1:1 복제(프록시 off)
- [ ] 가비아 NS 변경(소유자 인증)
- [ ] admin → rag → blog 순서로 Custom Domain 연결
- [ ] 48시간 모니터링 후 Vercel Pro 해지 / Neon·Render 정리

---

## 11. 남은 확인 필요 사항 (사용자/대시보드 확인)

1. **Neon 유료 여부** — 무료면 절감액은 $16.5/월, 유료($10)면 $26.5/월.
2. **Cloudflare 계정에 이미 Workers Paid가 있는지** — 있다면 추가 비용 **$0**(절감 $22/월).
3. **Vercel Blob 실제 객체 수**(= `blob_files` 행 수) — R2 스크립트 예상 시간 산정.
4. **가비아 DNS 레코드 전체 목록** — 특히 Resend `resend._domainkey` DKIM 값(TXT). 이 값이 없으면 전환 후 뉴스레터가 죽습니다.
5. **Google OAuth 승인 리디렉션 URI 현황** — admin 최종 도메인 확정 후 등록.
6. **`admin` 최종 도메인** — `admin.dev-bbak.site` 권장(현재 vercel.app 주소에서 변경 시 쿠키/콜백 모두 갱신 필요).

---

## 부록 A — 참고 근거(외부 문서, 2026-11-17 확인)

- Workers 가격·한도: `$5/월 최소, 요청 10M 포함, static asset 요청 무료·무제한, subrequest 10,000/요청(Paid) / 50(Free), CPU 30초 기본`
- R2 가격: `저장 10GB·Class A 1M·Class B 10M 무료, egress 무료, $0.015/GB-월`
- D1 가격·한도: `DB당 10GB(Paid)/500MB(Free), 라이브 25B rows·쓰기 50M/월 포함, Time Travel 30일, 바인딩 100개, LIKE 50바이트, DB당 단일 스레드`
- Hyperdrive: `Workers Paid 포함, 쿼리 무제한`(Neon 유지 시 대안)
- Neon Free: `100 CU-hours/프로젝트/월, 1GB 저장, public network transfer 5GB/월 초과 시 컴퓨트 정지`
- `@opennextjs/cloudflare@1.20.17` peer: `next >=15.5.29 <16 || >=16.4.5`, `wrangler ^4.148.0` / Next 최신 16.4.6
- OpenNext 캐싱 권장(소규모+revalidation): `R2 증분 캐시 + DO 큐 + D1NextModeTagCache`
- Prisma: SQLite/D1 `Enum→TEXT`, `BigInt→INTEGER`, 드라이버 어댑터 `DateTime` 기본 ISO-8601, `skipDuplicates` 미지원, `mode:'insensitive'` 미지원, D1 `$transaction` 무시
- 가비아 NS 변경: My가비아 > 서비스 관리 > 도메인 관리툴 > 도메인 정보 변경 > 네임서버 > 소유자 인증 > 적용 (전파 12~48시간)
