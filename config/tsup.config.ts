import { defineConfig } from 'tsup';
import tsupTsconfigPathsPlugin from './tsup-tsconfig-paths-plugin';

export default defineConfig({
  entry: ['./src/index.ts'],
  tsconfig: './tsconfig.json',
  sourcemap: true,
  dts: true,
  format: 'esm',
  outDir: 'dist',
  plugins: [tsupTsconfigPathsPlugin],
});
