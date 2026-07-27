import { auth } from '../../../auth';
import DashboardNav from './dashboard-nav';
import { Toaster } from '@/shared/ui';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // 인증되지 않은 경우 레이아웃 없이 children만 렌더링
  if (!session?.user) {
    return <>{children}</>;
  }

  // 인증된 경우 대시보드 레이아웃 표시
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
