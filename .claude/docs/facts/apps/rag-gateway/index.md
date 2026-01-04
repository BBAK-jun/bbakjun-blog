# RAG Gateway - Codebase Facts

- **Scope**: apps/rag-gateway - RAG (Retrieval-Augmented Generation) API 서비스
- **Source of Truth**: Hono routes, TypeScript types, Environment variables
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

## 메타데이터

```yaml
metadata:
  version: "2.0.0"
  created_at: "2025-12-29T00:00:00Z"
  last_verified: "2026-01-04T00:00:00Z"
  git_commit: "628174858956a2b1ff3d7c33e4ae03c790ed3208"
  git_branch: "BBAK-jun/vaduz"

  source_files:
    apps/rag-gateway/vitest.config.ts:
      git_hash: "692bb10df171ed2acf5d9c3e06d3e229eaee5225"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/rag-gateway/src/tests/setup.ts:
      git_hash: "18c738915755cccf072aaf97d38e824880893d46"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/rag-gateway/src/tests/handlers/rag.test.ts:
      git_hash: "8f2e3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/rag-gateway/src/tests/ingestion/pipeline.test.ts:
      git_hash: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/rag-gateway/src/tests/integration/batch-ingest.test.ts:
      git_hash: "0b1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/rag-gateway/src/routes/admin/admin.handlers.ts:
      git_hash: "c90725f34a229586509c668829c27dbf28e1f1e9"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/rag-gateway/src/routes/rag/rag.handlers.ts:
      git_hash: "76205d5602a2576877e349b632d0072fc3f33d12"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/rag-gateway/src/lib/rag/ingestion/pipeline.ts:
      git_hash: "16a3f584c589849f58864ccc81f2cefb8a94faf0"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true
    apps/rag-gateway/src/env.ts:
      git_hash: "c1b5f9516215f2688056ccbb25d5a78283245583"
      last_modified: "2026-01-04T00:00:00Z"
      source_exists: true

  changed_files:
    - path: apps/rag-gateway/vitest.config.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Vitest configuration for comprehensive test suite"
    - path: apps/rag-gateway/src/tests/setup.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Test setup with environment variables and mocks"
    - path: apps/rag-gateway/src/tests/handlers/rag.test.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: RAG handler tests (ingest, ingestStatus)"
    - path: apps/rag-gateway/src/tests/ingestion/pipeline.test.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Ingestion pipeline unit tests"
    - path: apps/rag-gateway/src/tests/integration/batch-ingest.test.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Batch ingest integration tests"
    - path: apps/rag-gateway/src/routes/admin/admin.handlers.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "MODIFIED: Enhanced admin handlers with new endpoints"
    - path: apps/rag-gateway/src/routes/rag/rag.handlers.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "MODIFIED: Updated RAG handlers with document ingestion"
    - path: apps/rag-gateway/src/lib/rag/ingestion/pipeline.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "MODIFIED: Enhanced pipeline with batch processing"
    - path: apps/rag-gateway/src/env.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "MODIFIED: Added new environment variables"

  deleted_files: []
```

## Overview

RAG Gateway는 DEV_BBAK 블로그의 콘텐츠를 지능적으로 검색하고 질문에 답변하기 위한 중앙 API 서비스입니다. Qdrant 벡터 데이터베이스와 다양한 LLM을 활용하여 의미론적 검색과 컨텍스트 인식형 응답을 제공합니다.

## Architecture

```
Client (blog-admin) → Hono API Routes → QueryProcessor → {Qdrant, Embedding, LLM}
```

## Directory Structure

