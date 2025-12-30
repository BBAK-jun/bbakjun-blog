# RAG Gateway - Render 무료 플랜 배포

- **Feature**: Render Free Tier Deployment
- **Based on Facts**:
  - [../../facts/apps/rag-gateway/index.md](../../facts/apps/rag-gateway/index.md)
  - [../../facts/apps/rag-gateway/config/index.md](../../facts/apps/rag-gateway/config/index.md)
- **Based on Insights**:
  - [../../insights/apps/rag-gateway/impact/cost.md](../../insights/apps/rag-gateway/impact/cost.md)
- **Created**: 2025-12-29
- **Status**: Implemented

---

## 개요

RAG Gateway를 Render 무료 플랜에 배포하여 인프라 비용을 $20-50/월 절감하는 기능입니다. Vercel Pro ($20-40/월) 대신 Render Free Web Service를 사용하여 동일한 기능을 무료로 제공합니다.

### 비용 절감 효과

| 항목 | Vercel Pro | Render Free | 절감액 |
|------|------------|-------------|--------|
| 호스팅 | $20-40/월 | $0 | **$20-40/월** |
| 총 비용 | $45-100/월 | $25-50/월 | **$20-50/월 (44-50%)** |

---

## 기술 사양

### 1. Render 배포 설정

**파일**: `render.yaml` (루트 디렉토리)

```yaml
services:
  - type: web
    name: rag-gateway
    runtime: node
    buildCommand: pnpm build:rag-gateway
    startCommand: pnpm start

    # Health check
    healthCheckPath: /api/admin/health

    # Build filters - RAG Gateway 파일만 변경 시 재배포
    buildFilter:
      includedPaths:
        - apps/rag-gateway/**
        - packages/**
        - turbo.json
        - pnpm-lock.yaml
        - pnpm-workspace.yaml
      ignoredPaths:
        - apps/blog/**
        - apps/blog-admin/**

    # 환경 변수 (Render 대시보드에서 설정)
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3002
```

### 2. 필수 환경 변수

Render 대시보드 → rag-gateway → Environment 탭에서 설정:

| 변수 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `QDRANT_URL` | URL | 예 | Qdrant Cloud URL |
| `QDRANT_API_KEY` | string | 조건 | Qdrant API 키 (필요 시) |
| `GLM_API_KEY` | string | **예** | Zhipu AI GLM API 키 |
| `RAG_GATEWAY_API_KEY` | string | 예 | API 인증 키 |
| `BLOG_ADMIN_URL` | URL | 예 | Blog-Admin URL |
| `REDIS_URL` | URL | 아니오 | Rate limiting용 Redis (선택) |

### 3. Build 필터 최적화

```yaml
buildFilter:
  includedPaths:
    - apps/rag-gateway/**    # RAG Gateway 코드 변경 시만 재배포
    - packages/**            # 공유 패키지 변경
    - turbo.json             # 빌드 설정 변경
  ignoredPaths:
    - apps/blog/**           # Blog 앱 변경 무시
    - apps/blog-admin/**     # Blog-Admin 앱 변경 무시
```

**효과**: Blog/Blog-Admin 변경으로 불필요한 RAG Gateway 재배포 방지

---

## 사용자 시나리오

### 시나리오 1: 최초 배포

```bash
# 1. GitHub에 레포지토리 푸시
git add render.yaml
git commit -m "feat: add Render deployment config"
git push origin main

# 2. Render 대시보드에서 Blueprint 생성
# Dashboard → New → Blueprint → 레포지토리 선택 → Apply Blueprint

# 3. 환경 변수 설정
# Render → rag-gateway → Environment → 환경 변수 입력

# 4. 배포 확인
# Dashboard → rag-gateway → Events → "Build completed"
```

### 시나리오 2: Qdrant 문서 인제스트

```bash
# Render 서비스가 시작된 후 문서 업로드
export RAG_GATEWAY_URL=https://rag-gateway.onrender.com

cd apps/rag-gateway
node scripts/ingest-claude-docs.ts
```

### 시나리오 3: 슬립 모드 해결

```bash
# 방법 1: UptimeRobot 설정 (https://uptimerobot.com)
# - URL: https://rag-gateway.onrender.com/api/admin/health
# - 간격: 5분
# - 상태: Active

# 방법 2: cron-job.org 설정 (https://cron-job.org)
# - URL: https://rag-gateway.onrender.com/api/admin/health
# - 스케줄: 매 10분
```

### 시나리오 4: 문서 전체 재인덱싱 (Render 환경)

```bash
# Render는 영구 스토리지가 없으므로 cleanup-stale-docs.ts 스크립트 사용 불가
# 대신 컬렉션 전체 삭제 후 재인제스트

# 1. 컬렉션 삭제
curl -X DELETE https://rag-gateway.onrender.com/api/admin/collection \
  -H "X-RAG-API-Key: $RAG_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"confirm": "yes"}'

# 2. 문서 재인제스트
node scripts/ingest-claude-docs.ts
```

---

## API 사양

### DELETE /api/admin/collection

**Purpose**: 전체 컬렉션 삭제 (모든 벡터 제거)

**Request**:
```bash
curl -X DELETE https://rag-gateway.onrender.com/api/admin/collection \
  -H "X-RAG-API-Key: $RAG_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"confirm": "yes"}'
```

