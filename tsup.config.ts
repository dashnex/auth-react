import { defineConfig } from 'tsup'
import nodePolyfills from 'rollup-plugin-polyfill-node';

export default defineConfig([{
  // for modern Apps
  entry: ['src/index.ts'],
  dts: true,
  outDir: 'dist',
  clean: true,
  format: ['cjs', 'esm'],
  treeshake: true,
  splitting: false,
  cjsInterop: true,
  sourcemap: true,
  minify: true,
}, { // For vanilla JS
  entry: ['src/browser.ts'],
  dts: true,
  outDir: 'dist',
  clean: true,
  format: ['iife'],
  treeshake: true,
  splitting: false,
  cjsInterop: true,
  sourcemap: true,
  bundle: true,
  platform: 'browser',
  plugins: [
    nodePolyfills({
      include: 'buffer',
    }) as any,
  ],
  globalName: 'DashNex',
  minify: true
}])