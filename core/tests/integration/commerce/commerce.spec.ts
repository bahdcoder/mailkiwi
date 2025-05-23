import { appEnv } from '#root/core/app/env/app_env.js'
import type { AccountInformation } from '#root/core/commerce/contracts/commerce_provider_contract.js'
import { ProductRepository } from '#root/core/commerce/repositories/product_repository.js'
import { CommerceProviderTool } from '#root/core/commerce/tools/commerce_provider_tool.js'
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { DateTime } from 'luxon'
import { describe, test, vi } from 'vitest'

import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'

import type {
  Audience,
  InsertProduct,
  Team,
  User,
} from '#root/database/database_schema_types.js'
import { products } from '#root/database/schema.js'

import { makeApp, makeDatabase } from '#root/core/shared/container/index.js'

import { sleep } from '#root/core/utils/sleep.js'
import { container } from '#root/core/utils/typi.js'

describe('@commerce', () => {
  const connectCommerceProvider = async (user: User, team: Team) => {
    return makeRequestAsUser(user, {
      method: 'POST',
      path: '/commerce/connect',
      body: {
        provider: 'paystack',
        payoutInformation: {
          bankCode: '058',
          accountNumber: '0424218293',
        },
      },
      headers: {
        [appEnv.software.teamHeader]: team.id.toString(),
      },
    })
  }

  const createFakeCommerceProvider = () => {
    const createAccountFn = vi.fn(async (_account: AccountInformation) => {
      const accountId = `acct_${faker.string.uuid()}`
      return {
        id: accountId,
        onboardingLink: `https://connect.stripe.com/setup/e/acct_${faker.string.uuid()}`,
      }
    })

    const createProviderFn = vi.fn((name: string) => ({
      createAccount: createAccountFn,
      requiresExternalOnboarding: true,
      createOnboardingLink: vi.fn(),
      initialiseOneTimePayment: vi.fn(async () => ({
        paymentUrl: 'https://checkout.paystack.com/7j8',
      })),
      confirmOneTimePayment: vi.fn(async () => ({ success: true })),
    }))

    container.fake(CommerceProviderTool, {
      createProvider: createProviderFn,
    })

    return { createAccountFn, createProviderFn }
  }

  test('can connect commerce account to stripe provider', async ({ expect }) => {
    const { user, team } = await createUser({
      enableCommerceOnTeam: false,
    })

    const { createProviderFn } = createFakeCommerceProvider()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/commerce/connect',
      body: {
        provider: 'stripe',
        country: 'US',
      },
      headers: {
        [appEnv.software.teamHeader]: team.id.toString(),
      },
    })

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toMatch(
      'https://connect.stripe.com/setup/e/acct_',
    )

    expect(createProviderFn).toHaveBeenCalledWith('stripe')

    container.restoreAll()
  })

  test('can connect commerce account to paystack provider', async ({ expect }) => {
    const { user, team } = await createUser({
      enableCommerceOnTeam: false,
    })

    const { createProviderFn } = createFakeCommerceProvider()

    container.fake(CommerceProviderTool, {
      createProvider: createProviderFn,
    })

    await connectCommerceProvider(user, team)

    expect(createProviderFn).toHaveBeenCalledWith('paystack')

    container.restoreAll()
  })

  test('can create a commerce product', async ({ expect }) => {
    const { user, audience } = await createUser({
      enableCommerceOnTeam: true,
    })

    const payload = {
      name: faker.string.uuid(),
      billingCycle: 'once',
      price: 1000,
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/products`,
      body: payload,
    })

    expect(response.status).toBe(200)

    const [product] = await makeDatabase()
      .select()
      .from(products)
      .where(eq(products.name, payload.name))
      .limit(1)

    expect(product).toBeDefined()
    expect(product.price).toBe(payload.price)
    expect(product.audienceId).toBe(audience.id)
    expect(product.billingCycle).toBe(payload.billingCycle)
  })

  test('a contact can purchase a commerce product', async ({ expect }) => {
    const { audience, team } = await createUser({
      enableCommerceOnTeam: false,
    })

    await container.make(TeamRepository).teams().update(team.id, {
      commerceProvider: 'paystack',
      commerceProviderAccountId: 'ACCT_v5h38z9ciytbnq3',
      commerceProviderConfirmedAt: DateTime.now().toJSDate(),
    })

    const productPayload: InsertProduct = {
      billingCycle: 'once',
      name: faker.lorem.sentence(4),
      price: 100000,
      audienceId: audience.id,
      teamId: team.id,
    }
    const { id: productId } = await container
      .make(ProductRepository)
      .products()
      .create(productPayload)

    const email = faker.internet.email()

    await container.make(ContactRepository).create(
      {
        email,
      },
      audience as Audience,
    )

    const app = makeApp()

    createFakeCommerceProvider()

    // const response = await connectCommerceProvider(user, team)
    const response = await app.request(`/products/${productId}/payments/initialize`, {
      method: 'POST',
      body: JSON.stringify({
        email,
      }),
    })

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.paymentUrl).toContain('https://checkout.paystack.com/')
  })
})
