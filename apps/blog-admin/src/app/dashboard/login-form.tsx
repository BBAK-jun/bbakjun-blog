"use client";

import { useFormState, useFormStatus } from "react-dom";
import { FileText, AlertCircle } from "lucide-react";
import { login } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <svg
            className="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>인증 중...</span>
        </>
      ) : (
        "로그인"
      )}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState(login, null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">
          블로그 백오피스
        </h1>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
          마크다운 파일 관리 시스템
        </p>

        <form action={formAction} className="space-y-4">
          {/* Error Message */}
          {state?.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {state.error}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              사용자 이름
            </label>
            <input
              type="text"
              name="username"
              placeholder="사용자 이름 입력"
              autoComplete="username"
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              name="password"
              placeholder="비밀번호 입력"
              autoComplete="current-password"
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <SubmitButton />
        </form>

        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
          보안: HTTPS 연결을 통해서만 액세스하세요.
        </p>
      </div>
    </div>
  );
}