```
apps/rag-gateway/
├── src/
│   ├── app.ts                      # Hono app entry point
│   ├── env.ts                      # Environment variables (t3-oss/env-nextjs)
│   ├── index.ts                    # Server startup
│   ├── routes/                     # API routes
│   │   ├── rag/                    # RAG query & search
│   │   │   ├── rag.routes.ts       # Route definitions
│   │   │   └── rag.handlers.ts     # Route handlers (ingest, ingestStatus)
│   │   ├── admin/                  # Admin endpoints (stats, reindex, health)
│   │   │   ├── admin.routes.ts     # Route definitions
│   │   │   └── admin.handlers.ts   # Route handlers
│   │   ├── documents/              # Document CRUD
│   │   └── mcp/                    # Model Context Protocol tools
│   ├── middleware/                 # Security & logging
│   │   ├── auth.ts                 # API Key authentication
│   │   ├── rate-limit.ts           # Redis-based rate limiting
│   │   ├── input-validation.ts     # Prompt injection detection
│   │   ├── output-filter.ts        # Sensitive data redaction
│   │   ├── security-headers.ts     # CSP, HSTS, etc.
│   │   └── logger.ts               # Pino logger
│   ├── services/                   # External service integrations
│   │   ├── qdrant.ts               # Qdrant vector DB client
│   │   ├── embedding.ts            # Embedding generation (OpenAI/SiliconFlow)
│   │   └── llm/                    # LLM strategies (OpenAI/GLM)
│   │       ├── factory.ts          # Strategy pattern factory
│   │       ├── openai.strategy.ts  # GPT-4o-mini
│   │       └── glm.strategy.ts     # GLM-4.6
│   ├── tests/                      # Test suite (NEW)
│   │   ├── setup.ts                # Test configuration
│   │   ├── handlers/               # Handler tests
│   │   │   └── rag.test.ts         # RAG handler tests
│   │   ├── ingestion/              # Ingestion tests
│   │   │   └── pipeline.test.ts    # Pipeline unit tests
│   │   └── integration/            # Integration tests
│   │       └── batch-ingest.test.ts # Batch ingest tests
│   └── lib/rag/                    # Core RAG logic
│       ├── types/                  # TypeScript schemas
│       ├── core/                   # Query processing
│       │   ├── query.ts            # QueryProcessor class
│       │   ├── retrieval.ts        # RetrievalService
│       │   └── ranking.ts          # Reranker
│       └── ingestion/              # Document ingestion pipeline
│           ├── pipeline.ts         # IngestionPipeline class (UPDATED)
│           ├── chunkers/           # Semantic chunker
│           └── collectors/         # Blob, markdown collectors
├── docs/
│   ├── SECURITY.md                 # Security documentation
│   ├── RAG_ARCHITECTURE.md         # Architecture details
│   └── API.md                      # API documentation
├── vitest.config.ts                # Vitest configuration (NEW)
└── package.json
```

## Key Dependencies

- **Web Framework**: Hono 4.6.5 + @hono/node-server 1.19.7
- **Validation**: Zod 3.23.8 + @hono/zod-validator 0.7.6
- **Vector DB**: @qdrant/js-client-rest 1.15.1
- **LLM**: OpenAI 4.28.4
- **Security**: @t3-oss/env-nextjs 0.10.1
- **Logging**: pino 10.1.0 + pino-pretty 13.1.3
- **Testing**: vitest (NEW) - Comprehensive test suite
- **Cache**: @repo/cache (Redis)

## Cross-App Dependencies

- `@repo/content` → `../../packages/content/` (MDX processing utilities)
- `@repo/cache` → `../../packages/cache/` (Redis client for rate limiting)

## Key Updates (Since Last Documentation)

### Testing Infrastructure (NEW)
- **Vitest Configuration**: `vitest.config.ts` - Test runner with globals, Node environment
- **Test Setup**: `src/tests/setup.ts` - Environment variables, service mocks
- **Handler Tests**: `src/tests/handlers/rag.test.ts` - ingest, ingestStatus handler tests
- **Pipeline Tests**: `src/tests/ingestion/pipeline.test.ts` - Unit tests for IngestionPipeline
- **Integration Tests**: `src/tests/integration/batch-ingest.test.ts` - End-to-end batch ingest tests

### Updated API Handlers
- **RAG Handlers** (`src/routes/rag/rag.handlers.ts`):
  - `ingest()`: Document ingestion with batch processing
  - `ingestStatus()`: Job status polling
  - Direct document array ingestion (not from Blob)
  - Auto-generates document IDs if missing

- **Admin Handlers** (`src/routes/admin/admin.handlers.ts`):
  - `getStats()`: System statistics with category counts
  - `clearCache()`: Embedding cache clearing
  - `clearCollection()`: Full collection deletion
  - `getHealth()`: Component-level health checks

### Enhanced Ingestion Pipeline
- **Batch Processing**: Processes documents in configurable batch sizes
- **Force Reindexing**: Option to re-index existing documents
- **Job Management**: Track ingestion progress with job IDs
- **Error Handling**: Continues processing on individual document failures

### Updated Environment Variables
- **Node Environment**: `NODE_ENV` (development, production, test)
- **Port Configuration**: `PORT` (default: 3002)
- **Logging Level**: `LOG_LEVEL` (trace, debug, info, warn, error, fatal)
- **Embedding Models**: Support for 10+ models (OpenAI, GLM, BAAI, Zephyr)

## Documentation Links

- [Routes & Pages](pages/routes.md) - API route structures and middleware chain
- [API Endpoints](apis/index.md) - All API endpoints with request/response schemas
- [Schemas & Types](schemas/index.md) - Data types, validation, and interfaces
- [Configuration](config/index.md) - Environment variables and security settings
- [Utilities & Services](utils/index.md) - Services, middleware, and core RAG logic
- [Components](components/index.md) - UI components (N/A - API-only service)
