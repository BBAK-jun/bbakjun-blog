import { auth } from "../../../auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
        대시보드
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          환영합니다, {session?.user?.name || session?.user?.email}님!
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">역할:</span>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
              {session?.user?.role}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">이메일:</span>
            <span className="text-slate-900 dark:text-white">
              {session?.user?.email}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
