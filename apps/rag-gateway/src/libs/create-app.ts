import type { Schema } from 'hono';

import { OpenAPIHono } from '@hono/zod-openapi';
import { requestId } from 'hono/request-id';
import { notFound, onError } from 'stoker/middlewares';
import { defaultHook } from 'stoker/openapi';

import { logger } from '@/middleware/logger';

import type { AppBindings, AppOpenAPI } from './types';
import { cors } from 'hono/cors';
import { env } from '@/env';

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}

export default function createApp() {
  const app = createRouter().basePath('/api');
  app.use(requestId()).use(logger());

  app.use(
    '*',
    cors({
      origin: env.ALLOWED_ORIGINS.split(','),
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.notFound(notFound);
  app.onError(onError);
  return app;
}

export function createTestApp<S extends Schema>(router: AppOpenAPI<S>) {
  return createApp().route('/', router);
}
