import { auth, signOut } from '../../../auth';
import { ShieldAlert } from 'lucide-react';

export default async function UnauthorizedPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">
          접근 권한이 없습니다
        </h1>

        <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
          이 페이지는 슈퍼 관리자만 접근할 수 있습니다.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">이메일:</span>
              <span className="text-slate-900 dark:text-white font-medium">
                {session?.user?.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">현재 역할:</span>
              <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                {session?.user?.role}
              </span>
            </div>
          </div>
        </div>

        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <button
            type="submit"
            className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            로그아웃
          </button>
        </form>

        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
          관리자 권한이 필요하신 경우 시스템 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  );
}
