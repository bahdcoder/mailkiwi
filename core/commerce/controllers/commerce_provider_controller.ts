import {
  ConnectCommerceProviderDto,
  ConnectCommerceProviderSchema,
} from '#root/core/commerce/dto/connect_commerce_provider_dto.js'
import { StripeWebhookController } from '#root/core/commerce/providers/stripe/controllers/stripe_webhook_controller.js'
import { CommerceProviderTool } from '#root/core/commerce/tools/commerce_provider_tool.js'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * CommerceProviderController handles API endpoints for payment provider integration.
 *
 * This controller is responsible for managing the connection between teams and
 * payment providers (Stripe, Paystack, etc.). It provides endpoints for:
 *
 * 1. Connecting a team to a payment provider
 * 2. Managing the onboarding process for payment providers
 * 3. Handling webhooks from payment providers
 *
 * The controller uses the CommerceProviderTool to create the appropriate provider
 * implementation based on the team's selected provider, ensuring consistent behavior
 * regardless of which provider is used.
 */
export class CommerceProviderController extends BaseController {
  constructor(
    protected app = makeApp(),
    protected teamRepository = container.make(TeamRepository),
  ) {
    super()

    // Define the route for connecting a team to a payment provider
    this.app.defineRoutes([['POST', '/commerce/connect', this.connect.bind(this)]])

    // Initialize the Stripe webhook controller to handle Stripe events
    // This is resolved separately to register its routes
    container.resolve(StripeWebhookController)
  }

  /**
   * Connects a team to a payment provider or continues the onboarding process.
   *
   * This method handles the process of connecting a team to a payment provider:
   * 1. Validates that the user has administrative permissions for the team
   * 2. Validates the connection request data
   * 3. Creates the appropriate provider implementation
   * 4. Handles two distinct scenarios:
   *    a. If the team already has a provider account, continues the onboarding process
   *    b. If the team doesn't have a provider account, creates one and starts onboarding
   *
   * The method handles different provider requirements seamlessly. For providers
   * that require external onboarding (like Stripe), it redirects the user to the
   * provider's onboarding flow. For providers that don't require external onboarding
   * (like Paystack), it completes the process entirely through the API.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the account ID or redirect to onboarding
   */
  async connect(ctx: HonoContext) {
    // Ensure the user has administrative permissions for the team
    const team = this.ensureCanAdministrate(ctx)
    const user = this.user(ctx)

    // Validate the connection request data
    const payload = await this.validate(ctx, ConnectCommerceProviderSchema)

    // Create the appropriate provider implementation
    const commerceProvider = container
      .make(CommerceProviderTool)
      .createProvider(payload.provider)

    // If the team already has a provider account, continue the onboarding process
    if (team.commerceProvider && team.commerceProviderAccountId) {
      // For providers that don't require external onboarding, we're already done
      if (!commerceProvider.requiresExternalOnboarding) {
        return ctx.json({ id: team.commerceProviderAccountId })
      }

      // For providers that require external onboarding, redirect to the onboarding flow
      const { onboardingLink } = await commerceProvider.createOnboardingLink(
        team.commerceProviderAccountId,
      )

      return ctx.redirect(onboardingLink)
    }

    // If the team doesn't have a provider account, create one and start onboarding
    const { id: accountId, onboardingLink } = await commerceProvider.createAccount({
      email: user.email,
      country: payload.country,
      teamId: team.id,
      name: `${team.name}: ${team.id}`,
      payoutInformation: payload.payoutInformation,
    })

    // For providers that require external onboarding, redirect to the onboarding flow
    if (onboardingLink) {
      return ctx.redirect(onboardingLink)
    }

    // For providers that don't require external onboarding, return the account ID
    return ctx.json({ id: accountId })
  }
}
