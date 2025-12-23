# RAG 서비스 아키텍처

## 개요

DEV_BBAK 블로그를 위한 RAG(Retrieval-Augmented Generation) 시스템으로, 기술 블로그 문서를 검색하고 LLM을 통해 정확한 답변을 생성합니다.

## 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                         RAG Gateway                             │
│                      (Hono + Node.js)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   RAG API   │    │  Documents  │    │    Health   │          │
│  │   /rag/*    │    │    /docs    │    │    /health   │          │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
│         ┌──────────────────▼──────────────────┐                  │
│         │         QueryProcessor              │                  │
│         │      (@repo/rag-core)               │                  │
│         │  - Query Expansion                  │                  │
│         │  - Document Retrieval               │                  │
│         │  - Re-ranking                       │                  │
│         └──────────────────┬──────────────────┘                  │
│                            │                                     │
│  ┌─────────────────────────┼─────────────────────────┐        │
│  │                         │                         │        │
│  ▼                         ▼                         ▼        │
│ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│ │ Qdrant      │    │ Embedding   │    │ LLM         │    │
│ │ Service     │    │ Service     │    │ Service     │    │
│ │             │    │             │    │             │    │
│ │ - Search    │    │ - OpenAI    │    │ - OpenAI     │    │
│ │ - Store     │    │ - SiliconFlow│    │ - GLM        │    │
│ │ - Delete    │    │ (한국어)     │    │             │    │
│ └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   Qdrant Cloud        │
                        │   - Vector DB         │
                        │   - 1536 dims         │
                        │   - Cosine Similarity │
                        └──────────────────────┘
```

## 핵심 컴포넌트

### 1. RAG Gateway (`apps/rag-gateway`)

Hono 기반의 REST API 서버로, 모든 RAG 관련 요청을 처리합니다.

**주요 엔드포인트:**

| 엔드포인트 | 설명 |
|-----------|------|
| `POST /api/rag/query` | RAG 쿼리 처리 (검색 + LLM 생성) |
| `POST /api/rag/search` | 문서 검색만 수행 |
| `GET /api/documents` | 문서 목록 조회 |
| `POST /api/documents` | 문서 인덱싱 |
| `GET /api/documents/:id` | 특정 문서 조회 |
| `PUT /api/documents/:id` | 문서 재인덱싱 |
| `DELETE /api/documents/:id` | 문서 삭제 |

**디렉토리 구조:**

```
apps/rag-gateway/
├── src/
│   ├── env.ts                    # 환경 변수 설정 (t3-oss/env-nextjs)
│   ├── index.ts                  # 서터 진입점
│   ├── routes/
│   │   ├── rag/
│   │   │   └── index.ts          # RAG API 엔드포인트
│   │   └── documents/
│   │       └── index.ts          # 문서 관리 API
│   └── services/
│       ├── qdrant.ts             # Qdrant 벡터 DB 클라이언트
│       ├── embedding.ts          # 임베딩 생성 (OpenAI/SiliconFlow)
│       └── llm/                  # LLM 서비스 (Strategy Pattern)
│           ├── index.ts
│           ├── factory.ts
│           ├── openai.strategy.ts
│           ├── glm.strategy.ts
│           └── prompt.ts
└── scripts/
    └── ingest-claude-docs.ts     # 문서 인덱싱 스크립트
```

### 2. RAG Core (`packages/rag-core`)

RAG 처리의 핵심 로직을 담당하는 패키지입니다.

**주요 컴포넌트:**

- **`QueryProcessor`**: 쿼리 처리 파이프라인
  - Query Expansion (질문 확장)
  - Document Retrieval (문서 검색)
  - Re-ranking (결과 재정렬)
  - Chunk grouping by document

```
packages/rag-core/
├── src/
│   ├── query.ts                  # QueryProcessor 클래스
│   ├── retrieval.ts              # 검색 전략
│   ├── ranking.ts                # Re-ranking 전략
│   └── mcp.ts                    # MCP 클라이언트
```

### 3. RAG Ingestion (`packages/rag-ingestion`)

문서 청킹(Chunking) 및 임베딩 파이프라인입니다.

**청킹 전략:**

- **Semantic Chunker**: 의미 단위로 문서 분할
  - 헤딩, 코드 블록, 리스트 등의 구조 유지
  - 문맥 경계를 고려한 분할
  - 오버랩을 통한 문맥 연결성 보장

```
청킹 파라미터:
- maxSize: 1200 (문자)
- minSize: 100
- overlap: 200
```

### 4. RAG Types (`packages/rag-types`)

공통 타입 정의입니다.

**주요 타입:**

```typescript
// 임베딩 모델
EmbeddingModel:
  - text-embedding-3-small (OpenAI, 1536 dims)
  - text-embedding-3-large (OpenAI, 3072 dims)
  - BAAI/bge-m3 (SiliconFlow, 1024 dims) - 한국어 지원

// 문서 필터
DocumentFilter:
  - documentId
  - category
  - tags
  - author
  - source
  - dateRange
```

## 사용 기술 스택

### 백엔드

| 기술 | 용도 | 설명 |
|------|------|------|
| **Hono** | 웹 프레임워크 | 가볍경량, 타입 안전한 라우터 |
| **Node.js** | 런타임 | 서버 사이드 실행 환경 |
| **TypeScript** | 언어 | 타입 안전성 |
| **zod** | 검증 | 런타임 스키마 검증 |

### AI/ML

| 기술 | 용도 | 설명 |
|------|------|------|
| **Qdrant** | 벡터 DB | 고성량 벡터 검색 엔진 |
| **OpenAI** | 임베딩/LLM | text-embedding-3-small, GPT-4o-mini |
| **GLM** | LLM | z.ai의 GLM-4 모델 (한국어) |
| **SiliconFlow** | 임베딩 | BAAI/bge-m3 (한국어/다국어) |

### 개발 도구

| 기술 | 용도 | 설명 |
|------|------|------|
| **Turborepo** | 모노레포 | 패키지 관리 |
| **tsup** | 번들러 | TypeScript 빌드 |
| **t3-oss/env-nextjs** | 환경 변수 | 타입 안전한 환경 변수 관리 |

## 데이터 플로우

### 1. 문서 인덱싱 흐름

```
Markdown 파일
    ↓
Semantic Chunker (청킹)
    ↓
Embedding Service (벡터화)
    ↓
Qdrant Service (저장)
    ↓
Vector Database (1024~1536 차원 벡터)
```

### 2. RAG 쿼리 처리 흐름

```
사용자 질문
    ↓
Query Expansion (질문 확장)
    ↓
Embedding Service (질문 벡터화)
    ↓
Qdrant Search (유사 문서 검색)
    ↓
Group by Document (청크 그룹화)
    ↓
Re-ranking (재정렬)
    ↓
LLM Service (답변 생성)
    ↓
사용자에게 응답 반환
```

## 환경 변수

```bash
# 서버 설정
PORT=3002

# Qdrant
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-api-key

# LLM
LLM_PROVIDER=openai|glm
OPENAI_API_KEY=sk-...
GLM_API_KEY=...

# Embedding
EMBEDDING_PROVIDER=openai|siliconflow
EMBEDDING_MODEL=text-embedding-3-small|BAAI/bge-m3
SILICONFLOW_API_KEY=sk-...

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

## 검색 품질 최적화

### 구현된 최적화 기법

1. **청킹 최적화**
   - 더 큰 청크 크기 (1200자)로 문맥 보존
   - 높은 오버랩 (200자)으로 문맥 연결성 향상

2. **Query Expansion**
   - 질문 확장을 통한 검색 범위 개선
   - 여러 변형으로 검색 후 결과 병합

3. **Document Grouping**
   - 청크를 문서 단위로 그룹화
   - 문서별 점수 집계를 통한 정렬

### 미래 개선 방향

1. **Cross-encoder Re-ranking**
   - 검색 결과의 정밀 재정렬

2. **Hybrid Search**
   - BM25 (키워드) + Vector (의미) 결합

3. **LLM 기반 Query Expansion**
   - LLM으로 질문 변형 자동 생성

4. **한국어 특화 임베딩**
   - BAAI/bge-m3 등 다국어 모델 적용

## 배포

```bash
# 빌드
pnpm --filter=rag-gateway build

# 실행
pnpm --filter=rag-gateway dev

# Docker (예정)
docker build -t rag-gateway .
docker run -p 3002:3002 rag-gateway
```

## 성능

- **검색 속도**: ~50ms (Qdrant Cloud)
- **쿼리 처리**: ~5-10초 (LLM 생성 포함)
- **저장 용량**: ~1GB per 1000 문서 (임베딩 포함)

## 참고

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Hono Documentation](https://hono.dev/)
