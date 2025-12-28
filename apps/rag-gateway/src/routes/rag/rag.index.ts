import { createRouter } from '@/libs';
import { verifyAuth } from '@/middleware/auth';
import { apiSecurityHeaders } from '@/middleware/security-headers';
import { ragRateLimit, healthRateLimit } from '@/middleware/rate-limit';

import * as routes from './rag.routes';
import * as handlers from './rag.handlers';

const router = createRouter()
  .openapi(routes.query, handlers.query)
  .openapi(routes.search, handlers.search)
  .openapi(routes.ingest, handlers.ingest)
  .openapi(routes.ingestStatus, handlers.ingestStatus)
  .openapi(routes.health, handlers.health)
  .use('*', apiSecurityHeaders)
  .use('/query', ragRateLimit)
  .use('/search', ragRateLimit)
  .use('/ingest', ragRateLimit)
  .use('/ingest/status', ragRateLimit)
  .use('/health', healthRateLimit)
  .use('/query', verifyAuth)
  .use('/search', verifyAuth)
  .use('/ingest', verifyAuth)
  .use('/ingest/status', verifyAuth);

export default router;
