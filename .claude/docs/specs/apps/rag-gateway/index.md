# RAG Gateway - Feature Specifications Index

- **App**: apps/rag-gateway
- **Status**: Production Ready (As-Is 구현 완료)
- **Last Verified**: 2025-12-29
- **Repo Ref**: bbakjun-blog monorepo

---

## Overview (개요)

RAG Gateway는 DEV_BBAK 블로그의 콘텐츠를 지능적으로 검색하고 질문에 답변하기 위한 중앙 API 서비스입니다. Qdrant 벡터 데이터베이스와 다양한 LLM을 활용하여 의미론적 검색과 컨텍스트 인식형 응답을 제공합니다.

---

## Feature Specifications (기능 명세서)

### Core Features (핵심 기능)

| 명세서 | 설명 | 상태 |
|--------|------|------|
| [rag-query-pipeline.md](./rag-query-pipeline.md) | RAG 질의응답 파이프라인 (시맨틱 검색 + AI 응답) | As-Is |
| [document-ingestion.md](./document-ingestion.md) | 문서 수집, 청킹, 임베딩, Qdrant 인덱싱 | As-Is |
| [vector-search.md](./vector-search.md) | Qdrant 벡터 데이터베이스 통합 | As-Is |

### Infrastructure & Security (인프라 및 보안)

| 명세서 | 설명 | 상태 |
|--------|------|------|
| [security-layer.md](./security-layer.md) | API 보안 계층 (인증, 검증, Rate limiting, 필터링) | As-Is |
| [multi-llm-strategy.md](./multi-llm-strategy.md) | 다중 LLM 제공자 전략 (OpenAI, GLM) | As-Is |
| [render-deployment.md](./render-deployment.md) | Render 무료 플랜 배포 전략 ($0 호스팅) | ✅ New (2025-12-29) |

### Operations & Maintenance (운영 및 유지보수)

| 명세서 | 설명 | 상태 |
|--------|------|------|
| [stale-document-cleanup.md](./stale-document-cleanup.md) | 오래된 문서 자동 정리 스크립트 | ✅ New (2025-12-29) |

### Integrations (통합)

| 명세서 | 설명 | 상태 |
|--------|------|------|
| [mcp-integration.md](./mcp-integration.md) | Model Context Protocol 도구 통합 | As-Is |

---

## Quick Reference (빠른 참조)

### API Endpoints

#### RAG Query API
- `POST /api/rag/query` - RAG 질의응답 (검색 + AI 응답)
- `POST /api/rag/search` - 벡터 검색만
- `POST /api/rag/ingest` - 문서 인제스트 시작
- `GET /api/rag/ingest/status` - 인제스트 상태 조회
- `GET /api/rag/health` - 헬스 체크 (공개)

#### Documents API
- `GET /api/documents` - 문서 목록
- `GET /api/documents/{id}` - 문서 상세
- `POST /api/documents` - 문서 생성
- `PUT /api/documents/{id}` - 문서 업데이트
- `DELETE /api/documents/{id}` - 문서 삭제

#### Admin API
- `GET /api/admin/stats` - 시스템 통계
- `GET /api/admin/logs` - 감사 로그
- `POST /api/admin/reindex` - 재인덱싱 시작
- `GET /api/admin/reindex/{jobId}` - 재인덱싱 상태
- `DELETE /api/admin/cache` - 캐시 삭제
- `GET /api/admin/health` - 상세 헬스 체크
- `DELETE /api/admin/collection` - 컬렉션 전체 삭제 (신규)

#### MCP API
- `GET /api/mcp/tools` - 도구 목록
- `POST /api/mcp/invoke` - 도구 실행
- `POST /api/mcp/explain` - 코드 설명

### Security Implementation

