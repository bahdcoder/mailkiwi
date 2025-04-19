import react from "@vitejs/plugin-react"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { visualizer } from "rollup-plugin-visualizer"
import vike from "vike/plugin"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths(), vike(), react(), visualizer()],
  build: {
    manifest: true,
    outDir: resolve(process.cwd(), "build"),
  },
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json"],
  },
  server: {
    cors: false,
    https:
      process.env.NODE_ENV === "production"
        ? undefined
        : {
            key: readFileSync(
              resolve(process.cwd(), "certs", "localhost-key.pem")
            ),
            cert: readFileSync(
              resolve(process.cwd(), "certs", "localhost.pem")
            ),
          },
  },
})
