import type { MiddlewareHandler } from 'hono';
import { env } from '../env';

const corsHeaders = {
  'Access-Control-Allow-Origin': env.NEXT_PUBLIC_BLOG_URL || 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

export const cors: MiddlewareHandler = async (c, next) => {
  // Handle preflight OPTIONS requests
  if (c.req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      c.header(key, value);
    });
    return c.text('', 200);
  }

  // Add CORS headers to all other responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    c.header(key, value);
  });

  await next();
};