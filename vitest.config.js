import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
  },
  esbuild: {
    target: 'es2022',
  },
  optimizeDeps: {
    disabled: true,
  },
});
