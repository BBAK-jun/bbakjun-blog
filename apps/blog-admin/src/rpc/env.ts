import type { Session } from 'next-auth';
import type { UserRole } from '@prisma/client';

export type RpcSession =
  | (Session & {
      user?: Session['user'] & {
        id: string;
        role: UserRole;
      };
    })
  | null;

export type RpcEnv = {
  Variables: {
    session: RpcSession;
  };
};
