import type { Page } from '@playwright/test'

export class PasswordForgotPage {
  constructor(public readonly page: Page) {}
}
