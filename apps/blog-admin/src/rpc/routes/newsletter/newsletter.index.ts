import { createRouter } from '@/rpc/libs';
import * as routes from './newsletter.routes';
import * as handlers from './newsletter.handlers';
import { requireAdminSession } from '@/rpc/middleware/session';

const router = createRouter()
  .openapi(routes.subscribeNewsletter, handlers.subscribeNewsletter)
  .openapi(routes.unsubscribeNewsletter, handlers.unsubscribeNewsletter)
  .openapi(routes.getNewsletterSubscribers, async (c, next) => {
    // Apply admin session middleware
    await requireAdminSession(c, next);
    // If we reach here, session is valid
    return (handlers.getNewsletterSubscribers as any)(c);
  });

export default router;
