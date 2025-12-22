import { AppType } from 'blog-admin/rpc';
import { hc } from 'hono/client';
import { env } from '@/env';

export const client = hc<AppType>(env.NEXT_PUBLIC_ADMIN_URL);
