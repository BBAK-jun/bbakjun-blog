# RAG Gateway - Routes & Pages

- **Scope**: Hono API 라우트 구조 및 미들웨어 체인
- **Source of Truth**: `src/routes/`, `src/app.ts`, `src/routes/*/index.ts`
- **Last Verified**: 2024-12-26

## Route Structure

**Location**: `src/app.ts` (L9-L21)

```typescript
const app = createApp();
configureOpenAPI(app);

const routers = [ragRouter, adminRouter, documentsRouter, mcpRouter] as const;

routers.forEach(router => {
  app.route('/', router);
});
```

All routes are mounted at `/api` base path (defined in `create-app.ts`).

---

## RAG Routes (`/api/rag/*`)

**Location**: `src/routes/rag/rag.index.ts`

### Middleware Chain

```typescript
router.use('*', apiSecurityHeaders);        // P2: Security headers
router.use('/query', ragRateLimit);         // P2: Rate limiting (60 req/min)
router.use('/search', ragRateLimit);
router.use('/ingest', ragRateLimit);
router.use('/ingest/status', ragRateLimit);
router.use('/health', healthRateLimit);     // P2: Lenient rate limit (30 req/min)
router.use('/query', verifyAuth);           // P0: API Key auth
router.use('/search', verifyAuth);
router.use('/ingest', verifyAuth);
router.use('/ingest/status', verifyAuth);
// Note: /health has no auth (public endpoint)
```

### Endpoints

| Method | Path | Handler | Auth | Rate Limit |
|--------|------|---------|------|------------|
| POST | `/api/rag/query` | `handlers.query` | ✅ | Standard |
| POST | `/api/rag/search` | `handlers.search` | ✅ | Standard |
| POST | `/api/rag/ingest` | `handlers.ingest` | ✅ | Standard |
| GET | `/api/rag/ingest/status` | `handlers.ingestStatus` | ✅ | Standard |
| GET | `/api/rag/health` | `handlers.health` | ❌ | Lenient |

---

## Documents Routes (`/api/documents/*`)

**Location**: `src/routes/documents/documents.index.ts`

### Middleware Chain

No authentication or rate limiting applied (internal use only).

### Endpoints

| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/documents` | `handlers.listDocuments` | List documents with pagination |
| GET | `/api/documents/{id}` | `handlers.getDocument` | Get document by ID |
| POST | `/api/documents` | `handlers.createDocument` | Create & index new document |
| PUT | `/api/documents/{id}` | `handlers.updateDocument` | Update existing document |
| DELETE | `/api/documents/{id}` | `handlers.deleteDocument` | Delete document |

---

## Admin Routes (`/api/admin/*`)

**Location**: `src/routes/admin/admin.index.ts`

### Middleware Chain

No authentication or rate limiting applied (admin-only internal access).

### Endpoints

| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/admin/stats` | `handlers.getStats` | System statistics |
| GET | `/api/admin/logs` | `handlers.getLogs` | Audit logs |
| POST | `/api/admin/reindex` | `handlers.createReindex` | Trigger reindex job |
| GET | `/api/admin/reindex/{jobId}` | `handlers.getReindexStatus` | Get job status |
| DELETE | `/api/admin/cache` | `handlers.clearCache` | Clear embedding cache |
| GET | `/api/admin/health` | `handlers.getHealth` | Component health check |

---

## MCP Routes (`/api/mcp/*`)

**Location**: `src/routes/mcp/mcp.index.ts`

### Middleware Chain

No authentication or rate limiting applied (Model Context Protocol tools).

### Endpoints

| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/mcp/tools` | `handlers.listTools` | List available MCP tools |
| POST | `/api/mcp/invoke` | `handlers.invokeTool` | Invoke MCP tool |
| POST | `/api/mcp/explain` | `handlers.explain` | Explain code/context |

### Available MCP Tools

**Location**: `src/routes/mcp/mcp.handlers.ts` (L10-L44)

1. **search_blog**: Search blog posts for relevant information
2. **explain_code**: Explain code snippets from the blog
3. **find_examples**: Find code examples for specific technologies
4. **get_related_posts**: Get posts related to a specific topic

---

## Middleware Order

For authenticated RAG routes (e.g., `/api/rag/query`):

```
Request
  ↓
1. apiSecurityHeaders       (security-headers.ts)
   → CSP, HSTS, X-Frame-Options, etc.
  ↓
2. ragRateLimit             (rate-limit.ts)
   → Check Redis/in-memory rate limit
   → Returns 429 if exceeded
  ↓
3. verifyAuth               (auth.ts)
   → Validate X-RAG-API-Key header
   → Returns 401 if invalid/missing
  ↓
4. Handler (query/search)   (rag.handlers.ts)
   → Input sanitization (input-validation.ts)
   → Output filtering (output-filter.ts)
  ↓
Response
```

---

## OpenAPI Documentation

**Location**: `src/libs/open-api.ts`

- Scalar UI available at `/api/doc`
- Auto-generated from Zod schemas
- Includes request/response examples

---

## Error Responses

**Location**: `src/libs/error.ts`

| Status Code | Schema | Description |
|-------------|--------|-------------|
| 400 | BadRequestErrorSchema | Invalid input (e.g., prompt injection detected) |
| 401 | UnauthorizedErrorSchema | Missing/invalid API key |
| 404 | NotFoundErrorSchema | Resource not found |
| 429 | TooManyRequestsErrorSchema | Rate limit exceeded |
| 500 | InternalServerErrorSchema | Server error |
| 503 | Service Unavailable | Health check failure |

---

## Dependencies

**Routes**:
- `@/middleware/auth` → API Key validation
- `@/middleware/rate-limit` → `@repo/cache` (Redis)
- `@/middleware/input-validation` → Prompt injection patterns
- `@/middleware/output-filter` → Sensitive data redaction
- `@/middleware/security-headers` → Security header configuration

**Handlers**:
- `@/services/qdrant` → Vector database operations
- `@/services/embedding` → Embedding generation
- `@/services/llm` → LLM response generation
- `@/lib/rag/core` → Query processing logic
- `@/lib/rag/ingestion` → Document ingestion pipeline
