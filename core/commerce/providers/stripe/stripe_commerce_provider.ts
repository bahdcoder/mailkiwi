import { appEnv } from '#root/core/app/env/app_env.js'
import type {
  AccountInformation,
  CommerceProviderContract,
} from '#root/core/commerce/contracts/commerce_provider_contract.js'
import Stripe from 'stripe'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { rootPath } from '#root/core/shared/utils/routes/root_path.js'

import { container } from '#root/core/utils/typi.js'

/**
 * StripeCommerceProvider implements the payment provider contract for Stripe.
 *
 * This class provides the Stripe-specific implementation of the CommerceProviderContract,
 * enabling teams to use Stripe as their payment processor for selling products. It handles:
 *
 * 1. Creating Stripe Connect accounts for teams (merchants)
 * 2. Managing the onboarding process for Stripe Connect accounts
 * 3. Processing one-time payments through Stripe Checkout
 * 4. Verifying payment completion
 *
 * Stripe Connect is used to create separate accounts for each team, allowing them to
 * receive payments directly while Kibamail takes a platform fee. This approach provides
 * maximum flexibility for teams while ensuring compliance with payment regulations.
 */
export class StripeCommerceProvider implements CommerceProviderContract {
  constructor(
    protected stripe = new Stripe(appEnv.COMMERCE_PROVIDER_STRIPE_SECRET_KEY),
  ) {}

  /**
   * Indicates that Stripe requires external onboarding on their website.
   *
   * Stripe Connect requires merchants to complete an identity verification
   * and account setup process on Stripe's website. This cannot be done
   * entirely through the API, unlike some other providers.
   */
  requiresExternalOnboarding = true

  /**
   * Creates a Stripe Connect account for a team.
   *
   * This method implements the account creation process for Stripe:
   * 1. Creates an Express Connect account with Stripe
   * 2. Configures the account with the necessary capabilities
   * 3. Generates an onboarding link for the account
   * 4. Updates the team record with the Stripe account ID
   *
   * Stripe Express accounts provide a balance between simplicity and flexibility,
   * allowing teams to receive payments directly while Kibamail handles most of the
   * complexity of managing the Stripe integration.
   *
   * @param accountInformation - The team's account information
   * @returns The Stripe account ID and onboarding link
   */
  async createAccount(accountInformation: AccountInformation) {
    // Create an Express Connect account with Stripe
    const account = await this.stripe.accounts.create({
      type: 'express', // Express accounts provide a balance of features and simplicity
      email: accountInformation.email,
      country: accountInformation.country,

      // Enable the necessary capabilities for the account
      capabilities: {
        // Allow the account to accept card payments
        card_payments: {
          requested: true,
        },
        // Allow the platform to transfer funds to the account
        transfers: {
          requested: true,
        },
      },
    })

    // Generate an onboarding link for the account
    const accountLink = await this.createOnboardingLink(account.id)

    // Update the team record with the Stripe account ID
    await container.make(TeamRepository).teams().update(accountInformation.teamId, {
      commerceProvider: 'stripe',
      commerceProviderAccountId: account.id,
    })

    // Return the account ID and onboarding link
    return { id: account.id, ...accountLink }
  }

  /**
   * Generates an onboarding link for a Stripe Connect account.
   *
   * This method creates a unique URL that directs the team to Stripe's
   * onboarding flow, where they can complete their account setup and
   * identity verification. The flow includes:
   *
   * 1. Collecting business information
   * 2. Verifying the team's identity
   * 3. Setting up payout methods
   * 4. Accepting Stripe's terms of service
   *
   * The method includes return and refresh URLs to handle the user's
   * return to the application after completing or abandoning the flow.
   *
   * @param account - The Stripe account ID
   * @returns An object containing the onboarding URL
   */
  async createOnboardingLink(account: string) {
    // Create an account link for the onboarding flow
    const accountLink = await this.stripe.accountLinks.create({
      account, // The Stripe account to onboard
      type: 'account_onboarding', // The type of link to create
      // URL to redirect to after the flow is completed
      return_url: rootPath('settings/commerce'),
      // URL to redirect to if the link expires
      refresh_url: rootPath('settings/commerce/refresh'),
    })

    // Return the onboarding URL
    return { onboardingLink: accountLink.url }
  }

  /**
   * Initializes a one-time payment process through Stripe.
   *
   * Note: This is a placeholder implementation that needs to be completed.
   * The full implementation would create a Stripe Checkout session for the
   * specified product and return the checkout URL.
   *
   * @returns An object containing an empty payment URL
   */
  async initialiseOneTimePayment() {
    // TODO: Implement Stripe Checkout session creation
    return { paymentUrl: '' }
  }

  /**
   * Confirms that a payment has been successfully processed by Stripe.
   *
   * Note: This is a placeholder implementation that needs to be completed.
   * The full implementation would verify the payment status with Stripe
   * using the provided reference (Stripe session or payment intent ID).
   *
   * @returns An object indicating that the payment was successful
   */
  async confirmOneTimePayment() {
    // TODO: Implement Stripe payment verification
    return { success: true }
  }
}
