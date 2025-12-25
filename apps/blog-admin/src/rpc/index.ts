import configureOpenAPI from './libs/open-api';
import createApp from './libs/create-app';

import blobFilesRouter from './routes/blob-files/blob-files.index';
import newsletterRouter from './routes/newsletter/newsletter.index';
import uploadRouter from './routes/upload/upload.index';
import viewsRouter from './routes/views/views.index';
import experienceRouter from './routes/experience/experience.index';

/**
 * Hono RPC app with all blog-admin API routes.
 * `BlogAdminApp` type should be used for best type inference with `hc<BlogAdminApp>()`.
 *
 * RPC routes:
 * - /api/rpc/blob-files
 * - /api/rpc/blob-files/admin
 * - /api/rpc/blob-files/admin/sync
 * - /api/rpc/upload/markdown
 * - /api/rpc/upload/image
 * - /api/rpc/newsletter/subscribe
 * - /api/rpc/newsletter/unsubscribe
 * - /api/rpc/newsletter/admin/subscribers
 * - /api/rpc/views/:slug
 * - /api/rpc/views/stats
 * - /api/rpc/experiences
 * - /api/doc (OpenAPI spec)
 * - /api/reference (Scalar API reference UI)
 */
const app = createApp();

configureOpenAPI(app);

const routers = [
  blobFilesRouter,
  newsletterRouter,
  uploadRouter,
  viewsRouter,
  experienceRouter,
] as const;

routers.forEach(router => {
  app.route('/', router);
});

export type BlogAdminApp = (typeof routers)[number];
export const rpcApp = app;
export default app;
