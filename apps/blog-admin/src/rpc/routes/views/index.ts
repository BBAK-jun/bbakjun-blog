import { Hono } from 'hono';
import type { RpcEnv } from '../../env';
import { getViewsBySlugRoute, getViewsBySlugHandler } from './getViewsBySlug';
import { incrementViewsBySlugRoute, incrementViewsBySlugHandler } from './incrementViewsBySlug';
import { getViewsStatsRoute, getViewsStatsHandler } from './getViewsStats';

// Legacy routes for backward compatibility
export const viewsRoutes = new Hono<RpcEnv>()
  .get('/stats', getViewsStatsHandler)
  .get('/:slug', getViewsBySlugHandler)
  .post('/:slug', incrementViewsBySlugHandler);

// Export routes and handlers for OpenAPIHono
export {
  getViewsBySlugRoute,
  getViewsBySlugHandler,
  incrementViewsBySlugRoute,
  incrementViewsBySlugHandler,
  getViewsStatsRoute,
  getViewsStatsHandler,
};
