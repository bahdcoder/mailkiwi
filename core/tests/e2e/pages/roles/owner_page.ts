import type { Page } from '@playwright/test'
import { BaseRolePage } from './base_role_page.js'

export class OwnerPage extends BaseRolePage {
  constructor(public readonly page: Page) {
    super(page)
  }
}
