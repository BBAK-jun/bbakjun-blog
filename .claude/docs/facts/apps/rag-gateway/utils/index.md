# RAG Gateway - Utilities & Services

- **Scope**: 서비스 계층, 유틸리티, 코어 RAG 로직
- **Source of Truth**: `src/services/`, `src/lib/rag/core/`, `src/middleware/`
- **Last Verified**: 2024-12-26

---

## Services

### QdrantService

**Location**: `src/services/qdrant.ts`

**Purpose**: Qdrant 벡터 데이터베이스 클라이언트 (Singleton)

**Key Methods**:

| Method | Purpose | Location |
|--------|---------|----------|
| `initializeCollection()` | Create collection with indexes | L69-L103 |
| `upsertPoints()` | Insert/update vectors | L191-L209 |
| `search()` | Vector similarity search | L214-L280 |
| `deletePoints()` | Delete by filter | L285-L305 |
| `deletePoint()` | Delete by ID | L310-L324 |
| `getCollectionInfo()` | Get collection stats | L329-L348 |
| `scrollPoints()` | Paginated point retrieval | L353-L408 |
| `countPoints()` | Count points by filter | L413-L434 |
| `healthCheck()` | Connection check | L517-L528 |

**Usage**:
```typescript
import { getQdrantService } from '@/services/qdrant';

const qdrant = getQdrantService();
await qdrant.initializeCollection();

const results = await qdrant.search(queryVector, {
  limit: 10,
  threshold: 0.7,
  filter: { category: 'BLOG' },
});
```

**Configuration**:
- Collection: `blog_documents`
- Vector size: 1536 (text-embedding-3-small)
- Distance: Cosine
- On-disk payload: true

**Indexes**: `documentId`, `metadata.category`, `metadata.tags`, `metadata.author`, `metadata.source`, `metadata.publishedAt`

---

### EmbeddingService

**Location**: `src/services/embedding.ts`

**Purpose**: 임베딩 생성 및 캐싱 (Singleton)

**Key Methods**:

| Method | Purpose | Location |
|--------|---------|----------|
| `generateEmbedding()` | Single text embedding | L120-L149 |
| `generateBatchEmbeddings()` | Batch embeddings with cache | L154-L199 |
| `createEmbedding()` | Create embedding record | L204-L223 |
| `getOrGenerate()` | Cache-first generation | L228-L236 |
| `calculateSimilarity()` | Cosine similarity | L241-L264 |
| `clearCache()` | Clear embedding cache | L293-L295 |
| `getCacheStats()` | Cache size & memory estimate | L300-L307 |

**Features**:
- In-memory Map caching (text hash → vector)
- Retry with exponential backoff (rate limit handling)
- Multi-provider support (OpenAI, SiliconFlow)
- Batch processing (default: 50 texts/batch)

**Usage**:
```typescript
import { getEmbeddingService } from '@/services/embedding';

const embeddingService = getEmbeddingService({
  provider: 'openai',
  model: 'text-embedding-3-small',
});

const vector = await embeddingService.generateEmbedding('Hello world');
const vectors = await embeddingService.generateBatchEmbeddings(['text1', 'text2']);
```

**Cache Stats**:
```typescript
{
  size: 1250,              // Number of cached embeddings
  memoryEstimate: 7812500   // Estimated bytes (dimensions * 4 + overhead)
}
```

---

### LLMService (Strategy Pattern)

**Location**: `src/services/llm/`

**Purpose**: 다중 LLM 제공자 지원 (OpenAI, GLM)

#### LLMProviderFactory

**Location**: `src/services/llm/factory.ts` (L10-L57)

```typescript
class LLMProviderFactory {
  static createStrategy(provider: string): LLMProviderStrategy;
  static clearCache(): void;
  static getAvailableProviders(): string[];  // ['openai', 'glm']
}
```

**Providers**:
1. **OpenAI** (`openai.strategy.ts`):
   - Model: `gpt-4o-mini`
   - Max tokens: 2000
   - Pricing: $0.15/M input, $0.60/M output

2. **GLM** (`glm.strategy.ts`):
   - Model: `glm-4.6`
   - Base URL: `https://open.bigmodel.cn/api/paas/v4/`
   - Max tokens: 2000
   - Pricing: $0.005/M input, $0.025/M output

**Usage**:
```typescript
import { getLLMService } from '@/services/llm';

const llmService = getLLMService();  // Uses env.LLM_PROVIDER

const response = await llmService.generateRAGResponse(request, sources);
// or
const chatResponse = await llmService.chat('Explain this code', 0.7);
```

