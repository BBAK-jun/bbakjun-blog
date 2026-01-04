# RAG Gateway - API Endpoints

- **Scope**: 모든 API 엔드포인트 상세 사양
- **Source of Truth**: `src/routes/*/routes.ts`, `src/routes/*/handlers.ts`
- **Last Verified**: 2024-12-26

---

## RAG Query API

### POST /api/rag/query

**Location**: `src/routes/rag/rag.routes.ts` (L19-L39)

**Purpose**: RAG 질의응답 - 사용자 질문과 관련된 블로그 콘텐츠를 검색하고 LLM을 활용하여 답변 생성

**Request Headers**:
```
X-RAG-API-Key: <API_KEY>     # Required (P0 authentication)
Content-Type: application/json
```

**Request Body**:
```typescript
{
  query: string;              // Required: 검색 질문
  context?: string;           // Optional: 추가 컨텍스트
  intent?: QueryIntent;       // Optional: 쿼리 의도 (search, explain, how_to, etc.)
  filters?: DocumentFilter;   // Optional: 필터 (category, tags, author)
  limit?: number;             // Default: 5, Max: 20 - 검색 결과 수
  temperature?: number;       // Default: 0.7, Min: 0, Max: 2 - LLM 온도
  includeSources?: boolean;   // Default: true - 출처 포함 여부
  stream?: boolean;           // Default: false - 스트리밍 여부
}
```

**Response** (200 OK):
```typescript
{
  answer: string;             // LLM 생성 답변
  sources: Array<{
    id: string;
    title: string;
    slug: string;
    content: string;          // 발췌 내용
    score: number;           // 유사도 점수 (0-1)
    metadata?: {
      title: string;
      category: string;
      tags: string[];
      author: string;
    };
  }>;
  usage?: {
    model: string;           // e.g., "glm-4.6", "gpt-4o-mini"
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    cost?: number;           // USD
  };
  intent?: QueryIntent;      // 분류된 쿼리 의도
  queryTime?: number;        // ms
  model?: string;            // 사용된 LLM 모델
}
```

**Error Responses**:
- 400 Bad Request: Prompt injection detected
- 401 Unauthorized: Missing/invalid API key
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Query processing failed

**Handler**: `src/routes/rag/rag.handlers.ts` (L15-L60)
- Validates input with `sanitizeInput()`
- Initializes QueryProcessor with services
- Calls `processRAGQuery()`
- Filters response with `filterRAGResponse()`

---

### POST /api/rag/search

**Location**: `src/routes/rag/rag.routes.ts` (L41-L61)

**Purpose**: 문서 검색만 수행 (LLM 응답 없음)

**Request Headers**:
```
X-RAG-API-Key: <API_KEY>
Content-Type: application/json
```

**Request Body**:
```typescript
{
  query: string;              // Required: 검색 질문
  filters?: DocumentFilter;   // Optional: 필터
  limit?: number;             // Default: 10, Max: 50
  threshold?: number;         // Default: 0.7 - 유사도 임계값
  rerank?: boolean;           // Default: true - 재정렬 여부
}
```

**Response** (200 OK):
```typescript
{
  results: Array<{
    id: string;
    title: string;
    slug: string;
    content: string;
    score: number;
    metadata?: DocumentMetadata;
  }>;
  total: number;
  queryTime: number;          // ms
  hasMore?: boolean;
}
```

**Handler**: `src/routes/rag/rag.handlers.ts` (L62-L111)

---

### POST /api/rag/ingest

**Location**: `src/routes/rag/rag.routes.ts` (L63-L93)
**Source Exists**: true

**Purpose**: 직접 제공된 문서 배열 인제스트 시작 (배치 처리)

**Request Headers**:
```
X-RAG-API-Key: <API_KEY>
Content-Type: application/json
```

**Request Body**:
```typescript
{
  documents: Array<{
    id?: string;              // Optional: Auto-generated if missing
    title: string;            // Required
    content: string;          // Required: Markdown/MDX content
    slug: string;             // Required: Document slug
    metadata?: {
      category?: string;      // Document category
      tags?: string[];        // Document tags
      author?: string;        // Default: "claude-code"
      githubUrl?: string;     // Optional: GitHub source URL
    };
  }>;
  force?: boolean;            // Default: false - 강제 재인덱싱
  batchSize?: number;         // Default: 10, Min: 1, Max: 100
}
```

**Response** (200 OK):
```typescript
{
  jobId: string;              // Job ID for status tracking (format: ingest_<timestamp>)
  status: 'started';
  message: 'Document ingestion started';
  documentsCount: number;     // Number of documents provided
}
```

