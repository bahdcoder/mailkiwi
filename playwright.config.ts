import { defineConfig, devices } from '@playwright/test'

import { owner } from '#root/core/tests/e2e/helpers/storage_state_paths.js'

export default defineConfig({
  testDir: './core/tests/e2e',
  fullyParallel: true,
  globalSetup: './core/tests/setup.e2e.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 15000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
    storageState: owner(),

    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
