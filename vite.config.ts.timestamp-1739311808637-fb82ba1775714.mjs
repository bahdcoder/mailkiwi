// vite.config.ts
import react from "file:///Users/bettyalagwu/Code/kibamail/node_modules/.pnpm/@vitejs+plugin-react@4.3.4_vite@5.4.11_@types+node@20.17.10_/node_modules/@vitejs/plugin-react/dist/index.mjs"
import { visualizer } from "file:///Users/bettyalagwu/Code/kibamail/node_modules/.pnpm/rollup-plugin-visualizer@5.12.0_rollup@4.29.1/node_modules/rollup-plugin-visualizer/dist/plugin/index.js"
import vike from "file:///Users/bettyalagwu/Code/kibamail/node_modules/.pnpm/vike@0.4.210_react-streaming@0.3.44_react-dom@18.3.1_react@18.3.1__react@18.3.1__vite@5.4.11_@types+node@20.17.10_/node_modules/vike/dist/esm/node/plugin/index.js"
import tsconfigPaths from "file:///Users/bettyalagwu/Code/kibamail/node_modules/.pnpm/vite-tsconfig-paths@4.3.2_typescript@5.7.2_vite@5.4.11_@types+node@20.17.10_/node_modules/vite-tsconfig-paths/dist/index.mjs"
import { defineConfig } from "file:///Users/bettyalagwu/Code/kibamail/node_modules/.pnpm/vite@5.4.11_@types+node@20.17.10/node_modules/vite/dist/node/index.js"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

var vite_config_default = defineConfig({
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
    https: {
      key: readFileSync(resolve(process.cwd(), "certs", "localhost-key.pem")),
      cert: readFileSync(resolve(process.cwd(), "certs", "localhost.pem")),
    },
  },
})
export { vite_config_default as default }
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYmV0dHlhbGFnd3UvQ29kZS9raWJhbWFpbFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2JldHR5YWxhZ3d1L0NvZGUva2liYW1haWwvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2JldHR5YWxhZ3d1L0NvZGUva2liYW1haWwvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCJcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gXCJub2RlOmZzXCJcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwibm9kZTpwYXRoXCJcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tIFwicm9sbHVwLXBsdWdpbi12aXN1YWxpemVyXCJcbmltcG9ydCB2aWtlIGZyb20gXCJ2aWtlL3BsdWdpblwiXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiXG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFt0c2NvbmZpZ1BhdGhzKCksIHZpa2UoKSwgcmVhY3QoKSwgdmlzdWFsaXplcigpXSxcbiAgYnVpbGQ6IHtcbiAgICBtYW5pZmVzdDogdHJ1ZSxcbiAgICBvdXREaXI6IHJlc29sdmUocHJvY2Vzcy5jd2QoKSwgXCJidWlsZFwiKSxcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGV4dGVuc2lvbnM6IFtcIi5qc1wiLCBcIi50c1wiLCBcIi5qc3hcIiwgXCIudHN4XCIsIFwiLmpzb25cIl0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGNvcnM6IGZhbHNlLFxuICAgIGh0dHBzOiB7XG4gICAgICBrZXk6IHJlYWRGaWxlU3luYyhyZXNvbHZlKHByb2Nlc3MuY3dkKCksIFwiY2VydHNcIiwgXCJsb2NhbGhvc3Qta2V5LnBlbVwiKSksXG4gICAgICBjZXJ0OiByZWFkRmlsZVN5bmMocmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBcImNlcnRzXCIsIFwibG9jYWxob3N0LnBlbVwiKSksXG4gICAgfSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtSLE9BQU8sV0FBVztBQUNwUyxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGVBQWU7QUFDeEIsU0FBUyxrQkFBa0I7QUFDM0IsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sbUJBQW1CO0FBRTFCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxjQUFjLEdBQUcsS0FBSyxHQUFHLE1BQU0sR0FBRyxXQUFXLENBQUM7QUFBQSxFQUN4RCxPQUFPO0FBQUEsSUFDTCxVQUFVO0FBQUEsSUFDVixRQUFRLFFBQVEsUUFBUSxJQUFJLEdBQUcsT0FBTztBQUFBLEVBQ3hDO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxZQUFZLENBQUMsT0FBTyxPQUFPLFFBQVEsUUFBUSxPQUFPO0FBQUEsRUFDcEQ7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLEtBQUssYUFBYSxRQUFRLFFBQVEsSUFBSSxHQUFHLFNBQVMsbUJBQW1CLENBQUM7QUFBQSxNQUN0RSxNQUFNLGFBQWEsUUFBUSxRQUFRLElBQUksR0FBRyxTQUFTLGVBQWUsQ0FBQztBQUFBLElBQ3JFO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