#### LLMProviderStrategy Interface

**Location**: `src/services/llm/types.ts`

```typescript
interface LLMProviderStrategy {
  generateRAGCompletion(prompt: string, temperature: number): Promise<{
    content: string;
    usage: LLMUsage;
    model: string;
  }>;
  generateChatCompletion(message: string, temperature: number): Promise<string>;
  getProviderName(): string;
}
```

---

## Core RAG Logic

### QueryProcessor

**Location**: `src/lib/rag/core/query.ts`

**Purpose**: RAG 쿼리 처리 (검색 → 랭킹 → LLM 생성)

**Constructor**:
```typescript
constructor(
  qdrantService: IQdrantService,
  embeddingService: IEmbeddingService,
  llmService: ILLMService | null,
  options?: QueryProcessorOptions
)
```

**Options**:
```typescript
interface QueryProcessorOptions {
  maxResults?: number;            // Default: 10
  similarityThreshold?: number;    // Default: 0.7
  enableReranking?: boolean;       // Default: true
}
```

**Key Methods**:

| Method | Purpose | Location |
|--------|---------|----------|
| `processRAGQuery()` | Full RAG pipeline (search + LLM) | L63-L91 |
| `searchDocuments()` | Search only (no LLM) | L96-L138 |
| `retrieveDocuments()` | Retrieve with query expansion | L143-L189 |
| `expandQuery()` | Generate query variations | L194-L201 |
| `groupChunksByDocument()` | Group chunks by document | L206-L220 |
| `rerankAndFormatDocuments()` | Rerank and format | L225-L274 |

**Query Flow**:
```
QueryProcessor.processRAGQuery()
  ├─ 1. Generate query embedding (EmbeddingService)
  ├─ 2. Retrieve documents (QdrantService)
  │   ├─ Search with original query
  │   ├─ Expand query (variations)
  │   ├─ Search with expanded queries
  │   ├─ Group chunks by document
  │   └─ Rerank by score
  └─ 3. Generate response (LLMService)
      └─ Format with sources
```

---

### IngestionPipeline

**Location**: `src/lib/rag/ingestion/pipeline.ts`

**Purpose**: 문서 인제스트 파이프라인 (청킹 → 임베딩 → Qdrant 저장)

**Constructor**:
```typescript
constructor(qdrantService: any, embeddingService: any)
```

**Key Methods**:

| Method | Purpose | Location |
|--------|---------|----------|
| `startIngestion()` | Start background ingestion job | L64-L92 |
| `getJobStatus()` | Get job progress | L97-L99 |
| `runIngestion()` | Internal: Run ingestion pipeline | L104-L138 |
| `collectDocuments()` | Collect from Blob/files | L143-L225 |
| `processBatch()` | Process batch of documents | L269-L326 |
| `getAllJobs()` | Get all jobs | L367-L369 |
| `cleanupJobs()` | Clean old jobs | L374-L382 |

**Ingestion Flow**:
```
IngestionPipeline.startIngestion()
  ├─ 1. Initialize Qdrant collection
  ├─ 2. Collect documents
  │   ├─ From Vercel Blob (MDX posts)
  │   └─ From project files (facts.md, context.md)
  ├─ 3. Process in batches
  │   ├─ Check if exists (skip if !force)
  │   ├─ Delete existing (if force)
  │   ├─ Chunk document (SemanticChunker)
  │   ├─ Generate embeddings (EmbeddingService)
  │   └─ Upsert to Qdrant
  └─ 4. Update job progress
```

**BlobFileInfo Interface**:
```typescript
interface BlobFileInfo {
  url: string;              // Blob URL for download
  pathname: string;          // File path (e.g., "posts/DEV/my-post.mdx")
  contentType: string | null;
}
```

**Usage**:
```typescript
const pipeline = new IngestionPipeline(qdrantService, embeddingService);

const jobId = await pipeline.startIngestion({
  force: false,
  batchSize: 10,
  blobFiles: [
    { url: 'https://...', pathname: 'posts/DEV/test.mdx', contentType: 'text/markdown' }
  ],
});

// Check status
const job = pipeline.getJobStatus(jobId);
// { id, status: 'running', progress: { total: 100, processed: 50, ... } }
```

---

### SemanticChunker

**Location**: `src/lib/rag/ingestion/chunkers/semantic.ts`

**Purpose**: 의미론적 경계를 유지하며 문서 분할

**Options**:
```typescript
interface ChunkingOptions {
  maxSize?: number;          // Default: 1200
  minSize?: number;          // Default: 100
  overlap?: number;          // Default: 200
  respectStructure?: boolean; // Default: true
}
```

