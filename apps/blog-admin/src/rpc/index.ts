import { Hono } from 'hono';
import type { RpcEnv } from './env';
import {
  blobFilesRoutes,
  legacyAdminBlobFilesRoutes,
  legacyImageUploadRoutes,
  legacyMarkdownUploadRoutes,
  legacyPublicBlobFilesRoutes,
  newsletterRoutes,
  uploadRoutes,
  viewsRoutes
} from './routes';
 
const v1 = new Hono<RpcEnv>()
  .route('/blob-files', blobFilesRoutes)
  .route('/upload', uploadRoutes)
  .route('/newsletter', newsletterRoutes)
  .route('/views', viewsRoutes)
  .route('/public/blob-files', legacyPublicBlobFilesRoutes)
  .route('/admin/blob-files', legacyAdminBlobFilesRoutes)
  .route('/admin/upload', legacyMarkdownUploadRoutes)
  .route('/admin/upload-image', legacyImageUploadRoutes);

const api = new Hono<RpcEnv>().route('/v1', v1)

const rootApp = new Hono<RpcEnv>();
rootApp.notFound((c) => c.json({ error: 'Not Found' }, 404));
rootApp.onError((err, c) => {
  console.error('RPC error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

/**
 * Hono RPC app with all blog-admin API routes.
 * `AppType` should be derived from `typeof rpcApp` for best type inference with `hc<AppType>()`.
 */
export const rpcApp = rootApp.route('/api', api);

export type AppType = typeof rpcApp;
