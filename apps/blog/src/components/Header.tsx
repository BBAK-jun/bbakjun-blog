import Link from 'next/link'
import { cn } from "@repo/ui"
import { ThemeToggle } from "./theme-toggle"
import MobileMenu from "./MobileMenu"

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/blog', label: '포스트' },
  { href: '/tags', label: '태그' },
  { href: '/series', label: '시리즈' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 max-w-[1536px]">
        <div className="flex h-14 items-center justify-between relative">
          {/* 로고 */}
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-2xl font-bold text-foreground hover:text-primary transition-colors"
            >
              DEV_BBAK 블로그
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
                  "hover:underline hover:underline-offset-4"
                )}
              >
                {label}
              </Link>
            ))}
            <ThemeToggle />
          </nav>

          {/* 모바일 메뉴 */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  )
}