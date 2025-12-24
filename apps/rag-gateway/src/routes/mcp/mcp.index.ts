import { createRouter } from '@/libs';

import * as routes from './mcp.routes';
import * as handlers from './mcp.handlers';

const router = createRouter()
  .openapi(routes.listTools, handlers.listTools)
  .openapi(routes.invokeTool, handlers.invokeTool)
  .openapi(routes.explain, handlers.explain);

export default router;
