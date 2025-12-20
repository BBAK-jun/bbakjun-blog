'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn } from "@repo/ui"

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/blog', label: '포스트' },
  { href: '/tags', label: '태그' },
  { href: '/series', label: '시리즈' },
]

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* 모바일 메뉴 버튼 */}
      <button
        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
        onClick={toggleMenu}
      >
        {isOpen ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* 모바일 메뉴 드롭다운 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-t border-border/40 shadow-lg">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
                  "hover:underline hover:underline-offset-4"
                )}
                onClick={closeMenu}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