**Chunking Strategy**:
- Respects headings, code blocks, list structures
- Splits at sentence/paragraph boundaries
- Maintains overlap for context continuity

---

## Middleware

### Authentication (P0)

**Location**: `src/middleware/auth.ts`

**Purpose**: API Key 인증 (`X-RAG-API-Key` header)

```typescript
export const verifyAuth = async (c: Context, next: Next) => {
  const apiKey = c.req.header('X-RAG-API-Key');

  if (!apiKey) {
    return c.json({ error: 'Unauthorized', message: 'Missing X-RAG-API-Key header' }, 401);
  }

  if (apiKey !== env.RAG_GATEWAY_API_KEY) {
    return c.json({ error: 'Unauthorized', message: 'Invalid API key' }, 401);
  }

  await next();
};
```

---

### Rate Limiting (P2)

**Location**: `src/middleware/rate-limit.ts`

**Purpose**: Redis 기반 rate limiting (DoS 방지)

**Features**:
- Token bucket algorithm
- Per-API-key and per-IP limits
- Redis distributed locking
- In-memory fallback when Redis unavailable

**Pre-configured Limits**:
```typescript
export const ragRateLimit = rateLimit(DEFAULT_RATE_LIMITS.STANDARD);     // 60/60s
export const publicRateLimit = rateLimit(DEFAULT_RATE_LIMITS.STRICT);     // 10/60s
export const healthRateLimit = rateLimit(DEFAULT_RATE_LIMITS.LENIENT);    // 30/60s
```

**Response Headers**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1735219200000
```

**Error Response** (429):
```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Try again in 30 seconds.",
  "retryAfter": 30,
  "limit": 60,
  "remaining": 0,
  "reset": 1735219200000
}
```

---

### Input Validation (P1)

**Location**: `src/middleware/input-validation.ts`

**Purpose**: Prompt injection 탐지 및 방지

**Protected Patterns** (L18-L59):
- Instruction override: `ignore (all)? previous instructions`
- System prompt extraction: `system:`, `show me your system prompt`
- Special tokens: `[INST]`, `<|>`, `<s>`, `<<SYS>>`
- Role/jailbreak: `you are now`, `act as`, `pretend`, `jailbreak`
- Script/code injection: `<script>`, `javascript:`, `data:text/html`
- Encoding bypass: Unicode escapes, HTML entities

**Functions**:
```typescript
sanitizeInput(input: string, options?: {
  maxLength?: number;
  checkPromptInjection?: boolean;
}): string;

sanitizeContext(context: string): string;

detectSuspiciousPatterns(input: string): string[];
```

**Error**:
```
"Invalid input detected: Possible prompt injection attempt"
```

---

### Output Filtering (P2)

**Location**: `src/middleware/output-filter.ts`

**Purpose**: 민감 정보 자동 제거 (email, API key, credit card 등)

**Detected Patterns** (L22-L49):
- Email: `user@example.com`
- Credit card: `4111 1111 1111 1111`
- Phone: `+1 555-123-4567`
- Auth token: `Bearer eyJhbG...`
- API key: 32+ alphanumeric chars
- AWS keys: `AKIA...`, 40-char base64
- URL with credentials: `https://user:pass@host`

**Functions**:
```typescript
redactSensitiveInfo(text: string, options?: RedactOptions): string;

detectSensitiveInfo(text: string): Array<{
  type: string;
  matches: string[];
}>;

filterRAGResponse<T extends Record<string, unknown>>(response: T): T;

containsSensitiveInfo(response: Record<string, unknown>): Array<{
  field: string;
  type: string;
  matches: string[];
}>;
```

**Options**:
```typescript
interface RedactOptions {
  patterns?: Array<keyof typeof SENSITIVE_PATTERNS>;
  replacement?: string;        // Default: '[REDACTED]'
  preservePartial?: boolean;   // Show first 2-3 chars
}
```

---

### Security Headers (P2)

**Location**: `src/middleware/security-headers.ts`

**Purpose**: 보안 헤더 추가 (CSP, HSTS, X-Frame-Options 등)

**Pre-configured Middleware**:
```typescript
export const apiSecurityHeaders = securityHeaders(DEFAULT_SECURITY_HEADERS);
```

