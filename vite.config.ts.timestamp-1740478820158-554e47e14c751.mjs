// vite.config.ts
import react from 'file:///Users/bettyalagwu/Code/kibamail/node_modules/.pnpm/@vitejs+plugin-react@4.3.4_vite@5.4.11_@types+node@20.17.10_/node_modules/@vitejs/plugin-react/dist/index.mjs'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { visualizer } from 'file:///Users/bettyalagwu/Code/kibamail/node_modules/.pnpm/rollup-plugin-visualizer@5.12.0_rollup@4.29.1/node_modules/rollup-plugin-visualizer/dist/plugin/index.js'
import vike from 'file:///Users/bettyalagwu/Code/kibamail/node_modules/.pnpm/vike@0.4.210_react-streaming@0.3.44_react-dom@18.3.1_react@18.3.1__react@18.3.1__vite@5.4.11_@types+node@20.17.10_/node_modules/vike/dist/esm/node/plugin/index.js'
import { defineConfig } from 'file:///Users/bettyalagwu/Code/kibamail/node_modules/.pnpm/vite@5.4.11_@types+node@20.17.10/node_modules/vite/dist/node/index.js'
import tsconfigPaths from 'file:///Users/bettyalagwu/Code/kibamail/node_modules/.pnpm/vite-tsconfig-paths@4.3.2_typescript@5.7.2_vite@5.4.11_@types+node@20.17.10_/node_modules/vite-tsconfig-paths/dist/index.mjs'
const vite_config_default = defineConfig({
  plugins: [tsconfigPaths(), vike(), react(), visualizer()],
  build: {
    manifest: true,
    outDir: resolve(process.cwd(), 'build'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    cors: false,
    https: {
      key: readFileSync(resolve(process.cwd(), 'certs', 'localhost-key.pem')),
      cert: readFileSync(resolve(process.cwd(), 'certs', 'localhost.pem')),
    },
  },
})
export { vite_config_default as default }
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYmV0dHlhbGFnd3UvQ29kZS9raWJhbWFpbFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2JldHR5YWxhZ3d1L0NvZGUva2liYW1haWwvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2JldHR5YWxhZ3d1L0NvZGUva2liYW1haWwvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdub2RlOmZzJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInXG5pbXBvcnQgdmlrZSBmcm9tICd2aWtlL3BsdWdpbidcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tICd2aXRlLXRzY29uZmlnLXBhdGhzJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbdHNjb25maWdQYXRocygpLCB2aWtlKCksIHJlYWN0KCksIHZpc3VhbGl6ZXIoKV0sXG4gIGJ1aWxkOiB7XG4gICAgbWFuaWZlc3Q6IHRydWUsXG4gICAgb3V0RGlyOiByZXNvbHZlKHByb2Nlc3MuY3dkKCksICdidWlsZCcpLFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgZXh0ZW5zaW9uczogWycuanMnLCAnLnRzJywgJy5qc3gnLCAnLnRzeCcsICcuanNvbiddLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBjb3JzOiBmYWxzZSxcbiAgICBodHRwczoge1xuICAgICAga2V5OiByZWFkRmlsZVN5bmMocmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnY2VydHMnLCAnbG9jYWxob3N0LWtleS5wZW0nKSksXG4gICAgICBjZXJ0OiByZWFkRmlsZVN5bmMocmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnY2VydHMnLCAnbG9jYWxob3N0LnBlbScpKSxcbiAgICB9LFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1IsT0FBTyxXQUFXO0FBQ3BTLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsZUFBZTtBQUN4QixTQUFTLGtCQUFrQjtBQUMzQixPQUFPLFVBQVU7QUFDakIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxtQkFBbUI7QUFFMUIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLGNBQWMsR0FBRyxLQUFLLEdBQUcsTUFBTSxHQUFHLFdBQVcsQ0FBQztBQUFBLEVBQ3hELE9BQU87QUFBQSxJQUNMLFVBQVU7QUFBQSxJQUNWLFFBQVEsUUFBUSxRQUFRLElBQUksR0FBRyxPQUFPO0FBQUEsRUFDeEM7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLFlBQVksQ0FBQyxPQUFPLE9BQU8sUUFBUSxRQUFRLE9BQU87QUFBQSxFQUNwRDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsS0FBSyxhQUFhLFFBQVEsUUFBUSxJQUFJLEdBQUcsU0FBUyxtQkFBbUIsQ0FBQztBQUFBLE1BQ3RFLE1BQU0sYUFBYSxRQUFRLFFBQVEsSUFBSSxHQUFHLFNBQVMsZUFBZSxDQUFDO0FBQUEsSUFDckU7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
