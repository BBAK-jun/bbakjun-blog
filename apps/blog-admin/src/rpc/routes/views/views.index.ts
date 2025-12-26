import { createRouter } from '@/rpc/libs';
import * as routes from './views.routes';
import * as handlers from './views.handlers';
import { withSession } from '@/rpc/middleware/session';

const router = createRouter()
  .openapi(routes.getViewsBySlug, handlers.getViewsBySlug)
  .openapi(routes.incrementViewsBySlug, handlers.incrementViewsBySlug)
  .openapi(routes.getViewsStats, handlers.getViewsStats);

export default router;
