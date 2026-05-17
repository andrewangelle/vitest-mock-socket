import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['../src/index.ts'],
  tsconfig: '../tsconfig.json',
  sourcemap: true,
  dts: true,
  format: 'esm',
  outDir: '../dist',
  minify: true,
});
