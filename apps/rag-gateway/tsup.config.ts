import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/rpc/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  treeshake: true,
  external: [
    'hono',
    '@hono/node-server',
    '@hono/zod-openapi',
    '@hono/zod-validator',
    'stoker',
    '@qdrant/js-client-rest',
    '@repo/cache',
    '@scalar/hono-api-reference',
    'openai',
    'pino',
    'pino-pretty',
    'dotenv',
    'gray-matter',
    'zod',
  ],
});
