import { createRouter } from '@/libs';

import * as routes from './admin.routes';
import * as handlers from './admin.handlers';

const router = createRouter()
  .openapi(routes.getStats, handlers.getStats)
  .openapi(routes.getLogs, handlers.getLogs)
  .openapi(routes.createReindex, handlers.createReindex)
  .openapi(routes.getReindexStatus, handlers.getReindexStatus)
  .openapi(routes.clearCache, handlers.clearCache)
  .openapi(routes.clearCollection, handlers.clearCollection)
  .openapi(routes.getHealth, handlers.getHealth);

export default router;
