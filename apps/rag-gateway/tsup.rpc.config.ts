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
  external: [
    'hono',
    '@hono/node-server',
    '@hono/zod-openapi',
    '@hono/zod-validator',
    'stoker',
    '@qdrant/js-client-rest',
    '@repo/content',
    '@repo/rag-core',
    '@repo/rag-ingestion',
    '@repo/rag-types',
    '@repo/types',
    '@scalar/hono-api-reference',
    'openai',
    'pino',
    'pino-pretty',
    'dotenv',
    'gray-matter',
    'zod',
  ],
});