| 우선순위 | 기능 | 상태 |
|----------|------|------|
| P0 | API Key 인증 (`X-RAG-API-Key`) | ✅ 구현 완료 |
| P1 | 입력 검증 (Prompt injection 탐지) | ✅ 구현 완료 |
| P2 | Rate limiting (Redis 기반) | ✅ 구현 완료 |
| P2 | 출력 필터링 (민감 정보 왜곡) | ✅ 구현 완료 |
| P2 | 보안 헤더 (CSP, HSTS, etc.) | ✅ 구현 완료 |

### Technology Stack

**Framework**:
- Hono 4.6.5 (Web framework)
- @hono/node-server 1.19.7
- TypeScript 5.x

**Services**:
- Qdrant (@qdrant/js-client-rest 1.15.1) - 벡터 데이터베이스
- OpenAI 4.28.4 - LLM & Embedding
- GLM (Zhipu AI) - 저비용 LLM

**Validation & Security**:
- Zod 3.23.8 - 스키마 검증
- @t3-oss/env-nextjs 0.10.1 - 환경 변수
- Pino 10.1.0 - 로깅

**Storage**:
- Qdrant Cloud (1GB Starter) - 벡터 저장
- Redis (Vercel KV) - Rate limiting, 캐싱

### Environment Variables

**Required**:
```bash
QDRANT_URL=                    # Qdrant cluster URL
OPENAI_API_KEY=                # OpenAI API key
GLM_API_KEY=                   # Zhipu AI GLM key (Now Required!)
RAG_GATEWAY_API_KEY=           # API authentication key
BLOG_ADMIN_URL=                # Blog-Admin URL for blob files
```

**Optional**:
```bash
QDRANT_API_KEY=                # Qdrant API key (if required)
LLM_PROVIDER=openai|glm        # LLM provider (default: openai)
EMBEDDING_PROVIDER=openai|glm  # Embedding provider (siliconflow 제거됨)
EMBEDDING_MODEL=text-embedding-3-small  # Embedding model
REDIS_URL=                     # Redis for rate limiting
```

**Changes** (2025-12-29):
- `GLM_API_KEY`: 선택사항 → **필수** 변경
- `EMBEDDING_PROVIDER`: `siliconflow` 옵션 제거됨
- `SILICONFLOW_API_KEY`: 환경 변수 제거됨

### Deployment Options

**Render Free Tier** (New - 2025-12-29):
- Render Web Service: $0
- Qdrant Cloud (1GB): $25-50/월
- Redis (optional): $0.20-10/월
- **Total**: ~$25-50/월

**Vercel Pro** (Original):
- Vercel Pro hosting: $20-40/월
- Qdrant Cloud (1GB): $25-50/월
- Redis (Vercel KV): $0.20-10/월
- **Total**: ~$45-100/월

**Variable Costs (Per Query)**:
- OpenAI GPT-4o-mini: ~$0.00029/query
- GLM-4.6: ~$0.00003/query (97% 절감)

**Rate Limit Protection**:
- Max monthly cost (GLM): ~$101 (2.6M queries @ 60/min)
- Max monthly cost (OpenAI): ~$738 (2.6M queries @ 60/min)

---

## Related Documentation (관련 문서)

### Facts (사실)
- [RAG Gateway Overview](../../facts/apps/rag-gateway/index.md)
- [API Endpoints](../../facts/apps/rag-gateway/apis/index.md)
- [Routes & Pages](../../facts/apps/rag-gateway/pages/routes.md)
- [Schemas & Types](../../facts/apps/rag-gateway/schemas/index.md)
- [Configuration](../../facts/apps/rag-gateway/config/index.md)
- [Utilities & Services](../../facts/apps/rag-gateway/utils/index.md)

### Insights (인사이트)
- [Executive Summary](../../insights/apps/rag-gateway/exec/summary.md)
- [ROI Analysis](../../insights/apps/rag-gateway/impact/roi.md)
- [Customer Impact](../../insights/apps/rag-gateway/impact/customer.md)
- [Cost Analysis](../../insights/apps/rag-gateway/impact/cost.md)

