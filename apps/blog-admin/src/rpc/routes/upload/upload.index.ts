import { createRouter } from '@/rpc/libs';
import * as routes from './upload.routes';
import * as handlers from './upload.handlers';

const router = createRouter()
  .openapi(routes.clientUploadToken, handlers.clientUploadToken)
  .openapi(routes.uploadMarkdown, handlers.uploadMarkdown)
  .openapi(routes.uploadImage, handlers.uploadImage)
  .openapi(routes.uploadMultipleImages, handlers.uploadMultipleImages);

export default router;
