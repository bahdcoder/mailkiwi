import type { Page } from '@playwright/test'

import { BaseRolePage } from '#root/core/tests/e2e/pages/roles/base_role_page.js'

export class ManagerPage extends BaseRolePage {
  constructor(public readonly page: Page) {
    super(page)
  }
}
