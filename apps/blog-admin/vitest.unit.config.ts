import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    setupFiles: ['./tests/vitest.env.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next-themes': path.resolve(__dirname, './__mocks__/next-themes.tsx'),
    },
  },
});