**Error Responses**:
- 401 Unauthorized: Missing/invalid API key
- 422 Unprocessable Entity: Validation error (missing required fields)
- 500 Internal Server Error: Ingestion failed to start

**Handler**: `src/routes/rag/rag.handlers.ts` (L113-L171)
- **Auto-generates document IDs** using `generateDocumentId()` if not provided
- **Converts request format** to internal Document schema
- **Creates IngestionPipeline** with QdrantService and EmbeddingService
- **Starts background ingestion** with batch processing
- **Supports force reindexing**: Deletes existing documents before re-indexing

---

### GET /api/rag/ingest/status

**Location**: `src/routes/rag/rag.routes.ts` (L95-L127)

**Purpose**: 인제스트 작업 상태 조회

**Query Parameters**:
```
jobId: string     # Required
```

**Response** (200 OK):
```typescript
{
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    total: number;
    processed: number;
    failed: number;
    percentage: number;
    current: string;          // Current operation description
  };
  startedAt: string;          // ISO 8601 datetime
}
```

**Handler**: `src/routes/rag/rag.handlers.ts` (L173-L212)
- **Job Status Polling**: Retrieve ingestion progress by jobId
- **Returns null** for non-existent job IDs (404 response)
- **Tracks progress**: total, processed, failed, percentage

---

### GET /api/rag/health

**Location**: `src/routes/rag/rag.routes.ts` (L129-L145)

**Purpose**: 서비스 헬스 체크 (공개 엔드포인트, 인증 불필요)

**Response** (200 OK):
```typescript
{
  status: 'healthy' | 'unhealthy';
}
```

**Handler**: `src/routes/rag/rag.handlers.ts` (L214-L238)
- **Basic health check**: Verifies service initialization
- **No authentication required**: Public endpoint
- **Always returns 200 OK**: Status field indicates health

---

## Documents API

### GET /api/documents

**Location**: `src/routes/documents/documents.routes.ts` (L96-L116)

**Purpose**: 문서 목록 조회 (페이지네이션, 필터링 지원)

**Query Parameters**:
```
limit?: string      # Default: "20", Max: 100
offset?: string     # Default: "0"
category?: string   # Filter by category
tags?: string       # Comma-separated tag list
author?: string     # Filter by author
```

