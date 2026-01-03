import { UserRole } from '@repo/database';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: UserRole;
  }
}
