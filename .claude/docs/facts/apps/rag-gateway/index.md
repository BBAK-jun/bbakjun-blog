# RAG Gateway - Codebase Facts

- **Scope**: apps/rag-gateway - RAG (Retrieval-Augmented Generation) API 서비스
- **Source of Truth**: Hono routes, TypeScript types, Environment variables
- **Last Verified**: 2025-12-29
- **Repo Ref**: bbakjun-blog monorepo

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
│   │   ├── documents/              # Document CRUD
│   │   ├── admin/                  # Admin endpoints (stats, reindex, health)
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
│   └── lib/rag/                    # Core RAG logic
│       ├── types/                  # TypeScript schemas
│       ├── core/                   # Query processing
│       │   ├── query.ts            # QueryProcessor class
│       │   ├── retrieval.ts        # RetrievalService
│       │   └── ranking.ts          # Reranker
│       └── ingestion/              # Document ingestion pipeline
│           ├── pipeline.ts         # IngestionPipeline class
│           ├── chunkers/           # Semantic chunker
│           └── collectors/         # Blob, markdown collectors
├── docs/
│   ├── SECURITY.md                 # Security documentation
│   ├── RAG_ARCHITECTURE.md         # Architecture details
│   └── API.md                      # API documentation
└── package.json
```

## Key Dependencies

- **Web Framework**: Hono 4.6.5 + @hono/node-server 1.19.7
- **Validation**: Zod 3.23.8 + @hono/zod-validator 0.7.6
- **Vector DB**: @qdrant/js-client-rest 1.15.1
- **LLM**: OpenAI 4.28.4
- **Security**: @t3-oss/env-nextjs 0.10.1
- **Logging**: pino 10.1.0 + pino-pretty 13.1.3
- **Cache**: @repo/cache (Redis)

## Cross-App Dependencies

- `@repo/content` → `../../packages/content/` (MDX processing utilities)
- `@repo/cache` → `../../packages/cache/` (Redis client for rate limiting)

## Documentation Links

- [Routes & Pages](pages/routes.md) - API route structures and middleware chain
- [API Endpoints](apis/index.md) - All API endpoints with request/response schemas
- [Schemas & Types](schemas/index.md) - Data types, validation, and interfaces
- [Configuration](config/index.md) - Environment variables and security settings
- [Utilities & Services](utils/index.md) - Services, middleware, and core RAG logic
- [Components](components/index.md) - UI components (N/A - API-only service)
