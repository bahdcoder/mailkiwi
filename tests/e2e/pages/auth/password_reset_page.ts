import type { Page } from '@playwright/test'

export class PasswordResetPage {
  constructor(public readonly page: Page) {}
}
