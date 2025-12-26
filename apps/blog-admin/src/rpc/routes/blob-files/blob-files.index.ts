import { createRouter } from '@/rpc/libs';
import * as handlers from './blob-files.handlers';
import * as routes from './blob-files.routes';

const router = createRouter()
  .openapi(routes.getBlobFiles, handlers.getBlobFiles)
  .openapi(routes.getBlobFilesAdmin, handlers.getBlobFilesAdmin)
  .openapi(routes.syncBlobFiles, handlers.syncBlobFiles);

export default router;
