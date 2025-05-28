import { resolve } from 'node:path'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      ignoreEmptyLines: true,
      exclude: [
        'build/**',
        'tests/**',
        '.prettierrc.js',
        'drizzle.config.ts',
        'postcss.config.js',
        'tailwind.config.js',
      ],
    },
    setupFiles: ['core/tests/setup.ts'],
    hideSkippedTests: true,
    exclude: [
      ...configDefaults.exclude,
      '**/build/**',
      'pages/**/*.spec.tsx',
      '**/*.client.spec.tsx',
      'core/tests/e2e/**/*.spec.ts',
    ],
    reporters: ['verbose'],
    retry: 1,
    environment: 'node',
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 1,
        minThreads: 1,
      },
    },
  },
  resolve: {
    alias: {
      '#root': resolve(process.cwd()),
    },
  },
})
