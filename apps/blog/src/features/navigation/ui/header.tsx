import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { ThemeToggle } from '@/features/theme-toggle/ui';
import MobileMenu from './mobile-menu';

const navLinks = [
  { href: '/blog', label: '포스트' },
  { href: '/about', label: '소개' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/15 bg-background">
      <div className="max-w-3xl mx-auto py-5">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="text-xl font-bold text-foreground">
            DEV_BBAK
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline decoration-1 underline-offset-2 transition-colors"
              >
                {label}
              </Link>
            ))}
            <ThemeToggle />
          </nav>

          {/* 모바일 메뉴 */}
          <div className="md:hidden flex items-center space-x-3">
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
