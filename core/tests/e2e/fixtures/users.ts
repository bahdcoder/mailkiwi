import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { type Page, test as base } from '@playwright/test'

import {
  administrator,
  author,
  basePath,
  guest,
  manager,
  owner,
} from '#root/core/tests/e2e/helpers/storage_state_paths.js'
import { AdministratorPage } from '#root/core/tests/e2e/pages/roles/administrator_page.js'
import { AuthorPage } from '#root/core/tests/e2e/pages/roles/author_page.js'
import { GuestPage } from '#root/core/tests/e2e/pages/roles/guest_page.js'
import { ManagerPage } from '#root/core/tests/e2e/pages/roles/manager_page.js'
import { OwnerPage } from '#root/core/tests/e2e/pages/roles/owner_page.js'

import type { User } from '#root/database/database_schema_types.js'

type UserRolesFixtures = {
  administratorPage: AdministratorPage
  managerPage: ManagerPage
  authorPage: AuthorPage
  ownerPage: OwnerPage
  guestPage: GuestPage
  seed: Record<
    'owner' | 'guest' | 'author' | 'manager' | 'administrator',
    { team: { id: string; name: string }; user: User }
  >
}

export * from '@playwright/test'

export const test = base.extend<UserRolesFixtures>({
  async administratorPage({ browser }, use) {
    const context = await browser.newContext({
      storageState: administrator(),
    })
    await use(new AdministratorPage(await context.newPage()))
    await context.close()
  },
  async managerPage({ browser }, use) {
    const context = await browser.newContext({
      storageState: manager(),
    })

    await use(new ManagerPage(await context.newPage()))

    await context.close()
  },
  async guestPage({ browser }, use) {
    const context = await browser.newContext({
      storageState: guest(),
    })

    await use(new GuestPage(await context.newPage()))

    await context.close()
  },
  async ownerPage({ browser }, use) {
    const context = await browser.newContext({
      storageState: owner(),
    })

    await use(new OwnerPage(await context.newPage()))

    await context.close()
  },
  async authorPage({ browser }, use) {
    const context = await browser.newContext({
      storageState: author(),
    })

    await use(new AuthorPage(await context.newPage()))

    await context.close()
  },
  async seed({ context }, use) {
    const seedFilePath = resolve(basePath, 'seed.users.json')

    const users = await readFile(seedFilePath, 'utf-8')

    await use(JSON.parse(users))

    await context.close()
  },
})
