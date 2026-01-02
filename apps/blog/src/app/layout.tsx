import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './markdown.css';
import { Header, Footer } from '@/features/navigation';
import { ThemeProvider } from '@/features/theme-toggle/ui';
import { QueryProvider } from '@/shared/providers/query-provider';
import { Analytics } from '@vercel/analytics/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { env } from '@/env';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '박준형 - 프론트엔드 개발자',
  description: '프론트엔드 개발자 박준형의 블로그',
  keywords: '개발, 블로그, Next.js, React, TypeScript',
  authors: [{ name: 'bbakjun' }],
  openGraph: {
    title: '박준형 - 프론트엔드 개발자',
    description: '프론트엔드 개발자 박준형의 블로그',
    type: 'website',
    locale: 'ko_KR',
  },
  alternates: {
    types: {
      'application/rss+xml': `${env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/feed.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <NuqsAdapter>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
            >
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="grow px-4 py-12">{children}</main>
                <Footer />
              </div>
            </ThemeProvider>
          </NuqsAdapter>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
