import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    include: ['src/**/*.test.{js,ts}'],
    setupFiles: './config/setupTests.ts',
  },
});
