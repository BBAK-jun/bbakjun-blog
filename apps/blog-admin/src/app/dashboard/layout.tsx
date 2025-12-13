import { isAuthenticated } from "@/lib/auth-server";
import DashboardNav from "./dashboard-nav";
import { QueryProvider } from "@/shared/providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAuthenticated();

  // /dashboard 자체는 로그인 페이지이므로 인증 체크 안 함
  // 하위 경로만 체크
  if (!authenticated) {
    return <>{children}</>;
  }

  // 인증된 경우 대시보드 레이아웃 표시
  return (
    <QueryProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <DashboardNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </QueryProvider>
  );
}
