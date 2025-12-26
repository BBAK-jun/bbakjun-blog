import { createRouter } from '@/rpc/libs';
import * as handlers from './views.handlers';
import * as routes from './views.routes';

const router = createRouter()
  .openapi(routes.getViewsBySlug, handlers.getViewsBySlug)
  .openapi(routes.incrementViewsBySlug, handlers.incrementViewsBySlug)
  .openapi(routes.getViewsStats, handlers.getViewsStats);

export default router;
