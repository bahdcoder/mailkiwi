import { BaseRolePage } from "./base_role_page.js"
import { Page } from "@playwright/test"

export class OwnerPage extends BaseRolePage {
  constructor(public readonly page: Page) {
    super(page)
  }
}