**Applied Headers**: See [config/index.md](../config/index.md#security-configuration)

---

## Document Ingestion Components

### Collectors

**Location**: `src/lib/rag/ingestion/collectors/`

| Collector | Purpose |
|-----------|---------|
| `blob.ts` | Collect from Vercel Blob Storage |
| `markdown.ts` | Collect from local markdown files |

### Chunkers

**Location**: `src/lib/rag/ingestion/chunkers/`

| Chunker | Purpose |
|---------|---------|
| `fixed-size.ts` | Fixed-size chunking |
| `semantic.ts` | Semantic boundary-aware chunking |

### Preprocessors

**Location**: `src/lib/rag/ingestion/preprocessors/`

| Preprocessor | Purpose |
|--------------|---------|
| `text.ts` | Text normalization and cleaning |

---

## Utility Functions

### ID Generation

**Location**: `src/lib/rag/types/document.ts` (L74-L88)

```typescript
// Deterministic document ID
generateDocumentId(source: string, path: string): string;
// Example: generateDocumentId('blob', 'posts/DEV/test') → "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

// Deterministic chunk ID
generateChunkId(docId: string, position: number): string;
// Example: generateChunkId('doc-123', 0) → "f3e4d5c6-b7a8-9012-3456-789abcdef012"
```

### Text Hashing

**Location**: `src/lib/rag/types/embedding.ts`

```typescript
function generateTextHash(text: string): string;
// SHA-256 hash for embedding cache key
```

---

## Scripts

### cleanup-stale-docs.ts

**Location**: `scripts/cleanup-stale-docs.ts`

**Purpose**: 파일시스템에 존재하지 않는 문서(stale documents)를 Qdrant에서 정리

**Usage**:
```bash
# 로컬 개발 환경
RAG_GATEWAY_URL=http://localhost:3002 node scripts/cleanup-stale-docs.ts

# 프로덕션 환경 (확인 없이 바로 삭제)
RAG_GATEWAY_URL=https://rag-gateway.onrender.com node scripts/cleanup-stale-docs.ts --yes

# 또는 -y 플래그
RAG_GATEWAY_URL=https://rag-gateway.onrender.com node scripts/cleanup-stale-docs.ts -y
```

**How It Works**:

1. **파일시스템 스캔**: `.claude/docs/` 디렉토리의 모든 markdown 파일 스캔
2. **Slug 생성**: 파일 경로에서 slug 생성 (예: `facts/apps/rag-gateway/index.md`)
3. **Qdrant 조회**: `/api/documents?limit=1000`으로 모든 문서 가져오기
4. **Stale 문서 감지**: Qdrant에 있지만 파일시스템에 없는 문서 식별
5. **삭제 확인**: `--yes` 또는 `-y` 플래그로 삭제 승인
6. **일괄 삭제**: stale 문서들을 Qdrant에서 삭제

**Filters**:
- Only scans documents with slugs starting with:
  - `facts/apps/`
  - `insights/apps/`
  - `specs/apps/`
- Skips blog posts and other content

**Output**:
```
🔍 Scanning .claude/docs for markdown files...
📁 Found 125 markdown files
✅ Built index of 125 unique documents

📥 Fetching documents from Qdrant...
📊 Qdrant has 150 documents

🗑️  Found 25 stale documents:

  - facts/apps/old-app/index.md (Old App Documentation)
  - insights/apps/deprecated-feature/impact/roi.md (Deprecated Feature)

⚠️  This will DELETE the above documents from Qdrant.
Run with --yes or -y to confirm.

# With --yes flag:
🗑️  Deleting stale documents...

  ✅ Deleted: facts/apps/old-app/index.md
  ✅ Deleted: insights/apps/deprecated-feature/impact/roi.md

=== Summary ===
✅ Deleted: 25
❌ Failed: 0
📊 Total stale: 25

📊 Updated Qdrant stats:
  Vectors: 1250
```

**Use Cases**:
- 문서 구조 변경 후 정리
- 앱 삭제 후 관련 문서 제거
- 주기적인 데이터베이스 정리

**Important Notes**:
- Render 배포 환경에서는 작동하지 않음 (영구 스토리지 없음)
- 로컬 개발 또는 영구 스토리지 있는 환경에서만 사용

---

## MCP Tools

**Location**: `src/routes/mcp/mcp.handlers.ts` (L150-L353)

### Tool Implementations

| Tool | Function | Purpose |
|------|----------|---------|
| `search_blog` | `invokeSearchBlog()` | Search blog posts |
| `explain_code` | `invokeExplainCode()` | Explain code with context |
| `find_examples` | `invokeFindExamples()` | Find code examples |
| `get_related_posts` | `invokeGetRelatedPosts()` | Get related posts |

**Helper Functions**:
```typescript
extractConceptsFromExplanation(explanation: string): string[];
extractCodeBlocks(content: string): string[];
detectLanguage(technology: string): string;
```

---

## Type Guards

### Validation

**Location**: `src/middleware/output-filter.ts` (L307-L309)

```typescript
function isValidRedactOptions(options: unknown): options is RedactOptions;
```

---

## Dependencies

**Services**:
- `QdrantService` → `@qdrant/js-client-rest`
- `EmbeddingService` → `openai`
- `LLMService` → `openai` + custom GLM client

**RAG Core**:
- `QueryProcessor` → `QdrantService`, `EmbeddingService`, `LLMService`
- `IngestionPipeline` → `QdrantService`, `EmbeddingService`, `SemanticChunker`

**Middleware**:
- `rate-limit.ts` → `@repo/cache` (Redis)
- `security-headers.ts` → Hono middleware
- `input-validation.ts` → Standalone (pure patterns)
- `output-filter.ts` → Standalone (regex patterns)

---

## Test Suite (NEW)

### Overview

**Location**: `src/tests/`, `vitest.config.ts`
**Purpose**: 애플리케이션 테스트 및 테스트 설정
**Framework**: Vitest
**Last Verified**: 2026-01-04

### Vitest Configuration

- **Location**: `vitest.config.ts`
- **Source Exists**: true

```typescript
{
  test: {
    globals: true,              // 전역 테스트 함수 (describe, it, expect)
    environment: 'node',        // Node.js 환경
    include: ['**/*.test.ts'],  // 테스트 파일 패턴
    setupFiles: ['./src/tests/setup.ts'],  // 테스트 설정 파일
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
}
```

### Test Setup

- **Location**: `src/tests/setup.ts`
- **Source Exists**: true

**Features**:
- 환경변수 설정 (`NODE_ENV='test'`, Redis, Qdrant, API keys)
- @repo/cache 모킹
- 서비스 모킹 (Qdrant, Embedding, LLM)

### Handler Tests

**Location**: `src/tests/handlers/rag.test.ts`
**Source Exists**: true

**Coverage**:
- ingest() 핸들러: 문서 배열 처리, 빈 배열, force/batchSize 옵션, ID 자동 생성
- ingestStatus() 핸들러: 상태 조회, 404/400 에러 처리, completed/failed 상태

### Pipeline Tests

**Location**: `src/tests/ingestion/pipeline.test.ts`
**Source Exists**: true

**Coverage**:
- 빈 documents 배열 처리
- 배치 처리 (batchSize별 나누기)
- force 옵션 (재인덱싱 vs 건너뛰기)
- 개별 문서 실패 처리
- 진행률 업데이트
- getJobStatus(), cleanupJobs(), getAllJobs()

### Integration Tests

**Location**: `src/tests/integration/batch-ingest.test.ts`
**Source Exists**: true

**Coverage**:
- 다중/단일/대량(100개) 문서 인제스트
- force 옵션 통합 테스트
- batchSize 옵션 통합 테스트
- 상태 조회 (jobId로 진행률 확인)
- 에러 처리 (401, 422)

### Test Commands

```bash
# Run all tests
pnpm --filter=rag-gateway test

# Run once
pnpm --filter=rag-gateway test:run

# UI mode
pnpm --filter=rag-gateway test:ui

# Coverage
pnpm --filter=rag-gateway test:coverage
```

### Test Patterns

**Service Mocking**:
```typescript
vi.mock('@/services/qdrant', () => ({
  getQdrantService: vi.fn(() => ({
    initializeCollection: vi.fn(),
    upsertPoints: vi.fn(),
  })),
}));
```

**Dynamic Import**:
```typescript
const { default: ragRouter } = await import('@/routes/rag/rag.index');
app.route('/api', ragRouter);
```

**Async Job Testing**:
```typescript
const jobId = await pipeline.startIngestion(options);
await new Promise(resolve => setTimeout(resolve, 200));
const job = pipeline.getJobStatus(jobId);
```

**HTTP Request Simulation**:
```typescript
const response = await app.request('/api/rag/ingest', {
  method: 'POST',
  headers: { 'X-RAG-API-Key': 'test-api-key' },
  body: JSON.stringify({ documents: [] }),
});
```

### Test Coverage Summary

| Category | Test Files | Test Cases |
|----------|-----------|-----------|
| Handlers | rag.test.ts | 15+ |
| Pipeline | pipeline.test.ts | 20+ |
| Integration | batch-ingest.test.ts | 15+ |
| **Total** | 3 files | 50+ |
