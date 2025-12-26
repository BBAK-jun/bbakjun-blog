import type { MiddlewareHandler } from 'hono';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { auth } from '../../../auth';
import { UnauthorizedError } from '../libs';
import type { AppBindings } from '../libs/types';

export const withSession: MiddlewareHandler<AppBindings> = async (c, next) => {
  const session = await auth();

  if (!session) {
    return c.json(
      { error: 'Unauthorized', message: 'Not Permission' } satisfies UnauthorizedError,
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  c.set('session', session);
  return next();
};

export const withAdminSession: MiddlewareHandler<AppBindings> = async (c, next) => {
  const session = await auth();

  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
    return c.json(
      { error: 'Unauthorized', message: 'Not Permission' } satisfies UnauthorizedError,
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  c.set('session', session);
  return next();
};
