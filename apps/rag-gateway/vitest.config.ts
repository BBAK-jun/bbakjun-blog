import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Mock environment variables for tests
    'process.env.QDRANT_URL': '"http://localhost:6333"',
    'process.env.OPENAI_API_KEY': '"test-key"',
    'process.env.GLM_API_KEY': '"test-key"',
    'process.env.RAG_GATEWAY_API_KEY': '"test-api-key"',
  },
});
