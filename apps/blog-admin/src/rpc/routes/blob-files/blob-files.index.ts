import { createRouter } from '@/rpc/libs';
import * as routes from './blob-files.routes';
import * as handlers from './blob-files.handlers';
import { withSession, withAdminSession } from '@/rpc/middleware/session';

const router = createRouter()
  .openapi(routes.getBlobFiles, handlers.getBlobFiles)
  .openapi(routes.getBlobFilesAdmin, handlers.getBlobFilesAdmin)
  .openapi(routes.syncBlobFiles, handlers.syncBlobFiles)
  .use(withSession)
  .use(withAdminSession);

export default router;
