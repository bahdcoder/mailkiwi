import react from "@vitejs/plugin-react"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const path = fileURLToPath(import.meta.url)
const root = resolve(dirname(path), "src/views/app")

export default defineConfig({
  root,
  resolve: {
    alias: {
      "@client": resolve(root),
    },
  },
  plugins: [react({ jsxRuntime: "classic" })],
  build: {
    manifest: true,
    outDir: resolve(process.cwd(), "build/client"),
    ssrEmitAssets: true,
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(root, "main.tsx"),
    },
  },
  server: {
    cors: false,
  },
})
