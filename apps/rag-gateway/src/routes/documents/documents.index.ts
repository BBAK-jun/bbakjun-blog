import { createRouter } from '@/libs';

import * as routes from './documents.routes';
import * as handlers from './documents.handlers';

const router = createRouter()
  .openapi(routes.listDocuments, handlers.listDocuments)
  .openapi(routes.getDocument, handlers.getDocument)
  .openapi(routes.createDocument, handlers.createDocument)
  .openapi(routes.updateDocument, handlers.updateDocument)
  .openapi(routes.deleteDocument, handlers.deleteDocument);

export default router;
