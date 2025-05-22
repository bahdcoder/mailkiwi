import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { visualizer } from 'rollup-plugin-visualizer'
import vike from 'vike/plugin'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      vike(),
      react(),
      visualizer(),
      ...(mode === 'build'
        ? [
            sentryVitePlugin({
              org: 'kibamail',
              project: 'kibamail',
              authToken: process.env.SENTRY_AUTH_TOKEN,
              url: 'https://sentry.kibamail.com',
              debug: true,
            }),
          ]
        : []),
    ],
    build: {
      manifest: true,
      outDir: resolve(process.cwd(), 'build'),
      sourcemap: true,
    },
    resolve: {
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
      alias: {
        '@': resolve(process.cwd(), './core'),
        '@pages': resolve(process.cwd(), './pages'),
        '@database': resolve(process.cwd(), './database'),
      },
    },
    server: {
      cors: false,
      allowedHosts: ['.coder.kibamail.com', '.kibamail.com', '.preview.kibamail.com'],
    },
    define: {
      'import.meta.env.PUBLIC_ENV__NODE_ENV': process.env.NODE_ENV,
    },
  }
})
