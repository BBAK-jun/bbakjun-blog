import { createRouter } from '@/libs';

import * as routes from './rag.routes';
import * as handlers from './rag.handlers';

const router = createRouter()
  .openapi(routes.query, handlers.query)
  .openapi(routes.search, handlers.search)
  .openapi(routes.ingest, handlers.ingest)
  .openapi(routes.ingestStatus, handlers.ingestStatus)
  .openapi(routes.health, handlers.health);

export default router;
