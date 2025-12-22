import { Hono } from 'hono';
import type { RpcEnv } from '../../env';
import { requireAdminSession } from '../../middleware/session';
import { subscribeNewsletterRoute, subscribeNewsletterHandler } from './subscribeNewsletter';
import { unsubscribeNewsletterRoute, unsubscribeNewsletterHandler } from './unsubscribeNewsletter';
import { getNewsletterSubscribersRoute, getNewsletterSubscribersHandler } from './getNewsletterSubscribers';

// Legacy routes for backward compatibility
export const legacyNewsletterRoutes = new Hono<RpcEnv>()
  .post('/subscribe', subscribeNewsletterHandler)
  .post('/unsubscribe', unsubscribeNewsletterHandler)
  .use('/subscribers*', requireAdminSession)
  .get('/subscribers', getNewsletterSubscribersHandler);

// Export routes and handlers for OpenAPIHono
export {
  subscribeNewsletterRoute,
  subscribeNewsletterHandler,
  unsubscribeNewsletterRoute,
  unsubscribeNewsletterHandler,
  getNewsletterSubscribersRoute,
  getNewsletterSubscribersHandler,
};
