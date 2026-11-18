import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'rpc/index': 'src/rpc/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'es2022',
  tsconfig: 'tsconfig.tsup.json',
  external: [
    'next',
    'next-auth',
    'hono',
    'hono/vercel',
    'hono-pino',
    '@hono/zod-openapi',
    'stoker',
    '@vercel/blob',
    'resend',
    '@prisma/client',
    '@prisma/adapter-d1',
    '@auth/prisma-adapter',
    '@prisma/adapter-pg',
    '@repo/analytics',
    '@repo/cache',
    '@repo/content',
    '@repo/types',
    '@repo/ui',
    'react',
    'react-dom',
    'zod',
    'pino',
    'pino-pretty',
    '@scalar/hono-api-reference',
    // D1 용 생성 클라이언트는 절대 rpc 번들에 포함하지 않는다.
    // 포함되면 query_compiler_bg.wasm?module import 가 끌려와
    // blog(Vercel/CI) tsup 단계가 "No loader is configured for .wasm"로 깨진다.
    /generated\/d1/,
  ],
});
