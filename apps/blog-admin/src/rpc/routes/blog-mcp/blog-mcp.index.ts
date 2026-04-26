import { createRouter } from '@/rpc/libs';
import * as handlers from './blog-mcp.handlers';
import * as routes from './blog-mcp.routes';

const router = createRouter()
  .openapi(routes.listTools, handlers.listTools)
  .openapi(routes.invokeTool, handlers.invokeTool);

export default router;
