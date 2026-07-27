import { auth } from '../../../auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <>
      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">
        대시보드
      </h1>

      <div className="bg-card border border-border rounded-lg p-5 md:p-6 shadow-sm">
        <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">
          환영합니다, {session?.user?.name || session?.user?.email}님!
        </h2>

        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">역할:</span>
            <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium">
              {session?.user?.role}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">이메일:</span>
            <span className="text-sm text-foreground">{session?.user?.email}</span>
          </div>
        </div>
      </div>
    </>
  );
}
