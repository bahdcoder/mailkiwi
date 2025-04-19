import {
  ConnectCommerceProviderDto,
  ConnectCommerceProviderSchema,
} from '@/commerce/dto/connect_commerce_provider_dto.js'
import { StripeWebhookController } from '@/commerce/providers/stripe/controllers/stripe_webhook_controller.js'
import { CommerceProviderTool } from '@/commerce/tools/commerce_provider_tool.js'

import { TeamRepository } from '@/teams/repositories/team_repository.js'

import { makeApp } from '@/shared/container/index.js'
import { BaseController } from '@/shared/controllers/base_controller.js'
import type { HonoContext } from '@/shared/server/types.js'

import { container } from '@/utils/typi.js'

export class CommerceProviderController extends BaseController {
  constructor(
    protected app = makeApp(),
    protected teamRepository = container.make(TeamRepository),
  ) {
    super()

    this.app.defineRoutes([['POST', '/commerce/connect', this.connect.bind(this)]])

    container.resolve(StripeWebhookController)
  }

  async connect(ctx: HonoContext) {
    const team = this.ensureCanAdministrate(ctx)
    const user = this.user(ctx)

    const payload = await this.validate(ctx, ConnectCommerceProviderSchema)

    const commerceProvider = container
      .make(CommerceProviderTool)
      .createProvider(payload.provider)

    if (team.commerceProvider && team.commerceProviderAccountId) {
      if (!commerceProvider.requiresExternalOnboarding) {
        return ctx.json({ id: team.commerceProviderAccountId })
      }

      const { onboardingLink } = await commerceProvider.createOnboardingLink(
        team.commerceProviderAccountId,
      )

      return ctx.redirect(onboardingLink)
    }

    const { id: accountId, onboardingLink } = await commerceProvider.createAccount({
      email: user.email,
      country: payload.country,
      teamId: team.id,
      name: `${team.name}: ${team.id}`,
      payoutInformation: payload.payoutInformation,
    })

    if (onboardingLink) {
      return ctx.redirect(onboardingLink)
    }

    return ctx.json({ id: accountId })
  }
}
