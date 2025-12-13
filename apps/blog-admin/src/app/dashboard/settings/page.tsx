import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          설정
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          백오피스 설정을 관리합니다
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
            환경 정보
          </h3>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p>• Next.js 16 (App Router)</p>
            <p>• Vercel Blob Storage</p>
            <p>• Server-side 인증 (httpOnly 쿠키)</p>
          </div>
        </div>

        <div className="text-center py-8">
          <Settings className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            추가 설정 기능이 곧 추가될 예정입니다
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            API 키 관리, 사용자 권한, 저장소 용량 등을 설정할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
