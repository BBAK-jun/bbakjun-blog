import { createRouter } from '@/rpc/libs';
import * as handlers from './upload-history.handlers';
import * as routes from './upload-history.routes';

const router = createRouter().openapi(routes.getUploadHistory, handlers.getUploadHistoryHandler);

export default router;
