import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { Schema } from 'hono';
import type { PinoLogger } from 'hono-pino';
import type { Session } from 'next-auth';
import type { UserRole } from '@repo/database';

interface UserWithSession extends Session {
  user: Session['user'] & {
    id: string;
    role: UserRole;
  };
}

// Simpler AppBindings without complex session type
// This avoids type incompatibility with stoker's validation hook
export interface AppBindings {
  Variables: {
    logger: PinoLogger;
    session?: UserWithSession | null;
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;
