# RAG Gateway - Configuration

- **Scope**: 환경 변수, 앱 설정, 보안 설정
- **Source of Truth**: `src/env.ts`, `src/libs/create-app.ts`, `src/middleware/security-headers.ts`
- **Last Verified**: 2024-12-26

---

## Environment Variables

### Required Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `QDRANT_URL` | string (URL) | Qdrant cluster URL | `https://cluster.qdrant.io` |
| `OPENAI_API_KEY` | string (min: 1) | OpenAI API key | `sk-...` |
| `RAG_GATEWAY_API_KEY` | string (min: 1) | API authentication key | Generate with `openssl rand -base64 32` |
| `REDIS_URL` | string (URL, optional) | Redis for caching | `redis://localhost:6379` |
| `BLOG_ADMIN_URL` | string (URL) | Blog-Admin URL | `http://localhost:3001` |
| `ALLOWED_ORIGINS` | string | CORS allowed origins (comma-separated) | `http://localhost:3000,http://localhost:3001` |

### Optional Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | enum | `development` | `development` \| `production` \| `test` |
| `PORT` | number (coerced) | `3002` | Server port |
| `LOG_LEVEL` | enum | `info` | `trace` \| `debug` \| `info` \| `warn` \| `error` \| `fatal` |
| `QDRANT_API_KEY` | string | - | Qdrant API key (if required) |
| `GLM_API_KEY` | string | - | Zhipu AI GLM API key |
| `LLM_PROVIDER` | enum | `openai` | `openai` \| `glm` |
| `SILICONFLOW_API_KEY` | string | - | SiliconFlow API key (for Korean embeddings) |
| `EMBEDDING_PROVIDER` | enum | `openai` | `openai` \| `siliconflow` |
| `EMBEDDING_MODEL` | enum | `text-embedding-3-small` | See Embedding Models below |
| `NEXT_PUBLIC_RAG_URL` | string (URL) | - | Public RAG Gateway URL |

**Location**: `src/env.ts` (L10-L76)

---

## Embedding Models

### OpenAI Models

| Model | Dimensions | Max Tokens | Use Case |
|-------|------------|------------|----------|
| `text-embedding-3-small` | 1536 | 8191 | Default, balanced |
| `text-embedding-3-large` | 3072 | 8191 | High accuracy |
| `text-embedding-ada-002` | 1536 | 8191 | Legacy |

### SiliconFlow Models (Korean/Multilingual)

| Model | Dimensions | Max Tokens | Use Case |
|-------|------------|------------|----------|
| `BAAI/bge-m3` | 1024 | 8192 | Multilingual, Korean |
| `BAAI/bge-large-zh-v1.5` | 1024 | 8192 | Chinese |
| `embedding-2` | 1024 | 8192 | GLM embedding |
| `embedding-3` | 1024 | 8192 | GLM embedding v3 |
| `zephyr-embedding` | 1024 | 8192 | Zephyr |
| `zephyr-embedding-large` | 1024 | 8192 | Zephyr large |

**Location**: `src/services/embedding.ts` (L7-L20)

---

## LLM Models

### OpenAI

| Model | Input Cost | Output Cost | Max Tokens | Use Case |
|-------|------------|-------------|------------|----------|
| `gpt-4o-mini` | $0.15/M | $0.60/M | 2000 | Default, fast |
| `gpt-4o` | $2.50/M | $10.00/M | - | High quality |

**Location**: `src/services/llm/openai.strategy.ts` (L67-L81)

### GLM (Zhipu AI)

| Model | Input Cost | Output Cost | Max Tokens | Use Case |
|-------|------------|-------------|------------|----------|
| `glm-4.6` | $0.005/M | $0.025/M | 2000 | Korean optimized |

**Location**: `src/services/llm/glm.strategy.ts` (L70-L82)

---

## Application Configuration

**Location**: `src/libs/create-app.ts` (L14-L37)

### Base App Setup

```typescript
export default function createApp() {
  const app = createRouter().basePath('/api');  // All routes under /api
  app.use(requestId()).use(logger());           // Request ID + Pino logger

  // CORS configuration
  app.use('*', cors({
    origin: env.ALLOWED_ORIGINS.split(','),    // Comma-separated origins
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }));

  app.notFound(notFound);
  app.onError(onError);
  return app;
}
```

### CORS Origins

Default: `http://localhost:3000,http://localhost:3001`

**Production**: Set `ALLOWED_ORIGINS` to production domains

---

## Security Configuration

### Security Headers

**Location**: `src/middleware/security-headers.ts` (L59-L96)

