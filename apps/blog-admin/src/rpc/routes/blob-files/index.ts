import { Hono } from 'hono';
import type { RpcEnv } from '../../env';
import { requireAdminSession, requireSession } from '../../middleware/session';
import { getBlobFilesRoute, getBlobFilesHandler } from './getBlobFiles';
import { getBlobFilesAdminRoute, getBlobFilesAdminHandler } from './getBlobFilesAdmin';
import { syncBlobFilesRoute, syncBlobFilesHandler } from './syncBlobFiles';

// Legacy routes for backward compatibility
export const legacyPublicBlobFilesRoutes = new Hono<RpcEnv>().get(
  '/',
  getBlobFilesHandler
);

export const legacyAdminBlobFilesRoutes = new Hono<RpcEnv>()
  .get('/', requireSession, getBlobFilesAdminHandler)
  .post('/', requireAdminSession, syncBlobFilesHandler)
  .post('/sync', requireAdminSession, syncBlobFilesHandler);

// Export routes and handlers for OpenAPIHono
export {
  getBlobFilesRoute,
  getBlobFilesHandler,
  getBlobFilesAdminRoute,
  getBlobFilesAdminHandler,
  syncBlobFilesRoute,
  syncBlobFilesHandler,
};
