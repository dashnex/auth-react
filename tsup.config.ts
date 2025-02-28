import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/DashNexOauthClient.ts', 'src/storage/authLocalStorage.ts'],
  dts: true,
  outDir: 'dist',
  clean: true,
  format: ['cjs', 'esm'],
  treeshake: true,
  splitting: false,
  cjsInterop: true,
})