import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin' // Import Sentry Vite Plugin
import { visualizer } from 'rollup-plugin-visualizer'
import vike from 'vike/plugin'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))
const releaseVersion = packageJson.version

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    vike(),
    react(),
    visualizer(),
    // Add Sentry plugin, only for production builds
    process.env.NODE_ENV === 'production' &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: `kibamail-client@${releaseVersion}`,
        sourcemaps: {
          assets: './build/assets/**', // Adjust if your assets output dir is different
          ignore: ['node_modules'],
        },
      }),
  ].filter(Boolean), // Filter out any undefined entries from conditional plugins
  build: {
    manifest: true,
    outDir: resolve(process.cwd(), 'build'),
    sourcemap: true, // Enable source maps for production builds
  },
  define: {
    // Make version available to client-side code for Sentry release tracking
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(releaseVersion),
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
