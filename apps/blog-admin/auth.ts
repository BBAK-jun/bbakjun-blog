import { prisma } from '@/shared/lib/db';
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const nextAuth = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'database',
    maxAge: 7 * 24 * 60 * 60, // 7일
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // 첫 번째 사용자를 SUPER_ADMIN으로 자동 지정
      const userCount = await prisma.user.count();

      if (userCount === 1) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'SUPER_ADMIN' },
        });
        console.log(`✅ First user promoted to SUPER_ADMIN: ${user.email}`);
      } else {
        console.log(`✅ New user created with GUEST role: ${user.email}`);
      }
    },
  },
});

export const { handlers, auth } = nextAuth;

export const signOut: (options?: { redirectTo?: string }) => Promise<void> = nextAuth.signOut;
