/**
 * Catch-all API route powered by Hono
 * Exposes the same RPC surface consumed via `hc<AppType>()`.
 */

import { rpcApp } from '@/rpc';
import { handle } from 'hono/vercel';

export const runtime = 'nodejs';

export const GET = handle(rpcApp);
export const POST = handle(rpcApp);
export const PUT = handle(rpcApp);
export const DELETE = handle(rpcApp);
export const PATCH = handle(rpcApp);
export const OPTIONS = handle(rpcApp);
