import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'mysql://root:password@localhost:3306/mailchimp_test'
process.env.HOST = '0.0.0.0'
process.env.PORT = '5566'
process.env.APP_KEY = 'eokwbBbSOHggebeb2PxGK23Bq7EyuCO5'
process.env.MAILHOG_URL = 'http://localhost:8025'

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