```typescript
export const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  // Content Security Policy
  csp: "default-src 'none'; frame-ancestors 'none'",

  // Anti-clickjacking
  frameOptions: 'DENY',

  // MIME sniffing protection
  noSniff: true,

  // XSS filter (legacy)
  xssProtection: true,

  // HSTS (1 year, include subdomains, preload)
  hsts: true,
  hstsMaxAge: 31536000,
  hstsIncludeSubDomains: true,
  hstsPreload: true,

  // Referrer Policy
  referrerPolicy: 'no-referrer',

  // Permissions Policy (all disabled for API)
  permissionsPolicy:
    'geolocation=(), microphone=(), camera=(), ..., ' +
    'sync-xhr=(), xr-spatial-tracking=()',

  // Cross-Origin isolation
  coop: 'same-origin',
  coep: 'require-corp',

  // Cross-Origin-Resource-Policy
  corp: 'same-origin',
};
```

### Applied Headers

Production responses include:
- `Content-Security-Policy`: `default-src 'none'; frame-ancestors 'none'`
- `X-Frame-Options`: `DENY`
- `X-Content-Type-Options`: `nosniff`
- `X-XSS-Protection`: `1; mode=block`
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`
- `Referrer-Policy`: `no-referrer`
- `Permissions-Policy`: All features disabled
- `Cross-Origin-Opener-Policy`: `same-origin`
- `Cross-Origin-Embedder-Policy`: `require-corp`
- `Cross-Origin-Resource-Policy`: `same-origin`
- `X-DNS-Prefetch-Control`: `off`
- `X-Download-Options`: `noopen`
- `X-Permitted-Cross-Domain-Policies`: `none`
- `Server`: (empty, hidden)

**Location**: Applied via `apiSecurityHeaders` middleware in `src/routes/rag/rag.index.ts` (L12)

---

## Qdrant Configuration

**Location**: `src/services/qdrant.ts` (L55-L103)

### Collection Settings

```typescript
{
  vectors: {
    size: 1536,                    // text-embedding-3-small dimensions
    distance: 'Cosine',            // Cosine similarity
  },
  optimizers_config: {
    default_segment_number: 2,
    max_segment_size: 200000,
    memmap_threshold: 50000,
  },
  replication_factor: 1,
  write_consistency_factor: 1,
  on_disk_payload: true,           // Store payload on disk
}
```

### Indexed Payload Fields

**Location**: `src/services/qdrant.ts` (L108-L142)

| Field | Type | Purpose |
|-------|------|---------|
| `documentId` | keyword | Document grouping |
| `metadata.category` | keyword | Category filtering |
| `metadata.tags` | keyword | Tag filtering |
| `metadata.author` | keyword | Author filtering |
| `metadata.source` | keyword | Source filtering |
| `metadata.publishedAt` | datetime | Date range filtering |

---

## Rate Limiting Configuration

### Default Limits

**Location**: `src/middleware/rate-limit.ts` (L34-L43)

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public (STRICT) | 10 requests | 60 seconds |
| Authenticated (STANDARD) | 60 requests | 60 seconds |
| Health Check (LENIENT) | 30 requests | 60 seconds |

### Rate Limiting by Route

**Location**: `src/routes/rag/rag.index.ts` (L15-L19)

```typescript
router.use('/query', ragRateLimit);        // 60 req/min
router.use('/search', ragRateLimit);       // 60 req/min
router.use('/ingest', ragRateLimit);       // 60 req/min
router.use('/ingest/status', ragRateLimit); // 60 req/min
router.use('/health', healthRateLimit);    // 30 req/min
```

### Redis Configuration

Uses shared Redis client from `@repo/cache`:

```typescript
import { getRedisClient, isRedisAvailable } from '@repo/cache';
```

**Fallback**: In-memory Map when Redis unavailable

---

## Logging Configuration

**Location**: `src/middleware/logger.ts` (L7-L16)

```typescript
export function logger() {
  return pinoLogger({
    pino: pino({
      level: env.LOG_LEVEL || 'info',     // trace, debug, info, warn, error, fatal
    }, env.NODE_ENV === 'production' ? undefined : pretty()),  // Pretty print in dev
  });
}
```

### Log Levels

| Level | Usage |
|-------|-------|
| `trace` | Very detailed logging |
| `debug` | Debugging information |
| `info` | General information (default) |
| `warn` | Warning messages |
| `error` | Error messages |
| `fatal` | Critical errors |

---

## Input Validation Configuration

### Input Length Limits

**Location**: `src/middleware/input-validation.ts` (L62-L67)

```typescript
const INPUT_LIMITS = {
  MAX_QUERY_LENGTH: 2000,        // Max query characters
  MAX_CONTEXT_LENGTH: 5000,      // Max context characters
} as const;
```

### Prompt Injection Patterns

**Location**: `src/middleware/input-validation.ts` (L18-L59)

Protected patterns:
- Instruction override: `ignore previous instructions`, `disregard everything above`
- System prompt extraction: `system:`, `show me your system prompt`
- Special tokens: `[INST]`, `<|>`, `<s>`, `<<SYS>>`
- Role/jailbreak: `you are now`, `act as`, `pretend`, `jailbreak`
- Script injection: `<script>`, `javascript:`, `data:text/html`
- Encoding bypass: Unicode escapes, HTML entities

---

## Output Filtering Configuration

### Sensitive Data Patterns

**Location**: `src/middleware/output-filter.ts` (L22-L49)

| Pattern | Regex | Example |
|---------|-------|---------|
| Email | `/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi` | `user@example.com` |
| Credit Card | `/\b(?:\d[ -]*?){13,16}\b/g` | `4111 1111 1111 1111` |
| Phone | `/\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g` | `+1 555-123-4567` |
| Auth Token | `/Bearer\s+[A-Za-z0-9\-._~+/]+/gi` | `Bearer eyJhbG...` |
| API Key | `/\b[A-Za-z0-9]{32,}\b/g` | 32+ char alphanumeric |
| AWS Access Key | `/\bAKIA[0-9A-Z]{16}\b/g` | `AKIAIOSFODNN7EXAMPLE` |
| AWS Secret Key | `/\b[A-Za-z0-9/+=]{40}\b/g` | 40 char base64 |
| URL with credentials | `/:\/\/[^:\s]+:[^@\s]+@/g` | `https://user:pass@host` |

