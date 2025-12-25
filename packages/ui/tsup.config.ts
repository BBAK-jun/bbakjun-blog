import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx', 'src/utils.ts'],
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
  },
  clean: true,
  external: ['react', 'react-dom'],
  sourcemap: true,
});
