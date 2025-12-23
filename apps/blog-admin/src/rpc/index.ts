import { OpenAPIHono } from '@hono/zod-openapi';
import type { RpcEnv } from './env';
import {
  // Blob Files
  getBlobFilesRoute,
  getBlobFilesHandler,
  getBlobFilesAdminRoute,
  getBlobFilesAdminHandler,
  syncBlobFilesRoute,
  syncBlobFilesHandler,
  // Upload
  uploadMarkdownRoute,
  uploadMarkdownHandler,
  uploadImageRoute,
  uploadImageHandler,
  // Newsletter
  subscribeNewsletterRoute,
  subscribeNewsletterHandler,
  unsubscribeNewsletterRoute,
  unsubscribeNewsletterHandler,
  getNewsletterSubscribersRoute,
  getNewsletterSubscribersHandler,
  // Views
  getViewsBySlugRoute,
  getViewsBySlugHandler,
  incrementViewsBySlugRoute,
  incrementViewsBySlugHandler,
  getViewsStatsRoute,
  getViewsStatsHandler,
  // Experience
  experienceRoutes,
  experienceHandlers,
  // RAG
  ragRoutes,
  ragHandlers,
  // Legacy routes for backward compatibility
  legacyAdminBlobFilesRoutes,
  legacyImageUploadRoutes,
  legacyMarkdownUploadRoutes,
  legacyPublicBlobFilesRoutes,
  legacyNewsletterRoutes,
} from './routes';
import { requireAdminSession, requireSession } from './middleware/session';

/**
 * Hono RPC app with all blog-admin API routes.
 * `AppType` should be derived from `typeof rpcApp` for best type inference with `hc<AppType>()`.
 *
 * RPC routes with function-based naming:
 * - /api/rpc/getBlobFiles
 * - /api/rpc/getBlobFilesAdmin
 * - /api/rpc/syncBlobFiles
 * - /api/rpc/uploadMarkdown
 * - /api/rpc/uploadImage
 * - /api/rpc/subscribeNewsletter
 * - /api/rpc/unsubscribeNewsletter
 * - /api/rpc/getNewsletterSubscribers
 * - /api/rpc/getViewsBySlug/:slug
 * - /api/rpc/incrementViewsBySlug/:slug
 * - /api/rpc/getViewsStats
 */
const app = new OpenAPIHono<RpcEnv>()
  // Blob Files RPC
  .openapi(getBlobFilesRoute, getBlobFilesHandler)
  .openapi(getBlobFilesAdminRoute, async c => {
    await requireSession(c, async () => {});
    return getBlobFilesAdminHandler(c);
  })
  .openapi(syncBlobFilesRoute, async c => {
    await requireAdminSession(c, async () => {});
    return syncBlobFilesHandler(c);
  })
  // Upload RPC
  .openapi(uploadMarkdownRoute, uploadMarkdownHandler)
  .openapi(uploadImageRoute, uploadImageHandler)
  // Newsletter RPC
  .openapi(subscribeNewsletterRoute, subscribeNewsletterHandler)
  .openapi(unsubscribeNewsletterRoute, unsubscribeNewsletterHandler)
  .openapi(getNewsletterSubscribersRoute, async c => {
    await requireAdminSession(c, async () => {});
    return getNewsletterSubscribersHandler(c);
  })
  // Views RPC
  .openapi(getViewsStatsRoute, getViewsStatsHandler)
  .openapi(getViewsBySlugRoute, getViewsBySlugHandler)
  .openapi(incrementViewsBySlugRoute, incrementViewsBySlugHandler)
  // Experience RPC
  .openapi(experienceRoutes.getExperiences, experienceHandlers.getExperiences)
  // RAG RPC (public endpoints)
  .openapi(ragRoutes.queryBlogContent, ragHandlers.queryBlogContent)
  .openapi(ragRoutes.searchBlogPosts, ragHandlers.searchBlogPosts)
  // RAG RPC (admin endpoints)
  .openapi(ragRoutes.ingestDocuments, async (c) => {
    await requireAdminSession(c, async () => {});
    return ragHandlers.ingestDocuments(c);
  })
  .openapi(ragRoutes.getIngestionStatus, async (c) => {
    await requireAdminSession(c, async () => {});
    return ragHandlers.getIngestionStatus(c);
  })
  .openapi(ragRoutes.getRAGStats, async (c) => {
    await requireAdminSession(c, async () => {});
    return ragHandlers.getRAGStats(c);
  });

// Legacy v1 routes for backward compatibility
app.route('/api/v1/public/blob-files', legacyPublicBlobFilesRoutes);
app.route('/api/v1/admin/blob-files', legacyAdminBlobFilesRoutes);
app.route('/api/v1/admin/upload', legacyMarkdownUploadRoutes);
app.route('/api/v1/admin/upload-image', legacyImageUploadRoutes);
app.route('/api/v1/newsletter', legacyNewsletterRoutes);

// Global error handling
app.notFound(c => c.json({ error: 'Not Found' }, 404));
app.onError((err, c) => {
  console.error('RPC error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export const rpcApp = app;

export type AppType = typeof rpcApp;
