# RAG Gateway - Components

- **Scope**: UI 컴포넌트 및 재사용 가능한 모듈
- **Source of Truth**: N/A (API-only 서비스, UI 컴포넌트 없음)
- **Last Verified**: 2024-12-26

## Note

RAG Gateway는 **API 전용 서비스**이므로 UI 컴포넌트가 없습니다.

클라이언트 측 UI 컴포넌트는 **blog-admin** 앱에서 관리합니다:

- `apps/blog-admin/src/app/dashboard/rag/` - RAG 쿼리 UI
- Server Actions: `apps/blog-admin/src/app/actions/rag.ts`

---

## Related Components

### Blog-Admin RAG Components

| Component | Location | Purpose |
|-----------|----------|---------|
| RAG Query Form | `blog-admin/src/app/dashboard/rag/` | RAG 쿼리 입력 폼 |
| Server Actions | `blog-admin/src/app/actions/rag.ts` | `ragQuery()`, `ragSearch()` |
| RPC Client | `blog-admin/src/lib/rpc.ts` | Hono RPC 타입 안전 클라이언트 |

### Example Usage (blog-admin)

```typescript
// apps/blog-admin/src/app/actions/rag.ts
'use server';

import { getQdrantService } from '@apps/rag-gateway/services/qdrant';
import { env } from '@apps/rag-gateway/env';

export async function ragQuery(query: string) {
  const response = await fetch(`${env.NEXT_PUBLIC_RAG_URL}/api/rag/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RAG-API-Key': env.RAG_GATEWAY_API_KEY,
    },
    body: JSON.stringify({ query, limit: 5 }),
  });

  return response.json();
}
```

---

## Internal Modules

### Route Handlers (Hono)

RAG Gateway는 Hono 라우트 핸들러를 "컴포넌트"로 사용합니다:

| Module | Location | Purpose |
|--------|----------|---------|
| RAG Handlers | `src/routes/rag/rag.handlers.ts` | `query()`, `search()`, `ingest()` |
| Document Handlers | `src/routes/documents/documents.handlers.ts` | CRUD operations |
| Admin Handlers | `src/routes/admin/admin.handlers.ts` | Stats, reindex, health |
| MCP Handlers | `src/routes/mcp/mcp.handlers.ts` | MCP tool invocation |

### Middleware Modules

| Middleware | Location | Purpose |
|------------|----------|---------|
| Auth | `src/middleware/auth.ts` | API Key validation |
| Rate Limit | `src/middleware/rate-limit.ts` | Request throttling |
| Input Validation | `src/middleware/input-validation.ts` | Prompt injection detection |
| Output Filter | `src/middleware/output-filter.ts` | Sensitive data redaction |
| Security Headers | `src/middleware/security-headers.ts` | Security headers |
| Logger | `src/middleware/logger.ts` | Pino logging |

---

## See Also

- [pages/routes.md](../pages/routes.md) - Route handler details
- [apis/index.md](../apis/index.md) - API endpoint documentation
- [utils/index.md](../utils/index.md) - Service and middleware details
