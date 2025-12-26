import { createRouter } from '@/rpc/libs';
import * as routes from './newsletter.routes';
import * as handlers from './newsletter.handlers';
import { withAdminSession } from '@/rpc/middleware/session';

const router = createRouter()
  .openapi(routes.subscribeNewsletter, handlers.subscribeNewsletter)
  .openapi(routes.unsubscribeNewsletter, handlers.unsubscribeNewsletter)
  .openapi(routes.getNewsletterSubscribers, handlers.getNewsletterSubscribers)
  .use(withAdminSession);

export default router;
