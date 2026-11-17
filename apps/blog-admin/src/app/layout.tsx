import type { Metadata } from 'next';
import type React from 'react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { OverlayProvider } from 'overlay-kit';
import { QueryProvider } from '@/shared/lib/react-query';
import './globals.css';
import './markdown.css';

export const metadata: Metadata = {
  title: '블로그 백오피스 - 마크다운 관리',
  description: 'Azure Blob Storage를 통한 마크다운 파일 관리 시스템',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard Variable (Korean) */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && systemPrefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans">
        <OverlayProvider>
          <NuqsAdapter>
            <QueryProvider>
              <div className="min-h-screen bg-background text-foreground">
                {children}
              </div>
            </QueryProvider>
          </NuqsAdapter>
        </OverlayProvider>
      </body>
    </html>
  );
}
