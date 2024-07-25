import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const path = fileURLToPath(import.meta.url)
const root = resolve(dirname(path), 'src/http/views/app')

export default defineConfig({
  root,
  plugins: [react({ jsxRuntime: 'classic' })],
  build: {
    manifest: true,
    assetsDir: '',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    outDir: resolve(process.cwd(), 'build/client'),
    rollupOptions: {
      input: resolve(root, 'main.tsx'),
    },
  },
  server: {
    cors: false,
  },
})
