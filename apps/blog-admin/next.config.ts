import type { NextConfig } from 'next';

import './src/env';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],

  // Server Actions body 크기 제한 설정 (기본값: 1MB)
  // 이미지 업로드를 위해 5MB로 증가 (uploadImage MAX_SIZE와 일치)
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_BLOG_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
