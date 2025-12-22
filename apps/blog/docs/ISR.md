# ISR (Incremental Static Regeneration) 가이드

## 개요

이 블로그는 **ISR (Incremental Static Regeneration)**을 사용하여 정적 사이트의 성능과 동적 콘텐츠 업데이트의 장점을 모두 활용합니다.

## ISR이란?

ISR은 Next.js의 기능으로, 빌드 후에도 정적 페이지를 **주기적으로 또는 요청 시** 재생성할 수 있게 해줍니다.

### 전통적인 SSG vs ISR

**SSG (Static Site Generation)**:

- 빌드 시 모든 페이지 생성
- 콘텐츠 변경 시 전체 재빌드 필요
- 빠른 로딩 속도

**ISR**:

- 빌드 시 페이지 생성 + 주기적 재생성
- 콘텐츠 변경 시 자동 반영 (시간 기반 또는 On-demand)
- 빠른 로딩 속도 유지

## 적용된 ISR 설정

### 1. 블로그 포스트 페이지 (`/blog/[...slug]`)

**Revalidation 주기**: 60초

```typescript
export const revalidate = 60; // 60초마다 재검증
export const dynamicParams = true; // 새 포스트도 런타임에 생성
```

**동작 방식**:

1. 사용자가 포스트 방문
2. 마지막 생성 후 60초 이상 지났다면:
   - 기존 캐시된 페이지를 먼저 제공 (빠른 응답)
   - 백그라운드에서 새 버전 생성
   - 다음 요청부터 새 버전 제공

### 2. 홈페이지 (`/`)

**Revalidation 주기**: 60초

```typescript
export const revalidate = 60;
```

**동작 방식**:

- 최신 포스트 목록이 60초마다 자동 업데이트
- 새 포스트 작성 시 1분 이내 자동 반영

### 3. 태그 페이지 (`/tags/[tag]`)

**Revalidation 주기**: 300초 (5분)

```typescript
export const revalidate = 300;
export const dynamicParams = true;
```

**동작 방식**:

- 태그별 포스트 목록이 5분마다 업데이트
- 새 태그도 런타임에 자동 생성

## On-Demand Revalidation

시간 기반 재검증 외에도, **즉시 재검증**이 가능합니다.

### API 엔드포인트

```
POST /api/revalidate?secret=<token>&path=/blog/my-post
```

### 사용 예시

#### 1. 특정 포스트 재검증

```bash
curl -X POST \
  'https://your-blog.vercel.app/api/revalidate?secret=YOUR_SECRET&path=/blog/my-post'
```

#### 2. 모든 블로그 페이지 재검증

```bash
curl -X POST \
  'https://your-blog.vercel.app/api/revalidate?secret=YOUR_SECRET&all=true'
```

### Blog-Admin 통합

Admin에서 포스트 수정 시 자동으로 재검증 API 호출:

```typescript
// blog-admin에서 포스트 업데이트 후
await fetch(`${BLOG_URL}/api/revalidate?secret=${REVALIDATION_SECRET}&path=/blog/${slug}`, {
  method: 'POST',
});
```

## 환경 변수 설정

### 로컬 개발 (`.env.local`)

```env
REVALIDATION_SECRET=gKvUkQuiix93rC+NiA3DTWkztrnE0vhHOvRYzLlL+OM=
```

### Vercel 프로덕션

```
Settings → Environment Variables → Add New
```

**Name**: `REVALIDATION_SECRET`
**Value**: `gKvUkQuiix93rC+NiA3DTWkztrnE0vhHOvRYzLlL+OM=`
**Environments**: Production, Preview

## ISR 동작 확인

### 1. 로컬 테스트

```bash
# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 포스트 방문
open http://localhost:3000/blog/your-post

# 60초 대기 후 재방문 (백그라운드 재생성 확인)
# 터미널에서 빌드 로그 확인
```

### 2. On-demand Revalidation 테스트

