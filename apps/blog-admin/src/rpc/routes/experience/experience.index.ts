import { createRouter } from '@/rpc/libs';
import * as routes from './experience.routes';
import * as handlers from './experience.handlers';

const router = createRouter().openapi(routes.getExperiences, handlers.getExperiences);

export default router;
