import devServer from "@hono/vite-dev-server"
import react from "@vitejs/plugin-react"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import vike from "vike/plugin"
import { defineConfig } from "vite"

const path = fileURLToPath(import.meta.url)

export default defineConfig({
  // resolve: {
  //   alias: {
  //     "@client": resolve(root),
  //   },
  // },
  plugins: [vike(), react()],
  build: {
    manifest: true,
    outDir: resolve(process.cwd(), "build"),
  },
  server: {
    cors: false,
    https: {
      key: readFileSync(
        resolve(process.cwd(), "certs", "localhost-key.pem"),
      ),
      cert: readFileSync(resolve(process.cwd(), "certs", "localhost.pem")),
    },
  },
})
