# RAG Gateway - Schemas & Types

- **Scope**: TypeScript 타입 정의, Zod 스키마, 데이터 모델
- **Source of Truth**: `src/lib/rag/types/`, `src/env.ts`
- **Last Verified**: 2024-12-26

---

## Environment Variable Schema

**Location**: `src/env.ts` (L10-L76)

### Server Variables

```typescript
// Server Configuration
NODE_ENV: 'development' | 'production' | 'test'  // Default: 'development'
PORT: number                                          // Default: 3002, Coerce: true
LOG_LEVEL: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'  // Default: 'info'

// Qdrant Configuration
QDRANT_URL: string                   // Required: URL format
QDRANT_API_KEY?: string              // Optional

// LLM Configuration
OPENAI_API_KEY: string               // Required: Min length 1
GLM_API_KEY?: string                 // Optional: Zhipu AI key
LLM_PROVIDER: 'openai' | 'glm'      // Default: 'openai'

// Embedding Configuration
SILICONFLOW_API_KEY?: string         // Optional: For SiliconFlow
EMBEDDING_PROVIDER: 'openai' | 'siliconflow'  // Default: 'openai'
EMBEDDING_MODEL: EmbeddingModel       // Default: 'text-embedding-3-small'

// Optional Redis for caching
REDIS_URL?: string                   // Optional: URL format

// Blog-Admin URL for fetching blob files
BLOG_ADMIN_URL: string               // Default: 'http://localhost:3001'

// CORS Configuration
ALLOWED_ORIGINS: string              // Default: 'http://localhost:3000,http://localhost:3001'

// API Key Authentication
RAG_GATEWAY_API_KEY: string          // Required: Min length 1
```

### Embedding Model Enum

```typescript
type EmbeddingModel =
  // OpenAI models
  | 'text-embedding-3-small'    // 1536 dims
  | 'text-embedding-3-large'    // 3072 dims
  | 'text-embedding-ada-002'    // 1536 dims
  // SiliconFlow models
  | 'embedding-2'               // 1024 dims
  | 'embedding-3'               // 1024 dims
  | 'BAAI/bge-m3'               // 1024 dims (multilingual/Korean)
  | 'BAAI/bge-large-zh-v1.5'    // 1024 dims
  | 'zephyr-embedding'          // 1024 dims
  | 'zephyr-embedding-large';   // 1024 dims
```

### Client Variables

```typescript
NEXT_PUBLIC_RAG_URL: string      // Required: URL format
```

---

## Document Types

**Location**: `src/lib/rag/types/document.ts` (L1-L89)

### DocumentSource

```typescript
enum DocumentSource {
  BLOB = 'blob',         // Vercel Blob Storage
  UPLOAD = 'upload',     // Direct upload
  API = 'api',           // API-generated
  SCRAPER = 'scraper'    // Web scraper
}
```

### DocumentMetadata

```typescript
interface DocumentMetadata {
  title: string;                    // Document title
  slug?: string;                    // URL path
  author?: string;                  // Author name
  category?: string;                // Category classification
  tags?: string[];                  // Topic tags
  publishedAt?: string;             // ISO 8601 datetime
  wordCount?: number;               // Total word count
  language: string;                 // Default: 'ko'
  source: DocumentSource;           // Source type
  sourceUrl?: string;               // Original URL (if applicable)
  uploadedAt: string;               // ISO 8601 datetime
  lastModified: string;             // ISO 8601 datetime
}
```

### Document Schema

```typescript
interface Document {
  id: string;                       // Unique document ID
  content: string;                  // Full markdown content
  metadata: DocumentMetadata;
  chunks?: string[];                // Chunk IDs
  indexedAt?: string;               // ISO 8601 datetime
}
```

### QdrantPoint

```typescript
interface QdrantPoint {
  id: string;                       // Point ID (UUID)
  vector: number[];                 // Embedding vector
  payload: {
    documentId: string;             // Parent document ID
    chunkIndex: number;             // Chunk position in document
    content: string;                // Chunk text content
    metadata: DocumentMetadata;     // Document metadata
    position?: {
      start: number;                // Start character offset
      end: number;                  // End character offset
    };
  };
}
```

### DocumentFilter

```typescript
interface DocumentFilter {
  documentId?: string;              // Filter by document ID
  category?: string;                // Filter by category
  tags?: string[];                  // Filter by tags (OR logic)
  author?: string;                  // Filter by author
  dateRange?: {
    start?: string;                 // ISO 8601 datetime (inclusive)
    end?: string;                   // ISO 8601 datetime (inclusive)
  };
  source?: DocumentSource;          // Filter by source
}
```

### ID Generation

**Location**: `src/lib/rag/types/document.ts` (L74-L88)

```typescript
// Deterministic document ID from source + path
function generateDocumentId(source: string, path: string): string;
// Returns: UUID format (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890")

// Deterministic chunk ID from docId + position
function generateChunkId(docId: string, position: number): string;
// Returns: UUID format
```

---

## Query Types

