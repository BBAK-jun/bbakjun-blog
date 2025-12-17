/**
 * Catch-all API route powered by Hono
 * Exposes the same RPC surface consumed via `hc<AppType>()`.
 */

import { handle } from 'hono/vercel';
import { createRpcApp } from '@/rpc';

export const runtime = 'nodejs';

const app = createRpcApp();

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
export const OPTIONS = handle(app);
