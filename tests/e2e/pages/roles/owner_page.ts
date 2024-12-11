import { Page } from "@playwright/test"

export class OwnerPage {
  constructor(public readonly page: Page) {}
}