```bash
# 특정 경로 재검증
curl -X POST \
  'http://localhost:3000/api/revalidate?secret=gKvUkQuiix93rC+NiA3DTWkztrnE0vhHOvRYzLlL+OM=&path=/blog/your-post'

# 응답 예시:
# {
#   "revalidated": true,
#   "paths": ["/blog/your-post", "/", "/blog"],
#   "timestamp": "2025-12-16T10:30:00.000Z"
# }
```

### 3. Vercel 배포 후 확인

**Vercel Logs**:

```
Deployments → Functions → Logs

검색: "revalidat"
```

**Cache Headers 확인**:

```bash
curl -I https://your-blog.vercel.app/blog/your-post

# 응답 헤더에서 확인:
# x-vercel-cache: HIT (캐시에서 제공)
# x-vercel-cache: MISS (새로 생성)
# x-vercel-cache: STALE (재검증 중)
```

## 성능 영향

### 장점

1. **빠른 로딩 속도**: 정적 페이지 수준의 성능 유지
2. **자동 업데이트**: 재빌드 없이 콘텐츠 자동 반영
3. **서버 부하 감소**: 캐시 활용으로 DB 쿼리 최소화
4. **SEO 최적화**: 정적 페이지로 크롤링 친화적

### 주의사항

1. **Revalidation 간격 설정**:
   - 너무 짧으면: 서버 부하 증가, 빌드 비용 증가
   - 너무 길면: 콘텐츠 업데이트 지연
   - 권장: 콘텐츠 업데이트 빈도에 따라 조정

2. **Build Time**:
   - `generateStaticParams()`는 여전히 빌드 시 실행
   - 포스트가 많으면 초기 빌드 시간 증가
   - 해결: `dynamicParams: true`로 일부만 빌드

3. **캐시 전략**:
   - 첫 방문자는 오래된 캐시 볼 수 있음
   - 중요한 업데이트는 On-demand Revalidation 사용

## 모범 사례

### 1. Revalidation 주기 선택

```typescript
// 자주 변경되는 페이지
export const revalidate = 60; // 1분

// 보통 변경되는 페이지
export const revalidate = 300; // 5분

// 거의 변경되지 않는 페이지
export const revalidate = 3600; // 1시간
```

### 2. On-demand Revalidation 활용

Admin에서 포스트 CRUD 시:

```typescript
// 생성
await revalidateBlogPost(slug);
await revalidateHomePage();

// 수정
await revalidateBlogPost(slug);

// 삭제
await revalidateBlogPost(slug);
await revalidateHomePage();
```

### 3. 캐시 무효화 전략

```typescript
// revalidate API 호출 시 연관 페이지도 함께 재검증
if (path) {
  revalidatePath(path); // 포스트 페이지
  revalidatePath('/'); // 홈페이지 (최신글 목록)
  revalidatePath('/blog'); // 블로그 목록
}
```

## 트러블슈팅

### 문제: ISR이 작동하지 않음

**원인**: 개발 모드에서는 ISR이 작동하지 않음

**해결**:

```bash
# 개발 모드 (ISR 비활성화)
pnpm dev

# 프로덕션 빌드 후 테스트 (ISR 활성화)
pnpm build && pnpm start
```

### 문제: Revalidation 후에도 콘텐츠가 업데이트되지 않음

**원인**: 브라우저 캐시 또는 CDN 캐시

**해결**:

```bash
# Hard refresh (브라우저)
Cmd+Shift+R (Mac) 또는 Ctrl+Shift+R (Windows)

# Vercel에서 캐시 purge
vercel purge <url>
```

### 문제: On-demand Revalidation 실패

**원인**: Secret 토큰 불일치

**해결**:

```bash
# .env.local 확인
echo $REVALIDATION_SECRET

# Vercel 환경 변수 확인
vercel env ls

# 재배포
vercel --prod
```

## 참고 자료

- [Next.js ISR 공식 문서](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [revalidatePath API](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [Vercel ISR 가이드](https://vercel.com/docs/incremental-static-regeneration)

---

**마지막 업데이트**: 2025-12-16
**Next.js 버전**: 16.0.8
