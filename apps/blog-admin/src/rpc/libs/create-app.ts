import type { Schema } from 'hono';

import { OpenAPIHono } from '@hono/zod-openapi';
import { requestId } from 'hono/request-id';
import { cors } from 'hono/cors';
import { notFound, onError } from 'stoker/middlewares';
import { defaultHook as stokerDefaultHook } from 'stoker/openapi';

import { logger } from '../middleware/logger';
import { env } from '@/env';
// Cloudflare KV 바인딩을 @repo/cache 에 등록한다 (부수효과 import).
import '@/shared/lib/kv-binding';

import type { AppBindings, AppOpenAPI } from './types';

// Use type assertion to work around stoker's Hook type incompatibility
// The types are compatible at runtime, this is just a TypeScript limitation
const defaultHook = stokerDefaultHook as typeof stokerDefaultHook & { __brand: 'AppBindings' };

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook: defaultHook as any,
  });
}

export default function createApp() {
  const app = createRouter().basePath('/api');
  app.use(requestId()).use(logger());

  app.use(
    '*',
    cors({
      origin: env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
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