**Location**: `src/lib/rag/types/query.ts` (L1-L85)

### QueryIntent

```typescript
enum QueryIntent {
  SEARCH = 'search',               // General search
  EXPLAIN = 'explain',             // Explanation request
  FIND_EXAMPLES = 'find_examples', // Code examples
  COMPARE = 'compare',             // Comparison
  HOW_TO = 'how_to',              // How-to guide
  TROUBLESHOOT = 'troubleshoot',   // Troubleshooting
  BEST_PRACTICES = 'best_practices'  // Best practices
}
```

### RAGQueryRequest

```typescript
interface RAGQueryRequest {
  query: string;                   // Required: Min length 1
  context?: string;                // Optional: Additional context
  intent?: QueryIntent;            // Optional: Query classification
  filters?: DocumentFilter;        // Optional: Search filters
  limit?: number;                  // Default: 5, Min: 1, Max: 20
  temperature?: number;            // Default: 0.7, Min: 0, Max: 2
  includeSources?: boolean;        // Default: true
  stream?: boolean;                // Default: false
}
```

### SourceReference

```typescript
interface SourceReference {
  id: string;                      // Chunk/document ID
  title: string;                   // Document title
  slug: string;                    // Document slug
  content: string;                 // Excerpt/content
  score: number;                   // Similarity score (0-1)
  metadata?: {
    title?: string;
    category?: string;
    tags?: string[];
    author?: string;
  };
}
```

### LLMUsage

```typescript
interface LLMUsage {
  model: string;                   // Model name (e.g., "gpt-4o-mini")
  totalTokens: number;             // Total tokens used
  promptTokens: number;            // Input tokens
  completionTokens: number;        // Output tokens
  cost?: number;                   // Cost in USD
}
```

### RAGQueryResponse

```typescript
interface RAGQueryResponse {
  answer: string;                  // LLM-generated answer
  sources: SourceReference[];      // Retrieved sources
  usage?: LLMUsage;                // Token usage
  intent?: QueryIntent;            // Classified intent
  queryTime?: number;              // Query time in ms
  model?: string;                  // LLM model used
}
```

### SearchRequest

```typescript
interface SearchRequest {
  query: string;                   // Required: Min length 1
  filters?: DocumentFilter;        // Optional
  limit?: number;                  // Default: 10, Min: 1, Max: 50
  threshold?: number;              // Default: 0.7, Min: 0, Max: 1
  rerank?: boolean;                // Default: true
}
```

### SearchResponse

```typescript
interface SearchResponse {
  results: SourceReference[];      // Search results
  total: number;                   // Total results count
  queryTime: number;               // Query time in ms
  hasMore?: boolean;               // More results available
}
```

---

## Embedding Types

**Location**: `src/lib/rag/types/embedding.ts`

### Embedding

```typescript
interface Embedding {
  id: string;                      // Embedding ID
  vector: number[];                // Embedding vector
  text: string;                    // Original text
  model: EmbeddingModel;           // Model used
  provider: 'openai' | 'siliconflow';
  dimensions: number;              // Vector dimensions
  tokenCount: number;              // Estimated tokens
  createdAt: string;               // ISO 8601 datetime
  hash: string;                    // Text hash for caching
}
```

### EmbeddingConfig

```typescript
interface EmbeddingConfig {
  provider: 'openai' | 'siliconflow';
  model: EmbeddingModel;
  dimensions: number;              // Vector dimensions
  batchSize?: number;              // Default: 50
  maxTokens?: number;              // Max tokens per text
}
```

### Utility Functions

```typescript
// Generate hash from text for caching
function generateTextHash(text: string): string;

// Calculate cosine similarity
function cosineSimilarity(vec1: number[], vec2: number[]): number;
```

---

## Chunk Types

**Location**: `src/lib/rag/types/chunk.ts`

### Chunk

```typescript
interface Chunk {
  id: string;                      // Chunk ID
  content: string;                 // Chunk text
  metadata: {
    position: {
      start: number;               // Start offset in document
      end: number;                 // End offset in document
      charCount: number;           // Character count
    };
    wordCount: number;             // Word count
  };
}
```

### ChunkingOptions

```typescript
interface ChunkingOptions {
  maxSize?: number;                // Default: 1200 - Max chunk size
  minSize?: number;                // Default: 100 - Min chunk size
  overlap?: number;                // Default: 200 - Overlap between chunks
  respectStructure?: boolean;      // Default: true - Respect headings, lists
}
```

### ChunkerInterface

```typescript
interface ChunkerInterface {
  chunk(content: string, options?: ChunkingOptions): Promise<Chunk[]>;
}
```

---

## Service Interfaces

**Location**: `src/lib/rag/types/interfaces.ts` (L1-L144)

### IQdrantService