**Response** (200 OK):
```typescript
{
  documents: Array<{
    id: string;
    title: string;
    slug: string;
    metadata: Record<string, unknown>;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

**Handler**: `src/routes/documents/documents.handlers.ts` (L22-L124)

---

### GET /api/documents/{id}

**Location**: `src/routes/documents/documents.routes.ts` (L118-L138)

**Purpose**: 특정 문서 상세 조회 (모든 청크 포함)

**Path Parameters**:
```
id: string     # Document ID
```

**Response** (200 OK):
```typescript
{
  id: string;
  title: string;
  slug: string;
  chunks: Array<{
    id: string;
    content: string;
    position: number;
  }>;
  metadata: {
    title: string;
    category: string;
    tags: string[];
    author: string;
    chunkCount: number;
    lastIndexed: string;
  };
}
```

**Handler**: `src/routes/documents/documents.handlers.ts` (L126-L190)

---

### POST /api/documents

**Location**: `src/routes/documents/documents.routes.ts` (L140-L157)

**Purpose**: 새 문서 생성 및 인덱싱 (청킹 + 임베딩 자동 수행)

**Request Body**:
```typescript
{
  title: string;              // Required
  content: string;            // Required: Markdown content
  slug?: string;              // Optional: Auto-generated from title
  metadata?: {
    category?: string;
    tags?: string[];
    author?: string;
    publishedAt?: string;     // ISO 8601 datetime
    source?: 'blob' | 'upload' | 'api' | 'scraper';
  };
}
```

**Response** (201 Created):
```typescript
{
  id: string;
  title: string;
  slug: string;
  status: 'indexed';
  chunksCreated: number;
  metadata: DocumentMetadata & { indexedAt: string };
}
```

**Handler**: `src/routes/documents/documents.handlers.ts` (L192-L301)

---

### PUT /api/documents/{id}

**Location**: `src/routes/documents/documents.routes.ts` (L159-L180)

**Purpose**: 문서 업데이트 (재청킹 및 재인덱싱)

**Path Parameters**:
```
id: string
```

**Request Body**:
```typescript
{
  title?: string;
  content?: string;           // If provided, re-chunks document
  metadata?: {
    category?: string;
    tags?: string[];
    author?: string;
  };
}
```

**Response** (200 OK):
```typescript
{
  id: string;
  status: 'updated';
  chunksReindexed: number;
  updatedAt: string;
}
```

**Handler**: `src/routes/documents/documents.handlers.ts` (L303-L408)

---

### DELETE /api/documents/{id}

**Location**: `src/routes/documents/documents.routes.ts` (L182-L202)

**Purpose**: 문서 삭제 (모든 청크 삭제)

**Response** (200 OK):
```typescript
{
  id: string;
  status: 'deleted';
  chunksDeleted: number;
  deletedAt: string;
}
```

**Handler**: `src/routes/documents/documents.handlers.ts` (L410-L454)

---

## Admin API

### GET /api/admin/stats

**Location**: `src/routes/admin/admin.routes.ts` (L156-L167)

**Purpose**: 시스템 통계 조회

**Response** (200 OK):
```typescript
{
  documents: {
    total: number;            // Unique document count
    indexed: number;          // Total chunks indexed
    failed: number;
    categories: Record<string, number>; // Count per category
  };
  usage: {
    totalQueries: number;
    avgQueryTime: number;
    topQueries: string[];
  };
  performance: {
    qdrant: {
      avgSearchTime: number;
      totalCollections: number;
      totalVectors: number;
    };
    llm: {
      avgGenerationTime: number;
      totalTokens: number;
      avgTokensPerQuery: number;
    };
  };
  system: {
    uptime: string;           // e.g., "2h 30m"
    version: string;          // e.g., "0.1.0"
    lastIngestion: string | null;
    cacheHitRate: number;
  };
}
```

**Handler**: `src/routes/admin/admin.handlers.ts` (L22-L98)

---

### GET /api/admin/logs

**Location**: `src/routes/admin/admin.routes.ts` (L169-L187)

**Purpose**: 감사 로그 조회

**Query Parameters**:
```
limit?: string      # Default: "50", Max: 1000
level?: string      # Default: "info"
since?: string      # ISO 8601 datetime
```

**Response** (200 OK):
```typescript
{
  logs: Array<{
    timestamp: string;
    level: string;
    message: string;
    context?: Record<string, unknown>;
  }>;
  pagination: {
    total: number;
    limit: number;
    hasMore: boolean;
  };
}
```

**Handler**: `src/routes/admin/admin.handlers.ts` (L100-L118)
- Currently returns empty logs (TODO: implement)

---

### POST /api/admin/reindex

**Location**: `src/routes/admin/admin.routes.ts` (L189-L203)

**Purpose**: 재인덱싱 작업 시작

**Request Body**:
```typescript
{
  force?: boolean;            // Default: false
  batchSize?: number;         // Default: 10, Min: 1, Max: 100
  collections?: string[];
}
```

**Response** (200 OK):
```typescript
{
  jobId: string;
  status: 'started';
  config: {
    force: boolean;
    batchSize: number;
    collections: string[];
  };
  estimatedTime: string;      // e.g., "~5 minutes"
}
```

**Handler**: `src/routes/admin/admin.handlers.ts` (L120-L223)
- Stores job status in in-memory Map

---

### GET /api/admin/reindex/{jobId}

**Location**: `src/routes/admin/admin.routes.ts` (L205-L218)

**Response** (200 OK):
```typescript
{
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  progress: {
    total: number;
    processed: number;
    failed: number;
    percentage: number;
  };
  startedAt: string;
  completedAt?: string;
  errors: Array<{
    documentId: string;
    error: string;
    timestamp: string;
  }>;
}
```

**Handler**: `src/routes/admin/admin.handlers.ts` (L225-L250)

---

### DELETE /api/admin/cache

**Location**: `src/routes/admin/admin.routes.ts` (L220-L236)

**Purpose**: 임베딩 캐시 삭제

**Query Parameters**:
```
type?: string       # Default: "all"
```

**Response** (200 OK):
```typescript
{
  message: string;
  type: string;
  clearedAt: string;
  sizes: {
    embedding: string;        // e.g., "12.45MB"
  };
}
```

**Handler**: `src/routes/admin/admin.handlers.ts` (L252-L283)

---

### GET /api/admin/health

**Location**: `src/routes/admin/admin.routes.ts` (L238-L249)

**Purpose**: 상세 헬스 체크 (컴포넌트별 상태)

**Response** (200 OK):
```typescript
{
  status: 'healthy' | 'unhealthy';
  components: {
    qdrant: {
      status: 'healthy' | 'unhealthy' | 'unknown';
      responseTime?: number;
      collections?: number;
      vectorsCount?: number;
    };
    llm: {
      status: 'healthy' | 'unhealthy';
      provider: string;        // e.g., "GLM-4.6"
      responseTime?: number;
    };
    redis: {
      status: 'unknown';
      connected: boolean;
      memory: string;
    };
    storage: {
      status: 'healthy';
      free: string;
      usage: string;           // e.g., "45.67MB"
    };
  };
  uptime: string;
  version: string;
}
```

**Handler**: `src/routes/admin/admin.handlers.ts` (L312-L385)

---

### DELETE /api/admin/collection

**Location**: `src/routes/admin/admin.routes.ts` (L264-L282)

**Purpose**: 전체 컬렉션 삭제 (모든 벡터 제거)

**Request Headers**:
```
X-RAG-API-Key: <API_KEY>
Content-Type: application/json
```

**Request Body**:
```typescript
{
  confirm: 'yes';              // Required: Must be literal "yes"
}
```

**Response** (200 OK):
```typescript
{
  message: string;             // e.g., "All vectors deleted from collection"
  deletedCount: number;        // Number of vectors deleted
  clearedAt: string;           // ISO 8601 datetime
}
```

**Error Responses**:
- 400 Bad Request: Missing or invalid `confirm` parameter
- 500 Internal Server Error: Deletion failed

**Handler**: `src/routes/admin/admin.handlers.ts` (L285-L310)
- Calls `qdrantService.deleteAllPoints()` to remove all vectors
- Useful for full reindexing or cleanup

---

## MCP API

### GET /api/mcp/tools

**Location**: `src/routes/mcp/mcp.routes.ts` (L83-L90)

**Purpose**: 사용 가능한 MCP 도구 목록 조회

**Response** (200 OK):
```typescript
{
  tools: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  protocol: 'mcp';
  version: string;             // e.g., "1.0.0"
}
```

**Handler**: `src/routes/mcp/mcp.handlers.ts` (L46-L55)

**Available Tools** (L10-L44):
1. `search_blog`: 블로그 게시물 검색
2. `explain_code`: 코드 설명
3. `find_examples`: 기술별 코드 예제 찾기
4. `get_related_posts`: 관련 게시물 가져오기

---

### POST /api/mcp/invoke

**Location**: `src/routes/mcp/mcp.routes.ts` (L92-L107)

**Purpose**: MCP 도구 실행

**Request Body**:
```typescript
{
  tool: string;                // Tool name
  arguments: Record<string, unknown>;
  context?: {
    conversationId?: string;
    userId?: string;
  };
}
```

**Response** (200 OK):
```typescript
{
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}
```

**Handler**: `src/routes/mcp/mcp.handlers.ts` (L57-L112)

---

### POST /api/mcp/explain

**Location**: `src/routes/mcp/mcp.routes.ts` (L109-L123)

**Purpose**: 코드/쿼리 설명 생성

**Request Body**:
```typescript
{
  query: string;               // Required: 설명 요청
  code?: string;               // Optional: 설명할 코드
  context?: string;            // Optional: 추가 컨텍스트
}
```

**Response** (200 OK):
```typescript
{
  query: string;
  explanation: string;
  sources: Array<{
    title: string;
    slug: string;
    excerpt: string;
  }>;
  relatedCode?: Array<{
    language: string;
    code: string;
    explanation: string;
  }>;
}
```

**Handler**: `src/routes/mcp/mcp.handlers.ts` (L114-L147)

---

## Request/Response Flow

### RAG Query Flow

```
Client Request
  ↓
1. Security Headers (CSP, HSTS, etc.)
  ↓
2. Rate Limit Check (Redis)
  ↓
3. API Key Validation (X-RAG-API-Key)
  ↓
4. Input Validation (sanitizeInput)
  ↓
5. QueryProcessor.processRAGQuery()
   ├─ Generate query embedding
   ├─ Search Qdrant (vector similarity)
   ├─ Expand query (optional)
   ├─ Group chunks by document
   ├─ Rerank results
   └─ LLM generateRAGResponse()
  ↓
6. Output Filtering (redactSensitiveInfo)
  ↓
Client Response
```

---

## Dependencies

**API → Services**:
- RAG handlers → `QueryProcessor` → `{QdrantService, EmbeddingService, LLMService}`
- Document handlers → `QdrantService`, `EmbeddingService`, `SemanticChunker`
- Admin handlers → `QdrantService`, `EmbeddingService`, `IngestionPipeline`

**Services**:
- `QdrantService`: Vector database operations
- `EmbeddingService`: OpenAI/SiliconFlow embeddings
- `LLMService`: OpenAI/GLM chat completions
- `IngestionPipeline`: Document ingestion jobs
