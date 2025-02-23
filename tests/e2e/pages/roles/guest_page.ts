import type { Page } from '@playwright/test'

export class GuestPage {
  constructor(public readonly page: Page) {}
}
