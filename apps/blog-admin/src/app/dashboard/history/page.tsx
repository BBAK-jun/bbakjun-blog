import { History } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">업로드 이력</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          파일 업로드 및 수정 이력을 확인합니다
        </p>
      </div>

      <div className="text-center py-12">
        <History className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400 mb-2">
          업로드 이력 기능이 곧 추가될 예정입니다
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          파일별 업로드 시간, 수정 이력, 작업자 정보 등을 제공할 예정입니다
        </p>
      </div>
    </div>
  );
}
