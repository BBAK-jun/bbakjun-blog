import { createRouter } from '@/rpc/libs';
import * as handlers from './newsletter.handlers';
import * as routes from './newsletter.routes';

const router = createRouter()
  .openapi(routes.subscribeNewsletter, handlers.subscribeNewsletter)
  .openapi(routes.unsubscribeNewsletter, handlers.unsubscribeNewsletter)
  .openapi(routes.getNewsletterSubscribers, handlers.getNewsletterSubscribers);

export default router;
