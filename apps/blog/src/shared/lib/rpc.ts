import { BlogAdminApp } from '@apps/blog-admin/rpc';
import { hc } from 'hono/client';
import { env } from '@/env';

export const client = hc<BlogAdminApp>(env.NEXT_PUBLIC_ADMIN_URL);
