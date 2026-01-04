import configureOpenAPI from '@/libs/open-api';
import createApp from '@/libs/create-app';

import ragRouter from '@/routes/rag/rag.index';
import adminRouter from '@/routes/admin/admin.index';
import documentsRouter from '@/routes/documents/documents.index';
import mcpRouter from '@/routes/mcp/mcp.index';
import monitoringRouter from '@/routes/monitoring/monitoring.index';

const app = createApp();

configureOpenAPI(app);

const routers = [ragRouter, adminRouter, documentsRouter, mcpRouter, monitoringRouter] as const;

routers.forEach(router => {
  app.route('/', router);
});

export type RagGatewayApp = (typeof routers)[number];

export default app;