---

## Architecture Diagram (아키텍처 다이어그램)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Blog Admin   │  │   Blog App   │  │ AI Assistants│        │
│  │ (Dashboard)  │  │  (Public)    │  │  (MCP)       │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          │ REST API         │ RPC (Hono)       │ MCP Protocol
          │                  │                  │
┌─────────┴──────────────────┴──────────────────┴────────────────┐
│                     RAG Gateway API                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Security Layer (P0, P1, P2)                               │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │ │
│  │  │ API Key  │ │Input Val │ │Rate Limit│ │Output    │      │ │
│  │  │   Auth   │ │          │ │          │ │ Filter   │      │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ RAG Query Pipeline                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │   Query      │  │ Retrieval    │  │   LLM        │    │ │
│  │  │ Processor    │  │   Service    │  │  Service     │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Document Ingestion Pipeline                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │  Semantic    │  │  Embedding   │  │   Qdrant     │    │ │
│  │  │  Chunker     │  │   Service    │  │   Service    │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ MCP Tools                                                   │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │ │
│  │  │search_blog│ │explain_  │ │find_     │ │get_      │     │ │
│  │  │          │ │code      │ │examples  │ │related   │     │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
┌───────────────────────────┴───────────────────────────────────┐
│                    External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Qdrant     │  │   OpenAI     │  │     GLM      │        │
│  │ (Vector DB)  │  │  (LLM/Emb)   │  │  (LLM)       │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │   Redis      │  │ Blog-Admin   │                           │
│  │ (Rate Limit) │  │  (CDC Blob)  │                           │
│  └──────────────┘  └──────────────┘                           │
└───────────────────────────────────────────────────────────────┘
```

---

## Development Guidelines (개발 가이드라인)

### Getting Started

```bash
# Clone repository
git clone https://github.com/bbakjun/bbakjun-blog.git
cd bbakjun-blog

# Install dependencies
pnpm install

# Set up environment variables
cp apps/rag-gateway/.env.example apps/rag-gateway/.env.local
# Edit .env.local with your values

# Start development server
pnpm dev:rag-gateway
```

### Running Tests

```bash
# Run tests
pnpm --filter=rag-gateway test

# Run tests in watch mode
pnpm --filter=rag-gateway test:watch

# Run tests in UI mode
pnpm --filter=rag-gateway test:ui
```

### Building for Production

```bash
# Build rag-gateway
pnpm build:rag-gateway

# Start production server
pnpm start:rag-gateway
```

---

## Troubleshooting (트러블슈팅)

### Common Issues

**Issue: Qdrant connection failed**
- Check `QDRANT_URL` environment variable
- Verify Qdrant cluster is running
- Check API key if required

**Issue: LLM API errors**
- Verify `OPENAI_API_KEY` or `GLM_API_KEY`
- Check API quota limits
- Enable debug logging: `LOG_LEVEL=debug`

**Issue: Rate limiting not working**
- Check `REDIS_URL` is set
- Verify Redis is accessible
- Fallback to in-memory if Redis unavailable

**Issue: Embedding dimension mismatch**
- Ensure embedding model matches Qdrant vector size
- Reindex collection if changing models

---

## Changelog (변경 로그)

### 2025-12-29
- **New**: Render 무료 플랜 배포 전략 명세서 추가
- **New**: Stale Document Cleanup 스크립트 명세서 추가
- **Updated**: 환경 변수 변경사항 반영 (GLM_API_KEY 필수, SiliconFlow 제거)
- **Updated**: 비용 분석에 Render 배포 옵션 추가
- **Updated**: API 엔드포인트에 `DELETE /api/admin/collection` 추가

### 2024-12-26
- Initial feature specifications created
- All core features documented (As-Is)

---

## Contributors (기여자)

- **Author**: bbakjun
- **Maintainer**: bbakjun

---

## License (라이선스)

MIT

---

**Last Updated**: 2025-12-29
