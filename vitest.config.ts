import tsconfigPaths from 'vite-tsconfig-paths'
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
  },
  plugins: [tsconfigPaths()],
})
