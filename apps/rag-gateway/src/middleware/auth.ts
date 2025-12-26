import type { Context, Next } from 'hono';
import { env } from '@/env';
import * as HttpStatusCodes from 'stoker/http-status-codes';

/**
 * Verify API Key authentication middleware
 *
 * Validates the X-RAG-API-Key header against the configured RAG_GATEWAY_API_KEY.
 * Returns 401 Unauthorized if the API key is missing or invalid.
 *
 * @example
 * ```typescript
 * app.use('/api/rag/*', verifyAuth);
 * ```
 */
export const verifyAuth = async (c: Context, next: Next) => {
  const apiKey = c.req.header('X-RAG-API-Key');

  if (!apiKey) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Missing X-RAG-API-Key header',
      },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  if (apiKey !== env.RAG_GATEWAY_API_KEY) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Invalid API key',
      },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  await next();
};
