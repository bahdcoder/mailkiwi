import react from "@vitejs/plugin-react"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import vike from "vike/plugin"
import { defineConfig } from "vite"

export default defineConfig({
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
