import Link from 'next/link'
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-2xl font-bold text-foreground hover:text-primary transition-colors"
            >
              DEV_BBAK 블로그
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={cn(
                "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
                "hover:underline hover:underline-offset-4"
              )}
            >
              홈
            </Link>
            <Link
              href="/blog"
              className={cn(
                "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
                "hover:underline hover:underline-offset-4"
              )}
            >
              포스트
            </Link>
            <Link
              href="/tags"
              className={cn(
                "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
                "hover:underline hover:underline-offset-4"
              )}
            >
              태그
            </Link>
            <ThemeToggle />
          </nav>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="메뉴 열기"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}