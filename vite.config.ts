import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import vike from 'vike/plugin'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    tsconfigPaths(), 
    vike(), 
    react(), 
    visualizer(),
    // Add Sentry plugin for source map uploads in production
    process.env.NODE_ENV === 'production' && sentryVitePlugin({
      org: "kibamail",
      project: "kibamail-client",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      url: "https://sentry.kibamail.com/",
      sourcemaps: {
        assets: "./build/client/assets/**",
      },
    }),
  ].filter(Boolean),
  build: {
    manifest: true,
    outDir: resolve(process.cwd(), 'build'),
    sourcemap: true, // Enable source maps for better error tracking
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    cors: false,
    https:
      process.env.NODE_ENV === 'production'
        ? undefined
        : {
            key: readFileSync(resolve(process.cwd(), 'certs', 'localhost-key.pem')),
            cert: readFileSync(resolve(process.cwd(), 'certs', 'localhost.pem')),
          },
  },
})