```typescript
interface IQdrantService {
  initializeCollection(): Promise<void>;
  upsertPoints(points: QdrantPoint[]): Promise<void>;
  search(
    queryVector: number[],
    params?: Partial<SearchParams>
  ): Promise<SimilarityResult[]>;
  deletePoints(filter: DocumentFilter): Promise<void>;
  deletePoint(pointId: string): Promise<void>;
  getCollectionInfo(): Promise<CollectionInfo>;
  scrollPoints(
    filter?: DocumentFilter,
    limit?: number,
    offset?: { point_id: string }
  ): Promise<ScrollResult>;
  countPoints(filter?: DocumentFilter): Promise<number>;
  healthCheck(): Promise<boolean>;
}
```

### SearchParams

```typescript
interface SearchParams {
  limit?: number;                  // Default: 10
  threshold?: number;              // Similarity threshold
  filter?: DocumentFilter;         // Payload filter
  includeMetadata?: boolean;       // Default: true
}
```

### SimilarityResult

```typescript
interface SimilarityResult {
  id: string;                      // Point ID
  score: number;                   // Similarity score (0-1)
  text: string;                    // Content
  documentId?: string;             // Document ID
  metadata?: DocumentMetadata;     // Payload metadata
  position?: {
    start: number;
    end: number;
    charCount: number;
  };
}
```

### IEmbeddingService

```typescript
interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  createEmbedding(
    text: string,
    metadata?: Partial<Omit<Embedding, 'id' | 'vector' | 'text' | 'hash'>>
  ): Promise<Embedding>;
  getOrGenerate(text: string): Promise<number[]>;
  calculateSimilarity(embedding1: number[], embedding2: number[]): number;
  clearCache(): void;
  getCacheStats(): { size: number; memoryEstimate: number };
  validateDimensions(embedding: number[]): boolean;
}
```

### ILLMService

```typescript
interface ILLMService {
  generateRAGResponse(
    request: RAGQueryRequest,
    sources: SourceReference[]
  ): Promise<RAGQueryResponse>;
  chat(message: string, temperature?: number): Promise<string>;
}
```

---

## Error Schemas

**Location**: `src/libs/error.ts`

### BadRequestErrorSchema

```typescript
{
  error: string;                  // "Bad Request"
  message: string;                // Error description
}
```

### UnauthorizedErrorSchema

```typescript
{
  error: string;                  // "Unauthorized"
  message: string;                // "Missing X-RAG-API-Key header" or "Invalid API key"
}
```

### TooManyRequestsErrorSchema

```typescript
{
  error: string;                  // "rate_limit_exceeded"
  message: string;                // Error message with retry time
  retryAfter?: number;            // Seconds until retry
  limit: number;                  // Rate limit
  remaining: number;              // Remaining requests
  reset: number;                  // Reset timestamp
}
```

### NotFoundErrorSchema

```typescript
{
  error: string;                  // "Not Found"
  message: string;                // Resource description
}
```

### InternalServerErrorSchema

```typescript
{
  error: string;                  // Error type
  message: string;                // Error details
}
```

---

## Validation Constants

**Location**: `src/middleware/input-validation.ts` (L62-L77)

### Input Limits

```typescript
const INPUT_LIMITS = {
  MAX_QUERY_LENGTH: 2000,         // Max query characters
  MAX_CONTEXT_LENGTH: 5000,       // Max context characters
} as const;
```

### Validation Errors

```typescript
const VALIDATION_ERRORS = {
  PROMPT_INJECTION: 'Invalid input detected: Possible prompt injection attempt',
  QUERY_TOO_LONG: `Query exceeds maximum length of ${INPUT_LIMITS.MAX_QUERY_LENGTH} characters`,
  CONTEXT_TOO_LONG: `Context exceeds maximum length of ${INPUT_LIMITS.MAX_CONTEXT_LENGTH} characters`,
  EMPTY_INPUT: 'Query cannot be empty',
} as const;
```

---

## Rate Limit Configuration

**Location**: `src/middleware/rate-limit.ts` (L34-L43)

### Rate Limit Config

```typescript
interface RateLimitConfig {
  limit: number;                  // Max requests
  window: number;                 // Time window in seconds
  skipOnRedisUnavailable?: boolean;
}
```

### Default Limits

```typescript
const DEFAULT_RATE_LIMITS = {
  STRICT: { limit: 10, window: 60 },      // Public endpoints
  STANDARD: { limit: 60, window: 60 },    // Authenticated endpoints
  LENIENT: { limit: 30, window: 60 },     // Health checks
} as const;
```

---

## Type Dependencies

```
env.ts
  └── Uses @t3-oss/env-nextjs with Zod schemas

lib/rag/types/
  ├── document.ts (DocumentFilter, DocumentMetadata)
  ├── query.ts (RAGQueryRequest, SearchRequest)
  ├── chunk.ts (Chunk, ChunkingOptions)
  ├── embedding.ts (Embedding, EmbeddingConfig)
  └── interfaces.ts (IQdrantService, IEmbeddingService, ILLMService)

libs/error.ts
  └── Error schemas for OpenAPI responses

middleware/
  ├── input-validation.ts (INPUT_LIMITS, VALIDATION_ERRORS)
  └── rate-limit.ts (RateLimitConfig, DEFAULT_RATE_LIMITS)
```
