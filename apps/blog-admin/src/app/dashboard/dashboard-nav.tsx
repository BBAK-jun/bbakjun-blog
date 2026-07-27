'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  History,
  Settings,
  LogOut,
  Moon,
  Sun,
  PenSquare,
  Briefcase,
  Search,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { logout } from './actions';
import { useEffect, useState } from 'react';

type NavItem = {
  id: string;
  name: string;
  shortName?: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  matchSubRoutes?: boolean;
  primary?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'create', name: '새 글 작성', shortName: '새 글', icon: PenSquare, href: '/dashboard/create', primary: true },
  { id: 'files', name: '파일 관리', shortName: '파일', icon: FileText, href: '/dashboard/files', matchSubRoutes: true, primary: true },
  { id: 'upload', name: '파일 업로드', shortName: '업로드', icon: Upload, href: '/dashboard/upload', primary: true },
  { id: 'experience', name: '경력 관리', shortName: '경력', icon: Briefcase, href: '/dashboard/experience' },
  { id: 'rag', name: 'RAG 관리', shortName: 'RAG', icon: Search, href: '/dashboard/rag' },
  { id: 'history', name: '업로드 이력', shortName: '이력', icon: History, href: '/dashboard/history' },
  { id: 'settings', name: '설정', shortName: '설정', icon: Settings, href: '/dashboard/settings', matchSubRoutes: true, primary: true },
];

const PRIMARY_ITEMS = NAV_ITEMS.filter(item => item.primary);
const SECONDARY_ITEMS = NAV_ITEMS.filter(item => !item.primary);

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const isTabActive = (href: string, matchSubRoutes?: boolean): boolean => {
    if (matchSubRoutes) {
      return pathname === href || pathname?.startsWith(href + '/');
    }
    return pathname === href;
  };

  const isMoreActive = SECONDARY_ITEMS.some(item =>
    isTabActive(item.href, item.matchSubRoutes)
  );

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  // Close sheet on route change
  useEffect(() => {
    setMoreSheetOpen(false);
  }, [pathname]);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleNav = (href: string) => {
    router.push(href);
  };

  return (
    <>
      {/* ── Header (compact, works on all breakpoints) ── */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-base md:text-xl font-bold text-foreground tracking-tight">
                <span className="hidden sm:inline">블로그 백오피스</span>
                <span className="sm:hidden">백오피스</span>
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px] text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                aria-label="다크 모드 전환"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 min-h-[44px] min-w-[44px] px-3 md:min-h-[40px] md:min-w-[40px] md:px-4 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Desktop top tab strip (md+) ── */}
      <nav className="hidden md:block bg-card border-b border-border sticky top-14 lg:top-16 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 -mb-px">
            {NAV_ITEMS.map(tab => {
              const Icon = tab.icon;
              const isActive = isTabActive(tab.href, tab.matchSubRoutes);
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNav(tab.href)}
                  className={`flex items-center gap-2 px-3 py-3.5 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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

      {/* ── Mobile bottom tab bar (below md) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
        aria-label="모바일 주요 메뉴"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5">
          {PRIMARY_ITEMS.map(tab => {
            const Icon = tab.icon;
            const isActive = isTabActive(tab.href, tab.matchSubRoutes);
            return (
              <button
                key={tab.id}
                onClick={() => handleNav(tab.href)}
                className={`flex flex-col items-center justify-center min-h-[56px] gap-0.5 pt-2 pb-1 transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium">{tab.shortName}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMoreSheetOpen(true)}
            className={`flex flex-col items-center justify-center min-h-[56px] gap-0.5 pt-2 pb-1 transition-colors ${
              isMoreActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[11px] font-medium">더보기</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile "more" bottom sheet ── */}
      {moreSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="추가 메뉴"
        >
          <button
            className="absolute inset-0 bg-neutral-950/50"
            aria-label="닫기"
            onClick={() => setMoreSheetOpen(false)}
          />
          <div className="relative bg-card rounded-t-2xl border-t border-border shadow-2xl pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-sm font-semibold text-foreground">추가 메뉴</h2>
              <button
                onClick={() => setMoreSheetOpen(false)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 text-muted-foreground hover:text-foreground"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-3 pb-4 space-y-1">
              {SECONDARY_ITEMS.map(tab => {
                const Icon = tab.icon;
                const isActive = isTabActive(tab.href, tab.matchSubRoutes);
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNav(tab.href)}
                    className={`flex items-center gap-3 w-full min-h-[48px] px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
