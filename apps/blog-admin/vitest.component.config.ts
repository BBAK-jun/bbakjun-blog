import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

/**
 * Vitest 설정 for 컴포넌트 테스트
 *
 * DB 연결이 필요 없는 순수 UI 컴포넌트 테스트를 위한 설정입니다.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom', // DOM 환경 제공
    include: ['**/*.component.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next-themes': path.resolve(__dirname, './__mocks__/next-themes.tsx'),
    },
  },
});
