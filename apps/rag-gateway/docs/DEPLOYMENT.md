# RAG Gateway 배포 가이드 (Render)

이 가이드는 RAG Gateway를 Render 무료 플랜에 배포하는 방법을 설명합니다.

## 사전 준비

### 1. 필수 서비스 계정

- [Render 계정](https://render.com/register) (GitHub 연동 필요)
- [Qdrant Cloud](https://cloud.qdrant.io/) (무료 1GB 클러스터)
- GLM API Key (Zhipu AI)

### 2. Qdrant Cloud 설정

```bash
# 1. Qdrant Cloud 가입 후 클러스터 생성
# 2. API Key 발급
# 3. Cluster URL 확인 (예: https://xyz.xyz.aws.cloud.qdrant.io)
```

## 배포 단계

### 1단계: GitHub에 푸시

```bash
# render.yaml이 루트 디렉토리에 있는지 확인
git add render.yaml
git commit -m "feat: add Render deployment config"
git push origin main
```

### 2단계: Render 대시보드에서 New Service 생성

1. Render 대시보드 → **New** → **Blueprint**
2. 리포지토리 선택: `bbakjun-blog`
3. 루트 경로에 `render.yaml` 확인
4. **Apply Blueprint** 클릭

### 3단계: 환경 변수 설정

Render 대시보드의 **rag-gateway** 서비스 → **Environment** 탭에서 설정:

```bash
# 필수 환경 변수
QDRANT_URL=https://xyz.xyz.aws.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
RAG_GATEWAY_API_KEY=your_secure_api_key_here
GLM_API_KEY=your_glm_api_key
BLOG_ADMIN_URL=https://your-blog-admin.vercel.app

# 선택 사항 (Rate Limiting용 Redis)
REDIS_URL=redis://default:password@host:port

# 알림 설정 (선택사항)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#notifications
NOTIFICATION_EMAILS=user1@example.com,user2@example.com
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

#### 환경 변수 생성 방법

```bash
# RAG_GATEWAY_API_KEY 생성
openssl rand -base64 32
```

### 4단계: 배포 확인

```
Render Dashboard → rag-gateway → Events
```

**성공적인 배포 로그:**

```
✅ Build completed
✅ Service is healthy
✅ Deployed to: https://rag-gateway.onrender.com
```

## Qdrant 문서 임베딩 (최초 1회)

Render 서비스가 시작된 후 문서를 Qdrant에 업로드:

```bash
# Render 서비스 URL
export RAG_GATEWAY_URL=https://rag-gateway.onrender.com

# 문서 업로드
cd apps/rag-gateway
node scripts/ingest-claude-docs.ts
```

## 테스트

```bash
# Health Check
curl https://rag-gateway.onrender.com/api/admin/health

# RAG Query (API Key 필요)
curl -X POST https://rag-gateway.onrender.com/api/rag/query \
  -H "X-RAG-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"query": "TypeScript란 무엇인가요?", "limit": 5}'
```

## Render 무료 플랜 제한사항

| 항목      | 제한                       |
| --------- | -------------------------- |
| RAM       | 512MB                      |
| CPU       | 공유 코어                  |
| 스토리지  | 없음 (ephemeral)           |
| 실행 시간 | 750시간/월 (~31일)         |
| 슬립 모드 | 15분 요청 없으면 자동 슬립 |

**중요:** Render 무료 플랜은 **영구 스토리지가 없습니다**. 파일시스템 기반 `cleanup-stale-docs.ts` 스크립트는 작동하지 않습니다.

### 슬립 모드 해결 방법

Render Free Tier는 15분간 요청이 없으면 서비스가 중지(sleep)됩니다. 깨어나는 데 약 30초가 소요됩니다.

**해결책:**

1. **Cron-job.org** (무료)로 주기적 ping

   ```bash
   # 매 10분마다 ping
   https://cron-job.org 로 등록
   URL: https://rag-gateway.onrender.com/api/admin/health
   ```

2. **UptimeRobot** (무료)로 모니터링
   ```
   https://uptimerobot.com
   - 5분 간격 체크
   - 슬립 방지
   ```

## 문서 동기화 전략 (Render)

### 옵션 1: 전체 Clear + Upsert (권장)

```bash
# 배포 시마다 실행
curl -X DELETE https://rag-gateway.onrender.com/api/admin/collection \
  -H "Content-Type: application/json" \
  -d '{"confirm": "yes"}'

# 문서 재업로드
node scripts/ingest-claude-docs.ts
```

### 옵션 2: Blob Storage 기반 Cleanup (고급)

Vercel Blob Storage 메타데이터와 Qdrant 문서를 비교하여 stale 문서 삭제:

```typescript
// scripts/cleanup-stale-docs-render.ts
const blobFiles = await list({ mode: 'expanded' });
const qdrantDocs = await getQdrantDocuments();

const staleDocs = qdrantDocs.filter(
  doc => !blobFiles.some(blob => blob.pathname.includes(doc.slug))
);

for (const doc of staleDocs) {
  await deleteDocument(doc.id);
}
```

## 모니터링

### Render Logs

```
Dashboard → rag-gateway → Logs
```

### Health Check

```bash
curl https://rag-gateway.onrender.com/api/admin/health | jq
```

### Qdrant Stats

```bash
curl https://rag-gateway.onrender.com/api/admin/stats | jq
```

## 트러블슈팅

### 문제: 배포 실패

```bash
# Build 로그 확인
Dashboard → rag-gateway → Events → Failed Build

# 일반적인 원인:
1. 타입스크립트 에러: pnpm type-check 로컬 실행
2. 의존성 설치 실패: pnpm install 재시도
```

### 문제: 502 Bad Gateway

```bash
# 서비스 시작 확인
Dashboard → rag-gateway → Events

# Health Check 실패 시:
1. 환경 변수 확인
2. Qdrant 연결 확인
3. 로그에서 에러 메시지 확인
```

### 문제: 슬립 모드

```bash
# 즉시 깨우기
curl https://rag-gateway.onrender.com/api/admin/health

# 영구적인 해결:
# - UptimeRobot 설정
# - Cron-job.org 설정
```

### 문제: Qdrant 연결 실패

```bash
# 환경 변수 확인
echo $QDRANT_URL
echo $QDRANT_API_KEY

# Qdrant Health Check
curl https://xyz.xyz.aws.cloud.qdrant.io/health
```

## 비용 최적화

### 무료 플랜 유지 팁

1. **단일 서비스로 운영**: RAG Gateway만 Render에 배포
2. **Blog/Blog-Admin**: Vercel 무료 플랜 유지
3. **Qdrant**: 무료 1GB 클러스터 사용
4. **Redis 선택사항**: Rate Limiting 없으면 Redis 불필요

### 유료 플랜 업그레이드 시점

- 일일 500+ 요청
- 슬립 모드로 인한 지연 불편
- 영구 스토리지 필요

## 업데이트 배포

```bash
# 코드 변경 후
git add .
git commit -m "feat: new feature"
git push origin main

# Render가 자동으로 감지하고 재배포
# 3-5분 소요
```

## 보안 권장사항

1. **API Key 관리**: Render Environment Variables에만 저장
2. **HTTPS**: Render가 자동으로 SSL 제공
3. **Rate Limiting**: Redis 설정 시 자동 활성화
4. **Health Check**: 공개 엔드포인트 제한 고려

## 참고 자료

- [Render 공식 문서](https://render.com/docs)
- [render.yaml 스펙](https://render.com/docs/yaml-spec)
- [Qdrant Cloud](https://cloud.qdrant.io/)
- [UptimeRobot](https://uptimerobot.com/)
