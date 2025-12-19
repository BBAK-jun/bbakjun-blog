import { auth } from "../../../auth";
import DashboardNav from "./dashboard-nav";
import { Toaster } from "@/shared/ui";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 인증되지 않은 경우 레이아웃 없이 children만 렌더링
  if (!session?.user) {
    return <>{children}</>;
  }

  // 인증된 경우 대시보드 레이아웃 표시
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DashboardNav />
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
