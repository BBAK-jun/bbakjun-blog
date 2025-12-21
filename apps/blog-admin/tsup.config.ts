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
    '@hono/zod-openapi',
    '@vercel/blob',
    'resend',
    '@prisma/client',
    '@auth/prisma-adapter',
    '@prisma/adapter-pg',
    '@repo/analytics',
    '@repo/content',
    '@repo/types',
    '@repo/ui',
    'react',
    'react-dom',
    'zod',
  ],
});
