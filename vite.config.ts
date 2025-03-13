import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.{js,ts}'],
    setupFiles: './src/setupTests.ts',
  },
});
