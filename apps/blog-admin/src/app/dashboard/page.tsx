"use client";

import { useState } from "react";
import { Upload, FileText, History, Settings } from "lucide-react";

export default function DashboardPage() {
  const [apiKey, setApiKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  const handleAuth = () => {
    if (apiKey.trim()) {
      setIsAuthenticated(true);
      localStorage.setItem("backoffice_api_key", apiKey);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setApiKey("");
    localStorage.removeItem("backoffice_api_key");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-center mb-8">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">
            블로그 백오피스
          </h1>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
            마크다운 파일 관리 시스템
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                API 키
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="BACKOFFICE_API_KEY 입력"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleAuth()}
              />
            </div>

            <button
              onClick={handleAuth}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              로그인
            </button>
          </div>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
            보안: HTTPS 연결을 통해서만 액세스하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                블로그 백오피스
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                마크다운 관리 시스템
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Upload className="w-4 h-4" />
            업로드
          </button>

          <button
            onClick={() => setActiveTab("files")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "files"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            파일 관리
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            이력
          </button>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 gap-8">
          {activeTab === "upload" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                  파일 업로드
                </h2>

                {/* File Input Area */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 mb-2">
                    여기에 마크다운 파일을 드래그하세요
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    또는 클릭하여 파일을 선택하세요
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-600 mt-4">
                    지원 형식: .md, .mdx (최대 10MB)
                  </p>
                </div>

                {/* Upload Options */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      경로
                    </label>
                    <input
                      type="text"
                      placeholder="예: DEV/my-post"
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      태그
                    </label>
                    <input
                      type="text"
                      placeholder="nextjs, react, typescript"
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      상태
                    </label>
                    <select className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      <option value="draft">초안</option>
                      <option value="published">발행됨</option>
                    </select>
                  </div>
                </div>

                <button className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                  업로드
                </button>
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                파일 관리
              </h2>

              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  불러오는 중...
                </p>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                업로드 이력
              </h2>

              <div className="text-center py-12">
                <History className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  이력이 없습니다
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
