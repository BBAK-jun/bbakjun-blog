// Blob Files RPC
export {
  // Routes and Handlers
  getBlobFilesRoute,
  getBlobFilesHandler,
  getBlobFilesAdminRoute,
  getBlobFilesAdminHandler,
  syncBlobFilesRoute,
  syncBlobFilesHandler,
  // Legacy routes
  legacyAdminBlobFilesRoutes,
  legacyPublicBlobFilesRoutes,
} from './blob-files';

// Upload RPC
export {
  // Routes and Handlers
  uploadMarkdownRoute,
  uploadMarkdownHandler,
  uploadImageRoute,
  uploadImageHandler,
  // Legacy routes
  legacyImageUploadRoutes,
  legacyMarkdownUploadRoutes,
} from './upload';

// Newsletter RPC
export {
  // Routes and Handlers
  subscribeNewsletterRoute,
  subscribeNewsletterHandler,
  unsubscribeNewsletterRoute,
  unsubscribeNewsletterHandler,
  getNewsletterSubscribersRoute,
  getNewsletterSubscribersHandler,
  // Legacy routes
  legacyNewsletterRoutes,
} from './newsletter';

// Views RPC
export {
  // Routes and Handlers
  getViewsBySlugRoute,
  getViewsBySlugHandler,
  incrementViewsBySlugRoute,
  incrementViewsBySlugHandler,
  getViewsStatsRoute,
  getViewsStatsHandler,
} from './views';

// Experience RPC
export { experienceRoutes, experienceHandlers } from './experience';
