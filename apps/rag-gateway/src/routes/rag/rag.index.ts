import { createRouter } from '@/libs';
import { verifyAuth } from '@/middleware/auth';

import * as routes from './rag.routes';
import * as handlers from './rag.handlers';

const router = createRouter();

// Apply authentication to all RAG routes except health check
router.use('/query', verifyAuth);
router.use('/search', verifyAuth);
router.use('/ingest', verifyAuth);
router.use('/ingest/status', verifyAuth);

router
  .openapi(routes.query, handlers.query)
  .openapi(routes.search, handlers.search)
  .openapi(routes.ingest, handlers.ingest)
  .openapi(routes.ingestStatus, handlers.ingestStatus)
  .openapi(routes.health, handlers.health);

export default router;
