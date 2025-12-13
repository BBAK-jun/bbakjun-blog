"use client";

import { usePathname, useRouter } from "next/navigation";
import { Upload, FileText, History, Settings, LogOut } from "lucide-react";
import { logout } from "./actions";

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { id: "upload", name: "업로드", icon: Upload, href: "/dashboard/upload" },
    { id: "files", name: "파일 관리", icon: FileText, href: "/dashboard/files" },
    { id: "history", name: "업로드 이력", icon: History, href: "/dashboard/history" },
    { id: "settings", name: "설정", icon: Settings, href: "/dashboard/settings" },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                블로그 백오피스
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href || pathname?.startsWith(tab.href + "/");

              return (
                <button
                  key={tab.id}
                  onClick={() => router.push(tab.href)}
                  className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
