import { OpenAPIHono } from '@hono/zod-openapi';
import * as routes from './monitoring.routes';
import * as handlers from './monitoring.handlers';
import { AppBindings } from '@/libs';

const app = new OpenAPIHono<AppBindings>();

/**
 * @description Get all ingestion jobs
 */
app.openapi(routes.getAllJobs, handlers.getAllJobsHandler);

/**
 * @description Get ingestion statistics
 */
app.openapi(routes.getStats, handlers.getStatsHandler);

/**
 * @description Get current running job
 */
app.openapi(routes.getCurrentJob, handlers.getCurrentJobHandler);

/**
 * @description Get job by ID
 */
app.openapi(routes.getJobById, handlers.getJobByIdHandler);

export default app;
