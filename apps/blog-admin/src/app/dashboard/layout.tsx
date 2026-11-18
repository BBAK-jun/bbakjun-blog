import { redirect } from 'next/navigation';
import { auth } from '../../../auth';
import DashboardNav from './dashboard-nav';
import { Toaster } from '@/shared/ui';

/**
 * 대시보드 접근 제어는 여기(서버 컴포넌트)에서 한다.
 *
 * 이전에는 src/proxy.ts(Next 16 middleware)에서 auth()로 세션·역할을 검사했지만,
 * Cloudflare Workers에서는 proxy.ts가 "Node.js middleware" 별도 번들로 실행되고
 * 그 안에서 DB(D1/Prisma) 조회 프라미스가 다른 realm과 섞여
 * `TypeError: Method Promise.prototype.then called on incompatible receiver` 로 500이 났다.
 * (Next 16 proxy.ts + DB 조회는 workerd에서 알려진 제약)
 *
 * 그래서 proxy.ts를 제거하고, 실제 접근 차단은 서버 컴포넌트인 이 레이아웃에서 수행한다.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // SUPER_ADMIN만 접근 허용
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      {/* pb-24 on mobile to clear the fixed bottom tab bar; md:pb-8 restores normal spacing */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 md:pb-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
