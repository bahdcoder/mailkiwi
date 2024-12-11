import { Page } from "@playwright/test"

export class AuthorPage {
  constructor(public readonly page: Page) {}
}
