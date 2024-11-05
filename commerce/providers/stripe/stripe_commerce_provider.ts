import { appEnv } from "@/app/env/app_env.js"
import {
  AccountInformation,
  CommerceProviderContract,
} from "@/commerce/contracts/commerce_provider_contract.js"
import Stripe from "stripe"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { rootPath } from "@/shared/utils/routes/root_path.js"

import { container } from "@/utils/typi.js"

export class StripeCommerceProvider implements CommerceProviderContract {
  constructor(
    protected stripe = new Stripe(
      appEnv.COMMERCE_PROVIDER_STRIPE_SECRET_KEY,
    ),
  ) {}

  requiresExternalOnboarding = true

  async createAccount(accountInformation: AccountInformation) {
    const account = await this.stripe.accounts.create({
      type: "express",
      email: accountInformation.email,
      country: accountInformation.country,

      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
    })

    const accountLink = await this.createOnboardingLink(account.id)

    await container
      .make(TeamRepository)
      .teams()
      .update(accountInformation.teamId, {
        commerceProvider: "stripe",
        commerceProviderAccountId: account.id,
      })

    return { id: account.id, ...accountLink }
  }

  async createOnboardingLink(account: string) {
    const accountLink = await this.stripe.accountLinks.create({
      account,
      type: "account_onboarding",
      return_url: rootPath("settings/commerce"),
      refresh_url: rootPath("settings/commerce/refresh"),
    })

    return { onboardingLink: accountLink.url }
  }
}
