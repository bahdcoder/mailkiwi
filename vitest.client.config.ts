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
    setupFiles: ['core/tests/setup.client.ts'],
    hideSkippedTests: true,
    exclude: [...configDefaults.exclude, '**/build/**'],
    reporters: ['verbose'],
    retry: 1,
    environment: 'jsdom',
    include: ['pages/**/*.spec.tsx', 'core/**/*.client.spec.tsx'],
  },
})
