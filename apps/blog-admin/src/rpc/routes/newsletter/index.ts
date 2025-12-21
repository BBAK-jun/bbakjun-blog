import { Hono } from 'hono';
import type { RpcEnv } from '../../env';
import { requireAdminSession } from '../../middleware/session';
import { subscribeNewsletterRoute, subscribeNewsletterHandler } from './subscribeNewsletter';
import { unsubscribeNewsletterRoute, unsubscribeNewsletterHandler } from './unsubscribeNewsletter';
import { getNewsletterSubscribersRoute, getNewsletterSubscribersHandler } from './getNewsletterSubscribers';
import { env } from '../../../env';

const corsHeaders = {
  'Access-Control-Allow-Origin': env.NEXT_PUBLIC_BLOG_URL || 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Legacy routes for backward compatibility
export const legacyNewsletterRoutes = new Hono<RpcEnv>()
  .options('*', () => new Response(null, { status: 200, headers: corsHeaders }))
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
