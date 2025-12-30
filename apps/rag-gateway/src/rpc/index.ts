import configureOpenAPI from '@/libs/open-api';
import createApp from '@/libs/create-app';

import ragRouter from '@/routes/rag/rag.index';
import adminRouter from '@/routes/admin/admin.index';
import documentsRouter from '@/routes/documents/documents.index';
import mcpRouter from '@/routes/mcp/mcp.index';

const app = createApp();

configureOpenAPI(app);

const routers = [ragRouter, adminRouter, documentsRouter, mcpRouter] as const;

routers.forEach(router => {
  app.route('/api', router);
});

export type RagGatewayApp = (typeof routers)[number];
export default app;
