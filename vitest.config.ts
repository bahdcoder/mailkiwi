import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
    },
    setupFiles: ['src/tests/setup.ts'],
    exclude: [...configDefaults.exclude, '**/build/**'],
    reporters: ['verbose'],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  plugins: [tsconfigPaths()],
})