**Response** (200 OK):
```json
{
  "message": "All vectors deleted from collection",
  "deletedCount": 1250,
  "clearedAt": "2025-12-29T12:00:00.000Z"
}
```

**Error** (400 Bad Request):
```json
{
  "error": "Must confirm with confirm=yes"
}
```

---

## 제한사항 및 해결 방안

### 제한사항 1: 슬립 모드

**문제**: 15분 요청 없으면 서비스 중지, 콜드 스타트 ~30초

**해결 방안**:
1. UptimeRobot (무료)으로 5분 간격 핑
2. cron-job.org (무료)으로 10분 간격 핑
3. Health check endpoint: `/api/admin/health`

### 제한사항 2: 영구 스토리지 없음

**문제**: `cleanup-stale-docs.ts` 스크립트 사용 불가 (파일시스템 접근 불가)

**해결 방안**:
1. `DELETE /api/admin/collection`으로 전체 재인덱싱
2. Vercel Blob Storage 메타데이터 기반 cleanup 스크립트 개발

### 제한사항 3: RAM 제한 (512MB)

**문제**: 메모리 집약적 작업 시 OOM 위험

**해결 방안**:
1. 배치 사이즈 줄이기 (`batchSize: 5`)
2. 인제스트 작업을 외부에서 실행 (로컬 머신)

### 제한사항 4: 실행 시간 제한 (750시간/월)

**문제**: 월간 실행 시간 초과 시 슬립

**해결 방안**:
1. UptimeRobot으로 최소한의 핑만 보내기
2. 필요할 때만 수동으로 깨우기

---

## 성능 요구사항

### Health Check

- **엔드포인트**: `GET /api/admin/health`
- **타임아웃**: 30초
- **성공 기준**: HTTP 200 + `{"status": "healthy"}`

### 배포 시간

- **빌드 시간**: ~3-5분 (Turborepo 캐시 활용)
- **콜드 스타트**: ~30초 (슬립 모드 후)

### 동시성

- **최대 동시 요청**: 10개 (Render Free 제한)
- **Rate Limiting**: 60 req/min (Redis 기반)

---

## 보안 고려사항

### 1. 환경 변수 관리

- **규칙**: 모든 API 키를 Render Environment Variables에만 저장
- **금지**: `.env` 파일을 커밋하지 않기
- **회전**: 주기적 키 rotation (월 1회 권장)

### 2. Health Check 공개

**문제**: `/api/admin/health`가 공개 엔드포인트

**해결 방안**:
- 옵션 1: 별도의 공개 health endpoint 생성
- 옵션 2: Rate limiting 적용 (현재 30 req/min)
- 옵션 3: IP 화이트리스트 추가

### 3. CORS 설정

```bash
ALLOWED_ORIGINS=https://your-blog.vercel.app,https://your-admin.vercel.app
```

---

## 모니터링 및 로그

### Render Logs

```
Dashboard → rag-gateway → Logs
```

### 주요 로그 이벤트

| 이벤트 | 로그 레벨 | 설명 |
|--------|-----------|------|
| 서버 시작 | info | "RAG Gateway listening on port 3002" |
| Qdrant 연결 | info | "Connected to Qdrant at {url}" |
| API 요청 | debug | "POST /api/rag/query - 200" |
| Rate limit 초과 | warn | "Rate limit exceeded for {ip}" |
| 에러 | error | "Failed to generate embedding" |

### 메트릭 수집

```bash
# Health Check (수동)
curl https://rag-gateway.onrender.com/api/admin/health | jq

# Stats 조회
curl https://rag-gateway.onrender.com/api/admin/stats \
  -H "X-RAG-API-Key: $RAG_GATEWAY_API_KEY" | jq
```

---

## 롤백 절차

### 문제 발생 시

```bash
# 1. 이전 커밋으로 되돌리기
git revert HEAD

# 2. GitHub에 푸시 (자동 재배포)
git push origin main

# 3. Render Events에서 배포 확인
# Dashboard → rag-gateway → Events
```

### Vercel로 이동 시

```bash
# 1. render.yaml 삭제 (선택사항)
git rm render.yaml

# 2. Vercel 프로젝트 설정
vercel link

# 3. 배포
vercel --prod
```

---

## 테스트 계획

### 기능 테스트

| 테스트 케이스 | 예상 결과 | 검증 방법 |
|--------------|----------|----------|
| Health check | 200 OK | `curl /api/admin/health` |
| RAG query | 답변 반환 | `POST /api/rag/query` |
| 컬렉션 삭제 | 삭제 완료 | `DELETE /api/admin/collection` |
| Rate limiting | 429 반환 | 60+ req/min 요청 |

### 성능 테스트

| 메트릭 | 목표치 | 측정 방법 |
|--------|--------|----------|
| 콜드 스타트 | < 60초 | 슬립 후 `curl` 응답 시간 |
| RAG query | < 5초 | `time curl POST /api/rag/query` |
| 인제스트 속도 | > 10 docs/min | `ingest-claude-docs.ts` 실행 |

---

## 참고 자료

- [Render 공식 문서](https://render.com/docs)
- [render.yaml 스펙](https://render.com/docs/yaml-spec)
- [DEPLOYMENT.md](../../../apps/rag-gateway/docs/DEPLOYMENT.md) - 상세 배포 가이드
- [Facts: Configuration](../../facts/apps/rag-gateway/config/index.md)
- [Insights: Cost Analysis](../../insights/apps/rag-gateway/impact/cost.md)
