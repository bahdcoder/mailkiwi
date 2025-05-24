import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// import { sentryVitePlugin } from '@sentry/vite-plugin'
import vike from 'vike/plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vike(),
    react(),
    tailwindcss(),
    // ...(mode === 'build'
    //   ? [
    //       sentryVitePlugin({
    //         org: 'kibamail',
    //         project: 'kibamail',
    //         authToken: process.env.SENTRY_AUTH_TOKEN,
    //         url: 'https://sentry.kibamail.com',
    //         debug: true,
    //       }),
    //     ]
    //   : []),
  ],
  build: {
    manifest: true,
    outDir: resolve(process.cwd(), 'build'),
    sourcemap: true,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      '#root': resolve(process.cwd()),
    },
  },
  server: {
    cors: false,
    allowedHosts: ['.coder.kibamail.com', '.kibamail.com', '.preview.kibamail.com'],
  },
})
