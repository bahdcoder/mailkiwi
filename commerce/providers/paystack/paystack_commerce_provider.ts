import { appEnv } from "@/app/env/app_env.js"
import {
  AccountInformation,
  CommerceProviderContract,
} from "@/commerce/contracts/commerce_provider_contract.js"
import { DateTime } from "luxon"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { makeHttpClient } from "@/shared/http/http_client.js"

import { container } from "@/utils/typi.js"

export class PaystackCommerceProvider implements CommerceProviderContract {
  requiresExternalOnboarding = false

  constructor(
    protected httpClient = makeHttpClient()
      .baseURL("https://api.paystack.co")
      .headers({
        Authorization: `Bearer ${appEnv.COMMERCE_PROVIDER_PAYSTACK_SECRET_KEY}`,
      }),
  ) {}

  async createAccount(account: AccountInformation) {
    const { data, error } = await this.httpClient
      .url("/subaccount")
      .payload({
        business_name: account?.name,
        bank_code: account?.payoutInformation?.bankCode,
        account_number: account?.payoutInformation?.accountNumber,
        percentage_charge: 0,
      })
      .headers({
        Authorization: `Bearer ${appEnv.COMMERCE_PROVIDER_PAYSTACK_SECRET_KEY}`,
      })
      .asJson()
      .post()
      .send<{ data: { subaccount_code: string; active: boolean } }>()

    if (error) throw error

    await container.make(TeamRepository).teams().update(account.teamId, {
      commerceProvider: "paystack",
      commerceProviderAccountId: data?.data?.subaccount_code,
      commerceProviderConfirmedAt: DateTime.now().toJSDate(),
    })

    return { id: data?.data?.subaccount_code }
  }

  async createOnboardingLink(accountId: string) {
    return { onboardingLink: "" }
  }
}
