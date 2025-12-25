import type { MiddlewareHandler } from 'hono';
import { auth } from '../../../auth';
import type { AppBindings } from '../libs/types';

export const requireSession: MiddlewareHandler<AppBindings> = async (c, next) => {
  const session = await auth();
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('session', session);
  return next();
};

export const requireAdminSession: MiddlewareHandler<AppBindings> = async (c, next) => {
  const session = await auth();
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('session', session);
  return next();
};