### Redaction Options

**Location**: `src/middleware/output-filter.ts` (L66-L79)

```typescript
interface RedactOptions {
  patterns?: Array<keyof typeof SENSITIVE_PATTERNS>;  // Patterns to use
  replacement?: string;                                // Default: '[REDACTED]'
  preservePartial?: boolean;                           // Show first 2-3 chars
}
```

---

## OpenAPI Configuration

**Location**: `src/libs/open-api.ts`

- Auto-generated from Zod schemas
- Scalar UI at `/api/doc`
- Includes all routes, request/response schemas, error responses

---

## Dependency Configuration

### Package Dependencies

**Location**: `package.json` (L21-L38)

| Package | Version | Purpose |
|---------|---------|---------|
| `hono` | 4.6.5 | Web framework |
| `@hono/node-server` | 1.19.7 | Node.js server |
| `@hono/zod-openapi` | 0.16.4 | OpenAPI integration |
| `@qdrant/js-client-rest` | 1.15.1 | Qdrant client |
| `openai` | 4.28.4 | OpenAI API |
| `@t3-oss/env-nextjs` | 0.10.1 | Type-safe env vars |
| `zod` | 3.23.8 | Validation |
| `pino` | 10.1.0 | Logging |
| `dotenv` | 17.2.3 | Environment loading |

### Shared Workspace Dependencies

| Package | Path | Purpose |
|---------|------|---------|
| `@repo/content` | `../../packages/content` | MDX processing |
| `@repo/cache` | `../../packages/cache` | Redis client |

---

## Build Configuration

### TypeScript Config

**Location**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

### tsup Config

**Location**: `tsup.config.ts`

Builds Node.js server bundle from `src/index.ts`.

---

## Environment Setup

### Development

```bash
# .env.local
NODE_ENV=development
PORT=3002
LOG_LEVEL=debug

QDRANT_URL=http://localhost:6333
OPENAI_API_KEY=sk-...
RAG_GATEWAY_API_KEY=test-key

BLOG_ADMIN_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

REDIS_URL=redis://localhost:6379
```

### Production

```bash
# Generate secure keys
RAG_GATEWAY_API_KEY=$(openssl rand -base64 32)
AUTH_SECRET=$(openssl rand -base64 32)

# Set in Vercel/dotenv
NODE_ENV=production
PORT=3002
LOG_LEVEL=info

QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-key
OPENAI_API_KEY=sk-...
RAG_GATEWAY_API_KEY=<generated>

EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
LLM_PROVIDER=openai

BLOG_ADMIN_URL=https://your-admin.vercel.app
ALLOWED_ORIGINS=https://your-blog.vercel.app,https://your-admin.vercel.app

REDIS_URL=redis://user:pass@host:port
```
