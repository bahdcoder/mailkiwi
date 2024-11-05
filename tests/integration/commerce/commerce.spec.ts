import { appEnv } from "@/app/env/app_env.js"
import { AccountInformation } from "@/commerce/contracts/commerce_provider_contract.js"
import { CommerceProviderTool } from "@/commerce/tools/commerce_provider_tool.js"
import { faker } from "@faker-js/faker"
import { describe, test, vi } from "vitest"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

import { container } from "@/utils/typi.js"

describe("@commerce", () => {
  test("can connect commerce account to stripe provider", async ({
    expect,
  }) => {
    const { user, team } = await createUser()

    const createAccountFn = vi.fn(async function (
      account: AccountInformation,
    ) {
      const accountId = `acct_${faker.string.uuid()}`
      return {
        id: accountId,
        onboardingLink: `https://connect.stripe.com/setup/e/${accountId}/${faker.string.nanoid()}`,
      }
    })

    const createProviderFn = vi.fn(function (name: string) {
      return {
        createAccount: createAccountFn,
        requiresExternalOnboarding: true,
        createOnboardingLink: vi.fn(),
      }
    })

    container.fake(CommerceProviderTool, {
      createProvider: createProviderFn,
    })

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/commerce/connect",
      body: {
        provider: "stripe",
        country: "US",
      },
      headers: {
        [appEnv.software.teamHeader]: team.id.toString(),
      },
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toMatch(
      "https://connect.stripe.com/setup/e/acct_",
    )

    expect(createProviderFn).toHaveBeenCalledWith("stripe")

    container.restore(CommerceProviderTool)
  })

  test("can connect commerce account to paystack provider", async ({
    expect,
  }) => {
    const { user, team } = await createUser()

    const createAccountFn = vi.fn(async function (
      account: AccountInformation,
    ) {
      const accountId = `acct_${faker.string.uuid()}`
      return {
        id: accountId,
        onboardingLink: "",
      }
    })

    const createProviderFn = vi.fn(function (name: string) {
      return {
        createAccount: createAccountFn,
        requiresExternalOnboarding: true,
        createOnboardingLink: vi.fn(),
      }
    })

    container.fake(CommerceProviderTool, {
      createProvider: createProviderFn,
    })

    await makeRequestAsUser(user, {
      method: "POST",
      path: "/commerce/connect",
      body: {
        provider: "paystack",
        payoutInformation: {
          bankCode: "058",
          accountNumber: "0424218293",
        },
      },
      headers: {
        [appEnv.software.teamHeader]: team.id.toString(),
      },
    })

    expect(createProviderFn).toHaveBeenCalledWith("paystack")

    container.restore(CommerceProviderTool)
  })
})
